"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { categoryById, forumCategories, reportReasons } from "@/lib/data";
import { VoteControl } from "@/features/forum/vote-control";
import { Tag } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MarkdownLite } from "@/components/markdown-lite";
import { useToast } from "@/components/toast";
import { ReactionBar } from "@/features/forum/reactions";
import { ImageGallery, ImageUpload } from "@/components/image-upload";
import type { ForumCategoryId, ForumComment } from "@/lib/types";

type CommentNode = ForumComment & { children: CommentNode[] };

export default function ForumThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const threadId = Number(params.id);
  const {
    state,
    currentUser,
    addComment,
    voteThread,
    voteComment,
    viewThread,
    markAccepted,
    editThread,
    deleteThread,
    editComment,
    deleteComment,
    pinThread,
    reportThread,
    reportComment,
    reactTo,
  } = useStore();
  const { toast } = useToast();

  const thread = state.threads.find((t) => t.id === threadId);
  const [replyBody, setReplyBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [replyPreviewing, setReplyPreviewing] = useState(false);

  // Thread editing state
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<ForumCategoryId>("umum");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editPreviewing, setEditPreviewing] = useState(false);

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentBody, setEditCommentBody] = useState("");
  const [editCommentImages, setEditCommentImages] = useState<string[]>([]);

  // Inline report form state.
  const [reportingTarget, setReportingTarget] = useState<
    { type: "thread"; id: number } | { type: "comment"; id: number } | null
  >(null);
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportNote, setReportNote] = useState("");

  // Count the view once per mounted thread.
  const countedRef = useRef<number | null>(null);
  useEffect(() => {
    if (thread == null) return;
    if (countedRef.current === thread.id) return;
    countedRef.current = thread.id;
    viewThread(thread.id);
  }, [thread, viewThread]);

  const comments = useMemo(
    () => state.comments.filter((c) => c.threadId === threadId),
    [state.comments, threadId]
  );

  if (!thread) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Thread tidak ditemukan</h1>
        <Link href="/forum" className="btn-primary mt-4">
          Kembali ke forum
        </Link>
      </div>
    );
  }

  const author = state.users.find((u) => u.id === thread.userId);
  const threadVote = state.votes.threads[thread.id] ?? 0;
  const threadReactions = state.reactions.threads[thread.id] ?? {};
  const threadMyReaction = state.myReactions.threads[thread.id] ?? null;
  const isOwner = currentUser?.id === thread.userId;
  const isAdmin = currentUser?.role === "admin";
  const isMentorOrAdmin =
    currentUser?.role === "mentor" || currentUser?.role === "admin";
  const category = categoryById.get(thread.categoryId);

  // Non-nullable alias so hoisted helper functions can reference the thread
  // without TypeScript widening the type back to `ForumThread | undefined`.
  const threadData = thread;

  function buildTree(list: ForumComment[], acceptedCommentId: number | null): CommentNode[] {
    const map = new Map<number, CommentNode>();
    list.forEach((c) => map.set(c.id, { ...c, children: [] }));
    const roots: CommentNode[] = [];
    map.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(c);
      } else {
        roots.push(c);
      }
    });
    // Pin the accepted answer (if any) to the top.
    if (acceptedCommentId != null) {
      const idx = roots.findIndex((r) => r.id === acceptedCommentId);
      if (idx > 0) {
        const [accepted] = roots.splice(idx, 1);
        roots.unshift(accepted);
      }
    }
    return roots;
  }

  const tree = buildTree(comments, thread.acceptedCommentId);

  function handleReply() {
    if (!replyBody.trim()) return;
    addComment(threadId, replyBody, replyTo, replyImages);
    setReplyBody("");
    setReplyImages([]);
    setReplyPreviewing(false);
    setReplyTo(null);
    toast("Komentar berhasil dikirim");
  }

  function startEditThread() {
    setIsEditingThread(true);
    setEditTitle(threadData.title);
    setEditBody(threadData.body);
    setEditTags(threadData.tags.join(", "));
    setEditCategoryId(threadData.categoryId);
    setEditImages(threadData.images);
    setEditPreviewing(false);
  }

  function handleEditThread(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim() || !editBody.trim()) return;
    const tags = editTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    editThread(threadData.id, {
      title: editTitle,
      body: editBody,
      tags,
      categoryId: editCategoryId,
      images: editImages,
    });
    setIsEditingThread(false);
    toast("Thread berhasil diperbarui");
  }

  function handleDeleteThread() {
    if (!window.confirm("Hapus thread ini beserta semua komentarnya?")) return;
    deleteThread(threadData.id);
    toast("Thread dihapus");
    router.push("/forum");
  }

  function startEditComment(c: ForumComment) {
    setEditingCommentId(c.id);
    setEditCommentBody(c.body);
    setEditCommentImages(c.images ?? []);
  }

  function handleEditComment() {
    if (editingCommentId == null || !editCommentBody.trim()) return;
    editComment(editingCommentId, editCommentBody, editCommentImages);
    setEditingCommentId(null);
    toast("Komentar berhasil diperbarui");
  }

  function handleDeleteComment(id: number) {
    if (!window.confirm("Hapus komentar ini beserta balasannya?")) return;
    deleteComment(id);
    toast("Komentar dihapus");
  }

  function submitReport(target: { type: "thread" | "comment"; id: number }) {
    const reason = reportNote.trim() ? `${reportReason} — ${reportNote.trim()}` : reportReason;
    if (target.type === "thread") reportThread(target.id, reason);
    else reportComment(target.id, reason);
    setReportingTarget(null);
    setReportNote("");
    setReportReason(reportReasons[0]);
    toast("Laporan terkirim. Terima kasih!");
  }

  function ReportForm({ target }: { target: { type: "thread" | "comment"; id: number } }) {
    return (
      <div className="mt-2 rounded-lg border border-border bg-surface-hover p-3">
        <p className="mb-2 text-xs font-medium text-content">Laporkan konten ini</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="input sm:max-w-xs"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            {reportReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            className="input flex-1"
            placeholder="Catatan tambahan (opsional)"
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => submitReport(target)} className="btn-primary">
            Kirim laporan
          </button>
          <button onClick={() => setReportingTarget(null)} className="btn-secondary">
            Batal
          </button>
        </div>
      </div>
    );
  }

  function CommentNode({ node }: { node: CommentNode }) {
    const commentAuthor = state.users.find((u) => u.id === node.userId);
    const voteVal = state.votes.comments[node.id] ?? 0;
    const reactions = state.reactions.comments[node.id] ?? {};
    const myReaction = state.myReactions.comments[node.id] ?? null;
    const isOP = node.userId === threadData.userId;
    const isAccepted = threadData.acceptedCommentId === node.id;
    const isCommentOwner = currentUser?.id === node.userId;
    const isTopLevel = node.parentId == null;
    const canReportComment = currentUser && !isCommentOwner && !isAdmin;

    if (editingCommentId === node.id) {
      return (
        <div className="pl-4 sm:pl-6">
          <div className="card space-y-3 p-4">
            <textarea
              className="input min-h-24 resize-y"
              value={editCommentBody}
              onChange={(e) => setEditCommentBody(e.target.value)}
            />
            <ImageUpload images={editCommentImages} onChange={setEditCommentImages} />
            <div className="flex gap-2">
              <button onClick={handleEditComment} className="btn-primary">Simpan</button>
              <button onClick={() => setEditingCommentId(null)} className="btn-secondary">
                Batal
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (node.hidden && !isAdmin) {
      return (
        <div className="pl-4 sm:pl-6">
          <p className="text-xs italic text-subtle">[disembunyikan]</p>
          {node.children.length > 0 && (
            <div className="mt-3 space-y-3 border-l border-border">
              {node.children.map((child) => (
                <CommentNode key={child.id} node={child} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="pl-4 sm:pl-6">
        <div
          className={`flex gap-3 ${
            isAccepted ? "rounded-lg border border-success-soft bg-success-soft p-3" : ""
          }`}
        >
          <VoteControl
            count={node.voteCount}
            value={voteVal}
            onVote={(d) => voteComment(node.id, d)}
          />
          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Link href={`/profile/${commentAuthor?.id}`} className="flex items-center gap-1.5 font-medium text-content hover:text-brand">
                <Avatar name={commentAuthor?.name ?? "Pengguna"} size="sm" />
                <span>{commentAuthor?.name ?? "Pengguna"}</span>
              </Link>
              {isOP && <span className="badge bg-brand-soft text-brand">Penulis</span>}
              {isAccepted && (
                <span className="badge bg-success-soft text-success">✓ Jawaban Terbaik</span>
              )}
              {node.hidden && (
                <span className="badge bg-danger-soft text-danger">Disembunyikan</span>
              )}
              <span>· {node.createdAt}</span>
            </div>
            <div className="text-sm text-content">
              <MarkdownLite source={node.body} />
            </div>
            <ImageGallery images={node.images} />
            <div className="mt-2">
              <ReactionBar
                reactions={reactions}
                myReaction={myReaction}
                onReact={(key) => reactTo("comment", node.id, key)}
              />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {currentUser && (
                <button
                  onClick={() => {
                    setReplyTo(node.id);
                    document.getElementById("reply-box")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs font-medium text-subtle transition-colors hover:text-brand"
                >
                  Balas
                </button>
              )}
              {isCommentOwner && (
                <>
                  <button
                    onClick={() => startEditComment(node)}
                    className="text-xs font-medium text-subtle transition-colors hover:text-brand"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(node.id)}
                    className="text-xs font-medium text-subtle transition-colors hover:text-danger"
                  >
                    Hapus
                  </button>
                </>
              )}
              {canReportComment && (
                <button
                  onClick={() => {
                    setReportingTarget(
                      reportingTarget?.type === "comment" && reportingTarget.id === node.id
                        ? null
                        : { type: "comment", id: node.id }
                    );
                    setReportReason(reportReasons[0]);
                    setReportNote("");
                  }}
                  className="text-xs font-medium text-subtle transition-colors hover:text-danger"
                >
                  Lapor
                </button>
              )}
              {isOwner && isTopLevel && (
                <button
                  onClick={() =>
                    markAccepted(threadData.id, isAccepted ? null : node.id)
                  }
                  className="text-xs font-medium text-subtle transition-colors hover:text-success"
                >
                  {isAccepted ? "Batalkan tandai" : "Tandai sebagai jawaban"}
                </button>
              )}
            </div>
            {reportingTarget?.type === "comment" && reportingTarget.id === node.id && (
              <ReportForm target={reportingTarget} />
            )}
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-border">
            {node.children.map((child) => (
              <CommentNode key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs
        items={[{ label: "Forum", href: "/forum" }, { label: thread.title }]}
      />

      <div className="card mb-8 flex gap-4 p-6">
        <VoteControl count={thread.voteCount} value={threadVote} onVote={(d) => voteThread(thread.id, d)} />
        <div className="min-w-0 flex-1">
          {isEditingThread ? (
            <form onSubmit={handleEditThread} className="space-y-4">
              <div>
                <label className="label" htmlFor="edit-thread-title">Judul</label>
                <input
                  id="edit-thread-title"
                  className="input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="label" htmlFor="edit-thread-body">Isi</label>
                  <button
                    type="button"
                    onClick={() => setEditPreviewing((v) => !v)}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    {editPreviewing ? "Tulis" : "Pratinjau"}
                  </button>
                </div>
                {editPreviewing ? (
                  <div className="min-h-28 rounded-lg border border-border bg-surface-hover p-3">
                    {editBody.trim() ? (
                      <MarkdownLite source={editBody} />
                    ) : (
                      <p className="text-sm text-subtle">Belum ada isi untuk dipratinjau.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    id="edit-thread-body"
                    className="input min-h-28 resize-y"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    required
                  />
                )}
              </div>
              <ImageUpload images={editImages} onChange={setEditImages} />
              <div>
                <label className="label" htmlFor="edit-thread-tags">Tags (pisahkan dengan koma)</label>
                <input
                  id="edit-thread-tags"
                  className="input"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="edit-thread-category">Kategori</label>
                <select
                  id="edit-thread-category"
                  className="input"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value as ForumCategoryId)}
                >
                  {forumCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Simpan</button>
                <button type="button" onClick={() => setIsEditingThread(false)} className="btn-secondary">
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold text-content">{thread.title}</h1>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                <Link href={`/profile/${author?.id}`} className="flex items-center gap-1.5 font-medium text-content hover:text-brand">
                  <Avatar name={author?.name ?? "Pengguna"} size="sm" />
                  <span>{author?.name ?? "Pengguna"}</span>
                </Link>
                <span>·</span>
                <span>{thread.createdAt}</span>
                <span>·</span>
                <span>👁 {thread.viewCount ?? 0}</span>
                {thread.pinned && (
                  <span className="badge bg-warning-soft text-warning">📌 Disematkan</span>
                )}
                {category && (
                  <span className="badge bg-surface-hover text-muted">
                    {category.emoji} {category.label}
                  </span>
                )}
                <span className="flex flex-wrap gap-1.5">
                  {thread.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </span>
                <span className="ml-auto flex gap-3">
                  {isMentorOrAdmin && (
                    <button
                      onClick={() => pinThread(thread.id, !thread.pinned)}
                      className="font-medium text-subtle hover:text-warning"
                    >
                      {thread.pinned ? "Lepas sematan" : "Sematkan"}
                    </button>
                  )}
                  {isOwner && (
                    <button onClick={startEditThread} className="font-medium text-subtle hover:text-brand">
                      Edit
                    </button>
                  )}
                  {(isOwner || isAdmin) && (
                    <button onClick={handleDeleteThread} className="font-medium text-subtle hover:text-danger">
                      Hapus
                    </button>
                  )}
                  {currentUser && !isOwner && !isAdmin && (
                    <button
                      onClick={() => {
                        setReportingTarget(
                          reportingTarget?.type === "thread" ? null : { type: "thread", id: thread.id }
                        );
                        setReportReason(reportReasons[0]);
                        setReportNote("");
                      }}
                      className="font-medium text-subtle hover:text-danger"
                    >
                      Lapor
                    </button>
                  )}
                </span>
              </div>
              <MarkdownLite source={thread.body} />
              <ImageGallery images={thread.images} />
              <div className="mt-3">
                <ReactionBar
                  reactions={threadReactions}
                  myReaction={threadMyReaction}
                  onReact={(key) => reactTo("thread", thread.id, key)}
                />
              </div>
              {reportingTarget?.type === "thread" && (
                <ReportForm target={reportingTarget} />
              )}
            </>
          )}
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold text-content">{comments.length} Komentar</h2>

      {/* Reply box */}
      <div id="reply-box" className="card mb-6 p-5">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Membalas komentar…</span>
            <button onClick={() => setReplyTo(null)} className="font-medium text-brand">
              Batal
            </button>
          </div>
        )}
        {currentUser ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted">Komentar Anda</span>
              <button
                type="button"
                onClick={() => setReplyPreviewing((v) => !v)}
                className="text-xs font-medium text-brand hover:underline"
              >
                {replyPreviewing ? "Tulis" : "Pratinjau"}
              </button>
            </div>
            {replyPreviewing ? (
              <div className="min-h-24 rounded-lg border border-border bg-surface-hover p-3">
                {replyBody.trim() ? (
                  <MarkdownLite source={replyBody} />
                ) : (
                  <p className="text-sm text-subtle">Belum ada isi untuk dipratinjau.</p>
                )}
              </div>
            ) : (
              <textarea
                className="input min-h-24 resize-y"
                placeholder="Tulis komentar Anda…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
            )}
            <div className="mt-3">
              <ImageUpload images={replyImages} onChange={setReplyImages} />
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={handleReply} disabled={!replyBody.trim()} className="btn-primary">
                Kirim Komentar
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="font-medium text-brand hover:underline">
              Masuk
            </Link>{" "}
            untuk berkomentar.
          </p>
        )}
      </div>

      {tree.length === 0 ? (
        <p className="text-sm text-muted">Belum ada komentar. Jadilah yang pertama!</p>
      ) : (
        <div className="space-y-4">
          {tree.map((node) => (
            <CommentNode key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}
