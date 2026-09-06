"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getAllInvoices, saveInvoice, addNotification } from "@/lib/store";
import { simulateExtraction, generateAiInsights } from "@/lib/mockAI";
import { extractPdfText, renderPdfPageToCanvas } from "@/lib/pdfText";
import { runOcr } from "@/lib/ocr";
import { loadImageToCanvas } from "@/lib/renderImage";
import { parseInvoiceText } from "@/lib/parseInvoiceText";
import { withTimeout } from "@/lib/withTimeout";
import { Invoice } from "@/lib/types";

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];

// Storing the whole file as a base64 data URL in localStorage lets you
// re-open it later, but large files (e.g. multi-MB phone photos) can blow
// past the browser's localStorage quota and make saving silently fail.
// Cap it so the demo never hangs on a big upload.
const MAX_PREVIEW_BYTES = 1_500_000;

// Below this many characters of embedded PDF text, treat the file as if it
// has no text layer at all (a scanned/photographed page) and fall back to OCR.
const MIN_EMBEDDED_TEXT_LENGTH = 30;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the best text we can out of the file: embedded PDF text when
 * available (fast, exact), otherwise OCR — run on a rendered page for a
 * scanned PDF, or directly on the image for a photo/screenshot.
 */
async function extractText(
  file: File,
  onOcrProgress: (pct: number) => void
): Promise<{ text: string; usedOcr: boolean }> {
  // PDF/OCR libraries occasionally hang on a malformed or unusual file
  // instead of throwing — every risky step below is time-boxed so a single
  // bad upload can never freeze the page indefinitely; it just falls back
  // to simulated data, same as a step that fails outright.
  if (file.type === "application/pdf") {
    const embedded = await withTimeout(extractPdfText(file), 8_000, "PDF text read").catch(() => "");
    if (embedded.trim().length >= MIN_EMBEDDED_TEXT_LENGTH) {
      return { text: embedded, usedOcr: false };
    }
    try {
      const canvas = await withTimeout(renderPdfPageToCanvas(file, 1, 2), 12_000, "PDF page render");
      const ocrText = await withTimeout(runOcr(canvas, onOcrProgress), 60_000, "OCR");
      return { text: ocrText, usedOcr: true };
    } catch {
      return { text: embedded, usedOcr: false };
    }
  }

  try {
    const canvas = await withTimeout(loadImageToCanvas(file), 8_000, "Image decode");
    const ocrText = await withTimeout(runOcr(canvas, onOcrProgress), 60_000, "OCR");
    return { text: ocrText, usedOcr: true };
  } catch {
    return { text: "", usedOcr: false };
  }
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"idle" | "uploading" | "ocr" | "extracting" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [usedRealExtraction, setUsedRealExtraction] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!ACCEPTED.includes(f.type)) {
      setError("Please upload a PDF, PNG, or JPG file.");
      return;
    }
    setError("");
    setFile(f);
  }, []);

  async function processFile() {
    if (!file || !user) return;
    setError("");
    setStage("uploading");
    setProgress(10);

    try {
      // Run the (small, capped) file preview encode alongside text
      // extraction instead of one after another.
      const previewPromise =
        file.size <= MAX_PREVIEW_BYTES ? fileToDataUrl(file).catch(() => "") : Promise.resolve("");

      let ocrStarted = false;
      const { text: parsedText, usedOcr } = await extractText(file, (pct) => {
        if (!ocrStarted) {
          ocrStarted = true;
          setStage("ocr");
        }
        setProgress(20 + Math.round(pct * 0.6));
      });

      setStage("extracting");
      setProgress(85);

      const fileDataUrl = await previewPromise;

      const fromRealDoc = parseInvoiceText(parsedText, file.name);
      const extracted = fromRealDoc ?? simulateExtraction(file.name);
      setUsedRealExtraction(Boolean(fromRealDoc));

      const existing = getAllInvoices();
      const insights = generateAiInsights(
        {
          vendor: extracted.vendor,
          total: extracted.total,
          dueDate: extracted.dueDate,
          invoiceNumber: extracted.invoiceNumber,
        },
        existing
      );

      setProgress(100);

      const invoice: Invoice = {
        id: crypto.randomUUID(),
        ...extracted,
        status: "Draft",
        fileName: file.name,
        fileDataUrl,
        aiSummary: insights.summary,
        aiRecommendation: insights.recommendation,
        aiRisk: insights.risk,
        aiFlags: insights.flags,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        statusHistory: [{ status: "Draft", at: new Date().toISOString() }],
      };

      try {
        saveInvoice(invoice);
      } catch {
        // Most likely a localStorage quota error from a large file preview —
        // drop the preview and retry once rather than leaving the user stuck.
        invoice.fileDataUrl = "";
        saveInvoice(invoice);
      }

      addNotification(user.id, {
        id: crypto.randomUUID(),
        message: `Invoice ${invoice.invoiceNumber} uploaded and processed${
          usedOcr ? " (via OCR)" : ""
        }.`,
        type: "upload",
        createdAt: new Date().toISOString(),
        read: false,
      });

      setStage("done");
      setTimeout(() => router.push(`/invoices/${invoice.id}`), 600);
    } catch {
      setError("Something went wrong while processing this file. Please try again.");
      setStage("idle");
      setProgress(0);
    }
  }

  const STAGE_LABEL: Record<string, string> = {
    uploading: "Reading file…",
    ocr: "Running OCR — this can take a bit longer for scanned files…",
    extracting: "Extracting invoice fields…",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload invoice</h1>
        <p className="text-foreground/60 text-sm mt-1">
          Drag and drop a PDF, PNG, or JPG. Fields are extracted automatically for
          you to review — including OCR for scanned pages and photos.
        </p>
      </div>

      {stage === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors animate-fade-up ${
            dragging ? "border-accent bg-accent/5" : "border-border bg-surface hover:bg-black/[0.02]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <UploadCloud size={36} className="mx-auto mb-4 text-accent-dark" />
          <p className="font-medium mb-1">
            {file ? file.name : "Drag & drop your invoice here"}
          </p>
          <p className="text-sm text-foreground/50">or click to browse — PDF, PNG, JPG, JPEG</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {file && stage === "idle" && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-accent-dark" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-foreground/50">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <button
            onClick={processFile}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors shadow-sm"
          >
            Process invoice
          </button>
        </div>
      )}

      {(stage === "uploading" || stage === "ocr" || stage === "extracting") && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-accent-dark" />
            <p className="text-sm font-medium">{STAGE_LABEL[stage]}</p>
          </div>
          <div className="h-2 rounded-full bg-black/5 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-2 animate-fade-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <p className="text-sm font-medium">Done! Opening invoice for review…</p>
          </div>
          {!usedRealExtraction && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              This file&apos;s fields couldn&apos;t be read confidently (a low-quality
              scan or unusual layout), so they were filled in with simulated demo
              data — please review and correct them.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
