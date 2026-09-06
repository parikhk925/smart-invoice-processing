"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, XCircle, Clock, Wallet, UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getNotificationsForUser, markAllNotificationsRead } from "@/lib/store";
import { AppNotification } from "@/lib/types";
import { formatDate } from "@/lib/format";

const ICONS: Record<AppNotification["type"], typeof Bell> = {
  upload: UploadCloud,
  approved: CheckCircle2,
  rejected: XCircle,
  due: Clock,
  paid: Wallet,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (user) setNotifs(getNotificationsForUser(user.id));
  }, [user]);

  function markRead() {
    if (!user) return;
    markAllNotificationsRead(user.id);
    setNotifs(getNotificationsForUser(user.id));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-foreground/60 text-sm mt-1">
            Uploads, approvals, and payment activity.
          </p>
        </div>
        {notifs.some((n) => !n.read) && (
          <button
            onClick={markRead}
            className="text-sm font-medium text-accent-dark hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl divide-y divide-border animate-fade-up">
        {notifs.length === 0 ? (
          <p className="text-sm text-foreground/50 py-14 text-center">No notifications yet.</p>
        ) : (
          notifs.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 ${!n.read ? "bg-accent/5" : ""}`}
              >
                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-accent-dark" />
                </span>
                <div>
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
