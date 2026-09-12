"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/playground/code-editor";
import { OutputPanel, type OutputLine } from "@/components/playground/output-panel";
import { SandboxRunner } from "@/components/playground/sandbox-runner";
import { DEFAULT_SNIPPET, PLAYGROUND_SNIPPETS } from "@/components/playground/snippets";

const TIMEOUT_MS = 5000;

export default function PlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_SNIPPET.code);
  const [codeToRun, setCodeToRun] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [activeSnippetId, setActiveSnippetId] = useState(DEFAULT_SNIPPET.id);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const handleRun = useCallback(() => {
    clearTimer();
    setLines([]);
    setHasRun(true);
    setRunning(true);
    setCodeToRun(code);
    setRunId((id) => id + 1);

    timeoutRef.current = setTimeout(() => {
      setRunning(false);
      setCodeToRun(null);
      setLines((prev) => [
        ...prev,
        {
          id: `timeout-${Date.now()}`,
          kind: "error",
          text: "Waktu eksekusi terlalu lama (mungkin ada perulangan tanpa henti) — dihentikan otomatis.",
        },
      ]);
    }, TIMEOUT_MS);
  }, [clearTimer, code]);

  const handleReset = useCallback(() => {
    clearTimer();
    setCode(DEFAULT_SNIPPET.code);
    setActiveSnippetId(DEFAULT_SNIPPET.id);
    setCodeToRun(null);
    setLines([]);
    setRunning(false);
    setHasRun(false);
  }, [clearTimer]);

  const handleSnippetClick = useCallback(
    (snippetId: string, snippetCode: string) => {
      clearTimer();
      setActiveSnippetId(snippetId);
      setCode(snippetCode);
      setCodeToRun(null);
      setLines([]);
      setRunning(false);
      setHasRun(false);
    },
    [clearTimer]
  );

  const handleLine = useCallback((line: OutputLine) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const handleDone = useCallback(() => {
    clearTimer();
    setRunning(false);
  }, [clearTimer]);

  return (
    <div className="container-app py-10">
      <header className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-content">Playground Kode</h1>
        <p className="mt-2 text-muted">
          Coba langsung kode JavaScript di browser — tempat aman untuk latihan konsep
          dasar AI/ML seperti array, loop, dan fungsi (normalisasi data, rata-rata,
          filter, rekursi) sebelum masuk ke materi kursus.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {PLAYGROUND_SNIPPETS.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            onClick={() => handleSnippetClick(snippet.id, snippet.code)}
            className={activeSnippetId === snippet.id ? "pill pill-active" : "pill pill-idle"}
          >
            {snippet.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="label mb-0">Kode JavaScript</label>
            <div className="flex gap-2">
              <button type="button" onClick={handleReset} className="btn-secondary">
                Reset
              </button>
              <button type="button" onClick={handleRun} disabled={running} className="btn-primary">
                {running ? "Menjalankan…" : "Jalankan"}
              </button>
            </div>
          </div>
          <CodeEditor value={code} onChange={setCode} disabled={running} />
          <p className="text-xs text-subtle">
            Kode dijalankan di dalam sandbox iframe terisolasi — tidak punya akses ke
            data akun atau halaman lain di situs ini.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex h-[38px] items-center">
            <label className="label mb-0">Hasil</label>
          </div>
          <OutputPanel lines={lines} running={running} hasRun={hasRun} />
        </section>
      </div>

      {codeToRun !== null && (
        <SandboxRunner key={runId} code={codeToRun} onLine={handleLine} onDone={handleDone} />
      )}
    </div>
  );
}
