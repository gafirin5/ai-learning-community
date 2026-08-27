"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { ProgressBar, ProgressRing } from "@/components/progress";
import { LevelBadge } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { RecommendedCourses } from "@/components/recommended-courses";
import { BADGE_DEFS } from "@/lib/store/gamification";

export default function DashboardPage() {
  const { currentUser, state, nextLesson, courseProgressPercent } = useStore();
  const resume = nextLesson();
  const courses = state.courses;
  const lessonById = new Map(state.lessons.map((l) => [l.id, l]));

  const completedLessons = useMemo(
    () => Object.values(state.progress).filter((p) => p.status === "selesai").length,
    [state.progress]
  );

  const quizScores = useMemo(
    () =>
      Object.values(state.progress)
        .map((p) => p.quizScore)
        .filter((s): s is number => s != null),
    [state.progress]
  );
  const avgScore = quizScores.length
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0;

  const totalLessons = courses.reduce((a, c) => a + c.lessonIds.length, 0);
  const overallPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (!currentUser) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-content">Silakan masuk dahulu</h1>
        <p className="mb-6 text-muted">Dashboard hanya tersedia untuk pengguna yang sudah masuk.</p>
        <Link href="/login" className="btn-primary">
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold text-content">Selamat datang, {currentUser.name} 👋</h1>
        <p className="text-muted">Pantau progres belajar Anda di sini.</p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Reveal className="h-full">
          <div className="card h-full p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-2xl" aria-hidden="true">
              🔥
            </div>
            <div>
              <p className="text-2xl font-bold text-content">
                <CountUp value={state.activity.streak} />
              </p>
              <p className="text-sm text-muted">Hari beruntun</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={80} className="h-full">
          <div className="card h-full p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-soft text-2xl" aria-hidden="true">
              ✅
            </div>
            <div>
              <p className="text-2xl font-bold text-content">
                <CountUp value={completedLessons} />
              </p>
              <p className="text-sm text-muted">Pelajaran selesai</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={160} className="h-full">
          <div className="card h-full p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-soft text-2xl" aria-hidden="true">
              🎯
            </div>
            <div>
              <p className="text-2xl font-bold text-content">
                <CountUp value={avgScore} suffix="%" />
              </p>
              <p className="text-sm text-muted">Rata-rata skor kuis</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue learning + overall */}
        <div className="space-y-6 lg:col-span-2">
          {resume && (
            <div className="card overflow-hidden">
              <div className="border-b border-border bg-brand-soft/50 px-6 py-4">
                <h2 className="font-semibold text-content">Lanjut Belajar</h2>
              </div>
              <div className="p-6">
                {(() => {
                  const lesson = lessonById.get(resume.lessonId);
                  const course = courses.find((c) => c.id === lesson?.courseId);
                  if (!lesson || !course) return null;
                  return (
                    <Link
                      href={`/courses/${resume.courseSlug}/lessons/${resume.lessonId}`}
                      className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-surface-hover"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white" aria-hidden="true">
                        ▶
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-subtle">{course.title}</p>
                        <p className="truncate font-semibold text-content group-hover:text-brand">
                          {lesson.title}
                        </p>
                      </div>
                    </Link>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Course progress */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-content">Progres Kursus</h2>
            <div className="space-y-4">
              {courses.map((course, i) => {
                const pct = courseProgressPercent(course);
                return (
                  <Reveal key={course.id} delay={i * 60}>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="truncate text-sm font-medium text-content hover:text-brand"
                        >
                          {course.title}
                        </Link>
                        <span className="shrink-0 text-sm text-muted">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center p-6 text-center">
            <h3 className="mb-4 font-semibold text-content">Pencapaian Keseluruhan</h3>
            <ProgressRing value={overallPct} size={96} strokeWidth={8} />
            <p className="mt-3 text-sm text-muted">
              {completedLessons} dari {totalLessons} pelajaran selesai
            </p>
          </div>

          {/* Recent forum activity */}
          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-content">Aktivitas Forum Saya</h3>
            {state.threads.filter((t) => t.userId === currentUser.id).length === 0 ? (
              <p className="text-sm text-muted">
                Anda belum membuat thread.{" "}
                <Link href="/forum" className="text-brand hover:underline">
                  Mulai diskusi →
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {state.threads
                  .filter((t) => t.userId === currentUser.id)
                  .slice(0, 5)
                  .map((t) => (
                    <li key={t.id}>
                      <Link href={`/forum/${t.id}`} className="text-sm font-medium text-content hover:text-brand">
                        {t.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{t.commentIds.length} komentar</span>
                        <span>·</span>
                        <span>{t.voteCount} vote</span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Bookmarks */}
          <RecommendedCourses />
          {state.badges.length > 0 && (
            <div className="card p-6">
              <h3 className="mb-3 font-semibold text-content">Lencana</h3>
              <div className="flex flex-wrap gap-2">
                {state.badges.map((bid) => {
                  const b = BADGE_DEFS.find((x) => x.id === bid);
                  if (!b) return null;
                  return <span key={bid} className="badge bg-warning-soft text-warning" title={b.description}>{b.emoji} {b.label}</span>;
                })}
              </div>
            </div>
          )}
          {state.points > 0 && (
            <div className="card p-6">
              <h3 className="mb-2 font-semibold text-content">Poin</h3>
              <p className="text-2xl font-bold text-brand">{state.points}</p>
              <p className="text-xs text-muted">Terus selesaikan pelajaran & kuis untuk naik peringkat.</p>
              <Link href="/leaderboard" className="btn-secondary mt-3 w-full text-center">Lihat Leaderboard</Link>
            </div>
          )}
          {state.bookmarks.length > 0 && (
            <div className="card p-6">
              <h3 className="mb-4 font-semibold text-content">Kursus Tersimpan</h3>
              <ul className="space-y-3">
                {state.bookmarks.map((id) => {
                  const course = courses.find((c) => c.id === id);
                  if (!course) return null;
                  return (
                    <li key={id}>
                      <Link href={`/courses/${course.slug}`} className="text-sm font-medium text-content hover:text-brand">
                        {course.title}
                      </Link>
                      <div className="mt-1">
                        <LevelBadge level={course.level} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
