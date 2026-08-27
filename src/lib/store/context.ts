import { createContext, useContext } from "react";
import type { ChatMessage, Course, ForumCategoryId, Level, ProgressEntry, Question, ReactionKey, Role, StoreState, User } from "@/lib/types";

interface AuthPayload {
  name: string;
  email: string;
  password: string;
  role?: Exclude<Role, "guest">;
}

export interface StoreContextValue {
  state: StoreState;
  currentUser: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (payload: AuthPayload) => { ok: boolean; error?: string };
  logout: () => void;
  setInterests: (ids: string[]) => void;
  markLessonDone: (lessonId: number, done: boolean) => void;
  saveQuizScore: (lessonId: number, score: number) => void;
  getLessonProgress: (lessonId: number) => ProgressEntry | undefined;
  courseProgressPercent: (course: Course) => number;
  sendChat: (lessonId: number, message: string) => { ok: boolean; error?: string; reply?: ChatMessage };
  getChat: (lessonId: number) => ChatMessage[];
  clearChat: (lessonId: number) => void;
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
  addProject: (data: Omit<Project, "id" | "userId" | "createdAt" | "commentIds" | "likeCount">) => void;
  addProjectComment: (projectId: number, body: string) => void;
  voteProject: (projectId: number, delta: 1 | -1) => void;
  addUser: (data: { name: string; email: string; role: Exclude<Role, "guest"> }) => { ok: boolean; error?: string };
  setUserRole: (userId: number, role: Exclude<Role, "guest">) => void;
  deleteUser: (userId: number) => void;
  addCourse: (data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => number;
  editCourse: (courseId: number, data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => void;
  deleteCourse: (courseId: number) => void;
  addLesson: (courseId: number, data: { title: string; summary: string; content: string }) => number;
  editLesson: (lessonId: number, data: { title: string; summary: string; content: string }) => void;
  deleteLesson: (lessonId: number) => void;
  saveQuiz: (lessonId: number, data: { title: string; questions: Question[] }) => void;
  deleteQuiz: (lessonId: number) => void;
  editProject: (projectId: number, data: { title: string; description: string; repoUrl: string; tags: string[]; level: Level }) => void;
  deleteProject: (projectId: number) => void;
  deleteProjectComment: (commentId: number) => void;
  deleteReport: (reportId: number) => void;
  touchLesson: (lessonId: number) => void;
  toggleBookmark: (courseId: number) => void;
  nextLesson: () => { courseSlug: string; lessonId: number } | null;
}

import type { Project } from "@/lib/types";

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type AuthPayloadType = AuthPayload;
export type { ProgressStatus } from "@/lib/types";
