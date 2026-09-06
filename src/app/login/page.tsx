"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";

type Mode = "signin" | "signup" | "forgot";

function LoginForm() {
  const { user, login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) || "signin";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);

    setTimeout(() => {
      if (mode === "signin") {
        const res = login(email, password);
        if (!res.ok) setError(res.error ?? "Something went wrong.");
        else router.replace("/dashboard");
      } else if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your name.");
          setSubmitting(false);
          return;
        }
        const res = register(name, email, password);
        if (!res.ok) setError(res.error ?? "Something went wrong.");
        else router.replace("/dashboard");
      } else {
        setInfo(
          "If an account exists for that email, a reset link has been sent (demo only — no email is actually sent)."
        );
      }
      setSubmitting(false);
    }, 400);
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="bg-surface border border-border rounded-2xl shadow-xl p-6">
          <h1 className="text-lg font-semibold mb-1">Welcome</h1>
          <p className="text-sm text-foreground/60 mb-5">
            Sign in or create an account to start processing invoices.
          </p>

          <div className="flex rounded-lg bg-black/5 p-1 mb-5 text-sm font-medium">
            {(["signin", "signup", "forgot"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setInfo("");
                }}
                className={`flex-1 py-1.5 rounded-md transition-colors capitalize ${
                  mode === m ? "bg-surface shadow-sm" : "text-foreground/50"
                }`}
              >
                {m === "signin" ? "Sign in" : m === "signup" ? "Sign up" : "Forgot"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="Charmi Patel"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="you@example.com"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-dark transition-colors disabled:opacity-60 shadow-sm"
            >
              {submitting
                ? "Please wait…"
                : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                ? "Create account"
                : "Send reset link"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-foreground/50 mt-6">
          <Link href="/" className="hover:text-accent-dark transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
