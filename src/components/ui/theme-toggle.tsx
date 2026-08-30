"use client";

import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, resolved, mounted, setTheme } = useTheme();

  function cycle() {
    // light -> dark -> system -> light
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  }

  const label =
    theme === "system" ? "Sistem" : resolved === "dark" ? "Gelap" : "Terang";
  const isDark = mounted && resolved === "dark";

  return (
    <button
      onClick={cycle}
      className="btn-ghost h-9 w-9 rounded-lg !p-0"
      aria-label={`Mode tema: ${label}. Klik untuk ganti.`}
      title={`Tema: ${label}`}
    >
      <span key={label} className="inline-flex animate-pop">
        {isDark ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}
