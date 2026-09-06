"use client";

async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}

/**
 * Extracts embedded text from a PDF entirely in the browser (no server call).
 * Works for digitally-generated invoices (the vast majority of real ones).
 * Scanned/photographed PDFs with no text layer will return an empty/short
 * string, which the caller treats as "extraction failed".
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";
  const pageCount = Math.min(pdf.numPages, 5); // an invoice is rarely more than a few pages
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ") + "\n";
  }
  return text;
}

/**
 * Renders one page of a PDF to a canvas, for OCR on scanned/photographed
 * PDFs that have no embedded text layer for extractPdfText to read.
 */
export async function renderPdfPageToCanvas(
  file: File,
  pageNumber = 1,
  scale = 2
): Promise<HTMLCanvasElement> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas;
}
