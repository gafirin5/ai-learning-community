"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { LevelBadge } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function BookmarksPage() {
  const { state, toggleBookmark, courseProgressPercent } = useStore();
  const { toast } = useToast();
  const courses = state.courses;
  const lessonsById = useMemo(() => new Map(state.lessons.map((l) => [l.id, l])), [state.lessons]);

  const savedCourses = useMemo(
    () => courses.filter((c) => state.bookmarks.includes(c.id)),
    [courses, state.bookmarks]
  );
  const savedThreads = useMemo(
    () => state.threads.filter((t) => state.savedThreadIds.includes(t.id)),
    [state.threads, state.savedThreadIds]
  );
  const recentLessons = useMemo(
    () => state.recentlyViewed.map((id) => lessonsById.get(id)).filter((v): v is NonNullable<typeof v> => !!v),
    [state.recentlyViewed, lessonsById]
  );

  const empty = savedCourses.length === 0 && savedThreads.length === 0 && recentLessons.length === 0;

  return (
    <div className="container-app py-10">
      <h1 className="mb-2 text-3xl font-bold text-content">Tersimpan</h1>
      <p className="mb-8 text-muted">
        Kursus, thread, dan pelajaran yang kamu simpan atau baru dilihat — semua di satu tempat.
      </p>

      {empty ? (
        <div className="card p-10 text-center">
          <p className="mb-2 text-4xl" aria-hidden="true">🔖</p>
          <p className="font-semibold text-content">Belum ada yang tersimpan</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Simpan kursus dari halaman kursus atau thread forum untuk melihatnya di sini.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/courses" className="btn-primary">Jelajahi kursus</Link>
            <Link href="/forum" className="btn-secondary">Buka forum</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            {savedCourses.length > 0 && (
              <div className="card p-6">
                <h2 className="mb-4 font-semibold text-content">Kursus tersimpan ({savedCourses.length})</h2>
                <ul className="space-y-3">
                  {savedCourses.map((c) => {
                    const pct = courseProgressPercent(c);
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                        <div className="min-w-0">
                          <Link href={`/courses/${c.slug}`} className="font-semibold text-content hover:text-brand">{c.title}</Link>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted"><LevelBadge level={c.level} /><span>{pct}% progres</span></div>
                        </div>
                        <button onClick={() => { toggleBookmark(c.id); toast("Dihapus dari tersimpan", "success"); }} className="btn-ghost shrink-0">Hapus</button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {savedThreads.length > 0 && (
              <div className="card p-6">
                <h2 className="mb-4 font-semibold text-content">Thread tersimpan ({savedThreads.length})</h2>
                <ul className="space-y-3">
                  {savedThreads.map((t) => (
                    <li key={t.id} className="rounded-xl border border-border p-4">
                      <Link href={`/forum/${t.id}`} className="font-semibold text-content hover:text-brand">{t.title}</Link>
                      <p className="mt-1 text-sm text-muted line-clamp-2">{t.body}</p>
                      <div className="mt-2 flex gap-2 text-xs text-muted"><span>{t.voteCount} vote</span><span>·</span><span>{t.commentIds.length} komentar</span></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="card p-6">
              <h3 className="mb-4 font-semibold text-content">Baru dilihat</h3>
              {recentLessons.length === 0 ? (
                <p className="text-sm text-muted">Belum ada riwayat.</p>
              ) : (
                <ul className="space-y-3">
                  {recentLessons.slice(0, 8).map((l) => {
                    const course = courses.find((c) => c.id === l.courseId);
                    return (
                      <li key={l.id}>
                        <Link href={course ? `/courses/${course.slug}/lessons/${l.id}` : "#"} className="text-sm font-medium text-content hover:text-brand">{l.title}</Link>
                        <p className="text-xs text-muted">{course?.title}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {state.certificates.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 font-semibold text-content">Sertifikat ({state.certificates.length})</h3>
                <ul className="space-y-2">
                  {state.certificates.map((c) => (
                    <li key={c.id} className="rounded-lg bg-surface-hover px-3 py-2 text-sm">
                      <p className="font-medium text-content">{c.courseTitle}</p>
                      <p className="text-xs text-muted">{new Date(c.issuedAt).toLocaleDateString("id-ID")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
