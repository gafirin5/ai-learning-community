"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "#4f46e5",
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#38bdf8",
];

/**
 * One-shot confetti burst rendered as an absolutely-positioned overlay.
 * Generates ~48 CSS-animated particles that fall and rotate, then removes
 * itself once the animation completes. Skipped for reduced-motion users.
 */
export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<
    Array<{ id: number; left: number; delay: number; color: string; size: number }>
  >([]);

  useEffect(() => {
    if (!trigger) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const batch = Array.from({ length: 48 }, (_, i) => ({
      id: trigger * 100 + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
    }));
    setPieces(batch);

    const timer = setTimeout(() => setPieces([]), 2200);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            borderRadius: 2,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
