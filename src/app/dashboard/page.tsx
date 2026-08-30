"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { ProgressBar } from "@/components/progress";
import { LevelBadge } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { RecommendedCourses } from "@/components/recommended-courses";
import { LabFlashcardsWidget, LabPathsWidget } from "@/components/lab/lab-widgets";
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
        <p className="mb-6 text-muted">Rapor hanya tersedia untuk siswa yang sudah masuk.</p>
        <Link href="/login" className="btn-primary">
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      {/* Kop rapor */}
      <div className="kop mb-8 flex flex-wrap items-end justify-between gap-3 pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-subtle">
            Rapor Belajar · AI Learning Community
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-content">
            {currentUser.name}
          </h1>
          <p className="num-tabular mt-0.5 text-sm text-muted">
            NIS {String(currentUser.id).padStart(4, "0")} · {currentUser.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge text-brand">{currentUser.role}</span>
          <span className="badge text-success">
            Streak {state.activity.streak} hari
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom utama */}
        <div className="space-y-6 lg:col-span-2">
          {/* Rekap nilai — buku besar, bukan kartu metrik */}
          <div className="card overflow-hidden">
            <div className="kop px-6 pb-3 pt-5">
              <h2 className="font-bold uppercase tracking-[0.09em] text-content">
                Rekap Nilai
              </h2>
            </div>
            <table className="table-ledger">
              <tbody>
                <tr>
                  <td className="text-muted">Pelajaran selesai</td>
                  <td className="num-tabular text-right text-lg font-bold text-content">
                    {completedLessons}
                    <span className="text-sm font-normal text-subtle"> / {totalLessons}</span>
                  </td>
                  <td className="w-28 sm:w-44">
                    <ProgressBar value={overallPct} />
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Rata-rata skor kuis</td>
                  <td className="num-tabular text-right text-lg font-bold text-content">
                    {avgScore ? `${avgScore}%` : "—"}
                  </td>
                  <td>
                    <ProgressBar value={avgScore} />
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Hari belajar beruntun</td>
                  <td className="num-tabular text-right text-lg font-bold text-content">
                    {state.activity.streak}
                    <span className="text-sm font-normal text-subtle"> hari</span>
                  </td>
                  <td>
                    <ProgressBar value={Math.min(100, state.activity.streak * 10)} />
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Poin belajar</td>
                  <td className="num-tabular text-right text-lg font-bold text-brand">
                    {state.points}
                  </td>
                  <td>
                    <Link href="/leaderboard" className="text-sm font-semibold text-brand hover:underline">
                      Peringkat →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Lanjut belajar — jejak tinta yang memudar */}
          {resume &&
            (() => {
              const lesson = lessonById.get(resume.lessonId);
              const course = courses.find((c) => c.id === lesson?.courseId);
              if (!lesson || !course) return null;
              return (
                <Link
                  href={`/courses/${resume.courseSlug}/lessons/${resume.lessonId}`}
                  className="card card-hover group block px-6 py-5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-subtle">
                    Lanjutkan dari sini
                  </p>
                  <p className="mt-1.5 truncate font-bold text-content group-hover:text-brand">
                    {lesson.title}
                  </p>
                  <p className="text-sm text-muted">{course.title}</p>
                  <span
                    className="mt-3 block h-[2px] w-40 rounded-full transition-all duration-300 group-hover:w-64"
                    style={{
                      background: "linear-gradient(to right, var(--brand), transparent)",
                    }}
                    aria-hidden="true"
                  />
                </Link>
              );
            })()}

          {/* Progres per kursus */}
          <div className="card p-6">
            <h2 className="kop mb-4 pb-2 font-bold uppercase tracking-[0.09em] text-content">
              Nilai per Mata Pelajaran
            </h2>
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
                        <span className="flex shrink-0 items-center gap-2">
                          <LevelBadge level={course.level} />
                          <span className="num-tabular text-sm text-muted">{pct}%</span>
                        </span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kolom samping */}
        <div className="space-y-6">
          <div className="card px-6 py-5 text-center">
            <h3 className="kop mb-4 pb-2 text-left font-bold uppercase tracking-[0.09em] text-content">
              Pencapaian Keseluruhan
            </h3>
            <p className="num-tabular text-5xl font-extrabold text-brand">{overallPct}%</p>
            <p className="mt-2 text-sm text-muted">
              {completedLessons} dari {totalLessons} pelajaran selesai
            </p>
          </div>

          <LabPathsWidget />
          <LabFlashcardsWidget />

          <div className="card p-6">
            <h3 className="kop mb-4 pb-2 font-bold uppercase tracking-[0.09em] text-content">
              Aktivitas Forum Saya
            </h3>
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
                      <div className="num-tabular flex items-center gap-2 text-xs text-muted">
                        <span>{t.commentIds.length} komentar</span>
                        <span>·</span>
                        <span>{t.voteCount} vote</span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <RecommendedCourses />
          {state.badges.length > 0 && (
            <div className="card p-6">
              <h3 className="kop mb-3 pb-2 font-bold uppercase tracking-[0.09em] text-content">
                Stempel Prestasi
              </h3>
              <div className="flex flex-wrap gap-2">
                {state.badges.map((bid) => {
                  const b = BADGE_DEFS.find((x) => x.id === bid);
                  if (!b) return null;
                  return <span key={bid} className="badge text-warning" title={b.description}>{b.label}</span>;
                })}
              </div>
            </div>
          )}
          {state.bookmarks.length > 0 && (
            <div className="card p-6">
              <h3 className="kop mb-4 pb-2 font-bold uppercase tracking-[0.09em] text-content">
                Kursus Tersimpan
              </h3>
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
