"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-foreground/60 text-sm mt-1">Preferences for this device.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Appearance</p>
            <p className="text-xs text-foreground/50 mt-0.5">
              Switch between light and dark mode.
            </p>
          </div>
          <button
            onClick={toggle}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <p className="font-medium text-sm mb-1">About this demo</p>
        <p className="text-xs text-foreground/50 leading-relaxed">
          This is a student project build of the Smart Invoice Processing System.
          All data is stored locally in your browser (no server/database), and AI
          extraction &amp; insights are simulated in place of paid Azure services.
        </p>
      </div>
    </div>
  );
}
