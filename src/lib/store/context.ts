import { createContext, useContext } from "react";
import type {
  ChatMessage,
  Course,
  ForumCategoryId,
  Level,
  ProgressEntry,
  Project,
  Question,
  ReactionKey,
  Role,
  StoreState,
  User,
} from "@/lib/types";
import type {
  AvailableSlot,
  BookingInput,
  BookingStatus,
  ReviewInput,
  ScheduleRange,
} from "@/features/mentor/types";

export type StateSetter = (updater: (s: StoreState) => StoreState) => void;
export type { StoreState } from "@/lib/types";

interface AuthPayload {
  name: string;
  email: string;
  password: string;
  role?: Exclude<Role, "guest">;
}

export interface StoreContextValue {
  state: StoreState;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (payload: AuthPayload) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
  setInterests: (ids: string[]) => Promise<void>;
  markLessonDone: (lessonId: number, done: boolean) => Promise<void>;
  saveQuizScore: (lessonId: number, score: number) => Promise<void>;
  getLessonProgress: (lessonId: number) => ProgressEntry | undefined;
  courseProgressPercent: (course: Course) => number;
  sendChat: (lessonId: number, message: string) => { ok: boolean; error?: string; reply?: ChatMessage };
  getChat: (lessonId: number) => ChatMessage[];
  clearChat: (lessonId: number) => void;
  addThread: (data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => Promise<number>;
  addComment: (threadId: number, body: string, parentId: number | null, images?: string[]) => Promise<void>;
  voteThread: (threadId: number, delta: 1 | -1) => Promise<void>;
  voteComment: (commentId: number, delta: 1 | -1) => Promise<void>;
  viewThread: (threadId: number) => Promise<void>;
  toggleSaveThread: (threadId: number) => Promise<void>;
  markAccepted: (threadId: number, commentId: number | null) => Promise<void>;
  editThread: (threadId: number, data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => Promise<void>;
  deleteThread: (threadId: number) => Promise<void>;
  editComment: (commentId: number, body: string, images?: string[]) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  pinThread: (threadId: number, pinned: boolean) => Promise<void>;
  reactTo: (target: "thread" | "comment", id: number, key: ReactionKey) => Promise<void>;
  reportThread: (threadId: number, reason: string) => Promise<void>;
  reportComment: (commentId: number, reason: string) => Promise<void>;
  resolveReport: (reportId: number) => Promise<void>;
  hideThread: (threadId: number, hidden: boolean) => Promise<void>;
  hideComment: (commentId: number, hidden: boolean) => Promise<void>;
  addProject: (data: Omit<Project, "id" | "userId" | "createdAt" | "commentIds" | "likeCount">) => Promise<void>;
  addProjectComment: (projectId: number, body: string) => Promise<void>;
  voteProject: (projectId: number, delta: 1 | -1) => Promise<void>;
  addUser: (data: { name: string; email: string; role: Exclude<Role, "guest"> }) => Promise<{ ok: boolean; error?: string; generatedPassword?: string }>;
  setUserRole: (userId: number, role: Exclude<Role, "guest">) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  addCourse: (data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => Promise<number>;
  editCourse: (courseId: number, data: { title: string; description: string; level: Level; topics: string[]; mentorId: number }) => Promise<void>;
  deleteCourse: (courseId: number) => Promise<void>;
  addLesson: (courseId: number, data: { title: string; summary: string; content: string }) => Promise<number>;
  editLesson: (lessonId: number, data: { title: string; summary: string; content: string }) => Promise<void>;
  deleteLesson: (lessonId: number) => Promise<void>;
  saveQuiz: (lessonId: number, data: { title: string; questions: Question[] }) => Promise<void>;
  deleteQuiz: (lessonId: number) => Promise<void>;
  editProject: (projectId: number, data: { title: string; description: string; repoUrl: string; tags: string[]; level: Level }) => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;
  deleteProjectComment: (commentId: number) => Promise<void>;
  deleteReport: (reportId: number) => Promise<void>;
  touchLesson: (lessonId: number) => Promise<void>;
  toggleBookmark: (courseId: number) => Promise<void>;
  nextLesson: () => { courseSlug: string; lessonId: number } | null;
  // Notifications
  addNotification: (data: { type: import("@/lib/types").NotificationType; title: string; body: string; href?: string; userId: number }) => void;
  markNotificationRead: (id: number, read?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearRead: () => void;
  // Gamification
  awardPoints: (amount: number) => void;
  issueCertificate: (courseId: number, courseTitle: string) => Promise<{ ok: boolean; error?: string }>;
  syncBadges: () => void;
  // Mentor Hub (Lane H)
  createBooking: (input: BookingInput) => Promise<void>;
  updateBookingStatus: (sessionId: number, status: BookingStatus) => Promise<void>;
  submitReview: (input: ReviewInput) => Promise<void>;
  saveAvailability: (slots: ScheduleRange[]) => Promise<void>;
  refreshMentorSessions: () => Promise<void>;
  getAvailableSlots: (mentorUuid: string, startDate: Date, endDate: Date) => Promise<AvailableSlot[]>;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type AuthPayloadType = AuthPayload;
export type { ProgressStatus } from "@/lib/types";
