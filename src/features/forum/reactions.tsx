"use client";

import type { ReactionKey } from "@/lib/types";

export const REACTIONS: ReactionKey[] = ["👍", "❤️", "🎉", "💡", "👀", "🙌"];

export function ReactionBar({
  reactions,
  myReaction,
  onReact,
}: {
  reactions: Record<ReactionKey, number>;
  myReaction: ReactionKey | null;
  onReact: (key: ReactionKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTIONS.map((key) => {
        const count = reactions[key] ?? 0;
        const active = myReaction === key;
        return (
          <button
            key={key}
            onClick={() => onReact(key)}
            aria-label={`Reaksi ${key}`}
            aria-pressed={active}
            title={`${key}${count ? ` (${count})` : ""}`}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
              active
                ? "border-brand/40 bg-brand-soft text-brand"
                : "border-border text-muted hover:border-brand/40 hover:bg-surface-hover"
            }`}
          >
            <span>{key}</span>
            {count > 0 && <span className="font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
