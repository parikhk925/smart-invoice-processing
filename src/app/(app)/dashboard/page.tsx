"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "recharts";
import { FileText, Clock, CheckCircle2, Wallet } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getInvoicesForUser } from "@/lib/store";
import { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { monthlySpend, statusBreakdown, CHART_COLORS } from "@/lib/analytics";
import StatusBadge from "@/components/StatusBadge";

function KpiCard({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-shadow animate-fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
          {label}
        </span>
        <Icon size={16} className="text-accent-dark" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (user) setInvoices(getInvoicesForUser(user.id));
  }, [user]);

  const kpis = useMemo(() => {
    const total = invoices.length;
    const pending = invoices.filter((i) => i.status === "Pending").length;
    const approvedOrPaid = invoices.filter(
      (i) => i.status === "Approved" || i.status === "Paid"
    ).length;
    const totalSpend = invoices.reduce((sum, i) => sum + i.total, 0);
    return { total, pending, approvedOrPaid, totalSpend };
  }, [invoices]);

  const spendTrend = useMemo(() => monthlySpend(invoices), [invoices]);
  const statusData = useMemo(() => statusBreakdown(invoices), [invoices]);

  const recent = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [invoices]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-foreground/60 text-sm mt-1">
          Overview of your invoice processing pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={FileText} label="Total invoices" value={String(kpis.total)} delay={0} />
        <KpiCard icon={Clock} label="Pending review" value={String(kpis.pending)} delay={0.05} />
        <KpiCard
          icon={CheckCircle2}
          label="Approved / Paid"
          value={String(kpis.approvedOrPaid)}
          delay={0.1}
        />
        <KpiCard
          icon={Wallet}
          label="Total spend"
          value={formatCurrency(kpis.totalSpend)}
          delay={0.15}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-medium mb-4">Monthly spend</h2>
          {spendTrend.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={spendTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e7e5df", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <h2 className="text-sm font-medium mb-4">Status breakdown</h2>
          {statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={entry.status} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e7e5df", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Recent invoices</h2>
          <Link href="/invoices" className="text-xs text-accent-dark hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-foreground/50 py-8 text-center">
            No invoices yet.{" "}
            <Link href="/upload" className="text-accent-dark hover:underline">
              Upload your first invoice
            </Link>
            .
          </p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between py-3 hover:bg-black/[0.02] -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{inv.vendor}</p>
                  <p className="text-xs text-foreground/50">
                    {inv.invoiceNumber} · {formatDate(inv.invoiceDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatCurrency(inv.total, inv.currency)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-foreground/40">
      No data yet.
    </div>
  );
}
