import type {
  Certificate,
  ForumCategoryId,
  ForumComment,
  ForumThread,
  ProgressStatus,
  Project,
  ProjectComment,
} from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { uuidToNumber } from "@/lib/uuid";

// Operasi tulis menuju Supabase. Setiap fungsi mengembalikan hasil server yang
// sudah dipetakan ke tipe domain (bukan id Date.now() lokal).
// user_id selalu berasal dari session (RLS), bukan dari angka hash di store.

type AnyRow = { [key: string]: unknown };

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function mapThread(r: AnyRow): ForumThread {
  return {
    id: num(r.id),
    userId: uuidToNumber(str(r.user_id)),
    title: str(r.title),
    body: str(r.body),
    tags: strArr(r.tags),
    voteCount: num(r.vote_count),
    viewCount: num(r.view_count),
    acceptedCommentId: r.accepted_comment_id == null ? null : num(r.accepted_comment_id),
    createdAt: str(r.created_at),
    commentIds: [],
    categoryId: (str(r.category_id, "umum") as ForumCategoryId),
    pinned: Boolean(r.pinned),
    hidden: Boolean(r.hidden),
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
  };
}

function mapComment(r: AnyRow): ForumComment {
  return {
    id: num(r.id),
    threadId: num(r.thread_id),
    userId: uuidToNumber(str(r.user_id)),
    parentId: r.parent_id == null ? null : num(r.parent_id),
    body: str(r.body),
    voteCount: num(r.vote_count),
    createdAt: str(r.created_at),
    hidden: Boolean(r.hidden),
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
  };
}

function mapProject(r: AnyRow): Project {
  return {
    id: num(r.id),
    userId: uuidToNumber(str(r.user_id)),
    title: str(r.title),
    description: str(r.description),
    repoUrl: str(r.repo_url),
    tags: strArr(r.tags),
    level: (str(r.level, "pemula") as Project["level"]),
    createdAt: str(r.created_at),
    commentIds: [],
    likeCount: num(r.like_count),
  };
}

function mapProjectComment(r: AnyRow): ProjectComment {
  return {
    id: num(r.id),
    projectId: num(r.project_id),
    userId: uuidToNumber(str(r.user_id)),
    body: str(r.body),
    createdAt: str(r.created_at),
  };
}

function single<T>(data: unknown): T {
  const arr = data as T[];
  return arr[0];
}

// ---- Forum ----

export async function addThreadRemote(data: {
  title: string;
  body: string;
  tags: string[];
  categoryId: ForumCategoryId;
  images?: string[];
}): Promise<ForumThread> {
  const supabase = getSupabase();
  const { data: inserted, error } = await supabase
    .from("threads")
    .insert({
      title: data.title.trim(),
      body: data.body.trim(),
      tags: data.tags,
      category_id: data.categoryId,
      images: data.images ?? [],
    })
    .select(
      "id, user_id, title, body, tags, vote_count, view_count, accepted_comment_id, created_at, category_id, pinned, hidden, images"
    )
    .single();
  if (error) throw error;
  return mapThread(inserted as unknown as AnyRow);
}

export async function addCommentRemote(
  threadId: number,
  body: string,
  parentId: number | null,
  images?: string[]
): Promise<ForumComment> {
  const supabase = getSupabase();
  const { data: inserted, error } = await supabase
    .from("comments")
    .insert({ thread_id: threadId, body: body.trim(), parent_id: parentId, images: images ?? [] })
    .select("id, thread_id, user_id, parent_id, body, vote_count, created_at, hidden, images")
    .single();
  if (error) throw error;
  return mapComment(inserted as unknown as AnyRow);
}

export async function voteThreadRemote(
  threadId: number,
  delta: 1 | -1
): Promise<{ voteCount: number; myVote: 1 | -1 | 0 }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("toggle_thread_vote", {
    p_thread_id: threadId,
    p_delta: delta,
  });
  if (error) throw error;
  const row = single<{ vote_count: number; my_vote: number }>(data);
  return { voteCount: row.vote_count, myVote: (row.my_vote as 1 | -1 | 0) };
}

export async function voteCommentRemote(
  commentId: number,
  delta: 1 | -1
): Promise<{ voteCount: number; myVote: 1 | -1 | 0 }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("toggle_comment_vote", {
    p_comment_id: commentId,
    p_delta: delta,
  });
  if (error) throw error;
  const row = single<{ vote_count: number; my_vote: number }>(data);
  return { voteCount: row.vote_count, myVote: (row.my_vote as 1 | -1 | 0) };
}

