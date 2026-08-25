"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ChatMessage,
  Course,
  ForumCategoryId,
  ForumComment,
  ForumThread,
  Lesson,
  Level,
  ProgressEntry,
  ProgressStatus,
  Project,
  ProjectComment,
  Question,
  Quiz,
  ReactionKey,
  Report,
  Role,
  StoreState,
  User,
} from "@/lib/types";
import {
  forumComments as seedComments,
  forumThreads as seedThreads,
  projectComments as seedProjectComments,
  projects as seedProjects,
} from "@/lib/data";
import {
  DAILY_QUOTA,
  generateTutorReply,
  initialState,
  todayKey,
  withTodayQuota as _wq,
} from "@/lib/tutor";

const STORAGE_KEY = "aic-store-v1";

interface AuthPayload {
  name: string;
  email: string;
  password: string;
  role?: Exclude<Role, "guest">;
}

interface StoreContextValue {
  state: StoreState;
  currentUser: User | null;
  // auth
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (payload: AuthPayload) => { ok: boolean; error?: string };
  logout: () => void;
  // onboarding
  setInterests: (ids: string[]) => void;
  // progress
  markLessonDone: (lessonId: number, done: boolean) => void;
  saveQuizScore: (lessonId: number, score: number) => void;
  getLessonProgress: (lessonId: number) => ProgressEntry | undefined;
  courseProgressPercent: (course: Course) => number;
  // chat
  sendChat: (lessonId: number, message: string) => { ok: boolean; error?: string; reply?: ChatMessage };
  getChat: (lessonId: number) => ChatMessage[];
  clearChat: (lessonId: number) => void;
  // forum
  addThread: (data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => number;
  addComment: (threadId: number, body: string, parentId: number | null, images?: string[]) => void;
  voteThread: (threadId: number, delta: 1 | -1) => void;
  voteComment: (commentId: number, delta: 1 | -1) => void;
  viewThread: (threadId: number) => void;
  toggleSaveThread: (threadId: number) => void;
  markAccepted: (threadId: number, commentId: number | null) => void;
  editThread: (threadId: number, data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => void;
  deleteThread: (threadId: number) => void;
  editComment: (commentId: number, body: string, images?: string[]) => void;
  deleteComment: (commentId: number) => void;
  pinThread: (threadId: number, pinned: boolean) => void;
  reactTo: (target: "thread" | "comment", id: number, key: ReactionKey) => void;
  reportThread: (threadId: number, reason: string) => void;
  reportComment: (commentId: number, reason: string) => void;
  resolveReport: (reportId: number) => void;
  hideThread: (threadId: number, hidden: boolean) => void;
  hideComment: (commentId: number, hidden: boolean) => void;
  // projects
  addProject: (data: Omit<Project, "id" | "userId" | "createdAt" | "commentIds" | "likeCount">) => void;
  addProjectComment: (projectId: number, body: string) => void;
  voteProject: (projectId: number, delta: 1 | -1) => void;
  // admin: users
  addUser: (data: { name: string; email: string; role: Exclude<Role, "guest"> }) => { ok: boolean; error?: string };
  setUserRole: (userId: number, role: Exclude<Role, "guest">) => void;
  deleteUser: (userId: number) => void;
  // admin: courses / lessons / quizzes
  addCourse: (data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => number;
  editCourse: (courseId: number, data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => void;
  deleteCourse: (courseId: number) => void;
  addLesson: (courseId: number, data: { title: string; summary: string; content: string }) => number;
  editLesson: (lessonId: number, data: { title: string; summary: string; content: string }) => void;
  deleteLesson: (lessonId: number) => void;
  saveQuiz: (lessonId: number, data: { title: string; questions: Question[] }) => void;
  deleteQuiz: (lessonId: number) => void;
  // admin: projects
  editProject: (projectId: number, data: { title: string; description: string; repoUrl: string; tags: string[]; level: Level }) => void;
  deleteProject: (projectId: number) => void;
  deleteProjectComment: (commentId: number) => void;
  // admin: reports
  deleteReport: (reportId: number) => void;
  // activity & navigation
  touchLesson: (lessonId: number) => void;
  toggleBookmark: (courseId: number) => void;
  nextLesson: () => { courseSlug: string; lessonId: number } | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): StoreState {
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
      xp: parsed.xp ?? 0,
      certificates: parsed.certificates ?? [],
    };
  } catch {
    return initialState;
  }
}

// Merge static seed content (threads/projects/comments) with user additions
// so the two coexist. Runs once after hydration, not during initial render.
// Also normalizes threads so fields added in later versions (viewCount,
// acceptedCommentId) are always present, re-applying seed values for seed ids.
function mergeSeeds(s: StoreState): StoreState {
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

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "kursus";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Deterministic initial state — identical on server and first client render,
  // so React hydration never mismatches. Persisted state is loaded after mount.
  const [state, setState] = useState<StoreState>(initialState);
  const hydrated = useRef(false);

  // Load persisted state and merge seed content once after mount (browser only).
  useEffect(() => {
    const persisted = loadState();
    setState(mergeSeeds(persisted));
    hydrated.current = true;
  }, []);

  // Persist on change (skip until hydration has completed).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const login = useCallback(
    (email: string, password: string) => {
      // Demo: password accepted as anything non-empty; user must exist.
      const user = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!user) return { ok: false, error: "Email tidak ditemukan." };
      if (!password) return { ok: false, error: "Kata sandi wajib diisi." };
      setState((s) => ({ ...s, currentUserId: user.id }));
      return { ok: true };
    },
    [state.users]
  );

