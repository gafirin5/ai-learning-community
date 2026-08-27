import type { StoreState } from "@/lib/types";
import {
  forumComments as seedComments,
  forumThreads as seedThreads,
  projectComments as seedProjectComments,
  projects as seedProjects,
} from "@/lib/data";
import { initialState } from "./initial";

export const STORAGE_KEY = "aic-store-v1";

export function loadState(): StoreState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as StoreState;
    return {
      ...initialState,
      ...parsed,
      users: parsed.users ?? initialState.users,
      courses: parsed.courses ?? initialState.courses,
      lessons: parsed.lessons ?? initialState.lessons,
      quizzes: parsed.quizzes ?? initialState.quizzes,
      seeded: parsed.seeded ?? false,
      savedThreadIds: parsed.savedThreadIds ?? [],
      reports: parsed.reports ?? [],
      votes: {
        threads: { ...(parsed.votes?.threads ?? {}) },
        comments: { ...(parsed.votes?.comments ?? {}) },
        projects: { ...(parsed.votes?.projects ?? {}) },
      },
      reactions: {
        threads: { ...(parsed.reactions?.threads ?? {}) },
        comments: { ...(parsed.reactions?.comments ?? {}) },
      },
      myReactions: {
        threads: { ...(parsed.myReactions?.threads ?? {}) },
        comments: { ...(parsed.myReactions?.comments ?? {}) },
      },
    };
  } catch {
    return initialState;
  }
}

export function mergeSeeds(s: StoreState): StoreState {
  const seedThreadById = new Map(seedThreads.map((t) => [t.id, t]));

  const normalizedThreads = s.threads.map((t) => {
    const seed = seedThreadById.get(t.id);
    const viewCount = t.viewCount ?? seed?.viewCount ?? 0;
    const acceptedCommentId = t.acceptedCommentId ?? seed?.acceptedCommentId ?? null;
    const categoryId = t.categoryId ?? seed?.categoryId ?? "umum";
    const pinned = t.pinned ?? seed?.pinned ?? false;
    const hidden = t.hidden ?? seed?.hidden ?? false;
    const images = t.images ?? seed?.images ?? [];
    if (
      viewCount === t.viewCount &&
      acceptedCommentId === t.acceptedCommentId &&
      categoryId === t.categoryId &&
      pinned === t.pinned &&
      hidden === t.hidden &&
      images === t.images
    ) {
      return t;
    }
    return { ...t, viewCount, acceptedCommentId, categoryId, pinned, hidden, images };
  });

  const normalizedComments = s.comments.map((c) => {
    if (c.hidden === undefined || c.images === undefined) {
      return { ...c, hidden: c.hidden ?? false, images: c.images ?? [] };
    }
    return c;
  });

  const threadIds = new Set(normalizedThreads.map((t) => t.id));
  const commentIds = new Set(normalizedComments.map((c) => c.id));
  const projectIds = new Set(s.projects.map((p) => p.id));
  const projectCommentIds = new Set(s.projectComments.map((c) => c.id));

  const mergedThreads = [...normalizedThreads, ...(s.seeded ? [] : seedThreads.filter((t) => !threadIds.has(t.id)))];
  const mergedComments = [...normalizedComments, ...(s.seeded ? [] : seedComments.filter((c) => !commentIds.has(c.id)))];
  const mergedProjects = [...s.projects, ...(s.seeded ? [] : seedProjects.filter((p) => !projectIds.has(p.id)))];
  const mergedProjectComments = [
    ...s.projectComments,
    ...(s.seeded ? [] : seedProjectComments.filter((c) => !projectCommentIds.has(c.id))),
  ];

  if (
    mergedThreads.length === s.threads.length &&
    mergedComments.length === s.comments.length &&
    mergedProjects.length === s.projects.length &&
    mergedProjectComments.length === s.projectComments.length &&
    normalizedThreads.every((t, i) => t === s.threads[i]) &&
    normalizedComments.every((c, i) => c === s.comments[i]) &&
    s.seeded
  ) {
    return s;
  }
  return {
    ...s,
    threads: mergedThreads,
    comments: mergedComments,
    projects: mergedProjects,
    projectComments: mergedProjectComments,
    seeded: true,
  };
}

