import type { Level } from "./common";

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
