import type { Course, Lesson, Quiz } from "./course";
import type { ForumComment, ForumThread, ReactionKey, Report } from "./forum";
import type { Project, ProjectComment } from "./project";
import type { ChatMessage } from "./chat";
import type { ProgressEntry } from "./progress";
import type { User } from "./user";
import type { AppNotification } from "./notification";
import type { Certificate } from "./gamification";

export interface StoreState {
  currentUserId: number | null;
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  seeded: boolean;
  progress: Record<number, ProgressEntry>;
  chat: Record<number, ChatMessage[]>;
  chatQuota: { date: string; used: number };
  threads: ForumThread[];
  comments: ForumComment[];
  savedThreadIds: number[];
  reports: Report[];
  projects: Project[];
  projectComments: ProjectComment[];
  votes: {
    threads: Record<number, 1 | -1 | 0>;
    comments: Record<number, 1 | -1 | 0>;
    projects: Record<number, 1 | -1 | 0>;
  };
  reactions: {
    threads: Record<number, Record<ReactionKey, number>>;
    comments: Record<number, Record<ReactionKey, number>>;
  };
  myReactions: {
    threads: Record<number, ReactionKey | null>;
    comments: Record<number, ReactionKey | null>;
  };
  interests: string[];
  recentlyViewed: number[];
  bookmarks: number[];
  activity: { streak: number; lastActiveDate: string };
  notifications: AppNotification[];
  certificates: Certificate[];
  points: number;
  badges: string[];
}
