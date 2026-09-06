"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "sip_theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (window.localStorage.getItem(KEY) as "light" | "dark") || "light";
    setTheme(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem(KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
