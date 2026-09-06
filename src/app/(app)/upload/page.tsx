"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getAllInvoices, saveInvoice, addNotification } from "@/lib/store";
import { simulateExtraction, generateAiInsights } from "@/lib/mockAI";
import { extractPdfText } from "@/lib/pdfText";
import { parseInvoiceText } from "@/lib/parseInvoiceText";
import { Invoice } from "@/lib/types";

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];

// Storing the whole file as a base64 data URL in localStorage lets you
// re-open it later, but large files (e.g. multi-MB phone photos) can blow
// past the browser's localStorage quota and make saving silently fail.
// Cap it so the demo never hangs on a big upload.
const MAX_PREVIEW_BYTES = 1_500_000;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting" | "done">("idle");
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
    setProgress(15);

    try {
      // Run the (small, capped) file preview encode and the real PDF text
      // extraction in parallel instead of one after another.
      const previewPromise =
        file.size <= MAX_PREVIEW_BYTES ? fileToDataUrl(file).catch(() => "") : Promise.resolve("");

      let parsedText = "";
      if (file.type === "application/pdf") {
        parsedText = await extractPdfText(file).catch(() => "");
      }

      setStage("extracting");
      setProgress(65);

      const fileDataUrl = await previewPromise;

      const fromRealDoc = file.type === "application/pdf" ? parseInvoiceText(parsedText, file.name) : null;
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
        message: `Invoice ${invoice.invoiceNumber} uploaded and processed.`,
        type: "upload",
        createdAt: new Date().toISOString(),
        read: false,
      });

      setStage("done");
      setTimeout(() => router.push(`/invoices/${invoice.id}`), 400);
    } catch {
      setError("Something went wrong while processing this file. Please try again.");
      setStage("idle");
      setProgress(0);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload invoice</h1>
        <p className="text-foreground/60 text-sm mt-1">
          Drag and drop a PDF, PNG, or JPG. Fields are extracted automatically for
          you to review.
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

      {(stage === "uploading" || stage === "extracting") && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-accent-dark" />
            <p className="text-sm font-medium">
              {stage === "uploading"
                ? "Reading file…"
                : "Extracting invoice fields…"}
            </p>
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
              This file&apos;s fields couldn&apos;t be read directly (a photo, scan, or
              unusual layout), so they were filled in with simulated demo data —
              please review and correct them.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
