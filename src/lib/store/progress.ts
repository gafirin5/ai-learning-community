import { useCallback } from "react";
import type { Course } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import type { StateSetter, StoreState } from "./context";

export function useProgressActions(state: StoreState, setState: StateSetter) {
  const markLessonDone = useCallback(
    (lessonId: number, done: boolean) => {
      setState((s) => {
        const prev = s.progress[lessonId] ?? { lessonId, status: "belum", quizScore: null };
        return {
          ...s,
          progress: {
            ...s.progress,
            [lessonId]: { ...prev, status: done ? "selesai" : "belum" },
          },
        };
      });
    },
    [setState]
  );

  const saveQuizScore = useCallback(
    (lessonId: number, score: number) => {
      setState((s) => {
        const prev = s.progress[lessonId] ?? { lessonId, status: "selesai", quizScore: null };
        return {
          ...s,
          progress: {
            ...s.progress,
            [lessonId]: { ...prev, status: "selesai", quizScore: score },
          },
        };
      });
    },
    [setState]
  );

  const getLessonProgress = useCallback(
    (lessonId: number) => state.progress[lessonId],
    [state.progress]
  );

  const courseProgressPercent = useCallback(
    (course: Course) => {
      const total = course.lessonIds.length;
      if (total === 0) return 0;
      const done = course.lessonIds.filter((id) => state.progress[id]?.status === "selesai").length;
      return Math.round((done / total) * 100);
    },
    [state.progress]
  );

  const touchLesson = useCallback(
    (lessonId: number) => {
      setState((s) => {
        const key = todayKey();
        let streak = s.activity.streak;
        const last = s.activity.lastActiveDate;
        if (last !== key) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          streak = last === yesterday ? streak + 1 : 1;
        }
        return {
          ...s,
          recentlyViewed: [lessonId, ...s.recentlyViewed.filter((id) => id !== lessonId)].slice(0, 12),
          activity: { streak, lastActiveDate: key },
        };
      });
    },
    [setState]
  );

  const toggleBookmark = useCallback(
    (courseId: number) => {
      setState((s) => ({
        ...s,
        bookmarks: s.bookmarks.includes(courseId)
          ? s.bookmarks.filter((id) => id !== courseId)
          : [...s.bookmarks, courseId],
      }));
    },
    [setState]
  );

  const nextLesson = useCallback((): { courseSlug: string; lessonId: number } | null => {
    const courses = state.courses;
    const lessonById = new Map(state.lessons.map((l) => [l.id, l]));
    if (courses.length === 0) return null;
    const findFirstUnfinished = (): { courseSlug: string; lessonId: number } | null => {
      for (const course of courses) {
        for (const id of course.lessonIds) {
          if (state.progress[id]?.status !== "selesai") {
            return { courseSlug: course.slug, lessonId: id };
          }
        }
      }
      return null;
    };
    for (const id of state.recentlyViewed) {
      const lesson = lessonById.get(id);
      if (lesson && state.progress[id]?.status !== "selesai") {
        const course = courses.find((c) => c.id === lesson.courseId);
        if (course) return { courseSlug: course.slug, lessonId: id };
      }
    }
    const fallback = findFirstUnfinished();
    if (fallback) return fallback;
    if (state.recentlyViewed.length > 0) {
      const lesson = lessonById.get(state.recentlyViewed[0]);
      if (lesson) {
        const course = courses.find((c) => c.id === lesson.courseId);
        if (course) return { courseSlug: course.slug, lessonId: lesson.id };
      }
    }
    const first = courses[0];
    return { courseSlug: first.slug, lessonId: first.lessonIds[0] };
  }, [state.recentlyViewed, state.progress, state.courses, state.lessons]);

  return { markLessonDone, saveQuizScore, getLessonProgress, courseProgressPercent, touchLesson, toggleBookmark, nextLesson };
}
