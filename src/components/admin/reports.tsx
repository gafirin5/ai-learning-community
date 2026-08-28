"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { Report } from "@/lib/types";

export function Reports() {
  const { state, resolveReport, hideThread, hideComment, deleteReport } = useStore();
  const { toast } = useToast();

  function userName(id: number) {
    return state.users.find((u) => u.id === id)?.name ?? "Pengguna";
  }

  function targetLabel(r: Report) {
    if (r.targetType === "thread") {
      const thread = state.threads.find((t) => t.id === r.targetId);
      return { kind: "Thread", title: thread?.title ?? "(thread terhapus)", link: `/forum/${r.targetId}` };
    }
    const comment = state.comments.find((c) => c.id === r.targetId);
    const thread = comment ? state.threads.find((t) => t.id === comment.threadId) : undefined;
    return {
      kind: "Komentar",
      title: comment?.body ?? "(komentar terhapus)",
      link: thread ? `/forum/${thread.id}` : "/forum",
    };
  }

  function isHidden(r: Report): boolean {
    if (r.targetType === "thread") {
      return state.threads.find((t) => t.id === r.targetId)?.hidden ?? false;
    }
    return state.comments.find((c) => c.id === r.targetId)?.hidden ?? false;
  }

  function hide(r: Report) {
    if (r.targetType === "thread") hideThread(r.targetId, true);
    else hideComment(r.targetId, true);
    void resolveReport(r.id);
    toast("Konten disembunyikan");
  }

  function restore(r: Report) {
    if (r.targetType === "thread") hideThread(r.targetId, false);
    else hideComment(r.targetId, false);
    void resolveReport(r.id);
    toast("Konten dipulihkan");
  }

  function handleDelete(reportId: number) {
    if (!window.confirm("Hapus laporan ini secara permanen?")) return;
    void deleteReport(reportId).then(() => toast("Laporan dihapus"));
    toast("Laporan dihapus");
  }

  const reports = [...state.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-3">
      {reports.length === 0 ? (
        <EmptyState icon="🚨" title="Tidak ada laporan" description="Laporan dari pengguna akan muncul di sini." />
      ) : (
        reports.map((report) => {
          const target = targetLabel(report);
          const hidden = isHidden(report);
          return (
            <div key={report.id} className="card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="badge bg-warning-soft text-warning">{target.kind}</span>
                <span className="badge bg-danger-soft text-danger">{report.reason}</span>
                <span className="badge bg-surface-hover text-muted">{report.status === "open" ? "Terbuka" : "Selesai"}</span>
                <span>{report.createdAt}</span>
                {hidden && <span className="badge bg-danger-soft text-danger">Disembunyikan</span>}
              </div>
              <Link href={target.link} className="mb-2 block text-base font-semibold text-content hover:text-brand">
                {target.title}
              </Link>
              <div className="mb-3 flex items-center gap-1.5 text-xs text-muted">
                <Avatar name={userName(report.reporterId)} size="sm" />
                <span>Dilaporkan oleh {userName(report.reporterId)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {hidden ? (
                  <button onClick={() => restore(report)} className="btn-secondary">Pulihkan</button>
                ) : (
                  <button onClick={() => hide(report)} className="btn-primary">Sembunyikan</button>
                )}
                {report.status === "open" && (
                  <button onClick={() => { void resolveReport(report.id).then(() => toast("Laporan ditandai selesai")); }} className="btn-secondary">
                    Tandai selesai
                  </button>
                )}
                <button onClick={() => handleDelete(report.id)} className="btn-danger">
                  Hapus
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
