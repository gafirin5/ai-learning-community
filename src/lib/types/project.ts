import type { Level } from "./common";

export interface Project {
  id: number;
  userId: number;
  title: string;
  description: string;
  repoUrl: string;
  tags: string[];
  level: Level;
  /** URL gambar cover (kolom projects.cover_image_url, migration 20260901000001). Kosong = pakai banner gradient. */
  coverImageUrl?: string;
  /** URL demo live (kolom projects.demo_url, migration 20260901000001). Kosong = tanpa tombol/badge Demo. */
  demoUrl?: string;
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
