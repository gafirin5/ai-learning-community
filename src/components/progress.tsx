"use client";

export function ProgressBar({
  value,
  className = "",
  tone = "brand",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "success" | "warning";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const toneCls =
    tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-brand";
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-surface-hover ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`relative h-full overflow-hidden rounded-full transition-all duration-500 ${toneCls}`}
        style={{ width: `${clamped}%` }}
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
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
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
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-sm font-bold text-content">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
