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