  const register = useCallback(
    (payload: AuthPayload) => {
      const email = payload.email.trim().toLowerCase();
      if (!payload.name.trim()) return { ok: false, error: "Nama wajib diisi." };
      if (!email || !payload.password)
        return { ok: false, error: "Email dan kata sandi wajib diisi." };
      if (state.users.some((u) => u.email.toLowerCase() === email))
        return { ok: false, error: "Email sudah terdaftar." };
      const newUser: User = {
        id: Date.now(),
        name: payload.name.trim(),
        email,
        role: payload.role ?? "learner",
        joinedAt: todayKey(),
      };
      setState((s) => ({ ...s, users: [...s.users, newUser], currentUserId: newUser.id }));
      return { ok: true };
    },
    [state.users]
  );

  const logout = useCallback(() => {
    setState((s) => ({ ...s, currentUserId: null }));
  }, []);

  const setInterests = useCallback((ids: string[]) => {
    setState((s) => ({ ...s, interests: ids }));
  }, []);

  const markLessonDone = useCallback((lessonId: number, done: boolean) => {
    setState((s) => {
      const prev = s.progress[lessonId] ?? { lessonId, status: "belum", quizScore: null };

      // Calculate XP change: add 10 XP if marking as done, subtract if reverting (only if it was previously not done)
      let xpDelta = 0;
      if (done && prev.status !== "selesai") xpDelta = 10;
      else if (!done && prev.status === "selesai") xpDelta = -10;

      return {
        ...s,
        xp: Math.max(0, s.xp + xpDelta),
        progress: {
          ...s.progress,
          [lessonId]: { ...prev, status: done ? "selesai" : "belum" },
        },
      };
    });
  }, []);

  const saveQuizScore = useCallback((lessonId: number, score: number) => {
    setState((s) => {
      const prev = s.progress[lessonId] ?? { lessonId, status: "selesai", quizScore: null };

      // Calculate XP from quiz score (e.g. 1 point per percent score).
      // Only award if it's the first time taking it or they improved.
      const previousScore = prev.quizScore ?? 0;
      let xpDelta = 0;
      if (score > previousScore) {
        xpDelta = score - previousScore;
      }

      return {
        ...s,
        xp: Math.max(0, s.xp + xpDelta),
        progress: {
          ...s.progress,
          [lessonId]: { ...prev, status: "selesai", quizScore: score },
        },
      };
    });
  }, []);

  const getLessonProgress = useCallback(
    (lessonId: number) => state.progress[lessonId],
    [state.progress]
  );

  const courseProgressPercent = useCallback(
    (course: Course) => {
      const total = course.lessonIds.length;
      if (total === 0) return 0;
      const done = course.lessonIds.filter(
        (id) => state.progress[id]?.status === "selesai"
      ).length;
      return Math.round((done / total) * 100);
    },
    [state.progress]
  );

