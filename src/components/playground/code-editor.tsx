"use client";

interface CodeEditorProps {
  value: string;
  // Method-signature (bukan arrow-type) supaya plugin TS Next.js tidak
  // salah anggap ini melanggar aturan serializable props "use client".
  onChange(value: string): void;
  disabled?: boolean;
}

export function CodeEditor({ value, onChange, disabled }: CodeEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      spellCheck={false}
      rows={14}
      className="input h-64 w-full resize-y font-mono text-[13px] leading-6 sm:h-80"
      placeholder="Tulis kode JavaScript di sini…"
      aria-label="Editor kode JavaScript"
    />
  );
}
