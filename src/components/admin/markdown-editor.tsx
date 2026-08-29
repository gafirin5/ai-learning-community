"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownLite } from "@/components/ui/markdown-lite";

/**
 * Editor Markdown ringan untuk form admin: toolbar sisip-markdown pada posisi
 * kursor + tab Tulis/Pratinjau. Pada layar `lg` kedua panel tampil berdampingan
 * (split-view: textarea kiri, pratinjau kanan).
 */

interface Snippet {
  label: string;
  ariaLabel: string;
  /** Teks disisipkan sebelum seleksi/kursor. */
  before: string;
  /** Teks disisipkan setelah seleksi/fallback (mis. `](url)` untuk tautan). */
  after?: string;
  /** Teks placeholder dipakai bila tidak ada teks terseleksi. */
  fallback?: string;
  /** Sisipkan di awal baris kursor (prefix blok: heading, list, quote). */
  lineStart?: boolean;
}

const TOOLS: Snippet[] = [
  { label: "B", ariaLabel: "Bold", before: "**", after: "**", fallback: "teks" },
  { label: "I", ariaLabel: "Italic", before: "*", after: "*", fallback: "teks" },
  { label: "H2", ariaLabel: "Heading", before: "## ", lineStart: true },
  { label: "</>", ariaLabel: "Blok kode", before: "```\n", after: "\n```", fallback: "kode" },
  { label: "`", ariaLabel: "Kode inline", before: "`", after: "`", fallback: "kode" },
  { label: "Tautan", ariaLabel: "Sisipkan tautan", before: "[", after: "](url)", fallback: "teks tautan" },
  { label: "•", ariaLabel: "Daftar (list)", before: "- ", lineStart: true },
  { label: "❝", ariaLabel: "Kutipan (quote)", before: "> ", lineStart: true },
  { label: "Gambar", ariaLabel: "Sisipkan gambar", before: "![", after: "](url)", fallback: "alt gambar" },
];

export function MarkdownEditor({
  value,
  onChange,
  rows = 10,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [tab, setTab] = useState<"tulis" | "pratinjau">("tulis");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Posisi kursor/seleksi yang dipulihkan setelah re-render akibat onChange.
  const pendingCursor = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const pending = pendingCursor.current;
    if (!pending) return;
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(pending.start, pending.end);
    }
    pendingCursor.current = null;
  });

  function applySnippet(tool: Snippet) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;

    if (tool.lineStart) {
      const lineStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
      const cursor = start + tool.before.length;
      pendingCursor.current = { start: cursor, end: cursor };
      onChange(value.slice(0, lineStart) + tool.before + value.slice(lineStart));
      return;
    }

    const selected = value.slice(start, end);
    const inner = selected || tool.fallback || "";
    const after = tool.after ?? "";
    const cursorEnd = start + tool.before.length + inner.length;
    // Bila menyisipkan placeholder (tanpa seleksi), seleksi teks placeholder
    // agar langsung tertimpa saat pengguna mengetik.
    pendingCursor.current = selected ? { start: cursorEnd, end: cursorEnd } : { start: start + tool.before.length, end: cursorEnd };
    onChange(value.slice(0, start) + tool.before + inner + after + value.slice(end));
  }

  const tabClass = (active: boolean) =>
    `rounded px-2 py-1 text-xs font-medium transition-colors ${
      active ? "bg-brand-soft text-brand" : "bg-surface-hover text-muted hover:bg-border hover:text-content"
    }`;

  return (
    <div className="space-y-2">
      {/* Tab hanya tampil di layar kecil; di `lg` kedua panel selalu terlihat. */}
      <div className="flex flex-wrap gap-1 lg:hidden">
        <button type="button" aria-pressed={tab === "tulis"} onClick={() => setTab("tulis")} className={tabClass(tab === "tulis")}>
          Tulis
        </button>
        <button type="button" aria-pressed={tab === "pratinjau"} onClick={() => setTab("pratinjau")} className={tabClass(tab === "pratinjau")}>
          Pratinjau
        </button>
      </div>

      <div role="toolbar" aria-label="Format Markdown" className="flex flex-wrap gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.ariaLabel}
            type="button"
            aria-label={tool.ariaLabel}
            title={tool.ariaLabel}
            onClick={() => applySnippet(tool)}
            className="rounded bg-surface-hover px-2 py-1 text-xs text-content transition-colors hover:bg-border"
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          ref={textareaRef}
          className={`input font-mono text-sm ${tab === "tulis" ? "" : "hidden lg:block"}`}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <div
          className={`overflow-auto rounded-lg border border-border bg-surface p-3 ${tab === "pratinjau" ? "" : "hidden lg:block"}`}
          style={{ minHeight: `${rows * 1.25 + 1.25}rem` }}
        >
          {value.trim() ? (
            <MarkdownLite source={value} />
          ) : (
            <p className="text-sm italic text-subtle">Belum ada pratinjau.</p>
          )}
        </div>
      </div>
    </div>
  );
}
