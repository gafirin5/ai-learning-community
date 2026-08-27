import { useCallback } from "react";
import type { Level, Question, Role, User, Course, Lesson, Quiz } from "@/lib/types";
import { todayKey } from "@/lib/tutor";
import { slugify } from "./persistence";
import type { StateSetter, StoreState } from "./types-helpers";

export function useAdminActions(state: StoreState, setState: StateSetter) {
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
    [state.users, setState]
  );

  const setUserRole = useCallback(
    (userId: number, role: Exclude<Role, "guest">) => {
      setState((s) => {
        if (userId === s.currentUserId) return s;
        const target = s.users.find((u) => u.id === userId);
        if (!target || target.role === role) return s;
        const isLastAdmin = target.role === "admin" && s.users.filter((u) => u.role === "admin").length === 1;
        if (isLastAdmin) return s;
        return { ...s, users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)) };
      });
    },
    [setState]
  );

  const deleteUser = useCallback(
    (userId: number) => {
      setState((s) => {
        if (userId === s.currentUserId) return s;
        const target = s.users.find((u) => u.id === userId);
        if (!target) return s;
        const isLastAdmin = target.role === "admin" && s.users.filter((u) => u.role === "admin").length === 1;
        if (isLastAdmin) return s;
        const threadIds = new Set(s.threads.filter((t) => t.userId === userId).map((t) => t.id));
        const commentIds = new Set(s.comments.filter((c) => c.userId === userId || threadIds.has(c.threadId)).map((c) => c.id));
        const projectIds = new Set(s.projects.filter((p) => p.userId === userId).map((p) => p.id));
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
    },
    [setState]
  );

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
    [setState]
  );

  const editCourse = useCallback(
    (courseId: number, data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => {
      setState((s) => ({
        ...s,
        courses: s.courses.map((c) =>
          c.id === courseId
            ? { ...c, title: data.title.trim(), description: data.description.trim(), level: data.level, topics: data.topics, mentorId: data.mentorId }
            : c
        ),
      }));
    },
    [setState]
  );

  const deleteCourse = useCallback(
    (courseId: number) => {
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
    },
    [setState]
  );

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
          courses: s.courses.map((c) => (c.id === courseId ? { ...c, lessonIds: [...c.lessonIds, id] } : c)),
        };
      });
      return id;
    },
    [setState]
  );

  const editLesson = useCallback(
    (lessonId: number, data: { title: string; summary: string; content: string }) => {
      setState((s) => ({
        ...s,
        lessons: s.lessons.map((l) =>
          l.id === lessonId ? { ...l, title: data.title.trim(), summary: data.summary.trim(), content: data.content } : l
        ),
      }));
    },
    [setState]
  );

  const deleteLesson = useCallback(
    (lessonId: number) => {
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
            c.id === lesson?.courseId ? { ...c, lessonIds: c.lessonIds.filter((id) => id !== lessonId) } : c
          ),
          recentlyViewed: s.recentlyViewed.filter((id) => id !== lessonId),
          progress,
          chat,
        };
      });
    },
    [setState]
  );

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
        const quiz: Quiz = { id: Date.now(), lessonId, title: data.title.trim(), questions: data.questions };
        return { ...s, quizzes: [...s.quizzes, quiz] };
      });
    },
    [setState]
  );

  const deleteQuiz = useCallback(
    (lessonId: number) => {
      setState((s) => ({ ...s, quizzes: s.quizzes.filter((q) => q.lessonId !== lessonId) }));
    },
    [setState]
  );

  const editProject = useCallback(
    (projectId: number, data: { title: string; description: string; repoUrl: string; tags: string[]; level: Level }) => {
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) =>
          p.id === projectId
            ? { ...p, title: data.title.trim(), description: data.description.trim(), repoUrl: data.repoUrl.trim(), tags: data.tags, level: data.level }
            : p
        ),
      }));
    },
    [setState]
  );

  const deleteProject = useCallback(
    (projectId: number) => {
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
    },
    [setState]
  );

  const deleteProjectComment = useCallback(
    (commentId: number) => {
      setState((s) => {
        const comment = s.projectComments.find((c) => c.id === commentId);
        return {
          ...s,
          projectComments: s.projectComments.filter((c) => c.id !== commentId),
          projects: s.projects.map((p) =>
            p.id === comment?.projectId ? { ...p, commentIds: p.commentIds.filter((id) => id !== commentId) } : p
          ),
        };
      });
    },
    [setState]
  );

  return {
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
  };
}
