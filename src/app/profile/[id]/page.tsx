"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { LevelBadge, EmptyState } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const { state } = useStore();

  const user = state.users.find((u) => u.id === userId);

  if (!user) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Pengguna tidak ditemukan</h1>
        <Link href="/" className="btn-primary mt-4">
          Kembali
        </Link>
      </div>
    );
  }

  const userProjects = state.projects.filter((p) => p.userId === userId);
  const userThreads = state.threads.filter((t) => t.userId === userId);
  const userComments = state.comments.filter((c) => c.userId === userId);

  return (
    <div className="container-app py-10">
      <Breadcrumbs items={[{ label: "Profil", href: "#" }, { label: user.name }]} />

      {/* Profile header */}
      <div className="card mb-8 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <Avatar name={user.name} size="lg" className="!h-20 !w-20 !text-2xl" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold text-content">{user.name}</h1>
            <span className="badge bg-brand-soft text-brand">{user.role}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <p className="text-xs text-subtle">Bergabung {user.joinedAt}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-xl font-bold text-content">{userProjects.length}</p>
            <p className="text-xs text-muted">Proyek</p>
          </div>
          <div>
            <p className="text-xl font-bold text-content">{userThreads.length}</p>
            <p className="text-xs text-muted">Thread</p>
          </div>
          <div>
            <p className="text-xl font-bold text-content">{userComments.length}</p>
            <p className="text-xs text-muted">Komentar</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projects */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-content">Proyek</h2>
          {userProjects.length === 0 ? (
            <EmptyState icon="🚀" title="Belum ada proyek" description="Pengguna ini belum mempublikasikan proyek." />
          ) : (
            <div className="space-y-3">
              {userProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="card block p-5 transition-colors hover:bg-surface-hover/50">
                  <h3 className="mb-1 font-semibold text-content hover:text-brand">{p.title}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-muted">{p.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelBadge level={p.level} />
                    {p.tags.map((t) => (
                      <span key={t} className="badge bg-surface-hover text-muted">#{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Forum activity */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-content">Aktivitas Forum</h2>
          {userThreads.length === 0 ? (
            <EmptyState icon="💬" title="Belum ada thread" description="Pengguna ini belum membuat thread." />
          ) : (
            <div className="space-y-3">
              {userThreads.map((t) => (
                <Link key={t.id} href={`/forum/${t.id}`} className="card block p-5 transition-colors hover:bg-surface-hover/50">
                  <h3 className="mb-1 font-semibold text-content hover:text-brand">{t.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{t.commentIds.length} komentar</span>
                    <span>·</span>
                    <span>{t.voteCount} vote</span>
                    <span>·</span>
                    <span>{t.createdAt}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
