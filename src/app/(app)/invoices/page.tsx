"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download, Upload as UploadIcon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getInvoicesForUser } from "@/lib/store";
import { Invoice, InvoiceStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

const STATUS_OPTIONS: (InvoiceStatus | "All")[] = [
  "All",
  "Draft",
  "Pending",
  "Approved",
  "Rejected",
  "Paid",
];

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "All">("All");

  useEffect(() => {
    if (user) setInvoices(getInvoicesForUser(user.id));
  }, [user]);

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => status === "All" || inv.status === status)
      .filter((inv) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          inv.vendor.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.gstNumber.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, query, status]);

  function exportCsv() {
    const header = ["Invoice #", "Vendor", "Date", "Due", "Status", "Total", "Currency"];
    const rows = filtered.map((inv) => [
      inv.invoiceNumber,
      inv.vendor,
      inv.invoiceDate,
      inv.dueDate,
      inv.status,
      inv.total,
      inv.currency,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-foreground/60 text-sm mt-1">
            Search, filter and manage every invoice.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-border bg-surface hover:bg-black/5 transition-colors"
          >
            <Download size={16} /> Export
          </button>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors shadow-sm"
          >
            <UploadIcon size={16} /> Upload
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendor, number, GST…"
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus | "All")}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-up">
        {filtered.length === 0 ? (
          <p className="text-sm text-foreground/50 py-14 text-center">
            No invoices match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-foreground/50 uppercase tracking-wide border-b border-border">
                  <th className="px-5 py-3 font-medium">Invoice #</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/invoices/${inv.id}`)}
                  >
                    <td className="px-5 py-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3">{inv.vendor}</td>
                    <td className="px-5 py-3 text-foreground/60">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-5 py-3 text-foreground/60">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
