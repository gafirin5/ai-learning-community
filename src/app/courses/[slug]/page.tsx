"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { LevelBadge } from "@/components/ui";
import { ProgressBar } from "@/components/progress";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Avatar } from "@/components/avatar";
import { useToast } from "@/components/toast";
import { CertificateCard } from "@/components/certificate-card";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const { getLessonProgress, courseProgressPercent, toggleBookmark, state, issueCertificate, addNotification } = useStore();
  const { toast } = useToast();
  const course = state.courses.find((c) => c.slug === params.slug);

  if (!course) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Kursus tidak ditemukan</h1>
        <Link href="/courses" className="btn-primary mt-4">
          Kembali ke daftar kursus
        </Link>
      </div>
    );
  }

  const mentor = state.users.find((u) => u.id === course.mentorId);
  const pct = courseProgressPercent(course);
  const bookmarked = state.bookmarks.includes(course.id);
  const canCert = pct === 100 && !!state.currentUserId;
  const cert = state.certificates.find((c) => c.courseId === course.id && c.userId === state.currentUserId);
  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;

  function handleBookmark() {
    toggleBookmark(course!.id);
    toast(bookmarked ? "Dihapus dari tersimpan" : "Kursus disimpan", "success");
  }

  function handleClaim() {
    if (!canCert || !currentUser) return;
    const r = issueCertificate(course!.id, course!.title);
    if (r.ok) {
      addNotification({ type: "certificate", title: "Sertifikat diterbitkan", body: "Selamat! Sertifikat " + course!.title + " telah diterbitkan.", href: "/bookmarks", userId: currentUser.id });
      toast("Sertifikat diterbitkan! Lihat di Tersimpan.", "success");
    } else {
      toast(r.error ?? "Gagal", "error");
    }
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs
        items={[{ label: "Kursus", href: "/courses" }, { label: course.title }]}
      />

      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <LevelBadge level={course.level} />
          {course.topics.map((t) => (
            <span key={t} className="badge bg-surface-hover text-muted">
              #{t}
            </span>
          ))}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-content">{course.title}</h1>
            <p className="max-w-3xl text-muted">{course.description}</p>
          </div>
          <button
            onClick={handleBookmark}
            className="btn-secondary shrink-0"
            aria-pressed={bookmarked}
            aria-label={bookmarked ? "Hapus dari tersimpan" : "Simpan kursus"}
          >
            {bookmarked ? "★ Tersimpan" : "☆ Simpan"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Progress */}
          <div className="card p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-content">Progress kursus</span>
              <span className="text-sm font-semibold text-brand">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="h-3" />
          </div>

          {canCert && !cert && (
            <div className="card flex items-center justify-between p-4">
              <span className="text-sm font-medium text-content">🎓 Kamu menyelesaikan 100% — klaim sertifikatmu!</span>
              <button onClick={handleClaim} className="btn-primary">Klaim Sertifikat</button>
            </div>
          )}
          {cert && currentUser && (
            <CertificateCard courseTitle={cert.courseTitle} userName={currentUser.name} issuedAt={cert.issuedAt} />
          )}

          {/* Lessons */}
          <h2 className="text-xl font-bold text-content">Daftar Pelajaran</h2>
          <div className="space-y-3">
            {course.lessonIds.map((lessonId, idx) => {
              const lesson = state.lessons.find((l) => l.id === lessonId);
              if (!lesson) return null;
              const progress = getLessonProgress(lessonId);
              const quiz = state.quizzes.find((q) => q.lessonId === lessonId);
              const done = progress?.status === "selesai";
              return (
                <div key={lessonId} className="card flex items-center gap-4 p-5 transition-colors hover:bg-surface-hover/50">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      done ? "bg-success-soft text-success" : "bg-surface-hover text-muted"
                    }`}
                  >
                    {done ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/courses/${course.slug}/lessons/${lessonId}`}
                      className="font-semibold text-content hover:text-brand"
                    >
                      {lesson.title}
                    </Link>
                    <p className="truncate text-sm text-muted">{lesson.summary}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {progress?.quizScore != null && (
                      <span className="badge bg-success-soft text-success">Skor {progress.quizScore}%</span>
                    )}
                    {quiz && <span className="badge bg-surface-hover text-muted">{quiz.questions.length} soal</span>}
                    <Link
                      href={`/courses/${course.slug}/lessons/${lessonId}`}
                      className="btn-secondary px-3 py-1.5"
                    >
                      {done ? "Ulas" : "Mulai"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mentor card */}
        <aside className="lg:col-span-1">
          <div className="card sticky top-20 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-subtle">
              Mentor
            </h3>
            <div className="flex items-center gap-3">
              <Avatar name={mentor?.name ?? "Mentor"} size="lg" />
              <div>
                {mentor ? (
                  <Link
                    href={`/profile/${mentor.id}`}
                    className="font-semibold text-content hover:text-brand"
                  >
                    {mentor.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-content">Mentor</span>
                )}
                <p className="text-xs text-muted">Pembuat kursus</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
