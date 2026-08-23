"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { MarkdownLite, extractHeadings } from "@/components/markdown-lite";
import { QuizPanel } from "@/components/quiz-panel";
import { TutorChat } from "@/components/tutor-chat";
import { TableOfContents } from "@/components/table-of-contents";
import { useToast } from "@/components/toast";

export default function LessonPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const router = useRouter();
  const lessonId = Number(params.lessonId);
  const { getLessonProgress, markLessonDone, currentUser, touchLesson, state } = useStore();
  const { toast } = useToast();
  const [readingPct, setReadingPct] = useState(0);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const lesson = state.lessons.find((l) => l.id === lessonId);
  const course = lesson ? state.courses.find((c) => c.id === lesson.courseId) : undefined;
  const quiz = state.quizzes.find((q) => q.lessonId === lessonId);
  const progress = getLessonProgress(lessonId);
  const headings = lesson ? extractHeadings(lesson.content) : [];

  const { prevLessonId, nextLessonId, lessonIndex, totalLessons } = useMemo(() => {
    if (!course) return { prevLessonId: null, nextLessonId: null, lessonIndex: 0, totalLessons: 0 };
    const idx = course.lessonIds.indexOf(lessonId);
    return {
      prevLessonId: idx > 0 ? course.lessonIds[idx - 1] : null,
      nextLessonId: idx < course.lessonIds.length - 1 ? course.lessonIds[idx + 1] : null,
      lessonIndex: idx + 1,
      totalLessons: course.lessonIds.length,
    };
  }, [course, lessonId]);

  // Record view + update reading progress.
  useEffect(() => {
    if (!lesson || !course) return;
    touchLesson(lessonId);
  }, [lessonId, lesson, course, touchLesson]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return setReadingPct(100);
      setReadingPct(Math.min(100, Math.round((el.scrollTop / max) * 100)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!lesson || !course) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Pelajaran tidak ditemukan</h1>
        <Link href="/courses" className="btn-primary mt-4">
          Kembali ke kursus
        </Link>
      </div>
    );
  }

  const done = progress?.status === "selesai";

  function goTo(id: number | null) {
    if (id) router.push(`/courses/${course!.slug}/lessons/${id}`);
  }

  function toggleDone() {
    const next = !done;
    markLessonDone(lessonId, next);
    toast(next ? "Pelajaran ditandai selesai" : "Status diset ke belum selesai");
  }

  return (
    <div className="flex flex-1 flex-col lg:h-[calc(100vh-4rem)]">
      {/* Lesson header bar */}
      <div className="border-b border-border bg-surface">
        <div className="container-app flex items-center gap-3 py-3">
          <Link
            href={`/courses/${course.slug}`}
            className="truncate text-sm font-medium text-muted transition-colors hover:text-brand"
          >
            ← {course.title}
          </Link>
          <span className="text-subtle">/</span>
          <span className="truncate text-sm font-semibold text-content">
            {lessonIndex}/{totalLessons} · {lesson.title}
          </span>
          <button
            onClick={() => setMobileChatOpen(true)}
            className="btn-secondary ml-auto px-3 py-1.5 lg:hidden"
          >
            🤖 Tutor
          </button>
        </div>
        {/* Reading progress bar */}
        <div className="h-0.5 bg-surface-hover">
          <div
            className="h-full bg-brand transition-all duration-150"
            style={{ width: `${readingPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Content column */}
        <div ref={contentRef} className="thin-scroll flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-4xl gap-8 px-4 py-8 sm:px-6">
            <article className="min-w-0 flex-1">
              <h1 className="mb-2 text-2xl font-bold text-content sm:text-3xl">
                {lesson.title}
              </h1>
              <p className="mb-8 text-muted">{lesson.summary}</p>

              <MarkdownLite source={lesson.content} />

              {/* Quiz */}
              {quiz && (
                <section className="mt-10 border-t border-border pt-8">
                  <h2 className="mb-4 text-xl font-bold text-content">📝 {quiz.title}</h2>
                  <QuizPanel quiz={quiz} onScore={() => markLessonDone(lessonId, true)} />
                </section>
              )}

              {/* Mark complete + navigation */}
              <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <button onClick={toggleDone} className={done ? "btn-secondary" : "btn-primary"}>
                    {done ? "✓ Selesai — tandai belum" : "Tandai selesai"}
                  </button>
                  {!currentUser && (
                    <p className="mt-2 text-xs text-muted">
                      <Link href="/login" className="font-medium text-brand hover:underline">
                        Masuk
                      </Link>{" "}
                      untuk menyimpan progress.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => goTo(prevLessonId)} disabled={!prevLessonId} className="btn-secondary">
                    ← Sebelumnya
                  </button>
                  <button onClick={() => goTo(nextLessonId)} disabled={!nextLessonId} className="btn-primary">
                    Berikutnya →
                  </button>
                </div>
              </div>
            </article>

            {/* TOC sidebar (desktop) */}
            {headings.length > 0 && (
              <aside className="hidden w-56 shrink-0 lg:block">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto thin-scroll">
                  <TableOfContents items={headings} />
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Tutor chat column (desktop) */}
        <aside className="hidden w-96 shrink-0 border-l border-border bg-surface lg:block">
          <TutorChat lessonId={lessonId} />
        </aside>
      </div>

      {/* Mobile tutor chat — bottom sheet */}
      {mobileChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileChatOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-[80vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-semibold text-content">AI Tutor</span>
              <button
                onClick={() => setMobileChatOpen(false)}
                className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-content"
                aria-label="Tutup"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <TutorChat lessonId={lessonId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
