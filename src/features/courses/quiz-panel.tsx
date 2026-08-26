"use client";

import { useState } from "react";
import type { Quiz } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/toast";
import { Confetti } from "@/components/confetti";

export function QuizPanel({
  quiz,
  onScore,
}: {
  quiz: Quiz;
  onScore: (score: number) => void;
}) {
  const { saveQuizScore, currentUser } = useStore();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [celebrate, setCelebrate] = useState(0);

  const answeredCount = Object.keys(answers).length;
  const total = quiz.questions.length;
  const allAnswered = answeredCount === total;
  const correctCount = quiz.questions.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;
  const score = Math.round((correctCount / total) * 100);

  function handleSubmit() {
    if (!allAnswered) return;
    setSubmitted(true);
    if (currentUser) saveQuizScore(quiz.lessonId, score);
    onScore(score);
    if (score >= 70) setCelebrate((c) => c + 1);
    toast(`Kuis selesai — skor ${score}%`, score >= 70 ? "success" : "info");
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-5">
      <Confetti trigger={celebrate} />

      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-content">
          {submitted ? "Hasil kuis" : `Terjawab ${answeredCount} dari ${total}`}
        </span>
        <div className="flex gap-1" aria-label={`Soal ${answeredCount} dari ${total} terjawab`}>
          {quiz.questions.map((q) => (
            <span
              key={q.id}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                answers[q.id] !== undefined ? "bg-brand" : "bg-surface-hover"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {quiz.questions.map((q, qIdx) => {
        const selected = answers[q.id];
        const isCorrect = submitted && selected === q.correctIndex;
        const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

        return (
          <div key={q.id} className="card p-5">
            <p className="mb-3 font-semibold text-content">
              {qIdx + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                let cls = "border-border hover:border-brand/50";
                if (submitted && oIdx === q.correctIndex) cls = "border-success/40 bg-success-soft";
                else if (isWrong && oIdx === selected) cls = "border-danger/40 bg-danger-soft animate-shake";
                else if (!submitted && selected === oIdx) cls = "border-brand bg-brand-soft";

                return (
                  <button
                    key={oIdx}
                    disabled={submitted}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${cls} ${
                      submitted ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        submitted && oIdx === q.correctIndex
                          ? "bg-success text-white"
                          : isWrong && oIdx === selected
                          ? "bg-danger text-white"
                          : selected === oIdx
                          ? "animate-pop bg-brand text-white"
                          : "bg-surface-hover text-muted"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-content">{opt}</span>
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div
                className={`mt-3 animate-fade-in rounded-lg px-4 py-3 text-sm ${
                  isCorrect ? "bg-success-soft text-content" : "bg-warning-soft text-content"
                }`}
              >
                <span className="font-semibold">{isCorrect ? "Benar! " : "Belum tepat. "}</span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {allAnswered ? "Semua soal terjawab." : `Sisa ${total - answeredCount} soal.`}
          </p>
          <button onClick={handleSubmit} disabled={!allAnswered} className="btn-primary">
            Kumpulkan Jawaban
          </button>
        </div>
      ) : (
        <div className="card animate-pop-in flex flex-col items-center gap-3 bg-brand-soft/50 p-6 text-center">
          <p className="text-lg font-bold text-content">
            Skor Anda: {score}% ({correctCount}/{total})
          </p>
          <p className="text-sm text-muted">
            {score >= 70 ? "Bagus! Anda menguasai materi ini." : "Ulas kembali materinya, lalu coba lagi."}
          </p>
          <button onClick={handleRetry} className="btn-secondary">
            Ulangi Kuis
          </button>
        </div>
      )}
    </div>
  );
}
