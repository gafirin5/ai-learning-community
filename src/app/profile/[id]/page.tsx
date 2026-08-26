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

  return (
    <div className="container-app py-10">
      <Breadcrumbs items={[{ label: "Portofolio", href: "#" }, { label: user.name }]} />

      {/* Profile header */}
      <div className="card mb-8 flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
        <Avatar name={user.name} size="lg" className="!h-24 !w-24 !text-3xl border-4 border-surface" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-3xl font-bold text-content">{user.name}</h1>
            <span className="badge bg-brand-soft text-brand">{user.role}</span>
          </div>
          <p className="mt-2 text-base text-muted">{user.email}</p>
          <p className="mt-1 text-sm text-subtle">Bergabung sejak {user.joinedAt}</p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button className="btn-primary" onClick={() => alert("Fitur Kontak sedang dikembangkan!")}>Hubungi Saya</button>
            <button className="btn-secondary">Unduh CV</button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-center sm:flex-col sm:justify-start">
          <div className="bg-surface-hover rounded-xl p-4 min-w-[100px]">
            <p className="text-2xl font-bold text-brand">{userProjects.length}</p>
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Proyek</p>
          </div>
          <div className="bg-surface-hover rounded-xl p-4 min-w-[100px]">
            <p className="text-2xl font-bold text-brand">{userThreads.length}</p>
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Diskusi</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Projects (Portfolio Focus) */}
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-content flex items-center gap-2">
            <span>🚀</span> Showcase Proyek
          </h2>
          {userProjects.length === 0 ? (
            <EmptyState icon="📂" title="Belum ada portofolio" description="Pengguna ini belum mempublikasikan proyek." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="card flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-brand/30">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-content hover:text-brand">{p.title}</h3>
                    <p className="mb-4 line-clamp-3 text-sm text-muted leading-relaxed">{p.description}</p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <LevelBadge level={p.level} />
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t} className="badge bg-surface-hover text-xs text-muted">#{t}</span>
                      ))}
                      {p.tags.length > 2 && <span className="text-xs text-muted">+{p.tags.length - 2}</span>}
                    </div>
                    <div className="text-xs text-brand font-medium group-hover:underline flex items-center gap-1">
                      Lihat Detail & Demo <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Forum activity */}
        <section className="lg:col-span-1">
          <h2 className="mb-4 text-xl font-bold text-content flex items-center gap-2">
            <span>💬</span> Kontribusi Forum
          </h2>
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
