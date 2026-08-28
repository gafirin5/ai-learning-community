"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/components/toast";
import type { Report } from "@/lib/types";

export default function ModerationPage() {
  const { state, currentUser, resolveReport, hideThread, hideComment } = useStore();
  const { toast } = useToast();

  const isAdmin = currentUser?.role === "admin";

  const openReports = useMemo(
    () =>
      state.reports
        .filter((r) => r.status === "open")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.reports]
  );

  if (!isAdmin) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Akses terbatas</h1>
        <p className="mt-2 text-sm text-muted">
          Halaman moderasi hanya dapat diakses oleh admin.
        </p>
        <Link href="/forum" className="btn-primary mt-4">
          Kembali ke forum
        </Link>
      </div>
    );
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

  function resolve(id: number) {
    void resolveReport(id).then(() => toast("Laporan ditandai selesai"));
    toast("Laporan ditandai selesai");
  }

  function hide(report: Report) {
    if (report.targetType === "thread") hideThread(report.targetId, true);
    else hideComment(report.targetId, true);
    resolveReport(report.id);
    toast("Konten disembunyikan");
  }

  function restore(report: Report) {
    if (report.targetType === "thread") hideThread(report.targetId, false);
    else hideComment(report.targetId, false);
    resolveReport(report.id);
    toast("Konten dipulihkan");
  }

  function isHidden(report: Report): boolean {
    if (report.targetType === "thread") {
      return state.threads.find((t) => t.id === report.targetId)?.hidden ?? false;
    }
    return state.comments.find((c) => c.id === report.targetId)?.hidden ?? false;
  }

  function reporterName(id: number) {
    return state.users.find((u) => u.id === id)?.name ?? "Pengguna";
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs
        items={[{ label: "Forum", href: "/forum" }, { label: "Moderasi" }]}
      />
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold text-content">Moderasi Forum</h1>
        <p className="text-muted">
          Tinjau laporan pengguna dan kelola konten yang dilaporkan.
        </p>
      </div>

      {openReports.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="Tidak ada laporan terbuka"
          description="Semua laporan telah ditangani. Konten yang dilaporkan akan muncul di sini."
        />
      ) : (
        <div className="space-y-3">
          {openReports.map((report) => {
            const target = targetLabel(report);
            const hidden = isHidden(report);
            return (
              <div key={report.id} className="card p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="badge bg-warning-soft text-warning">{target.kind}</span>
                  <span className="badge bg-danger-soft text-danger">{report.reason}</span>
                  <span>{report.createdAt}</span>
                  {hidden && (
                    <span className="badge bg-danger-soft text-danger">Disembunyikan</span>
                  )}
                </div>
                <Link
                  href={target.link}
                  className="mb-2 block text-base font-semibold text-content hover:text-brand"
                >
                  {target.title}
                </Link>
                <div className="mb-3 flex items-center gap-1.5 text-xs text-muted">
                  <Avatar name={reporterName(report.reporterId)} size="sm" />
                  <span>Dilaporkan oleh {reporterName(report.reporterId)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hidden ? (
                    <button onClick={() => restore(report)} className="btn-secondary">
                      Pulihkan
                    </button>
                  ) : (
                    <button onClick={() => hide(report)} className="btn-primary">
                      Sembunyikan
                    </button>
                  )}
                  <button onClick={() => resolve(report.id)} className="btn-secondary">
                    Tandai selesai
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
