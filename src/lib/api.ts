import type {
  Course,
  ForumCategoryId,
  ForumComment,
  ForumThread,
  Lesson,
  Project,
  ProjectComment,
  Quiz,
  Question,
  User,
  Role,
  ProgressEntry,
  AppNotification,
  NotificationType,
  Certificate,
  ReactionKey,
  Report,
} from "@/lib/types";
import type { BookingSession, BookingStatus, Review, ScheduleDay, ScheduleRange } from "@/features/mentor/types";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { uuidToNumber } from "@/lib/uuid";

export interface RemoteState {
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  threads: ForumThread[];
  comments: ForumComment[];
  projects: Project[];
  projectComments: ProjectComment[];
  reactions: {
    threads: Record<number, Record<ReactionKey, number>>;
    comments: Record<number, Record<ReactionKey, number>>;
  };
}

export interface UserState {
  progress: Record<number, ProgressEntry>;
  bookmarks: number[];
  interests: string[];
  savedThreadIds: number[];
  votes: {
    threads: Record<number, 1 | -1 | 0>;
    comments: Record<number, 1 | -1 | 0>;
    projects: Record<number, 1 | -1 | 0>;
  };
  notifications: AppNotification[];
  certificates: Certificate[];
  points: number;
  streak: number;
  /** Badge milik user dari tabel `badges` (RLS owner-only). id = badge_id. */
  badges: Array<{ id: string; earnedAt: string }>;
  myReactions: {
    threads: Record<number, ReactionKey | null>;
    comments: Record<number, ReactionKey | null>;
  };
  reports: Report[];
  // Mentor Hub (Lane H)
  mentoringSessions: BookingSession[];
  mentorReviews: Review[];
  mentorAvailability: ScheduleRange[];
}

interface Row { [key: string]: unknown }

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function mapUser(r: Row): User {
  const email = str(r.email);
  const roleRaw = str(r.role, "learner") as Role;
  const role: Exclude<Role, "guest"> = roleRaw === "guest" ? "learner" : roleRaw;
  return {
    id: uuidToNumber(str(r.id)),
    uuid: str(r.id),
    name: str(r.name, email.split("@")[0]),
    email,
    role,
    joinedAt: str(r.joined_at),
    expertise: strArr(r.expertise),
    bio: str(r.bio),
    avatarUrl: str(r.avatar_url),
    maxSessionsPerWeek: num(r.max_sessions_per_week, 10),
  };
}

