import type { Course } from "@/lib/types";
import { interests as interestDefs } from "@/lib/data/interests";

export function topicsForInterestIds(ids: string[]): string[] {
  const wanted = new Set(ids);
  return interestDefs.filter((i) => wanted.has(i.id)).flatMap((i) => i.topics);
}

export function recommendCourses(courses: Course[], interestIds: string[], limit = 6): Course[] {
  if (interestIds.length === 0) return courses.slice(0, limit);
  const topics = new Set(topicsForInterestIds(interestIds).map((t) => t.toLowerCase()));
  const scored = courses
    .map((c) => ({
      course: c,
      score: c.topics.filter((t) => topics.has(t.toLowerCase())).length,
    }))
    .sort((a, b) => b.score - a.score || b.course.createdAt.localeCompare(a.course.createdAt));
  const withScore = scored.filter((s) => s.score > 0).map((s) => s.course);
  // Fill remainder with newest if not enough matches
  const remain = scored.filter((s) => s.score === 0).map((s) => s.course);
  return [...withScore, ...remain].slice(0, limit);
}
