import type {
  Certificate,
  Course,
  ForumCategoryId,
  ForumComment,
  ForumThread,
  Level,
  Lesson,
  ProgressStatus,
  Project,
  ProjectComment,
  Question,
  Report,
  Role,
} from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { uuidToNumber } from "@/lib/uuid";
import { slugify } from "@/lib/utils/slug";

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

async function currentUid(): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Login diperlukan.");
  return id;
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
      user_id: await currentUid(),
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
    .insert({ thread_id: threadId, user_id: await currentUid(), body: body.trim(), parent_id: parentId, images: images ?? [] })
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
      user_id: await currentUid(),
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
    .insert({ project_id: projectId, user_id: await currentUid(), body: body.trim() })
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
    .insert({ id, user_id: await currentUid(), course_id: courseId, course_title: courseTitle })
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

export async function createNotificationRemote(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
}): Promise<void> {
  // RPC SECURITY DEFINER create_notification — butuh klien supabase biasa
  // (getSupabase()) dengan session user (grant ke role authenticated),
  // bukan service role.
  const supabase = getSupabase();
  const { error } = await supabase.rpc("create_notification", {
    p_user_id: input.userId,
    p_type: input.type,
    p_title: input.title,
    p_body: input.body,
    p_href: input.href ?? null,
  });
  if (error) throw error;
}

// ---- Forum moderation (thread/comment edit, delete, pin, hide, accept) ----

const THREAD_SELECT =
  "id, user_id, title, body, tags, vote_count, view_count, accepted_comment_id, created_at, category_id, pinned, hidden, images";
const COMMENT_SELECT =
  "id, thread_id, user_id, parent_id, body, vote_count, created_at, hidden, images";

export async function updateThreadRemote(
  threadId: number,
  data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }
): Promise<ForumThread> {
  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from("threads")
    .update({
      title: data.title.trim(),
      body: data.body.trim(),
      tags: data.tags,
      category_id: data.categoryId,
      images: data.images ?? [],
    })
    .eq("id", threadId)
    .select(THREAD_SELECT)
    .single();
  if (error) throw error;
  return mapThread(updated as unknown as AnyRow);
}

export async function deleteThreadRemote(threadId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("delete_thread_cascade", { p_thread_id: threadId });
  if (error) throw error;
}

export async function deleteThreadCascadeRemote(threadId: number): Promise<void> {
  return deleteThreadRemote(threadId);
}

export async function deleteCommentCascadeRemote(commentId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("delete_comment_cascade", { p_comment_id: commentId });
  if (error) throw error;
}

export async function updateCommentRemote(
  commentId: number,
  body: string,
  images?: string[]
): Promise<ForumComment> {
  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from("comments")
    .update({ body: body.trim(), ...(images ? { images } : {}) })
    .eq("id", commentId)
    .select(COMMENT_SELECT)
    .single();
  if (error) throw error;
  return mapComment(updated as unknown as AnyRow);
}

