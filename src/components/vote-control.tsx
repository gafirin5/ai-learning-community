"use client";

import { useEffect, useRef, useState } from "react";

export function VoteControl({
  count,
  value,
  onVote,
}: {
  count: number;
  value: 1 | -1 | 0;
  onVote: (delta: 1 | -1) => void;
}) {
  const [bump, setBump] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setBump((b) => b + 1);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => onVote(1)}
        aria-label="Upvote"
        aria-pressed={value === 1}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
          value === 1 ? "text-brand" : "text-subtle hover:bg-surface-hover hover:text-content"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
        </svg>
      </button>
      <span
        key={bump}
        className="inline-block animate-pop text-sm font-semibold text-content"
        aria-label={`${count} vote`}
      >
        {count}
      </span>
      <button
        onClick={() => onVote(-1)}
        aria-label="Downvote"
        aria-pressed={value === -1}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
          value === -1 ? "text-danger" : "text-subtle hover:bg-surface-hover hover:text-content"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
