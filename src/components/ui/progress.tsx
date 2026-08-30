"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bar progres = tinta merambat di kertas: terisi sekali saat pertama
 * terlihat (scaleX, bukan width), lalu transisi halus saat nilai berubah.
 * Reduced motion → langsung terisi.
 */
function useInkFilled<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFilled(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setFilled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, filled };
}

export function ProgressBar({
  value,
  className = "",
  tone = "brand",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "success" | "warning";
}) {
  const { ref, filled } = useInkFilled<HTMLDivElement>();
  const clamped = Math.max(0, Math.min(100, value));
  const toneCls =
    tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-brand";
  return (
    <div
      ref={ref}
      className={`h-2 overflow-hidden rounded-full bg-surface-hover ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`relative h-full w-full origin-left rounded-full transition-transform duration-700 ease-out ${toneCls}`}
        style={{ transform: `scaleX(${filled ? clamped / 100 : 0})` }}
      >
        {clamped > 0 && (
          <span
            className="absolute inset-0 animate-shimmer"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.25) 50%, transparent 75%)",
              backgroundSize: "200% 100%",
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 5,
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const { ref, filled } = useInkFilled<HTMLDivElement>();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference - (clamped / 100) * circumference;
  const offset = filled ? target : circumference;

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-hover)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-bold text-content">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
