"use client";

import { useAuth } from "@/lib/AuthContext";
import { formatDate } from "@/lib/format";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-foreground/60 text-sm mt-1">Your account information.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 animate-fade-up">
        <div className="flex items-center gap-4 mb-6">
          <span className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-xl font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-foreground/50">{user.email}</p>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-foreground/50 text-xs uppercase tracking-wide mb-1">Role</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
          <div>
            <dt className="text-foreground/50 text-xs uppercase tracking-wide mb-1">
              Member since
            </dt>
            <dd className="font-medium">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
