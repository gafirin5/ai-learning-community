// Learning Lab — helper murni untuk Jalur Belajar. Tanpa React/Supabase agar
// mudah diuji. Progres dihitung dari state.progress existing (per lesson),
// bukan dari sumber data baru — nol migrasi DB untuk core jalur.
import type { Course, LearningPath, ProgressEntry } from "@/lib/types";

/**
 * Mastery gate (hasil riset desain learning path): kursus berikutnya terbuka
 * bila kursus sebelumnya selesai >= 80% (atau 100%). Bisa dilewati lewat
 * "mode bebas" per jalur (usePathBypass).
 */
export const PATH_MASTERY_THRESHOLD = 0.8;

export interface PathCourseStatus {
  course: Course;
  index: number;
  unlocked: boolean;
  percent: number;
  done: boolean;
}

type ProgressMap = Record<number, ProgressEntry>;

/** Kursus dalam jalur yang benar-benar tersedia di state (id yang hilang difilter). */
export function resolvePathCourses(path: LearningPath, courses: Course[]): Course[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  return path.courseIds
    .map((id) => byId.get(id))
    .filter((c): c is Course => c !== undefined);
}

export function pathLessonIds(path: LearningPath, courses: Course[]): number[] {
  return resolvePathCourses(path, courses).flatMap((c) => c.lessonIds);
}

export function coursePercent(course: Course, progress: ProgressMap): number {
  const total = course.lessonIds.length;
  if (total === 0) return 0;
  const done = course.lessonIds.filter((id) => progress[id]?.status === "selesai").length;
  return Math.round((done / total) * 100);
}

export function pathProgressPercent(
  path: LearningPath,
  courses: Course[],
  progress: ProgressMap
): number {
  const ids = pathLessonIds(path, courses);
  if (ids.length === 0) return 0;
  const done = ids.filter((id) => progress[id]?.status === "selesai").length;
  return Math.round((done / ids.length) * 100);
}

/** Status tiap kursus dalam jalur: terkunci/terbuka/selesai + persentase. */
export function pathCourseStatuses(
  path: LearningPath,
  courses: Course[],
  progress: ProgressMap,
  bypass = false
): PathCourseStatus[] {
  let prevSatisfied = true;
  return resolvePathCourses(path, courses).map((course, index) => {
    const percent = coursePercent(course, progress);
    const done = course.lessonIds.length > 0 && percent === 100;
    const unlocked = bypass || prevSatisfied;
    prevSatisfied = done || percent >= PATH_MASTERY_THRESHOLD * 100;
    return { course, index, unlocked, percent, done };
  });
}

/** Pelajaran berikutnya yang belum selesai, pada kursus pertama yang terbuka. */
export function nextPathLesson(
  path: LearningPath,
  courses: Course[],
  progress: ProgressMap,
  bypass = false
): { course: Course; lessonId: number } | null {
  for (const st of pathCourseStatuses(path, courses, progress, bypass)) {
    if (!st.unlocked) continue;
    const lessonId = st.course.lessonIds.find((id) => progress[id]?.status !== "selesai");
    if (lessonId !== undefined) return { course: st.course, lessonId };
  }
  return null;
}

export function pathIsComplete(
  path: LearningPath,
  courses: Course[],
  progress: ProgressMap
): boolean {
  const ids = pathLessonIds(path, courses);
  return ids.length > 0 && ids.every((id) => progress[id]?.status === "selesai");
}
