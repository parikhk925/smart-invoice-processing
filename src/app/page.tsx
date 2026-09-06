"use client";

import Link from "next/link";
import {
  FileText,
  ScanSearch,
  ShieldCheck,
  BarChart3,
  Sparkles,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import Logo from "@/components/Logo";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "AI-Powered Extraction",
    desc: "Upload a PDF, JPG, or PNG and let the system pull out invoice number, vendor, dates, tax, and line items automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Approval Workflow",
    desc: "Every invoice moves through Draft → Pending → Approved/Rejected → Paid, so nothing gets paid without review.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    desc: "Automatic summaries, payment recommendations, and duplicate / anomaly flags on top of raw extracted data.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Monthly spend trends, vendor breakdowns, and tax summaries, updated the moment an invoice changes status.",
  },
];

const STEPS = [
  { icon: UploadCloud, title: "Upload", desc: "Drag and drop an invoice file." },
  { icon: ScanSearch, title: "Extract", desc: "Structured fields are pulled out automatically." },
  { icon: FileText, title: "Review", desc: "Verify and edit the extracted data." },
  { icon: CheckCircle2, title: "Approve & Pay", desc: "Move it through the workflow to Paid." },
];

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-black/5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login?mode=signup"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 text-xs font-medium bg-accent/10 text-accent-dark px-3 py-1 rounded-full mb-6">
              <Sparkles size={14} /> AI-powered invoice processing
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Turn every invoice into{" "}
              <span className="text-accent">clean data</span>, instantly.
            </h1>
            <p className="mt-5 text-lg text-foreground/70 max-w-lg">
              Upload PDFs or photos of your invoices. InvoiceVision extracts every
              line, flags duplicates and anomalies, and gives your team a
              real-time view of what you&apos;re spending.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className="px-5 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-dark transition-colors shadow-sm hover:shadow-md"
              >
                Start free →
              </Link>
              <Link
                href="/login"
                className="px-5 py-3 rounded-lg border border-border bg-surface font-medium hover:bg-black/5 transition-colors"
              >
                I already have an account
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="absolute -inset-6 bg-accent/10 rounded-[2rem] blur-2xl animate-float-slow" />
            <div className="relative bg-surface border border-border rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-foreground/50">Invoices</span>
                <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent-dark">
                  + New invoice
                </span>
              </div>
              {[
                { v: "Nimbus Cloud Supplies", s: "Approved", a: "₹49,060" },
                { v: "Vertex Cloud Hosting", s: "Pending", a: "₹1,39,240" },
                { v: "Prime Facilities Co.", s: "Paid", a: "₹35,400" },
              ].map((row, i) => (
                <div
                  key={row.v}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 animate-fade-up"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                >
                  <div>
                    <p className="text-sm font-medium">{row.v}</p>
                    <p className="text-xs text-foreground/50">{row.s}</p>
                  </div>
                  <span className="text-sm font-semibold">{row.a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
          <h2 className="text-2xl font-semibold text-center mb-2">
            Everything a finance team needs
          </h2>
          <p className="text-center text-foreground/60 mb-12">
            Built to demonstrate an end-to-end AI-assisted invoice pipeline.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="p-5 rounded-xl border border-border bg-surface hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-accent-dark" />
                </div>
                <h3 className="font-medium mb-1">{f.title}</h3>
                <p className="text-sm text-foreground/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
          <h2 className="text-2xl font-semibold text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-14 h-14 mx-auto rounded-full bg-accent text-white flex items-center justify-center mb-4 shadow-sm">
                  <s.icon size={22} />
                </div>
                <h3 className="font-medium mb-1">
                  {i + 1}. {s.title}
                </h3>
                <p className="text-sm text-foreground/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-accent/5">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center animate-fade-up">
            <h2 className="text-2xl font-semibold mb-3">
              Ready to see it in action?
            </h2>
            <p className="text-foreground/60 mb-8">
              Create a free account — sample invoices are pre-loaded so you can
              explore the dashboard immediately.
            </p>
            <Link
              href="/login?mode=signup"
              className="inline-block px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-dark transition-colors shadow-sm"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/50">
          <Logo compact />
          <p>Smart Invoice Processing System — college project demo.</p>
        </div>
      </footer>
    </div>
  );
}
