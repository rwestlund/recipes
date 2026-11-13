"use client";

import { pdfFilename } from "@/lib/text";

export function ShareSheet({ url, title }: { url: string; title: string }) {
  async function onShare() {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        window.location.assign(url);
        return;
      }
      const blob = await response.blob();
      const file = new File([blob], pdfFilename(title), { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    window.location.assign(url);
  }

  return (
    <button type="button" className="secondary" onClick={onShare}>
      Share sheet
    </button>
  );
}