export async function deleteCommentRemote(commentId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function setThreadPinnedRemote(threadId: number, pinned: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("threads").update({ pinned }).eq("id", threadId);
  if (error) throw error;
}

export async function setThreadHiddenRemote(threadId: number, hidden: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("threads").update({ hidden }).eq("id", threadId);
  if (error) throw error;
}

export async function setCommentHiddenRemote(commentId: number, hidden: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("comments").update({ hidden }).eq("id", commentId);
  if (error) throw error;
}

export async function setAcceptedCommentRemote(
  threadId: number,
  commentId: number | null
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("threads")
    .update({ accepted_comment_id: commentId })
    .eq("id", threadId);
  if (error) throw error;
}

// ---- Reactions ----

export async function toggleReactionRemote(
  targetType: "thread" | "comment",
  targetId: number,
  key: string | null
): Promise<string | null> {
  const supabase = getSupabase();
  // Reaksi lama user untuk target ini dihapus dulu (toggle single-reaction).
  const { error: delErr } = await supabase
    .from("reactions")
    .delete()
    .eq("target_type", targetType)
    .eq("target_id", targetId);
  if (delErr) throw delErr;
  if (!key) return null;
  const { error } = await supabase
    .from("reactions")
    .insert({ user_id: await currentUid(), target_type: targetType, target_id: targetId, reaction_key: key });
  if (error) throw error;
  return key;
}

// ---- Reports ----

export async function createReportRemote(
  targetType: "thread" | "comment",
  targetId: number,
  reason: string
): Promise<Report> {
  const supabase = getSupabase();
  const { data: inserted, error } = await supabase
    .from("reports")
    .insert({ reporter_id: await currentUid(), target_type: targetType, target_id: targetId, reason })
    .select("id, target_type, target_id, reporter_id, reason, status, created_at")
    .single();
  if (error) throw error;
  const r = inserted as unknown as AnyRow;
  return {
    id: num(r.id),
    targetType: str(r.target_type) as Report["targetType"],
    targetId: num(r.target_id),
    reporterId: uuidToNumber(str(r.reporter_id)),
    reason: str(r.reason),
    createdAt: str(r.created_at),
    status: str(r.status, "open") as Report["status"],
  };
}

export async function resolveReportRemote(reportId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
  if (error) throw error;
}

export async function deleteReportRemote(reportId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) throw error;
}

// ---- Admin: kelola user (via RPC SECURITY DEFINER) ----

async function getProfileUuidByEmail(email: string): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("User tidak ditemukan.");
  return str((data as unknown as AnyRow).id);
}

export async function adminCreateUserRemote(data: {
  name: string;
  email: string;
  role: Exclude<Role, "guest">;
  password?: string;
}): Promise<{ id: number; email: string; password: string }> {
  const supabase = getSupabase();
  const { data: res, error } = await supabase.rpc("admin_create_user", {
    p_email: data.email,
    p_password: data.password ?? null,
    p_name: data.name,
    p_role: data.role,
  });
  if (error) throw error;
  const row = single<{ out_id: string; out_email: string; out_password: string }>(res);
  return {
    id: uuidToNumber(row.out_id),
    email: row.out_email,
    password: row.out_password,
  };
}

export async function adminSetRoleRemote(email: string, role: Exclude<Role, "guest">): Promise<void> {
  const supabase = getSupabase();
  const uuid = await getProfileUuidByEmail(email);
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: uuid, p_role: role });
  if (error) throw error;
}

export async function adminDeleteUserRemote(email: string): Promise<void> {
  const supabase = getSupabase();
  const uuid = await getProfileUuidByEmail(email);
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: uuid });
  if (error) throw error;
}

// ---- Admin: CRUD konten ----

function mapCourseRow(r: AnyRow): Course {
  return {
    id: num(r.id),
    mentorId: uuidToNumber(str(r.mentor_id)),
    title: str(r.title),
    slug: str(r.slug),
    description: str(r.description),
    level: (str(r.level, "pemula") as Course["level"]),
    topics: strArr(r.topics),
    lessonIds: [],
    createdAt: str(r.created_at),
  };
}

export async function addCourseRemote(data: {
  title: string;
  description: string;
  level: Level;
  topics: string[];
  mentorEmail: string;
}): Promise<Course> {
  const supabase = getSupabase();
  // mentor_id butuh uuid; frontend memakai number hash, jadi kirim email mentor.
  const uuid = await getProfileUuidByEmail(data.mentorEmail);
  const base = {
    title: data.title.trim(),
    description: data.description.trim(),
    level: data.level,
    topics: data.topics,
    mentor_id: uuid,
  };
  // slug NOT NULL UNIQUE — retry dengan suffix kalau konflik.
  let attempt = 0;
  for (;;) {
    const slug = attempt === 0 ? slugify(data.title) : slugify(data.title) + "-" + Date.now().toString(36).slice(-4);
    const { data: inserted, error } = await supabase
      .from("courses")
      .insert({ ...base, slug })
      .select("id, mentor_id, title, slug, description, level, topics, created_at")
      .single();
    if (!error) return mapCourseRow(inserted as unknown as AnyRow);
    if ((error as { code?: string }).code !== "23505" || attempt >= 2) throw error;
    attempt++;
  }
}

