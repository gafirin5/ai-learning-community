"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";

/**
 * Editor kuis presentasional (state soal internal, persist via callback props).
 *
 * Keterbatasan: tipe `Question` (src/lib/types/course.ts) tidak memiliki field
 * `type`, sehingga soal "benar-salah" disimpan sebagai pilihan ganda dengan 2
 * opsi tetap ["Benar", "Salah"]. Soal tersimpan yang opsinya persis pasangan
 * tersebut dianggap benar-salah saat diedit kembali (heuristik).
 */

type QuestionKind = "pilihan-ganda" | "benar-salah";

interface EditorQuestion extends Question {
  kind: QuestionKind;
}

const BENAR_SALAH_OPTIONS: readonly [string, string] = ["Benar", "Salah"];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const DEFAULT_OPTIONS = ["", "", "", ""];

function isBenarSalahOptions(options: string[]): boolean {
  return (
    options.length === BENAR_SALAH_OPTIONS.length &&
    options[0] === BENAR_SALAH_OPTIONS[0] &&
    options[1] === BENAR_SALAH_OPTIONS[1]
  );
}

function toEditorQuestion(q: Question): EditorQuestion {
  return { ...q, kind: isBenarSalahOptions(q.options) ? "benar-salah" : "pilihan-ganda" };
}

function toQuestion(q: EditorQuestion): Question {
  if (q.kind === "benar-salah") {
    return {
      id: q.id,
      text: q.text,
      options: [...BENAR_SALAH_OPTIONS],
      correctIndex: q.correctIndex === 1 ? 1 : 0,
      explanation: q.explanation,
    };
  }
  return { id: q.id, text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation };
}

function buildErrors(title: string, questions: EditorQuestion[]): string[] {
  const errors: string[] = [];
  if (!title.trim()) errors.push("Judul kuis wajib diisi.");
  if (questions.length === 0) errors.push("Kuis minimal memiliki 1 soal.");
  questions.forEach((q, qi) => {
    const label = `Soal ${qi + 1}`;
    if (!q.text.trim()) errors.push(`${label}: pertanyaan belum diisi.`);
    if (q.options.length < MIN_OPTIONS) errors.push(`${label}: minimal ${MIN_OPTIONS} opsi.`);
    if (q.options.some((opt) => !opt.trim())) errors.push(`${label}: semua opsi wajib diisi.`);
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) errors.push(`${label}: jawaban benar belum dipilih.`);
  });
  return errors;
}

export function QuizEditor({
  lessonId,
  initialTitle,
  initialQuestions,
  hasExisting,
  onSave,
  onDelete,
  onClose,
}: {
  lessonId: number;
  initialTitle: string;
  initialQuestions: Question[];
  hasExisting: boolean;
  onSave: (data: { title: string; questions: Question[] }) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<EditorQuestion[]>(() => initialQuestions.map(toEditorQuestion));

  const errors = buildErrors(title, questions);
  const invalid = errors.length > 0;

  function updateQuestion(idx: number, patch: Partial<EditorQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [
      ...qs,
      // `+ qs.length` menghindari id bentrok saat menambah beberapa soal cepat.
      { id: Date.now() + qs.length, text: "", options: [...DEFAULT_OPTIONS], correctIndex: 0, explanation: "", kind: "pilihan-ganda" },
    ]);
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  function setKind(idx: number, kind: QuestionKind) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== idx || q.kind === kind) return q;
        if (kind === "benar-salah") {
          return { ...q, kind, options: [...BENAR_SALAH_OPTIONS], correctIndex: q.correctIndex === 1 ? 1 : 0 };
        }
        // Kembali ke pilihan ganda: pasangan Benar/Salah di-reset ke 4 opsi kosong.
        if (isBenarSalahOptions(q.options)) {
          return { ...q, kind, options: [...DEFAULT_OPTIONS], correctIndex: 0 };
        }
        return { ...q, kind };
      })
    );
  }

  function addOption(idx: number) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === idx && q.options.length < MAX_OPTIONS ? { ...q, options: [...q.options, ""] } : q))
    );
  }

  function removeOption(idx: number, optionIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== idx || q.options.length <= MIN_OPTIONS) return q;
        const options = q.options.filter((_, oi) => oi !== optionIndex);
        const correctIndex = q.correctIndex === optionIndex ? 0 : q.correctIndex > optionIndex ? q.correctIndex - 1 : q.correctIndex;
        return { ...q, options, correctIndex };
      })
    );
  }

  async function handleSave() {
    if (invalid) return;
    await onSave({ title: title.trim(), questions: questions.map(toQuestion) });
    onClose();
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm("Hapus kuis untuk pelajaran ini?")) return;
    await onDelete();
    onClose();
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <h5 className="font-semibold text-content">Kuis</h5>
        <button type="button" onClick={onClose} className="btn-ghost ml-auto px-2 py-1 text-xs">
          Tutup
        </button>
      </div>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul kuis" aria-label="Judul kuis" />
      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Soal {qi + 1}</span>
            <select
              className="input ml-auto w-auto py-1 text-xs"
              value={q.kind}
              onChange={(e) => setKind(qi, e.target.value as QuestionKind)}
              aria-label={`Jenis soal ${qi + 1}`}
            >
              <option value="pilihan-ganda">Pilihan Ganda</option>
              <option value="benar-salah">Benar / Salah</option>
            </select>
            <button type="button" onClick={() => removeQuestion(qi)} className="btn-ghost px-2 py-1 text-xs text-danger hover:bg-danger-soft">
              Hapus soal
            </button>
          </div>
          <input
            className="input"
            value={q.text}
            onChange={(e) => updateQuestion(qi, { text: e.target.value })}
            placeholder="Pertanyaan"
            aria-label={`Pertanyaan soal ${qi + 1}`}
          />
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${lessonId}-${qi}`}
                  checked={q.correctIndex === oi}
                  onChange={() => updateQuestion(qi, { correctIndex: oi })}
                  aria-label={`Jawaban benar ${oi + 1}`}
                />
                {q.kind === "benar-salah" ? (
                  <span className="text-sm text-content">{opt}</span>
                ) : (
                  <input
                    className="input"
                    value={opt}
                    onChange={(e) => {
                      const options = [...q.options];
                      options[oi] = e.target.value;
                      updateQuestion(qi, { options });
                    }}
                    placeholder={`Opsi ${oi + 1}`}
                    aria-label={`Opsi ${oi + 1} soal ${qi + 1}`}
                  />
                )}
                {q.kind === "pilihan-ganda" && (
                  <button
                    type="button"
                    onClick={() => removeOption(qi, oi)}
                    disabled={q.options.length <= MIN_OPTIONS}
                    className="btn-ghost px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                    aria-label={`Hapus opsi ${oi + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {q.kind === "pilihan-ganda" && (
            <button type="button" onClick={() => addOption(qi)} disabled={q.options.length >= MAX_OPTIONS} className="btn-ghost px-2 py-1 text-xs">
              + Opsi
            </button>
          )}
          <input
            className="input"
            value={q.explanation}
            onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
            placeholder="Pembahasan"
            aria-label={`Pembahasan soal ${qi + 1}`}
          />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addQuestion} className="btn-secondary">
          + Soal
        </button>
        <button type="button" onClick={handleSave} disabled={invalid} className="btn-primary">
          Simpan Kuis
        </button>
        {hasExisting && onDelete && (
          <button type="button" onClick={handleDelete} className="btn-danger">
            Hapus Kuis
          </button>
        )}
      </div>
      {invalid && (
        <ul className="space-y-0.5 text-xs text-danger" aria-live="polite">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
