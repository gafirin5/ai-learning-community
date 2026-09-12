export interface OutputLine {
  id: string;
  kind: "log" | "warn" | "error";
  text: string;
}

interface OutputPanelProps {
  lines: OutputLine[];
  running: boolean;
  hasRun: boolean;
}

export function OutputPanel({ lines, running, hasRun }: OutputPanelProps) {
  return (
    <div className="card flex h-64 flex-col overflow-hidden sm:h-80">
      <div className="flex items-center justify-between border-b border-border bg-surface-hover px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
          Output
        </span>
        {running && <span className="badge text-brand">Menjalankan…</span>}
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-6">
        {!hasRun && lines.length === 0 && !running && (
          <p className="text-muted">
            Klik &quot;Jalankan&quot; untuk melihat hasil console.log kodemu di sini.
          </p>
        )}
        {hasRun && lines.length === 0 && !running && (
          <p className="text-subtle">(tidak ada output)</p>
        )}
        {lines.map((line) => (
          <p
            key={line.id}
            className={
              line.kind === "error"
                ? "text-danger"
                : line.kind === "warn"
                  ? "text-warning"
                  : "text-content"
            }
          >
            <span aria-hidden="true">
              {line.kind === "error" ? "✖ " : line.kind === "warn" ? "⚠ " : "› "}
            </span>
            {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}
