"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  LineChart,
  Bell,
  User,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import { getNotificationsForUser } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const NAV_BOTTOM = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-sm text-foreground/50">Loading…</div>
      </div>
    );
  }

  const unread = getNotificationsForUser(user.id).filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  active
                    ? "bg-accent/10 text-accent-dark"
                    : "text-foreground/70 hover:bg-black/5"
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {item.href === "/notifications" && unread > 0 && (
                  <span className="ml-auto text-[10px] bg-accent text-white rounded-full px-1.5 py-0.5">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border space-y-1">
          {NAV_BOTTOM.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent-dark"
                    : "text-foreground/70 hover:bg-black/5"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
          <span className="text-sm text-foreground/60">{user.email}</span>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors shadow-sm"
          >
            <Plus size={16} /> New invoice
          </Link>
        </header>
        <main className="flex-1 p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
