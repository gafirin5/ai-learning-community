import { describe, it, expect } from 'vitest';
import {
  coursePercent,
  pathCourseStatuses,
  pathProgressPercent,
  nextPathLesson,
  pathIsComplete,
  resolvePathCourses,
  pathLessonIds,
  PATH_MASTERY_THRESHOLD,
} from '@/lib/learning-path';
import type { Course, LearningPath, ProgressEntry } from '@/lib/types';

function makeCourse(id: number, lessonIds: number[]): Course {
  return {
    id,
    mentorId: 1,
    title: `Course ${id}`,
    slug: `course-${id}`,
    description: 'desc',
    level: 'pemula',
    topics: [],
    lessonIds,
    createdAt: '2026-01-01',
  };
}

function makePath(courseIds: number[]): LearningPath {
  return {
    id: 1,
    slug: 'jalur-1',
    title: 'Jalur 1',
    description: 'desc',
    emoji: '🚀',
    level: 'pemula',
    courseIds,
    tags: [],
    outcomes: [],
    estimatedHours: 10,
  };
}

function progressFor(ids: number[], statuses: Array<'belum' | 'selesai'>): Record<number, ProgressEntry> {
  const map: Record<number, ProgressEntry> = {};
  ids.forEach((id, i) => {
    map[id] = { lessonId: id, status: statuses[i] ?? 'belum', quizScore: null };
  });
  return map;
}

describe('resolvePathCourses / pathLessonIds', () => {
  it('filters out course ids that no longer exist', () => {
    const course1 = makeCourse(1, [10, 11]);
    const path = makePath([1, 999]);
    expect(resolvePathCourses(path, [course1])).toEqual([course1]);
    expect(pathLessonIds(path, [course1])).toEqual([10, 11]);
  });
});

describe('coursePercent', () => {
  it('returns 0 for a course with no lessons', () => {
    const course = makeCourse(1, []);
    expect(coursePercent(course, {})).toBe(0);
  });

  it('returns rounded percentage of completed lessons', () => {
    const course = makeCourse(1, [1, 2, 3, 4]);
    const progress = progressFor([1, 2, 3, 4], ['selesai', 'selesai', 'selesai', 'belum']);
    expect(coursePercent(course, progress)).toBe(75);
  });

  it('returns 100 when all lessons are done', () => {
    const course = makeCourse(1, [1, 2]);
    const progress = progressFor([1, 2], ['selesai', 'selesai']);
    expect(coursePercent(course, progress)).toBe(100);
  });

  it('returns 0 when no progress entries exist for lessons', () => {
    const course = makeCourse(1, [1, 2]);
    expect(coursePercent(course, {})).toBe(0);
  });
});

describe('pathCourseStatuses', () => {
  it('always unlocks the first course', () => {
    const course1 = makeCourse(1, [1, 2]);
    const course2 = makeCourse(2, [3, 4]);
    const path = makePath([1, 2]);
    const statuses = pathCourseStatuses(path, [course1, course2], {});
    expect(statuses[0].unlocked).toBe(true);
  });

  it('unlocks the next course only when the previous one is done (100%)', () => {
    const course1 = makeCourse(1, [1, 2]);
    const course2 = makeCourse(2, [3, 4]);
    const path = makePath([1, 2]);
    const progress = progressFor([1, 2], ['selesai', 'selesai']);
    const statuses = pathCourseStatuses(path, [course1, course2], progress);

    expect(statuses[0].done).toBe(true);
    expect(statuses[1].unlocked).toBe(true);
  });

  it('unlocks the next course when previous percent >= PATH_MASTERY_THRESHOLD (80%)', () => {
    const course1 = makeCourse(1, [1, 2, 3, 4, 5]);
    const course2 = makeCourse(2, [6, 7]);
    const path = makePath([1, 2]);
    // 4 dari 5 lesson selesai = 80% >= threshold, tapi belum "done" (100%).
    const progress = progressFor([1, 2, 3, 4, 5], ['selesai', 'selesai', 'selesai', 'selesai', 'belum']);
    const statuses = pathCourseStatuses(path, [course1, course2], progress);

    expect(statuses[0].percent).toBe(Math.round(PATH_MASTERY_THRESHOLD * 100));
    expect(statuses[0].done).toBe(false);
    expect(statuses[1].unlocked).toBe(true);
  });

  it('keeps the next course locked when previous percent is below the threshold', () => {
    const course1 = makeCourse(1, [1, 2, 3, 4, 5]);
    const course2 = makeCourse(2, [6, 7]);
    const path = makePath([1, 2]);
    // 3 dari 5 = 60%, di bawah threshold 80%.
    const progress = progressFor([1, 2, 3, 4, 5], ['selesai', 'selesai', 'selesai', 'belum', 'belum']);
    const statuses = pathCourseStatuses(path, [course1, course2], progress);

    expect(statuses[0].percent).toBe(60);
    expect(statuses[1].unlocked).toBe(false);
  });

  it('unlocks everything when bypass mode is enabled', () => {
    const course1 = makeCourse(1, [1, 2]);
    const course2 = makeCourse(2, [3, 4]);
    const path = makePath([1, 2]);
    const statuses = pathCourseStatuses(path, [course1, course2], {}, true);

    expect(statuses[0].unlocked).toBe(true);
    expect(statuses[1].unlocked).toBe(true);
  });
});

