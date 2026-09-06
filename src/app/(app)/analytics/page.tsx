"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "@/lib/AuthContext";
import { getInvoicesForUser } from "@/lib/store";
import { Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import {
  monthlySpend,
  vendorBreakdown,
  categoryBreakdown,
  CHART_COLORS,
} from "@/lib/analytics";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (user) setInvoices(getInvoicesForUser(user.id));
  }, [user]);

  const trend = useMemo(() => monthlySpend(invoices), [invoices]);
  const vendors = useMemo(() => vendorBreakdown(invoices).slice(0, 6), [invoices]);
  const categories = useMemo(() => categoryBreakdown(invoices), [invoices]);

  const paidVsPending = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0);
    const pending = invoices
      .filter((i) => i.status === "Pending" || i.status === "Approved")
      .reduce((s, i) => s + i.total, 0);
    return [
      { name: "Paid", value: paid },
      { name: "Pending / Approved", value: pending },
    ];
  }, [invoices]);

  const totalTax = useMemo(() => invoices.reduce((s, i) => s + i.tax, 0), [invoices]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-foreground/60 text-sm mt-1">Deep-dive into your invoice trends.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Monthly trend">
          {trend.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5df", fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Spend by category">
          {categories.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {categories.map((c, i) => (
                    <Cell key={c.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5df", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Top vendors by spend">
          {vendors.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={vendors} layout="vertical" margin={{ left: 24 }}>
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <YAxis type="category" dataKey="vendor" tick={{ fontSize: 12 }} width={120} stroke="#a8a29e" />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5df", fontSize: 12 }} />
                <Bar dataKey="total" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Paid vs. pending">
          {invoices.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={paidVsPending} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {paidVsPending.map((c, i) => (
                    <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5df", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
        <h2 className="text-sm font-medium mb-1">Tax summary</h2>
        <p className="text-2xl font-semibold">{formatCurrency(totalTax)}</p>
        <p className="text-xs text-foreground/50 mt-1">Total tax across all recorded invoices.</p>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
      <h2 className="text-sm font-medium mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-foreground/40">
      No data yet.
    </div>
  );
}
