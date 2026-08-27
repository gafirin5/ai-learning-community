// Backward-compat shim — new code should import from "@/lib/types/*" slices.
export type { Role, Level } from "./types/common";
export type { User } from "./types/user";
export type { Lesson, Question, Quiz, Course } from "./types/course";
export type { ForumCategoryId, ForumCategory, ReportTarget, ReactionKey, Report, ForumComment, ForumThread } from "./types/forum";
export type { Project, ProjectComment } from "./types/project";
export type { ChatMessage, ProgressStatus, ProgressEntry, Interest } from "./types/progress";
export type { StoreState } from "./types/store";
