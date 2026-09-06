"use client";

/**
 * Loads an image file onto a canvas, downscaling it if it's larger than
 * `maxDim` on its longest side — phone photos are often 3000-4000px, which
 * makes OCR far slower than it needs to be for reading a document.
 */
export async function loadImageToCanvas(file: File | Blob, maxDim = 2000): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}
