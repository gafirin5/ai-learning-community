"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { categoryById, forumCategories, reportReasons } from "@/lib/data";
import { VoteControl } from "@/features/forum/vote-control";
import { EmptyState, Tag } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { Reveal } from "@/components/reveal";
import { useToast } from "@/components/toast";
import { MarkdownLite } from "@/components/markdown-lite";
import { ReactionBar } from "@/features/forum/reactions";
import { ImageGallery, ImageUpload } from "@/components/image-upload";
import type { ForumCategoryId } from "@/lib/types";

type SortMode = "terbaru" | "terpopuler";
type StatusFilter = "semua" | "terjawab" | "belum";
const PAGE_SIZES = [5, 10, 20];

export default function ForumPage() {
  const {
    state,
    currentUser,
    addThread,
    voteThread,
    toggleSaveThread,
    editThread,
    deleteThread,
    pinThread,
    reportThread,
    reactTo,
  } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<ForumCategoryId | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("terbaru");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [categoryId, setCategoryId] = useState<ForumCategoryId>("umum");
  const [images, setImages] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<ForumCategoryId>("umum");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editPreviewing, setEditPreviewing] = useState(false);

  // Inline report form state (thread cards).
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportNote, setReportNote] = useState("");

  const isMentorOrAdmin =
    currentUser?.role === "mentor" || currentUser?.role === "admin";

  const allTags = useMemo(() => {
    const s = new Set<string>();
    state.threads.forEach((t) => t.tags.forEach((tag) => s.add(tag)));
    return Array.from(s).sort();
  }, [state.threads]);

  const threads = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = state.threads.filter((t) => !t.hidden);
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (tagFilter) list = list.filter((t) => t.tags.includes(tagFilter));
    if (categoryFilter) list = list.filter((t) => t.categoryId === categoryFilter);
    if (statusFilter === "terjawab") list = list.filter((t) => t.acceptedCommentId != null);
    if (statusFilter === "belum") list = list.filter((t) => t.acceptedCommentId == null);
    if (savedOnly) list = list.filter((t) => state.savedThreadIds.includes(t.id));
    const sorted = [...list];
    // Pinned threads always float to the top, then by the chosen sort.
    if (sort === "terpopuler") {
      sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.voteCount - a.voteCount);
    } else {
      sorted.sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)
      );
    }
    return sorted;
  }, [
    state.threads,
    state.savedThreadIds,
    query,
    sort,
    tagFilter,
    categoryFilter,
    statusFilter,
    savedOnly,
  ]);

  const totalPages = Math.max(1, Math.ceil(threads.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(threads.length, currentPage * pageSize);
  const pageThreads = threads.slice(pageStart, pageEnd);

  function resetPage() {
    setPage(1);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    addThread({ title, body, tags, categoryId, images });
    setTitle("");
    setBody("");
    setTagsInput("");
    setCategoryId("umum");
    setImages([]);
    setPreviewing(false);
    setShowForm(false);
    resetPage();
    toast("Thread berhasil dipublikasikan");
  }

  function startEdit(t: {
    id: number;
    title: string;
    body: string;
    tags: string[];
    categoryId: ForumCategoryId;
    images: string[];
  }) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditBody(t.body);
    setEditTags(t.tags.join(", "));
    setEditCategoryId(t.categoryId);
    setEditImages(t.images);
    setEditPreviewing(false);
  }
  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim() || !editBody.trim() || editingId == null) return;
    const tags = editTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    editThread(editingId, { title: editTitle, body: editBody, tags, categoryId: editCategoryId, images: editImages });
    setEditingId(null);
    toast("Thread berhasil diperbarui");
  }

  function handleDelete(id: number) {
    if (!window.confirm("Hapus thread ini beserta semua komentarnya?")) return;
    deleteThread(id);
    toast("Thread dihapus");
  }

  function submitReport(threadId: number) {
    reportThread(threadId, reportNote.trim() ? `${reportReason} — ${reportNote.trim()}` : reportReason);
    setReportingId(null);
    setReportNote("");
    setReportReason(reportReasons[0]);
    toast("Laporan terkirim. Terima kasih!");
  }

  function renderCategoryFilter() {
    if (forumCategories.length === 0) return null;
    return (
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setCategoryFilter("");
            resetPage();
          }}
          className={`pill ${categoryFilter === "" ? "pill-active" : "pill-idle"}`}
        >
          Semua kategori
        </button>
        {forumCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCategoryFilter(categoryFilter === c.id ? "" : c.id);
              resetPage();
            }}
            className={`pill ${categoryFilter === c.id ? "pill-active" : "pill-idle"}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-content">Forum Diskusi</h1>
          <p className="text-muted">Diskusikan topik AI/ML bersama komunitas.</p>
        </div>
        <div className="flex items-center gap-2">
          {isMentorOrAdmin && (
            <Link href="/forum/moderation" className="btn-secondary">
              🛡️ Moderasi
            </Link>
          )}
          {currentUser ? (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
              {showForm ? "Tutup" : "+ Buat Thread"}
            </button>
          ) : (
            <Link href="/login" className="btn-primary">
              Masuk untuk berdiskusi
            </Link>
          )}
        </div>
      </div>

      {/* New thread form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4 p-6 animate-slide-up">
          <div>
            <label className="label" htmlFor="thread-title">Judul</label>
            <input
              id="thread-title"
              className="input"
              placeholder="Tulis judul pertanyaan…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label" htmlFor="thread-body">Isi</label>
              <button
                type="button"
                onClick={() => setPreviewing((v) => !v)}
                className="text-xs font-medium text-brand hover:underline"
              >
                {previewing ? "Tulis" : "Pratinjau"}
              </button>
            </div>
            {previewing ? (
              <div className="min-h-28 rounded-lg border border-border bg-surface-hover p-3">
                {body.trim() ? (
                  <MarkdownLite source={body} />
                ) : (
                  <p className="text-sm text-subtle">Belum ada isi untuk dipratinjau.</p>
                )}
              </div>
            ) : (
              <textarea
                id="thread-body"
                className="input min-h-28 resize-y"
                placeholder="Jelaskan pertanyaan atau topik Anda…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            )}
          </div>
          <ImageUpload images={images} onChange={setImages} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="thread-category">Kategori</label>
              <select
                id="thread-category"
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value as ForumCategoryId)}
              >
                {forumCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="thread-tags">Tags (pisahkan dengan koma)</label>
              <input
                id="thread-tags"
                className="input"
                placeholder="machine-learning, python"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Publikasikan
          </button>
        </form>
      )}

      {/* Search + sort */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden="true">
            🔍
          </span>
          <input
            className="input pl-9"
            placeholder="Cari thread berdasarkan kata kunci…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="flex gap-2">
          {(["terbaru", "terpopuler"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setSort(mode);
                resetPage();
              }}
              className={`pill ${sort === mode ? "pill-active" : "pill-idle"}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Status + saved filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["semua", "Semua"],
            ["terjawab", "Terjawab"],
            ["belum", "Belum terjawab"],
          ] as [StatusFilter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setStatusFilter(value);
              resetPage();
            }}
            className={`pill ${statusFilter === value ? "pill-active" : "pill-idle"}`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            setSavedOnly((v) => !v);
            resetPage();
          }}
          className={`pill ${savedOnly ? "pill-active" : "pill-idle"}`}
        >
          🔖 Disimpan
        </button>
      </div>

      {renderCategoryFilter()}

      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTagFilter("");
              resetPage();
            }}
            className={`pill ${tagFilter === "" ? "pill-active" : "pill-idle"}`}
          >
            Semua tag
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTagFilter(tagFilter === t ? "" : t);
                resetPage();
              }}
              className={`pill ${tagFilter === t ? "pill-active" : "pill-idle"}`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Tidak ada thread yang cocok"
          description="Coba kata kunci atau filter lain, atau buat thread baru."
        />
      ) : (
        <div className="space-y-3">
          {pageThreads.map((thread, i) => {
            const author = state.users.find((u) => u.id === thread.userId);
            const category = categoryById.get(thread.categoryId);
            const commentCount = thread.commentIds.length;
            const voteVal = state.votes.threads[thread.id] ?? 0;
            const reactions = state.reactions.threads[thread.id] ?? {};
            const myReaction = state.myReactions.threads[thread.id] ?? null;
            const isOwner = currentUser?.id === thread.userId;
            const isAdmin = currentUser?.role === "admin";
            const saved = state.savedThreadIds.includes(thread.id);
            const canReport = currentUser && !isOwner && !isAdmin;

            if (editingId === thread.id) {
              return (
                <form
                  key={thread.id}
                  onSubmit={handleEdit}
                  className="card space-y-4 p-5 animate-slide-up"
                >
                  <div>
                    <label className="label" htmlFor={`edit-title-${thread.id}`}>Judul</label>
                    <input
                      id={`edit-title-${thread.id}`}
                      className="input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="label" htmlFor={`edit-body-${thread.id}`}>Isi</label>
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
                        id={`edit-body-${thread.id}`}
                        className="input min-h-28 resize-y"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        required
                      />
                    )}
                  </div>
                  <ImageUpload images={editImages} onChange={setEditImages} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor={`edit-category-${thread.id}`}>Kategori</label>
                      <select
                        id={`edit-category-${thread.id}`}
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
                    <div>
                      <label className="label" htmlFor={`edit-tags-${thread.id}`}>Tags (pisahkan dengan koma)</label>
                      <input
                        id={`edit-tags-${thread.id}`}
                        className="input"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">Simpan</button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn-secondary">
                      Batal
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <Reveal key={thread.id} delay={Math.min(i, 8) * 40}>
                <div className="card card-hover flex gap-4 p-5">
                  <VoteControl
                    count={thread.voteCount}
                    value={voteVal}
                    onVote={(d) => voteThread(thread.id, d)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {thread.pinned && (
                        <span className="badge bg-warning-soft text-warning">📌 Disematkan</span>
                      )}
                      <Link
                        href={`/forum/${thread.id}`}
                        className="text-base font-semibold text-content hover:text-brand"
                      >
                        {thread.title}
                      </Link>
                      {thread.acceptedCommentId != null ? (
                        <span className="badge bg-success-soft text-success">✓ Terjawab</span>
                      ) : (
                        <span className="badge bg-surface-hover text-muted">Belum terjawab</span>
                      )}
                    </div>
                    <p className="mb-3 line-clamp-2 text-sm text-muted">{thread.body}</p>
                    <ImageGallery images={thread.images} />
                    <div className="mb-3">
                      <ReactionBar
                        reactions={reactions}
                        myReaction={myReaction}
                        onReact={(key) => reactTo("thread", thread.id, key)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <Link href={`/profile/${author?.id}`} className="flex items-center gap-1.5 font-medium text-content hover:text-brand">
                        <Avatar name={author?.name ?? "Pengguna"} size="sm" />
                        <span>{author?.name ?? "Pengguna"}</span>
                      </Link>
                      <span>·</span>
                      <span>{thread.createdAt}</span>
                      <span>·</span>
                      <span>{commentCount} komentar</span>
                      <span>·</span>
                      <span>👁 {thread.viewCount ?? 0}</span>
                      {category && (
                        <span className="badge bg-surface-hover text-muted">
                          {category.emoji} {category.label}
                        </span>
                      )}
                      <span className="ml-auto flex flex-wrap items-center gap-1.5">
                        {thread.tags.map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </span>
                      {isMentorOrAdmin && (
                        <button
                          onClick={() => pinThread(thread.id, !thread.pinned)}
                          title={thread.pinned ? "Lepas sematan" : "Sematkan thread"}
                          className="text-xs font-medium text-subtle hover:text-warning"
                        >
                          {thread.pinned ? "Lepas sematan" : "Sematkan"}
                        </button>
                      )}
                      <button
                        onClick={() => toggleSaveThread(thread.id)}
                        aria-label={saved ? "Hapus dari disimpan" : "Simpan thread"}
                        title={saved ? "Hapus dari disimpan" : "Simpan thread"}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
                          saved ? "text-brand" : "text-subtle hover:bg-surface-hover hover:text-content"
                        }`}
                      >
                        <svg viewBox="0 0 20 20" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                          <path d="M5 4.5A1.5 1.5 0 016.5 3h7A1.5 1.5 0 0115 4.5v12l-5-3.5L5 16.5v-12z" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {canReport && (
                        <button
                          onClick={() => {
                            setReportingId(reportingId === thread.id ? null : thread.id);
                            setReportReason(reportReasons[0]);
                            setReportNote("");
                          }}
                          className="font-medium text-subtle hover:text-danger"
                        >
                          Lapor
                        </button>
                      )}
                      {(isOwner || isAdmin) && (
                        <>
                          {isOwner && (
                            <button
                              onClick={() => startEdit(thread)}
                              className="font-medium text-subtle hover:text-brand"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(thread.id)}
                            className="font-medium text-subtle hover:text-danger"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>

                    {reportingId === thread.id && (
                      <div className="mt-3 rounded-lg border border-border bg-surface-hover p-3">
                        <p className="mb-2 text-xs font-medium text-content">Laporkan thread ini</p>
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
                          <button onClick={() => submitReport(thread.id)} className="btn-primary">
                            Kirim laporan
                          </button>
                          <button onClick={() => setReportingId(null)} className="btn-secondary">
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {threads.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pill pill-idle disabled:opacity-40"
            >
              ‹ Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`pill ${n === currentPage ? "pill-active" : "pill-idle"}`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pill pill-idle disabled:opacity-40"
            >
              Berikutnya ›
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>
              Menampilkan {threads.length === 0 ? 0 : pageStart + 1}–{pageEnd} dari {threads.length}
            </span>
            <select
              aria-label="Jumlah thread per halaman"
              className="pill pill-idle"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                resetPage();
              }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} / halaman
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