export async function toggleSaveThreadRemote(threadId: number): Promise<boolean> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("thread_saves")
    .select("thread_id")
    .eq("thread_id", threadId)
    .maybeSingle();
  if (existing) {
    await supabase.from("thread_saves").delete().eq("thread_id", threadId);
    return false;
  }
  await supabase.from("thread_saves").insert({ thread_id: threadId });
  return true;
}

export async function incrementViewRemote(threadId: number): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("increment_thread_view", { p_thread_id: threadId });
  if (error) throw error;
  const row = single<{ view_count: number }>(data);
  return row.view_count;
}

// ---- Projects ----

export async function addProjectRemote(data: {
  title: string;
  description: string;
  repoUrl: string;
  tags: string[];
  level: Project["level"];
}): Promise<Project> {
  const supabase = getSupabase();
  const { data: inserted, error } = await supabase
    .from("projects")
    .insert({
      title: data.title.trim(),
      description: data.description.trim(),
      repo_url: data.repoUrl,
      tags: data.tags,
      level: data.level,
    })
    .select("id, user_id, title, description, repo_url, tags, level, created_at, like_count")
    .single();
  if (error) throw error;
  return mapProject(inserted as unknown as AnyRow);
}

export async function addProjectCommentRemote(
  projectId: number,
  body: string
): Promise<ProjectComment> {
  const supabase = getSupabase();
  const { data: inserted, error } = await supabase
    .from("project_comments")
    .insert({ project_id: projectId, body: body.trim() })
    .select("id, project_id, user_id, body, created_at")
    .single();
  if (error) throw error;
  return mapProjectComment(inserted as unknown as AnyRow);
}

export async function voteProjectRemote(
  projectId: number,
  delta: 1 | -1
): Promise<{ likeCount: number; myVote: 1 | -1 | 0 }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("toggle_project_vote", {
    p_project_id: projectId,
    p_delta: delta,
  });
  if (error) throw error;
  const row = single<{ like_count: number; my_vote: number }>(data);
  return { likeCount: row.like_count, myVote: (row.my_vote as 1 | -1 | 0) };
}

// ---- Progress / bookmarks / interests ----

export async function setLessonDoneRemote(
  lessonId: number,
  done: boolean,
  quizScore: number | null
): Promise<{ status: ProgressStatus; points: number }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("set_lesson_done", {
    p_lesson_id: lessonId,
    p_done: done,
    p_quiz_score: quizScore,
  });
  if (error) throw error;
  const row = single<{ status: string; points: number }>(data);
  return { status: row.status as ProgressStatus, points: row.points };
}

export async function saveQuizScoreRemote(
  lessonId: number,
  score: number
): Promise<{ status: ProgressStatus; points: number }> {
  // Sama dengan set_lesson_done(done=true, score).
  return setLessonDoneRemote(lessonId, true, score);
}

export async function touchActivityRemote(): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("touch_activity");
  if (error) throw error;
  const row = single<{ streak: number }>(data);
  return row.streak;
}

export async function toggleBookmarkRemote(courseId: number): Promise<boolean> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("course_id")
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) {
    await supabase.from("bookmarks").delete().eq("course_id", courseId);
    return false;
  }
  await supabase.from("bookmarks").insert({ course_id: courseId });
  return true;
}

export async function setInterestsRemote(topics: string[]): Promise<string[]> {
  const supabase = getSupabase();
  const { error: delErr } = await supabase.from("interests").delete().neq("topic", "__none__");
  if (delErr) throw delErr;
  for (const topic of topics) {
    const { error } = await supabase.from("interests").upsert({ topic }, { onConflict: "user_id,topic" });
    if (error) throw error;
  }
  return topics;
}

// ---- Certificates ----

export async function issueCertificateRemote(
  courseId: number,
  courseTitle: string
): Promise<Certificate> {
  const supabase = getSupabase();
  const id = `cert-${courseId}-${Date.now()}`;
  const { data: inserted, error } = await supabase
    .from("certificates")
    .insert({ id, course_id: courseId, course_title: courseTitle })
    .select("id, course_id, course_title, issued_at")
    .single();
  if (error) throw error;
  const r = inserted as unknown as AnyRow;
  return {
    id: str(r.id),
    userId: 0, // tidak dipakai UI; diganti di store dari currentUser
    courseId: num(r.course_id),
    courseTitle: str(r.course_title),
    issuedAt: str(r.issued_at),
  };
}

// ---- Notifications ----

export async function markNotificationReadRemote(id: number, read = true): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
  if (error) throw error;
}

export async function markAllReadRemote(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw error;
}

export async function deleteNotificationRemote(id: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}