describe('pathProgressPercent', () => {
  it('returns 0 when the path has no lessons', () => {
    const path = makePath([]);
    expect(pathProgressPercent(path, [], {})).toBe(0);
  });

  it('computes overall percentage across all courses in the path', () => {
    const course1 = makeCourse(1, [1, 2]);
    const course2 = makeCourse(2, [3, 4]);
    const path = makePath([1, 2]);
    const progress = progressFor([1, 2, 3, 4], ['selesai', 'selesai', 'selesai', 'belum']);

    expect(pathProgressPercent(path, [course1, course2], progress)).toBe(75);
  });
});

describe('nextPathLesson', () => {
  it('returns the first unfinished lesson in the first unlocked course', () => {
    const course1 = makeCourse(1, [1, 2]);
    const course2 = makeCourse(2, [3, 4]);
    const path = makePath([1, 2]);
    const progress = progressFor([1, 2], ['selesai', 'belum']);

    const next = nextPathLesson(path, [course1, course2], progress);
    expect(next).toEqual({ course: course1, lessonId: 2 });
  });

  it('moves to the next course once the current course is fully done', () => {
    const course1 = makeCourse(1, [1, 2]);
    const course2 = makeCourse(2, [3, 4]);
    const path = makePath([1, 2]);
    const progress = progressFor([1, 2], ['selesai', 'selesai']);

    const next = nextPathLesson(path, [course1, course2], progress);
    expect(next).toEqual({ course: course2, lessonId: 3 });
  });

  it('returns null when there is nothing left to learn (path complete)', () => {
    const course1 = makeCourse(1, [1, 2]);
    const path = makePath([1]);
    const progress = progressFor([1, 2], ['selesai', 'selesai']);

    expect(nextPathLesson(path, [course1], progress)).toBeNull();
  });

  it('returns null when the next course is locked and current is incomplete-but-below-threshold', () => {
    const course1 = makeCourse(1, [1, 2, 3, 4, 5]);
    const course2 = makeCourse(2, [6, 7]);
    const path = makePath([1, 2]);
    // Course 1 belum selesai (60%), jadi masih ada next lesson di course 1.
    const progress = progressFor([1, 2, 3, 4, 5], ['selesai', 'selesai', 'selesai', 'belum', 'belum']);

    const next = nextPathLesson(path, [course1, course2], progress);
    expect(next).toEqual({ course: course1, lessonId: 4 });
  });
});

describe('pathIsComplete', () => {
  it('returns false when the path has no resolvable lessons', () => {
    const path = makePath([]);
    expect(pathIsComplete(path, [], {})).toBe(false);
  });

  it('returns false when some lessons are unfinished', () => {
    const course1 = makeCourse(1, [1, 2]);
    const path = makePath([1]);
    const progress = progressFor([1, 2], ['selesai', 'belum']);
    expect(pathIsComplete(path, [course1], progress)).toBe(false);
  });

  it('returns true when every lesson across the path is done', () => {
    const course1 = makeCourse(1, [1, 2]);
    const course2 = makeCourse(2, [3, 4]);
    const path = makePath([1, 2]);
    const progress = progressFor([1, 2, 3, 4], ['selesai', 'selesai', 'selesai', 'selesai']);
    expect(pathIsComplete(path, [course1, course2], progress)).toBe(true);
  });
});
