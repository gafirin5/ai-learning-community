"use client";

// Learning Lab — widget integrasi lintas halaman. Semua gated flag Lab
// (src/lib/flags.ts) dan render null saat fitur nonaktif — halaman pemakai
// hanya menambahkan satu baris JSX.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { flashcards, learningPaths } from "@/lib/data";
import { nextPathLesson, pathProgressPercent } from "@/lib/learning-path";
import { useLabFlag } from "@/lib/flags";
import { todayKey } from "@/lib/srs/sm2";
import { fetchMyFlashcardProgress } from "@/lib/store/flashcards-remote";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ProgressBar } from "@/components/progress";

/** Dashboard: jalur dengan progres tertinggi + CTA lanjutkan. */
export function LabPathsWidget() {
  const { state } = useStore();
  const [enabled, , ready] = useLabFlag("learning-paths");

  if (!ready || !enabled) return null;

  const withProgress = learningPaths
    .map((path) => ({ path, pct: pathProgressPercent(path, state.courses, state.progress) }))
    .filter((x) => state.courses.some((c) => x.path.courseIds.includes(c.id)));
  const active = withProgress
    .filter((x) => x.pct > 0 && x.pct < 100)
    .sort((a, b) => b.pct - a.pct)[0];
  const chosen = active ?? withProgress[0];
  if (!chosen) return null;
  const next = nextPathLesson(chosen.path, state.courses, state.progress);

  return (
    <div className="card p-6">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-content">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
        Jalur Belajar
        <span className="badge bg-brand-soft text-brand">Beta</span>
      </h3>
      <p className="text-sm font-medium text-content">
        <svg viewBox="0 0 24 24" className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M8 17c4-1 3-5 6-7 1.5-1 3-1 3-1" />
        </svg>
        {chosen.path.title}
      </p>
      <div className="my-2 flex items-center gap-2">
        <ProgressBar value={chosen.pct} className="h-2 flex-1" />
        <span className="shrink-0 text-xs font-semibold text-muted">{chosen.pct}%</span>
      </div>
      {next && (
        <p className="truncate text-xs text-muted">Berikutnya: {next.course.title}</p>
      )}
      <Link
        href={`/paths/${chosen.path.slug}`}
        className="btn-secondary mt-3 w-full justify-center text-sm"
      >
        {chosen.pct > 0 ? "Lanjutkan jalur" : "Lihat jalur"}
      </Link>
    </div>
  );
}

/** Dashboard: jumlah kartu jatuh tempo hari ini (fetch ringan, best-effort). */
export function LabFlashcardsWidget() {
  const { state } = useStore();
  const [enabled, , ready] = useLabFlag("flashcards");
  const isLoggedIn = state.currentUserId != null;
  const remoteOn = isSupabaseConfigured();
  const [due, setDue] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!ready || !enabled || !isLoggedIn || !remoteOn) return;
    void (async () => {
      try {
        const rows = await fetchMyFlashcardProgress();
        if (!cancelled) {
          const today = todayKey();
          setDue(rows.filter((r) => r.dueAt && r.dueAt <= today).length);
        }
      } catch {
        // best-effort: widget dashboard tidak boleh mengganggu halaman
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, enabled, isLoggedIn, remoteOn]);

  if (!ready || !enabled) return null;

  return (
    <div className="card p-6">
      <h3 className="mb-2 flex items-center gap-2 font-semibold text-content">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-warning" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="13" height="16" rx="1.5" />
          <path d="M7 5V4a2 2 0 012-2h11a1 1 0 011 1v14a1 1 0 01-1 1h-1" />
          <path d="M7 9h5M7 13h5M7 17h3" />
        </svg>
        Kartu Hafalan
        <span className="badge bg-warning-soft text-warning">Eksperimental</span>
      </h3>
      <p className="text-sm text-muted">
        {due == null
          ? "Memuat kartu jatuh tempo…"
          : due > 0
            ? (
              <>
                <span className="font-bold text-content">{due}</span> kartu menunggu diulas
                hari ini.
              </>
            )
            : "Tidak ada kartu jatuh tempo."}
      </p>
      <Link href="/flashcards" className="btn-secondary mt-3 w-full justify-center text-sm">
        Berlatih sekarang
      </Link>
    </div>
  );
}

/** Halaman pelajaran: tautan latihan kartu milik pelajaran ini. */
export function LabFlashcardsLessonLink({ lessonId }: { lessonId: number }) {
  const [enabled, , ready] = useLabFlag("flashcards");
  const hasCards = flashcards.some((c) => c.lessonId === lessonId);
  if (!ready || !enabled || !hasCards) return null;
  return (
    <Link
      href={`/flashcards?lesson=${lessonId}`}
      className="btn-secondary mt-4 w-full justify-center text-sm"
    >
      Latih Kartu Hafalan pelajaran ini
    </Link>
  );
}
