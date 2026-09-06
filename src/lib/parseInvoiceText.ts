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

// Adds days to a YYYY-MM-DD string using UTC arithmetic throughout, so the
// result can't shift by a day depending on the viewer's local timezone
// (which plain `Date#setDate` + `toISOString` is prone to).
function addDaysToIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function parseAmount(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const MONTH_NAMES: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function parseDateLoose(raw: string | null): string | null {
  if (!raw) return null;

  // A bare numeric D/M/Y date is ambiguous to JS's Date constructor (it
  // assumes US M/D/Y and silently produces an invalid date for anything
  // with a day > 12). Indian invoices use D/M/Y, so parse that explicitly.
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    if (Number(m) <= 12 && Number(d) <= 31) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // "17 Sep 2025" style — resolved by hand instead of `new Date(...)` so a
  // browser running ahead of UTC (e.g. India, UTC+5:30) can't have the date
  // shifted back a day when converting the resulting local Date to ISO.
  const dMon = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (dMon) {
    const [, d, mon, y] = dMon;
    const month = MONTH_NAMES[mon.slice(0, 3).toLowerCase()];
    if (month) return `${y}-${month}-${d.padStart(2, "0")}`;
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// Many ERP-generated invoices render a "label column" and a "value column"
// as two separate groups (e.g. "Invoice Number Invoice Date GST TIN No." at
// one position and ": AMAR2512/216 : 27/12/2025 : 24AACCS6474P1ZR" right
// after), rather than each label sitting directly next to its own value.
// PDF text extraction preserves that grouping, so a plain "label: value"
// regex never lines up. This finds one such label run immediately followed
// by a matching run of colon-prefixed values and pairs them up positionally.
const KNOWN_LABELS = [
  "invoice number",
  "invoice no\\.?",
  "invoice date",
  "document date",
  "gst\\s*tin no\\.?",
  "gstin no\\.?",
  "cin no\\.?",
  "p\\.?a\\.?n\\.?\\s*no",
  "due date",
  "payment terms",
];

function extractLabelValueMap(text: string): Map<string, string> {
  const map = new Map<string, string>();
  const labelAlt = KNOWN_LABELS.join("|");
  const blockRe = new RegExp(
    `((?:(?:${labelAlt})\\s+){2,8})((?:\\s*:\\s*[^:]+){2,8})`,
    "i"
  );
  const block = text.match(blockRe);
  if (!block) return map;

  const labelRe = new RegExp(`(${labelAlt})`, "gi");
  const labels = [...block[1].matchAll(labelRe)].map((m) =>
    m[1].toLowerCase().replace(/\s+/g, " ").replace(/\.$/, "").trim()
  );
  const values = block[2]
    .split(":")
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, labels.length);

  labels.forEach((label, i) => {
    if (values[i]) map.set(label, values[i]);
  });
  return map;
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
    // \b before the group matters: without it, "total" also matches inside
    // "Subtotal", so "Subtotal: 5,000.00" would be misread as the total.
    /\b(?:grand\s*total|total\s*amount\s*due|total\s*due|amount\s*paid|paid|total)\b\s*[:\-]?\s*(?:inr|rs\.?|usd|₹|\$)?\s*([\d,]+\.\d{2})/i,
    /(?:inr|₹|\$)\s*([\d,]+\.\d{2})/i,
    // Some invoice templates put the amount before its label instead of
    // after ("1,366,695.00 Total" rather than "Total: 1,366,695.00").
    /([\d,]+\.\d{2})\s*(?:grand\s*total|total)\b/i,
  ]);
  const total = parseAmount(totalRaw);
  if (!total) return null;

  const labelValues = extractLabelValueMap(text);

  const invoiceNumber =
    labelValues.get("invoice number") ??
    labelValues.get("invoice no") ??
    firstMatch(text, [
      /invoice\s*(?:no\.?|number|id)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{3,})/i,
      /tax\s*invoice\s*id\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{3,})/i,
      /invoice\s*#\s*([A-Z0-9][A-Z0-9\-/]{3,})/i,
    ]);

  const gstNumber =
    labelValues.get("gst tin no") ??
    labelValues.get("gstin no") ??
    firstMatch(text, [/\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b/]);

  const dateRaw =
    labelValues.get("invoice date") ??
    labelValues.get("document date") ??
    firstMatch(text, [
      /(?:invoice\s*date|document\s*date)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i,
      /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/,
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    ]);

  const subtotalRaw = firstMatch(text, [
    /sub\s*-?\s*total\s*[:\-]?\s*(?:inr|rs\.?|₹|\$)?\s*([\d,]+\.\d{2})/i,
    /total\s*taxable\s*amount\s*[:\-]?\s*(?:inr|rs\.?|₹|\$)?\s*([\d,]+\.\d{2})/i,
    /taxable\s*amount\s*[:\-]?\s*(?:inr|rs\.?|₹|\$)?\s*([\d,]+\.\d{2})/i,
  ]);

  const taxRaw = firstMatch(text, [
    // \b after the group matters: without it, "tax" also matches inside
    // "Taxable", so "Taxable Amount: 5,000.00" could be misread as tax.
    /\b(?:igst|cgst|sgst|gst|tax)\b\s*(?:\(\s*\d+\s*%\s*\))?\s*[:\-]?\s*(?:inr|₹)?\s*([\d,]+\.\d{2})/i,
  ]);

  // Require an unbroken run of capitalized "word" tokens right before a
  // company-type suffix, so the match can't run backward across unrelated
  // numbers/labels that happen to precede it in the PDF's text stream.
  // Suffix variants are spelled out in both cases rather than using the /i
  // flag, since /i would also let the "start with a capital letter" token
  // check match lowercase words and pull in unrelated text.
  const vendorMatch = text.match(
    /((?:[A-Z][A-Za-z&.'-]*\s+){1,7}(?:Pvt\.?\s*Ltd\.?|PVT\.?\s*LTD\.?|Private Limited|PRIVATE LIMITED|LLP|LLC|Inc\.?|INC\.?|Limited|LIMITED|Ltd\.?|LTD\.?))/
  );
  const vendor = vendorMatch?.[1]
    ?.replace(/^(?:[A-Z]{2,5}\s+)+/, "") // drop stray leading currency/unit codes (INR, USD, GST…)
    .trim();

  const invoiceDate = parseDateLoose(dateRaw) ?? new Date().toISOString().slice(0, 10);
  const dueDate = addDaysToIsoDate(invoiceDate, 30);

  // Prefer whichever of subtotal/tax was actually found in the text and
  // derive the other from it, rather than assuming a fixed tax rate — many
  // real invoices (exports, SEZ supplies, non-GST) charge no tax at all, so
  // guessing an 18% split when neither is found does more harm than good.
  const foundSubtotal = parseAmount(subtotalRaw);
  const foundTax = parseAmount(taxRaw);
  let subtotal: number;
  let tax: number;
  if (foundSubtotal != null) {
    subtotal = foundSubtotal;
    tax = foundTax ?? Math.max(0, Math.round((total - subtotal) * 100) / 100);
  } else if (foundTax != null) {
    tax = foundTax;
    subtotal = Math.round((total - tax) * 100) / 100;
  } else {
    subtotal = total;
    tax = 0;
  }

  const currency = /(usd|\$)/i.test(text) && !/(inr|₹)/i.test(text) ? "USD" : "INR";

  return {
    invoiceNumber: invoiceNumber ?? `INV-${Date.now().toString().slice(-6)}`,
    vendor: vendor || "Unknown vendor — please edit",
    vendorAddress: "Extracted from PDF text — please verify",
    invoiceDate,
    dueDate,
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