  // Hook into lesson completion to issue certificates
  useEffect(() => {
    if (!hydrated.current) return;

    let stateChanged = false;
    const newCertificates = [...state.certificates];
    let xpAwarded = 0;

    state.courses.forEach((course) => {
      const percent = courseProgressPercent(course);
      const hasCert = state.certificates.some(c => c.courseId === course.id);

      if (percent === 100 && !hasCert) {
        newCertificates.push({
          courseId: course.id,
          issuedAt: new Date().toISOString(),
          certificateId: `CERT-${course.id}-${Date.now()}`
        });
        xpAwarded += 50; // Bonus 50 XP for course completion
        stateChanged = true;
      }
    });

    if (stateChanged) {
      setState(s => ({
        ...s,
        certificates: newCertificates,
        xp: s.xp + xpAwarded
      }));
    }
  }, [state.progress, state.courses, courseProgressPercent, state.certificates, state.xp]);

  const getChat = useCallback(
    (lessonId: number) => state.chat[lessonId] ?? [],
    [state.chat]
  );

  const clearChat = useCallback((lessonId: number) => {
    setState((s) => ({ ...s, chat: { ...s.chat, [lessonId]: [] } }));
  }, []);

  const sendChat = useCallback(
    (lessonId: number, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return { ok: false, error: "Pesan tidak boleh kosong." };

      const stateWithQuota = _wq(state);
      if (stateWithQuota.chatQuota.used >= DAILY_QUOTA) {
        const quotaMsg: ChatMessage = {
          id: Date.now(),
          lessonId,
          sender: "assistant",
          kind: "quota",
          createdAt: new Date().toISOString(),
          content: `Kuota harian Anda (${DAILY_QUOTA} pesan/hari) telah habis. Silakan kembali besok untuk bertanya lagi ke AI tutor.`,
        };
        setState((s) => ({
          ..._wq(s),
          chat: {
            ...s.chat,
            [lessonId]: [...(s.chat[lessonId] ?? []), quotaMsg],
          },
        }));
        return { ok: false, error: "Kuota harian habis." };
      }

      const userMsg: ChatMessage = {
        id: Date.now(),
        lessonId,
        sender: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const reply = generateTutorReply(lessonId, trimmed, state.lessons, state.courses);

      setState((s) => {
        const scoped = _wq(s);
        return {
          ...scoped,
          chatQuota: { date: todayKey(), used: scoped.chatQuota.used + 1 },
          chat: {
            ...s.chat,
            [lessonId]: [...(s.chat[lessonId] ?? []), userMsg, reply],
          },
        };
      });
      return { ok: true, reply };
    },
    [state]
  );

  const addThread = useCallback(
    (data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => {
      const id = Date.now();
      const thread: ForumThread = {
        id,
        userId: state.currentUserId ?? 1,
        title: data.title.trim(),
        body: data.body.trim(),
        tags: data.tags,
        voteCount: 0,
        viewCount: 0,
        acceptedCommentId: null,
        createdAt: todayKey(),
        commentIds: [],
        categoryId: data.categoryId,
        pinned: false,
        hidden: false,
        images: data.images ?? [],
      };
      setState((s) => ({ ...s, threads: [thread, ...s.threads] }));
      return id;
    },
    [state.currentUserId]
  );

  const addComment = useCallback(
    (threadId: number, body: string, parentId: number | null, images?: string[]) => {
      if (!body.trim() || !state.currentUserId) return;
      const comment: ForumComment = {
        id: Date.now(),
        threadId,
        userId: state.currentUserId,
        parentId,
        body: body.trim(),
        voteCount: 0,
        createdAt: todayKey(),
        hidden: false,
        images: images ?? [],
      };
      setState((s) => ({
        ...s,
        comments: [...s.comments, comment],
        threads: s.threads.map((t) =>
          t.id === threadId ? { ...t, commentIds: [...t.commentIds, comment.id] } : t
        ),
      }));
    },
    [state.currentUserId]
  );

  const voteThread = useCallback((threadId: number, delta: 1 | -1) => {
    setState((s) => {
      const current = s.votes.threads[threadId] ?? 0;
      const next = current === delta ? 0 : delta;
      const netDelta = next - current;
      return {
        ...s,
        votes: { ...s.votes, threads: { ...s.votes.threads, [threadId]: next } },
        threads: s.threads.map((t) =>
          t.id === threadId ? { ...t, voteCount: t.voteCount + netDelta } : t
        ),
      };
    });
  }, []);

  const voteComment = useCallback((commentId: number, delta: 1 | -1) => {
    setState((s) => {
      const current = s.votes.comments[commentId] ?? 0;
      const next = current === delta ? 0 : delta;
      const netDelta = next - current;
      return {
        ...s,
        votes: { ...s.votes, comments: { ...s.votes.comments, [commentId]: next } },
        comments: s.comments.map((c) =>
          c.id === commentId ? { ...c, voteCount: c.voteCount + netDelta } : c
        ),
      };
    });
  }, []);

  const viewThread = useCallback((threadId: number) => {
    setState((s) => ({
      ...s,
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, viewCount: (t.viewCount ?? 0) + 1 } : t
      ),
    }));
  }, []);

