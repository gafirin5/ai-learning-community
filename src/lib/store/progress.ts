import { useCallback } from "react";
import type { Course } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  setLessonDoneRemote,
  saveQuizScoreRemote,
  touchActivityRemote,
  toggleBookmarkRemote,
} from "@/lib/api-write";
import type { StateSetter, StoreState } from "./context";

export function useProgressActions(state: StoreState, setState: StateSetter) {
  const markLessonDone = useCallback(
    async (lessonId: number, done: boolean) => {
      if (isSupabaseConfigured()) {
        const prevQuiz = state.progress[lessonId]?.quizScore ?? null;
        const { status, points } = await setLessonDoneRemote(lessonId, done, prevQuiz);
        setState((s) => ({
          ...s,
          points,
          progress: {
            ...s.progress,
            [lessonId]: { lessonId, status, quizScore: prevQuiz },
          },
        }));
        return;
      }
      setState((s) => {
        const prev = s.progress[lessonId] ?? { lessonId, status: "belum", quizScore: null };
        const wasDone = prev.status === "selesai";
        const willDone = done;
        let points = s.points;
        if (!wasDone && willDone) points += 10;
        if (wasDone && !willDone) points = Math.max(0, points - 10);
        return {
          ...s,
          points,
          progress: {
            ...s.progress,
            [lessonId]: { ...prev, status: done ? "selesai" : "belum" },
          },
        };
      });
    },
    [state.progress, setState]
  );

  const saveQuizScore = useCallback(
    async (lessonId: number, score: number) => {
      if (isSupabaseConfigured()) {
        const { status, points } = await saveQuizScoreRemote(lessonId, score);
        setState((s) => ({
          ...s,
          points,
          progress: {
            ...s.progress,
            [lessonId]: { lessonId, status, quizScore: score },
          },
        }));
        return;
      }
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
    async (lessonId: number) => {
      if (isSupabaseConfigured()) {
        const streak = await touchActivityRemote();
        setState((s) => ({
          ...s,
          recentlyViewed: [lessonId, ...s.recentlyViewed.filter((id) => id !== lessonId)].slice(0, 12),
          activity: { streak, lastActiveDate: todayKey() },
        }));
        return;
      }
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
    async (courseId: number) => {
      if (isSupabaseConfigured()) {
        const bookmarked = await toggleBookmarkRemote(courseId);
        setState((s) => ({
          ...s,
          bookmarks: bookmarked
            ? [...s.bookmarks, courseId]
            : s.bookmarks.filter((id) => id !== courseId),
        }));
        return;
      }
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