function mapCourse(r: Row): Course {
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

function mapLesson(r: Row): Lesson {
  return {
    id: num(r.id),
    courseId: num(r.course_id),
    title: str(r.title),
    summary: str(r.summary),
    content: str(r.content),
    order: num(r.order),
  };
}

function mapQuiz(r: Row): Quiz {
  const questions = Array.isArray(r.questions) ? (r.questions as Question[]) : [];
  return {
    id: num(r.id),
    lessonId: num(r.lesson_id),
    title: str(r.title),
    questions,
  };
}

function mapThread(r: Row): ForumThread {
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

function mapComment(r: Row): ForumComment {
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

function mapProject(r: Row): Project {
  return {
    id: num(r.id),
    userId: uuidToNumber(str(r.user_id)),
    title: str(r.title),
    description: str(r.description),
    repoUrl: str(r.repo_url),
    tags: strArr(r.tags),
    level: (str(r.level, "pemula") as Project["level"]),
    coverImageUrl: str(r.cover_image_url),
    demoUrl: str(r.demo_url),
    createdAt: str(r.created_at),
    commentIds: [],
    likeCount: num(r.like_count),
  };
}

function mapProjectComment(r: Row): ProjectComment {
  return {
    id: num(r.id),
    projectId: num(r.project_id),
    userId: uuidToNumber(str(r.user_id)),
    body: str(r.body),
    createdAt: str(r.created_at),
  };
}

async function selectAll(table: string, select: string): Promise<Row[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).select(select);
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

export async function fetchRemoteState(): Promise<RemoteState | null> {
  if (!isSupabaseConfigured()) return null;

  const [
    usersRows,
    courseRows,
    lessonRows,
    quizRows,
    threadRows,
    commentRows,
    projectRows,
    projectCommentRows,
    reactionRows,
  ] = await Promise.all([
    selectAll("profiles", "id, name, email, role, joined_at, expertise, bio, avatar_url, max_sessions_per_week"),
    selectAll("courses", "id, mentor_id, title, slug, description, level, topics, created_at"),
    selectAll("lessons", "id, course_id, title, summary, content, order"),
    selectAll("quizzes", "id, lesson_id, title, questions"),
    selectAll("threads", "id, user_id, title, body, tags, vote_count, view_count, accepted_comment_id, created_at, category_id, pinned, hidden, images"),
    selectAll("comments", "id, thread_id, user_id, parent_id, body, vote_count, created_at, hidden, images"),
    selectAll("projects", "id, user_id, title, description, repo_url, tags, level, created_at, like_count, cover_image_url, demo_url"),
    selectAll("project_comments", "id, project_id, user_id, body, created_at"),
    selectAll("reactions", "user_id, target_type, target_id, reaction_key"),
  ]);

  // Hitungan reaksi per target (publik — semua user).
  const reactions: {
    threads: Record<number, Record<ReactionKey, number>>;
    comments: Record<number, Record<ReactionKey, number>>;
  } = { threads: {}, comments: {} };
  for (const r of reactionRows) {
    const targetType = str(r.target_type);
    const targetId = num(r.target_id);
    const key = str(r.reaction_key) as ReactionKey;
    if (targetType !== "thread" && targetType !== "comment") continue;
    const bucket =
      targetType === "thread" ? reactions.threads : reactions.comments;
    bucket[targetId] = bucket[targetId] ?? ({} as Record<ReactionKey, number>);
    bucket[targetId][key] = (bucket[targetId][key] ?? 0) + 1;
  }

  const courses = courseRows.map(mapCourse);
  const lessons = lessonRows.map(mapLesson);
  const threads = threadRows.map(mapThread);
  const comments = commentRows.map(mapComment);
  const projects = projectRows.map(mapProject);

  // Relasi lessonIds + commentIds (tidak ada kolom denormalisasi di Supabase).
  for (const c of courses) {
    c.lessonIds = lessons.filter((l) => l.courseId === c.id).sort((a, b) => a.order - b.order).map((l) => l.id);
  }
  for (const t of threads) {
    t.commentIds = comments.filter((c) => c.threadId === t.id).map((c) => c.id);
  }
  for (const p of projects) {
    p.commentIds = projectCommentRows.filter((c) => num(c.project_id) === p.id).map((c) => num(c.id));
  }

  return {
    users: usersRows.map(mapUser),
    courses,
    lessons,
    quizzes: quizRows.map(mapQuiz),
    threads,
    comments,
    projects,
    projectComments: projectCommentRows.map(mapProjectComment),
    reactions,
  };
}

// ---- Mentor Hub (Lane H): mapping baris mentoring_sessions/reviews/availability ----

function mapBookingSessionRow(r: Row): BookingSession {
  return {
    id: num(r.id),
    mentorUuid: str(r.mentor_id),
    learnerUuid: str(r.learner_id),
    courseId: r.course_id == null ? undefined : num(r.course_id),
    scheduledAt: new Date(str(r.scheduled_at)),
    status: str(r.status, "pending") as BookingStatus,
    timezone: str(r.timezone, "Asia/Jakarta"),
    videoCallUrl: r.video_call_url == null ? undefined : str(r.video_call_url),
    notes: r.notes == null ? undefined : str(r.notes),
    createdAt: new Date(str(r.created_at)),
    updatedAt: new Date(str(r.updated_at)),
  };
}

function mapReviewRow(r: Row): Review {
  return {
    id: num(r.id),
    sessionId: num(r.session_id),
    reviewerId: str(r.reviewer_id),
    ratedUserUuid: str(r.rated_user_uuid),
    rating: num(r.rating),
    comment: r.comment == null ? undefined : str(r.comment),
    isPublic: Boolean(r.is_public),
    createdAt: new Date(str(r.created_at)),
  };
}

// Kolom time Postgres kembali "HH:MM:SS" — rapikan ke "HH:MM".
function mapScheduleRangeRow(r: Row): ScheduleRange {
  return {
    dayOfWeek: num(r.day_of_week) as ScheduleDay,
    startTime: str(r.start_time).slice(0, 5),
    endTime: str(r.end_time).slice(0, 5),
    isAvailable: Boolean(r.is_active),
  };
}

export async function fetchUserState(): Promise<UserState | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return null;
  const myUuid = session.session.user.id;

  const [
    progressRows,
    bookmarkRows,
    interestRows,
    saveRows,
    threadVoteRows,
    commentVoteRows,
    projectVoteRows,
    notificationRows,
    certRows,
    badgeRows,
    statsRows,
    myReactionRows,
    reportRows,
    mentoringSessionRows,
    mentorReviewRows,
    mentorAvailabilityRows,
  ] = await Promise.all([
    selectAll("progress", "lesson_id, status, quiz_score"),
    selectAll("bookmarks", "course_id"),
    selectAll("interests", "topic"),
    selectAll("thread_saves", "thread_id"),
    selectAll("thread_votes", "thread_id, value"),
    selectAll("comment_votes", "comment_id, value"),
    selectAll("project_votes", "project_id, value"),
    selectAll("notifications", "id, type, title, body, href, read, created_at").then((r) =>
      r.sort((a, b) => str(b.created_at).localeCompare(str(a.created_at)))
    ),
    selectAll("certificates", "id, course_id, course_title, issued_at"),
    // Gamifikasi (Lane F) — badge milik sendiri (RLS "badges owner").
    selectAll("badges", "badge_id, earned_at"),
    selectAll("user_stats", "points, streak"),
    selectAll("reactions", "target_type, target_id, reaction_key"),
    selectAll("reports", "id, target_type, target_id, reporter_id, reason, status, created_at").then((r) =>
      r.sort((a, b) => num(b.id) - num(a.id))
    ),
    // Mentor Hub (Lane H) — RLS otomatis: sesi hanya milik peserta, review
    // publik + milik sendiri, availability publik (filter ke uuid sendiri).
    selectAll("mentoring_sessions", "id, mentor_id, learner_id, course_id, scheduled_at, status, timezone, video_call_url, notes, created_at, updated_at").then((r) =>
      r.sort((a, b) => str(a.scheduled_at).localeCompare(str(b.scheduled_at)))
    ),
    selectAll("mentor_reviews", "id, session_id, reviewer_id, rated_user_uuid, rating, comment, is_public, created_at").then((r) =>
      r.sort((a, b) => str(b.created_at).localeCompare(str(a.created_at)))
    ),
    selectAll("mentor_availability", "id, user_id, day_of_week, start_time, end_time, is_active").then((r) =>
      r.filter((row) => str(row.user_id) === myUuid)
    ),
  ]);

  const progress: Record<number, ProgressEntry> = {};
  for (const r of progressRows) {
    progress[num(r.lesson_id)] = {
      lessonId: num(r.lesson_id),
      status: (str(r.status, "belum") as ProgressEntry["status"]),
      quizScore: r.quiz_score == null ? null : num(r.quiz_score),
    };
  }

  const votes = {
    threads: {} as Record<number, 1 | -1 | 0>,
    comments: {} as Record<number, 1 | -1 | 0>,
    projects: {} as Record<number, 1 | -1 | 0>,
  };
  for (const r of threadVoteRows) votes.threads[num(r.thread_id)] = (num(r.value) as 1 | -1 | 0);
  for (const r of commentVoteRows) votes.comments[num(r.comment_id)] = (num(r.value) as 1 | -1 | 0);
  for (const r of projectVoteRows) votes.projects[num(r.project_id)] = (num(r.value) as 1 | -1 | 0);

  const notifications: AppNotification[] = notificationRows.map((r) => ({
    id: num(r.id),
    userId: 0, // tidak dipakai UI
    type: (str(r.type, "system") as NotificationType),
    title: str(r.title),
    body: str(r.body),
    href: r.href == null ? undefined : str(r.href),
    read: Boolean(r.read),
    createdAt: str(r.created_at),
  }));

  const certificates: Certificate[] = certRows.map((r) => ({
    id: str(r.id),
    userId: 0,
    courseId: num(r.course_id),
    courseTitle: str(r.course_title),
    issuedAt: str(r.issued_at),
  }));

  const myReactions: {
    threads: Record<number, ReactionKey | null>;
    comments: Record<number, ReactionKey | null>;
  } = { threads: {}, comments: {} };
  for (const r of myReactionRows) {
    const targetType = str(r.target_type);
    const targetId = num(r.target_id);
    const key = str(r.reaction_key) as ReactionKey;
    if (targetType === "thread") myReactions.threads[targetId] = key;
    else if (targetType === "comment") myReactions.comments[targetId] = key;
  }

  const reports: Report[] = reportRows.map((r) => ({
    id: num(r.id),
    targetType: str(r.target_type) as Report["targetType"],
    targetId: num(r.target_id),
    reporterId: uuidToNumber(str(r.reporter_id)),
    reason: str(r.reason),
    createdAt: str(r.created_at),
    status: str(r.status, "open") as Report["status"],
  }));

  return {
    progress,
    bookmarks: bookmarkRows.map((r) => num(r.course_id)),
    interests: interestRows.map((r) => str(r.topic)),
    savedThreadIds: saveRows.map((r) => num(r.thread_id)),
    votes,
    notifications,
    certificates,
    points: statsRows.length ? num(statsRows[0].points) : 0,
    streak: statsRows.length ? num(statsRows[0].streak) : 0,
    badges: badgeRows.map((r) => ({ id: str(r.badge_id), earnedAt: str(r.earned_at) })),
    myReactions,
    reports,
    mentoringSessions: mentoringSessionRows.map(mapBookingSessionRow),
    mentorReviews: mentorReviewRows.map(mapReviewRow),
    mentorAvailability: mentorAvailabilityRows.map(mapScheduleRangeRow),
  };
}