  const toggleSaveThread = useCallback((threadId: number) => {
    setState((s) => ({
      ...s,
      savedThreadIds: s.savedThreadIds.includes(threadId)
        ? s.savedThreadIds.filter((id) => id !== threadId)
        : [...s.savedThreadIds, threadId],
    }));
  }, []);

  const markAccepted = useCallback(
    (threadId: number, commentId: number | null) => {
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) =>
          t.id === threadId ? { ...t, acceptedCommentId: commentId } : t
        ),
      }));
    },
    []
  );

  const editThread = useCallback(
    (threadId: number, data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => {
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                title: data.title.trim(),
                body: data.body.trim(),
                tags: data.tags,
                categoryId: data.categoryId,
                images: data.images ?? t.images,
              }
            : t
        ),
      }));
    },
    []
  );

  const deleteThread = useCallback((threadId: number) => {
    setState((s) => {
      const commentIds = new Set(
        s.comments.filter((c) => c.threadId === threadId).map((c) => c.id)
      );
      const votesComments = { ...s.votes.comments };
      commentIds.forEach((id) => delete votesComments[id]);
      const votesThreads = { ...s.votes.threads };
      delete votesThreads[threadId];
      const reactionsThreads = { ...s.reactions.threads };
      delete reactionsThreads[threadId];
      const reactionsComments = { ...s.reactions.comments };
      commentIds.forEach((id) => delete reactionsComments[id]);
      const myReactionsThreads = { ...s.myReactions.threads };
      delete myReactionsThreads[threadId];
      const myReactionsComments = { ...s.myReactions.comments };
      commentIds.forEach((id) => delete myReactionsComments[id]);
      return {
        ...s,
        threads: s.threads.filter((t) => t.id !== threadId),
        comments: s.comments.filter((c) => c.threadId !== threadId),
        savedThreadIds: s.savedThreadIds.filter((id) => id !== threadId),
        reports: s.reports.filter(
          (r) => !(r.targetType === "thread" && r.targetId === threadId) &&
                 !(r.targetType === "comment" && commentIds.has(r.targetId))
        ),
        votes: { ...s.votes, threads: votesThreads, comments: votesComments },
        reactions: { threads: reactionsThreads, comments: reactionsComments },
        myReactions: { threads: myReactionsThreads, comments: myReactionsComments },
      };
    });
  }, []);

  const editComment = useCallback((commentId: number, body: string, images?: string[]) => {
    setState((s) => ({
      ...s,
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, body: body.trim(), images: images ?? c.images } : c
      ),
    }));
  }, []);

  const deleteComment = useCallback((commentId: number) => {
    setState((s) => {
      // Collect the comment and its full reply subtree.
      const toDelete = new Set<number>([commentId]);
      let changed = true;
      while (changed) {
        changed = false;
        s.comments.forEach((c) => {
          if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
            toDelete.add(c.id);
            changed = true;
          }
        });
      }
      const votesComments = { ...s.votes.comments };
      toDelete.forEach((id) => delete votesComments[id]);
      const reactionsComments = { ...s.reactions.comments };
      toDelete.forEach((id) => delete reactionsComments[id]);
      const myReactionsComments = { ...s.myReactions.comments };
      toDelete.forEach((id) => delete myReactionsComments[id]);
      return {
        ...s,
        comments: s.comments.filter((c) => !toDelete.has(c.id)),
        threads: s.threads.map((t) => {
          const next = { ...t, commentIds: t.commentIds.filter((id) => !toDelete.has(id)) };
          if (t.acceptedCommentId && toDelete.has(t.acceptedCommentId)) {
            next.acceptedCommentId = null;
          }
          return next;
        }),
        reports: s.reports.filter(
          (r) => !(r.targetType === "comment" && toDelete.has(r.targetId))
        ),
        votes: { ...s.votes, comments: votesComments },
        reactions: { ...s.reactions, comments: reactionsComments },
        myReactions: { ...s.myReactions, comments: myReactionsComments },
      };
    });
  }, []);

  const pinThread = useCallback((threadId: number, pinned: boolean) => {
    setState((s) => ({
      ...s,
      threads: s.threads.map((t) => (t.id === threadId ? { ...t, pinned } : t)),
    }));
  }, []);

  const reportTarget = useCallback(
    (targetType: Report["targetType"], targetId: number, reason: string) => {
      if (!reason.trim() || !state.currentUserId) return;
      setState((s) => {
        const alreadyReported = s.reports.some(
          (r) =>
            r.targetType === targetType &&
            r.targetId === targetId &&
            r.reporterId === s.currentUserId &&
            r.status === "open"
        );
        if (alreadyReported) return s;
        const report: Report = {
          id: Date.now(),
          targetType,
          targetId,
          reporterId: s.currentUserId!,
          reason: reason.trim(),
          createdAt: todayKey(),
          status: "open",
        };
        return { ...s, reports: [...s.reports, report] };
      });
    },
    [state.currentUserId]
  );

  const reportThread = useCallback(
    (threadId: number, reason: string) => reportTarget("thread", threadId, reason),
    [reportTarget]
  );

  const reportComment = useCallback(
    (commentId: number, reason: string) => reportTarget("comment", commentId, reason),
    [reportTarget]
  );

  const resolveReport = useCallback((reportId: number) => {
    setState((s) => ({
      ...s,
      reports: s.reports.map((r) =>
        r.id === reportId ? { ...r, status: "resolved" as const } : r
      ),
    }));
  }, []);

  const hideThread = useCallback((threadId: number, hidden: boolean) => {
    setState((s) => ({
      ...s,
      threads: s.threads.map((t) => (t.id === threadId ? { ...t, hidden } : t)),
    }));
  }, []);

  const hideComment = useCallback((commentId: number, hidden: boolean) => {
    setState((s) => ({
      ...s,
      comments: s.comments.map((c) => (c.id === commentId ? { ...c, hidden } : c)),
    }));
  }, []);

  const reactTo = useCallback(
    (target: "thread" | "comment", id: number, key: ReactionKey) => {
      setState((s) => {
        const reactions = target === "thread" ? s.reactions.threads : s.reactions.comments;
        const myReactions = target === "thread" ? s.myReactions.threads : s.myReactions.comments;
        const currentKey = myReactions[id] ?? null;

        // Same reaction → remove. Different → switch. None → add.
        const nextKey = currentKey === key ? null : key;

        const counts = { ...(reactions[id] ?? {}) };
        if (currentKey) {
          counts[currentKey] = Math.max(0, (counts[currentKey] ?? 0) - 1);
          if (counts[currentKey] === 0) delete counts[currentKey];
        }
        if (nextKey) {
          counts[nextKey] = (counts[nextKey] ?? 0) + 1;
        }

        const nextReactions = { ...reactions };
        if (Object.keys(counts).length === 0) delete nextReactions[id];
        else nextReactions[id] = counts;

        const nextMy = { ...myReactions, [id]: nextKey };

        return target === "thread"
          ? {
              ...s,
              reactions: { ...s.reactions, threads: nextReactions },
              myReactions: { ...s.myReactions, threads: nextMy },
            }
          : {
              ...s,
              reactions: { ...s.reactions, comments: nextReactions },
              myReactions: { ...s.myReactions, comments: nextMy },
            };
      });
    },
    []
  );

  const addProject = useCallback(
    (data: Omit<Project, "id" | "userId" | "createdAt" | "commentIds" | "likeCount">) => {
      const project: Project = {
        ...data,
        id: Date.now(),
        userId: state.currentUserId ?? 1,
        createdAt: todayKey(),
        commentIds: [],
        likeCount: 0,
      };
      setState((s) => ({ ...s, projects: [project, ...s.projects] }));
    },
    [state.currentUserId]
  );

  const addProjectComment = useCallback(
    (projectId: number, body: string) => {
      if (!body.trim() || !state.currentUserId) return;
      const comment: ProjectComment = {
        id: Date.now(),
        projectId,
        userId: state.currentUserId,
        body: body.trim(),
        createdAt: todayKey(),
      };
      setState((s) => ({
        ...s,
        projectComments: [...s.projectComments, comment],
        projects: s.projects.map((p) =>
          p.id === projectId ? { ...p, commentIds: [...p.commentIds, comment.id] } : p
        ),
      }));
    },
    [state.currentUserId]
  );

  const voteProject = useCallback((projectId: number, delta: 1 | -1) => {
    setState((s) => {
      const current = s.votes.projects[projectId] ?? 0;
      const next = current === delta ? 0 : delta;
      const netDelta = next - current;
      return {
        ...s,
        votes: { ...s.votes, projects: { ...s.votes.projects, [projectId]: next } },
        projects: s.projects.map((p) =>
          p.id === projectId ? { ...p, likeCount: (p.likeCount ?? 0) + netDelta } : p
        ),
      };
    });
  }, []);

  const touchLesson = useCallback((lessonId: number) => {
    setState((s) => {
      const key = todayKey();
      let streak = s.activity.streak;
      const last = s.activity.lastActiveDate;
      if (last !== key) {
        // Streak continues if last active was yesterday; otherwise resets to 1.
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = last === yesterday ? streak + 1 : 1;
      }
      return {
        ...s,
        recentlyViewed: [lessonId, ...s.recentlyViewed.filter((id) => id !== lessonId)].slice(0, 12),
        activity: { streak, lastActiveDate: key },
      };
    });
  }, []);

  const toggleBookmark = useCallback((courseId: number) => {
    setState((s) => ({
      ...s,
      bookmarks: s.bookmarks.includes(courseId)
        ? s.bookmarks.filter((id) => id !== courseId)
        : [...s.bookmarks, courseId],
    }));
  }, []);

  // Return the first unfinished lesson (preferring recently-viewed), else the
  // first lesson of the first course — the target for "Lanjut Belajar".
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
    // Prefer a recently viewed unfinished lesson.
    for (const id of state.recentlyViewed) {
      const lesson = lessonById.get(id);
      if (lesson && state.progress[id]?.status !== "selesai") {
        const course = courses.find((c) => c.id === lesson.courseId);
        if (course) return { courseSlug: course.slug, lessonId: id };
      }
    }
    const fallback = findFirstUnfinished();
    if (fallback) return fallback;
    // All done — resume the last viewed or first course's first lesson.
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

  // ---- Admin: users ----
  const addUser = useCallback(
    (data: { name: string; email: string; role: Exclude<Role, "guest"> }) => {
      const email = data.email.trim().toLowerCase();
      if (!data.name.trim()) return { ok: false, error: "Nama wajib diisi." };
      if (!email) return { ok: false, error: "Email wajib diisi." };
      if (state.users.some((u) => u.email.toLowerCase() === email))
        return { ok: false, error: "Email sudah terdaftar." };
      const newUser: User = {
        id: Date.now(),
        name: data.name.trim(),
        email,
        role: data.role,
        joinedAt: todayKey(),
      };
      setState((s) => ({ ...s, users: [...s.users, newUser] }));
      return { ok: true };
    },
    [state.users]
  );

  const setUserRole = useCallback(
    (userId: number, role: Exclude<Role, "guest">) => {
      setState((s) => {
        if (userId === s.currentUserId) return s; // cannot change own role
        const target = s.users.find((u) => u.id === userId);
        if (!target || target.role === role) return s;
        const isLastAdmin =
          target.role === "admin" &&
          s.users.filter((u) => u.role === "admin").length === 1;
        if (isLastAdmin) return s;
        return {
          ...s,
          users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)),
        };
      });
    },
    []
  );

  const deleteUser = useCallback((userId: number) => {
    setState((s) => {
      if (userId === s.currentUserId) return s; // cannot delete self
      const target = s.users.find((u) => u.id === userId);
      if (!target) return s;
      const isLastAdmin =
        target.role === "admin" &&
        s.users.filter((u) => u.role === "admin").length === 1;
      if (isLastAdmin) return s;

      const threadIds = new Set(
        s.threads.filter((t) => t.userId === userId).map((t) => t.id)
      );
      const commentIds = new Set(
        s.comments.filter((c) => c.userId === userId || threadIds.has(c.threadId)).map((c) => c.id)
      );
      const projectIds = new Set(
        s.projects.filter((p) => p.userId === userId).map((p) => p.id)
      );

      const cleanVotes = <T extends Record<number, unknown>>(rec: T, ids: Set<number>): T => {
        const next = { ...rec } as T;
        ids.forEach((id) => delete next[id]);
        return next;
      };
      const votesThreads = cleanVotes(s.votes.threads, threadIds);
      const votesComments = cleanVotes(s.votes.comments, commentIds);
      const votesProjects = cleanVotes(s.votes.projects, projectIds);
      const reactionsThreads = cleanVotes(s.reactions.threads, threadIds);
      const reactionsComments = cleanVotes(s.reactions.comments, commentIds);
      const myReactionsThreads = cleanVotes(s.myReactions.threads, threadIds);
      const myReactionsComments = cleanVotes(s.myReactions.comments, commentIds);

      return {
        ...s,
        users: s.users.filter((u) => u.id !== userId),
        threads: s.threads.filter((t) => t.userId !== userId),
        comments: s.comments.filter((c) => c.userId !== userId),
        projects: s.projects.filter((p) => p.userId !== userId),
        projectComments: s.projectComments.filter((c) => c.userId !== userId),
        savedThreadIds: s.savedThreadIds.filter((id) => !threadIds.has(id)),
        reports: s.reports.filter(
          (r) =>
            !(r.targetType === "thread" && threadIds.has(r.targetId)) &&
            !(r.targetType === "comment" && commentIds.has(r.targetId)) &&
            r.reporterId !== userId
        ),
        votes: { threads: votesThreads, comments: votesComments, projects: votesProjects },
        reactions: { threads: reactionsThreads, comments: reactionsComments },
        myReactions: { threads: myReactionsThreads, comments: myReactionsComments },
      };
    });
  }, []);

  // ---- Admin: courses / lessons / quizzes ----
  const addCourse = useCallback(
    (data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => {
      const id = Date.now();
      const course: Course = {
        id,
        mentorId: data.mentorId,
        title: data.title.trim(),
        slug: slugify(data.title),
        description: data.description.trim(),
        level: data.level,
        topics: data.topics,
        lessonIds: [],
        createdAt: todayKey(),
      };
      setState((s) => ({ ...s, courses: [...s.courses, course] }));
      return id;
    },
    []
  );

  const editCourse = useCallback(
    (courseId: number, data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => {
      setState((s) => ({
        ...s,
        courses: s.courses.map((c) =>
          c.id === courseId
            ? {
                ...c,
                title: data.title.trim(),
                description: data.description.trim(),
                level: data.level,
                topics: data.topics,
                mentorId: data.mentorId,
              }
            : c
        ),
      }));
    },
    []
  );

  const deleteCourse = useCallback((courseId: number) => {
    setState((s) => {
      const course = s.courses.find((c) => c.id === courseId);
      const lessonIds = new Set(course?.lessonIds ?? []);
      const progress = { ...s.progress };
      const chat = { ...s.chat };
      lessonIds.forEach((id) => {
        delete progress[id];
        delete chat[id];
      });
      return {
        ...s,
        courses: s.courses.filter((c) => c.id !== courseId),
        lessons: s.lessons.filter((l) => !lessonIds.has(l.id)),
        quizzes: s.quizzes.filter((q) => !lessonIds.has(q.lessonId)),
        bookmarks: s.bookmarks.filter((id) => id !== courseId),
        recentlyViewed: s.recentlyViewed.filter((id) => !lessonIds.has(id)),
        progress,
        chat,
      };
    });
  }, []);

  const addLesson = useCallback(
    (courseId: number, data: { title: string; summary: string; content: string }) => {
      const id = Date.now();
      const lesson: Lesson = {
        id,
        courseId,
        title: data.title.trim(),
        summary: data.summary.trim(),
        content: data.content,
        order: 0,
      };
      setState((s) => {
        const course = s.courses.find((c) => c.id === courseId);
        lesson.order = (course?.lessonIds.length ?? 0) + 1;
        return {
          ...s,
          lessons: [...s.lessons, lesson],
          courses: s.courses.map((c) =>
            c.id === courseId ? { ...c, lessonIds: [...c.lessonIds, id] } : c
          ),
        };
      });
      return id;
    },
    []
  );

  const editLesson = useCallback(
    (lessonId: number, data: { title: string; summary: string; content: string }) => {
      setState((s) => ({
        ...s,
        lessons: s.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, title: data.title.trim(), summary: data.summary.trim(), content: data.content }
            : l
        ),
      }));
    },
    []
  );

  const deleteLesson = useCallback((lessonId: number) => {
    setState((s) => {
      const lesson = s.lessons.find((l) => l.id === lessonId);
      const progress = { ...s.progress };
      const chat = { ...s.chat };
      delete progress[lessonId];
      delete chat[lessonId];
      return {
        ...s,
        lessons: s.lessons.filter((l) => l.id !== lessonId),
        quizzes: s.quizzes.filter((q) => q.lessonId !== lessonId),
        courses: s.courses.map((c) =>
          c.id === lesson?.courseId
            ? { ...c, lessonIds: c.lessonIds.filter((id) => id !== lessonId) }
            : c
        ),
        recentlyViewed: s.recentlyViewed.filter((id) => id !== lessonId),
        progress,
        chat,
      };
    });
  }, []);

  const saveQuiz = useCallback(
    (lessonId: number, data: { title: string; questions: Question[] }) => {
      setState((s) => {
        const existing = s.quizzes.find((q) => q.lessonId === lessonId);
        if (existing) {
          return {
            ...s,
            quizzes: s.quizzes.map((q) =>
              q.lessonId === lessonId ? { ...q, title: data.title.trim(), questions: data.questions } : q
            ),
          };
        }
        const quiz: Quiz = {
          id: Date.now(),
          lessonId,
          title: data.title.trim(),
          questions: data.questions,
        };
        return { ...s, quizzes: [...s.quizzes, quiz] };
      });
    },
    []
  );

  const deleteQuiz = useCallback((lessonId: number) => {
    setState((s) => ({
      ...s,
      quizzes: s.quizzes.filter((q) => q.lessonId !== lessonId),
    }));
  }, []);

  // ---- Admin: projects ----
  const editProject = useCallback(
    (projectId: number, data: { title: string; description: string; repoUrl: string; tags: string[]; level: Level }) => {
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                title: data.title.trim(),
                description: data.description.trim(),
                repoUrl: data.repoUrl.trim(),
                tags: data.tags,
                level: data.level,
              }
            : p
        ),
      }));
    },
    []
  );

  const deleteProject = useCallback((projectId: number) => {
    setState((s) => {
      const votesProjects = { ...s.votes.projects };
      delete votesProjects[projectId];
      return {
        ...s,
        projects: s.projects.filter((p) => p.id !== projectId),
        projectComments: s.projectComments.filter((c) => c.projectId !== projectId),
        votes: { ...s.votes, projects: votesProjects },
      };
    });
  }, []);

  const deleteProjectComment = useCallback((commentId: number) => {
    setState((s) => {
      const comment = s.projectComments.find((c) => c.id === commentId);
      return {
        ...s,
        projectComments: s.projectComments.filter((c) => c.id !== commentId),
        projects: s.projects.map((p) =>
          p.id === comment?.projectId
            ? { ...p, commentIds: p.commentIds.filter((id) => id !== commentId) }
            : p
        ),
      };
    });
  }, []);

  const deleteReport = useCallback((reportId: number) => {
    setState((s) => ({
      ...s,
      reports: s.reports.filter((r) => r.id !== reportId),
    }));
  }, []);

  const value: StoreContextValue = {
    state,
    currentUser,
    login,
    register,
    logout,
    setInterests,
    markLessonDone,
    saveQuizScore,
    getLessonProgress,
    courseProgressPercent,
    sendChat,
    getChat,
    clearChat,
    addThread,
    addComment,
    voteThread,
    voteComment,
    viewThread,
    toggleSaveThread,
    markAccepted,
    editThread,
    deleteThread,
    editComment,
    deleteComment,
    pinThread,
    reactTo,
    reportThread,
    reportComment,
    resolveReport,
    hideThread,
    hideComment,
    addProject,
    addProjectComment,
    voteProject,
    addUser,
    setUserRole,
    deleteUser,
    addCourse,
    editCourse,
    deleteCourse,
    addLesson,
    editLesson,
    deleteLesson,
    saveQuiz,
    deleteQuiz,
    editProject,
    deleteProject,
    deleteProjectComment,
    deleteReport,
    touchLesson,
    toggleBookmark,
    nextLesson,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type { ProgressStatus };
