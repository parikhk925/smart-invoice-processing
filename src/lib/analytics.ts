import { Invoice } from "./types";

export function monthlySpend(invoices: Invoice[]) {
  const map = new Map<string, number>();
  invoices.forEach((inv) => {
    const key = inv.invoiceDate.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + inv.total);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

export function vendorBreakdown(invoices: Invoice[]) {
  const map = new Map<string, number>();
  invoices.forEach((inv) => {
    map.set(inv.vendor, (map.get(inv.vendor) ?? 0) + inv.total);
  });
  return Array.from(map.entries())
    .map(([vendor, total]) => ({ vendor, total }))
    .sort((a, b) => b.total - a.total);
}

export function categoryBreakdown(invoices: Invoice[]) {
  const map = new Map<string, number>();
  invoices.forEach((inv) => {
    const key = inv.category || "Uncategorized";
    map.set(key, (map.get(key) ?? 0) + inv.total);
  });
  return Array.from(map.entries()).map(([category, total]) => ({ category, total }));
}

export function statusBreakdown(invoices: Invoice[]) {
  const map = new Map<string, number>();
  invoices.forEach((inv) => {
    map.set(inv.status, (map.get(inv.status) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}

export const CHART_COLORS = ["#0d9488", "#14b8a6", "#5eead4", "#f59e0b", "#f87171", "#a78bfa", "#60a5fa"];
