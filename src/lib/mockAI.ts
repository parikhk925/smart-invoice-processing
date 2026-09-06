import { Invoice, InvoiceItem } from "./types";

const VENDORS = [
  "Nimbus Cloud Supplies",
  "Vertex Cloud Hosting",
  "Prime Facilities Co.",
  "Skyline Stationery Traders",
  "BluePeak Logistics",
  "Orbit IT Solutions",
  "Meridian Office Equipment",
  "Falcon Marketing Agency",
];

const CATEGORIES = [
  "Office Supplies",
  "Software & Subscriptions",
  "Facilities",
  "Logistics",
  "IT Equipment",
  "Marketing",
  "Consulting",
];

const ITEM_DESCRIPTIONS = [
  "Consulting services",
  "Cloud subscription — monthly plan",
  "Office stationery bundle",
  "Hardware maintenance",
  "Courier & logistics charges",
  "Design & marketing services",
  "Annual software license",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) / 10) * 10;
}

/**
 * Simulates what Azure AI Document Intelligence would return: structured
 * fields + line items extracted from the uploaded file. Since this is a
 * student project without a paid Azure subscription, the "OCR" step
 * generates plausible field values instead of calling a real service.
 */
export function simulateExtraction(fileName: string): Omit<
  Invoice,
  "id" | "status" | "createdBy" | "createdAt" | "statusHistory" | "fileName" | "fileDataUrl" | "aiSummary" | "aiRecommendation" | "aiRisk" | "aiFlags"
> {
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const items: InvoiceItem[] = Array.from({ length: itemCount }).map(() => {
    const quantity = 1 + Math.floor(Math.random() * 8);
    const unitPrice = randomAmount(500, 15000);
    return {
      id: crypto.randomUUID(),
      description: pick(ITEM_DESCRIPTIONS),
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.round(subtotal * 0.18);
  const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.02) : 0;
  const total = subtotal + tax - discount;

  const invoiceDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const numericSeed = fileName.length + Math.floor(Math.random() * 9000);

  return {
    invoiceNumber: `INV-${new Date().getFullYear()}-${(1000 + numericSeed).toString().slice(0, 4)}`,
    vendor: pick(VENDORS),
    vendorAddress: "Address auto-filled by extraction — please verify",
    invoiceDate: invoiceDate.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    paymentTerms: "Net 30",
    gstNumber: `24AAACX${1000 + numericSeed}F1Z${Math.floor(Math.random() * 9)}`,
    currency: "INR",
    category: pick(CATEGORIES),
    subtotal,
    tax,
    discount,
    total,
    items,
  };
}

export function generateAiInsights(
  invoice: Pick<Invoice, "vendor" | "total" | "dueDate" | "invoiceNumber">,
  existingInvoices: Invoice[]
): { summary: string; recommendation: string; risk: "Low" | "Medium" | "High"; flags: string[] } {
  const flags: string[] = [];

  const duplicate = existingInvoices.find(
    (inv) => inv.invoiceNumber === invoice.invoiceNumber
  );
  if (duplicate) {
    flags.push("Duplicate invoice number detected");
  }

  const sameVendor = existingInvoices.filter((inv) => inv.vendor === invoice.vendor);
  if (sameVendor.length > 0) {
    const avg =
      sameVendor.reduce((sum, inv) => sum + inv.total, 0) / sameVendor.length;
    if (invoice.total > avg * 1.4) {
      flags.push("Amount significantly higher than this vendor's average");
    }
  }

  const daysUntilDue = Math.round(
    (new Date(invoice.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  let risk: "Low" | "Medium" | "High" = "Low";
  if (flags.length >= 2) risk = "High";
  else if (flags.length === 1) risk = "Medium";

  const summary = `Invoice ${invoice.invoiceNumber} from ${invoice.vendor} for ₹${invoice.total.toLocaleString(
    "en-IN"
  )} is due in ${daysUntilDue >= 0 ? `${daysUntilDue} day(s)` : "the past — overdue"}. ${
    flags.length ? "Automated checks flagged items for review." : "No issues found in automated checks."
  }`;

  const recommendation =
    risk === "High"
      ? "Hold for manual review before approval."
      : risk === "Medium"
      ? "Review flagged items, then approve if satisfactory."
      : "Safe to approve for payment within terms.";

  return { summary, recommendation, risk, flags };
}
