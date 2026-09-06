"use client";

/**
 * Runs OCR entirely in the browser via Tesseract.js (WASM) — no paid API,
 * no server round-trip. Used for scanned PDFs (no text layer) and photos.
 */
export async function runOcr(
  image: File | Blob | HTMLCanvasElement,
  onProgress?: (pct: number) => void
): Promise<string> {
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(image, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress ?? 0) * 100));
      }
    },
  });
  return data.text;
}
