"use client";

import { useEffect, useState } from "react";

export function ShareRecipe({ id, title }: { id: number; title: string }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(typeof navigator.share === "function");
  }, []);

  if (!available) return null;

  async function onShare() {
    const url = new URL(`/recipes/${id}`, window.location.origin).href;
    try {
      await navigator.share({ title, url });
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
