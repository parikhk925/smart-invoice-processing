import { InvoiceItem } from "./types";

type ExtractedFields = {
  invoiceNumber: string;
  vendor: string;
  vendorAddress: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  gstNumber: string;
  currency: string;
  category: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: InvoiceItem[];
};

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function parseAmount(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDateLoose(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Best-effort regex extraction of common invoice fields from raw PDF text.
 * Returns null when there isn't enough signal (e.g. a scanned image with no
 * text layer) so the caller can fall back to the simulated extractor.
 */
export function parseInvoiceText(rawText: string, fileName: string): ExtractedFields | null {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (text.length < 30) return null;

  const totalRaw = firstMatch(text, [
    /(?:grand\s*total|total\s*amount\s*due|total\s*due|amount\s*paid|paid|total)\s*[:\-]?\s*(?:inr|rs\.?|usd|₹|\$)?\s*([\d,]+\.\d{2})/i,
    /(?:inr|₹|\$)\s*([\d,]+\.\d{2})/i,
  ]);
  const total = parseAmount(totalRaw);
  if (!total) return null;

  const invoiceNumber = firstMatch(text, [
    /invoice\s*(?:no\.?|number|id)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{3,})/i,
    /tax\s*invoice\s*id\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{3,})/i,
    /invoice\s*#\s*([A-Z0-9][A-Z0-9\-/]{3,})/i,
  ]);

  const gstNumber = firstMatch(text, [/\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b/]);

  const dateRaw = firstMatch(text, [
    /(?:invoice\s*date|document\s*date)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i,
    /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  ]);

  const subtotalRaw = firstMatch(text, [
    /sub\s*-?\s*total\s*[:\-]?\s*(?:inr|rs\.?|₹|\$)?\s*([\d,]+\.\d{2})/i,
  ]);

  const taxRaw = firstMatch(text, [
    /(?:igst|cgst|sgst|gst|tax)\s*(?:\(\s*\d+\s*%\s*\))?\s*[:\-]?\s*(?:inr|₹)?\s*([\d,]+\.\d{2})/i,
  ]);

  // Require an unbroken run of capitalized "word" tokens right before a
  // company-type suffix, so the match can't run backward across unrelated
  // numbers/labels that happen to precede it in the PDF's text stream.
  const vendorMatch = text.match(
    /((?:[A-Z][A-Za-z&.'-]*\s+){1,7}(?:Pvt\.?\s*Ltd\.?|Private Limited|LLP|LLC|Inc\.?|Limited|Ltd\.?))/
  );
  const vendor = vendorMatch?.[1]
    ?.replace(/^(?:[A-Z]{2,5}\s+)+/, "") // drop stray leading currency/unit codes (INR, USD, GST…)
    .trim();

  const invoiceDate = parseDateLoose(dateRaw) ?? new Date().toISOString().slice(0, 10);
  const due = new Date(invoiceDate);
  due.setDate(due.getDate() + 30);

  const subtotal = parseAmount(subtotalRaw) ?? Math.round((total / 1.18) * 100) / 100;
  const tax = parseAmount(taxRaw) ?? Math.max(0, Math.round((total - subtotal) * 100) / 100);

  const currency = /(usd|\$)/i.test(text) && !/(inr|₹)/i.test(text) ? "USD" : "INR";

  return {
    invoiceNumber: invoiceNumber ?? `INV-${Date.now().toString().slice(-6)}`,
    vendor: vendor || "Unknown vendor — please edit",
    vendorAddress: "Extracted from PDF text — please verify",
    invoiceDate,
    dueDate: due.toISOString().slice(0, 10),
    paymentTerms: "Net 30",
    gstNumber: gstNumber ?? "",
    currency,
    category: "Uncategorized",
    subtotal,
    tax,
    discount: 0,
    total,
    items: [
      {
        id: crypto.randomUUID(),
        description: `Charges as per ${fileName}`,
        quantity: 1,
        unitPrice: subtotal,
        amount: subtotal,
      },
    ],
  };
}
