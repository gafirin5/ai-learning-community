"use client";

// Jalur Belajar (fitur Lab) — daftar path terkurasi dengan progres agregat
// yang dihitung dari progress pelajaran existing. Frontend-only.
import Link from "next/link";
import { useStore } from "@/lib/store";
import { learningPaths, LEVEL_BADGE, LEVEL_LABEL } from "@/lib/data";
import { pathLessonIds, pathProgressPercent } from "@/lib/learning-path";
import { useLabFlag } from "@/lib/flags";
import { ProgressBar } from "@/components/progress";

function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3h4M11 3v6l-5.2 8.6A2 2 0 007.5 21h9a2 2 0 001.7-2.4L13 9V3" />
      <path d="M8.5 15h7" />
    </svg>
  );
}

export default function PathsPage() {
  const { state } = useStore();
  const [enabled, , ready] = useLabFlag("learning-paths");

  // Flag default on → selama belum terbaca (SSR/frame pertama) tampilkan konten.
  if (ready && !enabled) {
    return (
      <div className="container-app py-16 text-center">
        <FlaskIcon className="mx-auto mb-3 h-10 w-10 text-brand" />
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
      <div className="kop mb-8 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-subtle">
            Jalur Belajar · AI Learning Community
          </p>
          <span className="badge text-brand">Beta</span>
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-content">
          Ikuti garisnya.
        </h1>
        <p className="mt-1 max-w-2xl text-muted">
          Rangkaian kursus terkurasi untuk mencapai satu kompetensi. Kursus
          berikutnya terbuka setelah kamu menyelesaikan minimal 80% kursus
          sebelumnya — atau aktifkan mode bebas di halaman jalur.
        </p>
      </div>

      <div className="relative ml-2 space-y-6 border-l-2 border-brand/40 pl-6 sm:ml-4">
        {learningPaths.map((path) => {
          const pct = pathProgressPercent(path, state.courses, state.progress);
          const lessonCount = pathLessonIds(path, state.courses).length;
          const courseCount = path.courseIds.filter((id) =>
            state.courses.some((c) => c.id === id)
          ).length;
          return (
            <div key={path.id} className="relative">
              <span
                className="absolute -left-[31px] top-6 h-3 w-3 rounded-full border-2 border-brand bg-surface sm:-left-[35px]"
                aria-hidden="true"
              />
              <div className="card card-hover p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-content">{path.title}</h2>
                    <span className={`badge shrink-0 ${LEVEL_BADGE[path.level] ?? "text-muted"}`}>
                      {LEVEL_LABEL[path.level] ?? path.level}
                    </span>
                  </div>
                  <span className={`num-tabular shrink-0 text-lg font-extrabold ${pct === 100 ? "text-success" : "text-brand"}`}>
                    {pct}%
                  </span>
                </div>
                <p className="mb-4 text-sm text-muted">{path.description}</p>

                <p className="num-tabular mb-3 text-xs text-muted">
                  {courseCount} kursus · {lessonCount} pelajaran · ±{path.estimatedHours} jam
                </p>

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
