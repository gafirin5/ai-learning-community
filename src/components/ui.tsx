"use client";

import { LEVEL_BADGE, LEVEL_LABEL } from "@/lib/data";
import type { Level } from "@/lib/types";

export function LevelBadge({ level }: { level: Level | string }) {
  return (
    <span className={`badge ${LEVEL_BADGE[level] ?? "bg-surface-hover text-muted"}`}>
      {LEVEL_LABEL[level] ?? level}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="badge bg-surface-hover text-muted">#{children}</span>;
}

export function EmptyState({
  icon = "🗂️",
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center animate-fade-in">
      <div
        className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover text-2xl"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold text-content">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
