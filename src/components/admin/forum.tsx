"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui";
import { useToast } from "@/components/toast";

export function Forum() {
  const { state, pinThread, hideThread, hideComment, deleteThread, deleteComment } = useStore();
  const { toast } = useToast();

  function userName(id: number) {
    return state.users.find((u) => u.id === id)?.name ?? "Pengguna";
  }

  function handleDeleteThread(id: number, title: string) {
    if (!window.confirm(`Hapus thread "${title}" beserta komentarnya?`)) return;
    void deleteThread(id).then(() => toast("Thread dihapus"));
    toast("Thread dihapus");
  }

  function handleDeleteComment(id: number) {
    if (!window.confirm("Hapus komentar ini beserta balasannya?")) return;
    void deleteComment(id).then(() => toast("Komentar dihapus"));
    toast("Komentar dihapus");
  }

  return (
    <div className="space-y-3">
      {state.threads.length === 0 ? (
        <EmptyState icon="💬" title="Tidak ada thread" />
      ) : (
        state.threads.map((thread) => (
          <div key={thread.id} className="card p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Link href={`/forum/${thread.id}`} className="font-semibold text-content hover:text-brand">
                {thread.title}
              </Link>
              {thread.pinned && <span className="badge bg-brand-soft text-brand">📌 Disematkan</span>}
              {thread.hidden && <span className="badge bg-danger-soft text-danger">Disembunyikan</span>}
            </div>
            <div className="mb-3 flex items-center gap-2 text-xs text-muted">
              <Avatar name={userName(thread.userId)} size="sm" />
              <span>{userName(thread.userId)}</span>
              <span>·</span>
              <span>{thread.commentIds.length} komentar</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { void pinThread(thread.id, !thread.pinned).then(() => toast(thread.pinned ? "Penyematan dibatalkan" : "Thread disematkan")); }} className="btn-secondary">
                {thread.pinned ? "Lepas sematan" : "Sematkan"}
              </button>
              <button onClick={() => { void hideThread(thread.id, !thread.hidden).then(() => toast(thread.hidden ? "Thread dipulihkan" : "Thread disembunyikan")); }} className="btn-secondary">
                {thread.hidden ? "Pulihkan" : "Sembunyikan"}
              </button>
              <button onClick={() => handleDeleteThread(thread.id, thread.title)} className="btn-danger">
                Hapus
              </button>
            </div>

            {/* Comments */}
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {state.comments
                .filter((c) => c.threadId === thread.id)
                .map((comment) => (
                  <div key={comment.id} className="flex items-center gap-3 rounded-lg bg-surface-hover/50 p-2.5">
                    <Avatar name={userName(comment.userId)} size="sm" />
                    <p className={`min-w-0 flex-1 truncate text-sm ${comment.hidden ? "text-subtle line-through" : "text-content"}`}>
                      {comment.body}
                    </p>
                    {comment.hidden && <span className="badge bg-danger-soft text-danger">Tersembunyi</span>}
                    <button onClick={() => { void hideComment(comment.id, !comment.hidden).then(() => toast(comment.hidden ? "Komentar dipulihkan" : "Komentar disembunyikan")); }} className="btn-ghost px-2 py-1 text-xs">
                      {comment.hidden ? "Pulihkan" : "Sembunyikan"}
                    </button>
                    <button onClick={() => handleDeleteComment(comment.id)} className="btn-ghost px-2 py-1 text-xs text-danger hover:bg-danger-soft">
                      Hapus
                    </button>
                  </div>
                ))}
              {state.comments.filter((c) => c.threadId === thread.id).length === 0 && (
                <p className="text-xs text-muted">Tidak ada komentar.</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
