"use client";

import { useEffect, useState } from "react";
import { pdfFilename } from "@/lib/text";

export function ShareRecipe({ id, title }: { id: number; title: string }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(typeof navigator.share === "function");
  }, []);

  if (!available) return null;

  async function onShare() {
    const url = new URL(`/recipes/${id}`, window.location.origin).href;
    const payload: ShareData = { title, url };
    try {
      const response = await fetch(`/recipes/${id}/pdf`);
      if (response.ok) {
        const file = new File([await response.blob()], pdfFilename(title), { type: "application/pdf" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ title, url, files: [file] });
            return;
          } catch (error) {
            if (aborted(error)) return;
          }
        }
      }
      await navigator.share(payload);
    } catch (error) {
      if (aborted(error)) return;
    }
  }

  return (
    <button type="button" className="secondary" onClick={() => void onShare()}>
      Share
    </button>
  );
}

function aborted(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