export async function updateCourseRemote(
  courseId: number,
  data: { title: string; description: string; level: Level; topics: string[]; mentorEmail?: string }
): Promise<Course> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = {
    title: data.title.trim(),
    description: data.description.trim(),
    level: data.level,
    topics: data.topics,
  };
  if (data.mentorEmail) {
    patch.mentor_id = await getProfileUuidByEmail(data.mentorEmail);
  }
  const { data: updated, error } = await supabase
    .from("courses")
    .update(patch)
    .eq("id", courseId)
    .select("id, mentor_id, title, slug, description, level, topics, created_at")
    .single();
  if (error) throw error;
  return mapCourseRow(updated as unknown as AnyRow);
}

export async function deleteCourseRemote(courseId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw error;
}

export async function addLessonRemote(
  courseId: number,
  data: { title: string; summary: string; content: string }
): Promise<Lesson> {
  const supabase = getSupabase();
  // Hitung order berikutnya dari lessons course ini.
  const { data: existing, error: qErr } = await supabase
    .from("lessons")
    .select("order")
    .eq("course_id", courseId);
  if (qErr) throw qErr;
  const nextOrder = (existing ?? []).reduce((mx, r) => Math.max(mx, num((r as AnyRow).order)), 0) + 1;
  const { data: inserted, error } = await supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      title: data.title.trim(),
      summary: data.summary.trim(),
      content: data.content,
      order: nextOrder,
    })
    .select("id, course_id, title, summary, content, order")
    .single();
  if (error) throw error;
  const r = inserted as unknown as AnyRow;
  return { id: num(r.id), courseId: num(r.course_id), title: str(r.title), summary: str(r.summary), content: str(r.content), order: num(r.order) };
}

export async function updateLessonRemote(
  lessonId: number,
  data: { title: string; summary: string; content: string }
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("lessons")
    .update({ title: data.title.trim(), summary: data.summary.trim(), content: data.content })
    .eq("id", lessonId);
  if (error) throw error;
}

export async function deleteLessonRemote(lessonId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) throw error;
}

export async function saveQuizRemote(
  lessonId: number,
  data: { title: string; questions: Question[] }
): Promise<void> {
  const supabase = getSupabase();
  const { data: existing, error: qErr } = await supabase
    .from("quizzes")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (qErr) throw qErr;
  if (existing) {
    const { error } = await supabase
      .from("quizzes")
      .update({ title: data.title, questions: data.questions })
      .eq("id", num((existing as AnyRow).id));
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("quizzes")
    .insert({ lesson_id: lessonId, title: data.title, questions: data.questions });
  if (error) throw error;
}

export async function deleteQuizRemote(lessonId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("quizzes").delete().eq("lesson_id", lessonId);
  if (error) throw error;
}

export async function updateProjectRemote(
  projectId: number,
  data: { title: string; description: string; repoUrl: string; tags: string[]; level: Level }
): Promise<Project> {
  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from("projects")
    .update({
      title: data.title.trim(),
      description: data.description.trim(),
      repo_url: data.repoUrl,
      tags: data.tags,
      level: data.level,
    })
    .eq("id", projectId)
    .select("id, user_id, title, description, repo_url, tags, level, created_at, like_count")
    .single();
  if (error) throw error;
  return mapProject(updated as unknown as AnyRow);
}

export async function deleteProjectRemote(projectId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function deleteProjectCommentRemote(commentId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("project_comments").delete().eq("id", commentId);
  if (error) throw error;
}
