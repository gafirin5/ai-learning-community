"use client";

// Jalur Belajar (fitur Lab) — daftar path terkurasi dengan progres agregat
// yang dihitung dari progress pelajaran existing. Frontend-only.
import Link from "next/link";
import { useStore } from "@/lib/store";
import { learningPaths, LEVEL_BADGE, LEVEL_LABEL } from "@/lib/data";
import { pathLessonIds, pathProgressPercent } from "@/lib/learning-path";
import { useLabFlag } from "@/lib/flags";
import { ProgressBar } from "@/components/progress";

export default function PathsPage() {
  const { state } = useStore();
  const [enabled, , ready] = useLabFlag("learning-paths");

  // Flag default on → selama belum terbaca (SSR/frame pertama) tampilkan konten.
  if (ready && !enabled) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🧪</p>
        <h1 className="text-2xl font-bold text-content">Jalur Belajar sedang di Lab</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Fitur ini nonaktif di perangkatmu. Aktifkan dari halaman Lab untuk mencobanya.
        </p>
        <Link href="/labs" className="btn-primary mt-5">
          Buka Lab
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold text-content">Jalur Belajar</h1>
          <span className="badge bg-brand-soft text-brand">Beta</span>
        </div>
        <p className="max-w-2xl text-muted">
          Rangkaian kursus terkurasi untuk mencapai satu kompetensi. Kursus berikutnya terbuka
          setelah kamu menyelesaikan minimal 80% kursus sebelumnya — atau aktifkan mode bebas di
          halaman jalur.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {learningPaths.map((path) => {
          const pct = pathProgressPercent(path, state.courses, state.progress);
          const lessonCount = pathLessonIds(path, state.courses).length;
          const courseCount = path.courseIds.filter((id) =>
            state.courses.some((c) => c.id === id)
          ).length;
          return (
            <div key={path.id} className="card card-hover flex flex-col p-6">
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="text-3xl" aria-hidden="true">{path.emoji}</span>
                <span className={`badge shrink-0 ${LEVEL_BADGE[path.level] ?? "bg-surface-hover text-muted"}`}>
                  {LEVEL_LABEL[path.level] ?? path.level}
                </span>
              </div>
              <h2 className="mb-1 font-bold text-content">{path.title}</h2>
              <p className="mb-4 flex-1 text-sm text-muted">{path.description}</p>

              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>📚 {courseCount} kursus</span>
                <span>📝 {lessonCount} pelajaran</span>
                <span>⏱ ±{path.estimatedHours} jam</span>
              </div>

              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted">Progress</span>
                <span className="text-brand">{pct}%</span>
              </div>
              <ProgressBar value={pct} className="h-2" />

              <div className="mt-4">
                <Link
                  href={`/paths/${path.slug}`}
                  className={pct > 0 ? "btn-primary w-full text-center" : "btn-secondary w-full text-center"}
                >
                  {pct === 100 ? "Lihat jalur" : pct > 0 ? "Lanjutkan jalur" : "Mulai jalur"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Fitur eksperimental — kelola dari{" "}
        <Link href="/labs" className="font-medium text-brand underline-offset-2 hover:underline">
          halaman Lab
        </Link>
        .
      </p>
    </div>
  );
}
