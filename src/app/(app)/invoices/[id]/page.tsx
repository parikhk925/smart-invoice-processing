"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getAllInvoices, saveInvoice, deleteInvoice, addNotification } from "@/lib/store";
import { Invoice, InvoiceStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

const NEXT_STEPS: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ["Pending"],
  Pending: ["Approved", "Rejected"],
  Approved: ["Paid"],
  Rejected: ["Pending"],
  Paid: [],
};

const RISK_STYLES = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    const found = getAllInvoices().find((i) => i.id === params.id && i.createdBy === user.id);
    setInvoice(found ?? null);
  }, [params.id, user]);

  const totals = useMemo(() => {
    if (!invoice) return null;
    const itemsSubtotal = invoice.items.reduce((s, it) => s + it.amount, 0);
    return { itemsSubtotal };
  }, [invoice]);

  function updateField<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    if (!invoice) return;
    setInvoice({ ...invoice, [key]: value });
  }

  function save() {
    if (!invoice) return;
    saveInvoice(invoice);
  }

  function changeStatus(next: InvoiceStatus) {
    if (!invoice || !user) return;
    const updated: Invoice = {
      ...invoice,
      status: next,
      statusHistory: [...invoice.statusHistory, { status: next, at: new Date().toISOString() }],
    };
    saveInvoice(updated);
    setInvoice(updated);
    addNotification(user.id, {
      id: crypto.randomUUID(),
      message: `Invoice ${invoice.invoiceNumber} marked as ${next}.`,
      type: next === "Approved" ? "approved" : next === "Rejected" ? "rejected" : next === "Paid" ? "paid" : "upload",
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  function handleDelete() {
    if (!invoice) return;
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    deleteInvoice(invoice.id);
    router.push("/invoices");
  }

  if (invoice === undefined) {
    return <p className="text-sm text-foreground/50">Loading…</p>;
  }
  if (invoice === null) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-foreground/60 mb-4">Invoice not found.</p>
        <Link href="/invoices" className="text-accent-dark hover:underline text-sm">
          ← Back to invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/invoices"
            className="text-xs text-foreground/50 hover:text-accent-dark inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={14} /> Back to invoices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{invoice.vendor}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-foreground/50">Invoice #{invoice.invoiceNumber}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {NEXT_STEPS[invoice.status].map((next) => (
            <button
              key={next}
              onClick={() => changeStatus(next)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm ${
                next === "Rejected"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-accent text-white hover:bg-accent-dark"
              }`}
            >
              Mark {next}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg border border-border text-red-600 hover:bg-red-50 transition-colors"
            title="Delete invoice"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium">Details</h2>
              <span className="text-xs text-foreground/40">Edit AI-extracted fields</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Invoice number" value={invoice.invoiceNumber} onChange={(v) => updateField("invoiceNumber", v)} onBlur={save} />
              <Field label="Vendor" value={invoice.vendor} onChange={(v) => updateField("vendor", v)} onBlur={save} />
              <Field label="Invoice date" type="date" value={invoice.invoiceDate} onChange={(v) => updateField("invoiceDate", v)} onBlur={save} />
              <Field label="Due date" type="date" value={invoice.dueDate} onChange={(v) => updateField("dueDate", v)} onBlur={save} />
              <Field label="GST / Tax number" value={invoice.gstNumber} onChange={(v) => updateField("gstNumber", v)} onBlur={save} />
              <Field label="Currency" value={invoice.currency} onChange={(v) => updateField("currency", v)} onBlur={save} />
              <Field label="Category" value={invoice.category} onChange={(v) => updateField("category", v)} onBlur={save} />
              <Field label="Payment terms" value={invoice.paymentTerms} onChange={(v) => updateField("paymentTerms", v)} onBlur={save} />
              <Field
                label="Subtotal"
                type="number"
                value={String(invoice.subtotal)}
                onChange={(v) => updateField("subtotal", Number(v) || 0)}
                onBlur={save}
              />
              <Field
                label="Tax"
                type="number"
                value={String(invoice.tax)}
                onChange={(v) => updateField("tax", Number(v) || 0)}
                onBlur={save}
              />
              <Field
                label="Discount"
                type="number"
                value={String(invoice.discount)}
                onChange={(v) => updateField("discount", Number(v) || 0)}
                onBlur={save}
              />
              <Field
                label="Total"
                type="number"
                value={String(invoice.total)}
                onChange={(v) => updateField("total", Number(v) || 0)}
                onBlur={save}
              />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-foreground/50 mb-1">
                Vendor address
              </label>
              <textarea
                value={invoice.vendorAddress}
                onChange={(e) => updateField("vendorAddress", e.target.value)}
                onBlur={save}
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <h2 className="text-sm font-medium mb-4">Line items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-foreground/50 uppercase tracking-wide border-b border-border">
                    <th className="py-2 font-medium">Description</th>
                    <th className="py-2 font-medium text-right">Qty</th>
                    <th className="py-2 font-medium text-right">Unit price</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(item.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totals && (
              <div className="mt-4 flex justify-end">
                <div className="text-sm space-y-1 w-56">
                  <div className="flex justify-between text-foreground/60">
                    <span>Items subtotal</span>
                    <span>{formatCurrency(totals.itemsSubtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/60">
                    <span>Tax</span>
                    <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/60">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-sm font-medium mb-3">Status history</h2>
            <ol className="space-y-2">
              {invoice.statusHistory.map((h, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <StatusBadge status={h.status} />
                  <span className="text-foreground/50 text-xs">{formatDate(h.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-accent-dark" />
              <h2 className="text-sm font-medium">AI insights</h2>
            </div>
            <p className="text-xs font-medium text-foreground/50 mb-1">Summary</p>
            <p className="text-sm mb-4">{invoice.aiSummary || "AI summary unavailable."}</p>
            <p className="text-xs font-medium text-foreground/50 mb-1">Payment recommendation</p>
            <p className="text-sm mb-4">{invoice.aiRecommendation || "Review manually."}</p>

            <div className={`text-xs rounded-lg border px-3 py-2 flex items-center gap-2 mb-3 ${RISK_STYLES[invoice.aiRisk]}`}>
              {invoice.aiRisk === "Low" ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {invoice.aiRisk} risk
            </div>

            {invoice.aiFlags.length > 0 && (
              <div className="space-y-1.5">
                {invoice.aiFlags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2"
                  >
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-sm font-medium mb-3">Source file</h2>
            {invoice.fileDataUrl ? (
              <a
                href={invoice.fileDataUrl}
                download={invoice.fileName}
                className="text-sm text-accent-dark hover:underline"
              >
                Open {invoice.fileName || "file"}
              </a>
            ) : (
              <p className="text-sm text-foreground/40">No file preview available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground/50 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </div>
  );
}
