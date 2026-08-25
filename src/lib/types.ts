export type Role = "guest" | "learner" | "mentor" | "admin";

export type Level = "pemula" | "menengah" | "lanjutan";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Exclude<Role, "guest">;
  joinedAt: string;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  summary: string;
  content: string;
  order: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  questions: Question[];
}

export interface Course {
  id: number;
  mentorId: number;
  title: string;
  slug: string;
  description: string;
  level: Level;
  topics: string[];
  lessonIds: number[];
  createdAt: string;
}

export type ForumCategoryId = "ml" | "dl" | "data" | "career" | "umum";

export interface ForumCategory {
  id: ForumCategoryId;
  label: string;
  emoji: string;
  description?: string;
}

export type ReportTarget = "thread" | "comment";

export type ReactionKey = "👍" | "❤️" | "🎉" | "💡" | "👀" | "🙌";

export interface Report {
  id: number;
  targetType: ReportTarget;
  targetId: number;
  reporterId: number;
  reason: string;
  createdAt: string;
  status: "open" | "resolved";
}

export interface ForumComment {
  id: number;
  threadId: number;
  userId: number;
  parentId: number | null;
  body: string;
  voteCount: number;
  createdAt: string;
  hidden: boolean;
  images: string[];
}

export interface ForumThread {
  id: number;
  userId: number;
  title: string;
  body: string;
  tags: string[];
  voteCount: number;
  viewCount: number;
  acceptedCommentId: number | null;
  createdAt: string;
  commentIds: number[];
  categoryId: ForumCategoryId;
  pinned: boolean;
  hidden: boolean;
  images: string[];
}

export interface Project {
  id: number;
  userId: number;
  title: string;
  description: string;
  repoUrl: string;
  tags: string[];
  level: Level;
  createdAt: string;
  commentIds: number[];
  likeCount: number;
}

export interface ProjectComment {
  id: number;
  projectId: number;
  userId: number;
  body: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  lessonId: number;
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
  kind?: "normal" | "rejection" | "quota";
}

export type ProgressStatus = "belum" | "selesai";

export interface ProgressEntry {
  lessonId: number;
  status: ProgressStatus;
  quizScore: number | null;
}

export interface Interest {
  id: string;
  label: string;
  emoji: string;
  topics: string[];
}

// ---- Store shape (persisted to localStorage) ----
export interface StoreState {
  currentUserId: number | null;
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  seeded: boolean; // one-time per browser: gates seed re-insertion so admin deletions persist
  progress: Record<number, ProgressEntry>; // keyed by lessonId
  chat: Record<number, ChatMessage[]>; // keyed by lessonId
  chatQuota: { date: string; used: number };
  threads: ForumThread[];
  comments: ForumComment[];
  savedThreadIds: number[];
  reports: Report[];
  projects: Project[];
  projectComments: ProjectComment[];
  votes: { threads: Record<number, 1 | -1 | 0>; comments: Record<number, 1 | -1 | 0>; projects: Record<number, 1 | -1 | 0> };
  reactions: {
    threads: Record<number, Record<ReactionKey, number>>;
    comments: Record<number, Record<ReactionKey, number>>;
  };
  myReactions: {
    threads: Record<number, ReactionKey | null>;
    comments: Record<number, ReactionKey | null>;
  };
  interests: string[];
  recentlyViewed: number[]; // lesson ids, most recent first
  bookmarks: number[]; // course ids
  activity: { streak: number; lastActiveDate: string };
  xp: number;
  certificates: { courseId: number; issuedAt: string; certificateId: string }[];
}
