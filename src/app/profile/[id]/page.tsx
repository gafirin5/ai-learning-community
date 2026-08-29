"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { Avatar } from "@/components/avatar";
import { LevelBadge, EmptyState } from "@/components/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/components/toast";
import { BADGE_DEFS } from "@/lib/store/gamification";
import { interests as INTEREST_DEFS } from "@/lib/data/interests";
import { updateProfileRemote } from "@/features/profile/api";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const { state, setInterests } = useStore();
  const { toast } = useToast();

  const isCurrentUser = state.currentUserId !== null && state.currentUserId === userId;

  // ---- Derived (useMemo) ----
  const userProjects = useMemo(() => state.projects.filter((p) => p.userId === userId), [state.projects, userId]);
  const userThreads = useMemo(() => state.threads.filter((t) => t.userId === userId), [state.threads, userId]);
  // Komentar disembunyikan (moderasi) tidak dihitung maupun dirender — konsisten
  // dengan communityScore di gamification.
  const userComments = useMemo(
    () =>
      state.comments
        .filter((c) => c.userId === userId && !c.hidden)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.comments, userId]
  );
  const threadById = useMemo(() => new Map(state.threads.map((t) => [t.id, t])), [state.threads]);
  // badge_id (string) → definisi tampilan; id yang tak dikenal dilewati.
  const earnedBadges = useMemo(
    () =>
      state.badges.flatMap((id) => {
        const def = BADGE_DEFS.find((b) => b.id === id);
        return def ? [def] : [];
      }),
    [state.badges]
  );
  const selectedInterests = useMemo(
    () =>
      state.interests.flatMap((id) => {
        const def = INTEREST_DEFS.find((i) => i.id === id);
        return def ? [def] : [];
      }),
    [state.interests]
  );

  // ---- State form Edit Profil ----
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", avatarUrl: "", expertise: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- State Edit Minat ----
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [interestDraft, setInterestDraft] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);

  const userRaw = state.users.find((u) => u.id === userId);

  if (!userRaw) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Pengguna tidak ditemukan</h1>
        <Link href="/" className="btn-primary mt-4">
          Kembali
        </Link>
      </div>
    );
  }

  // Normalisasi defensif: state lama di localStorage (aic-store-v1) bisa berisi
  // user tanpa field baru (expertise/bio/avatarUrl) karena persistence (lane
  // lain) belum memetakannya. Deklarasi tipe eksplisit juga membuat `user`
  // aman dipakai di dalam closure handler di bawah.
  const user: User = {
    ...userRaw,
    expertise: Array.isArray(userRaw.expertise) ? userRaw.expertise : [],
    bio: typeof userRaw.bio === "string" ? userRaw.bio : "",
    avatarUrl: typeof userRaw.avatarUrl === "string" ? userRaw.avatarUrl : "",
  };

  // ---- Handlers (hanya dipanggil dari JSX setelah guard user di atas) ----

  function openEdit() {
    setForm({
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      expertise: user.expertise.join(", "),
    });
    setEditError(null);
    setEditOpen(true);
  }

  async function submitProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      setEditError("Nama tidak boleh kosong.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      await updateProfileRemote({
        name: form.name,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        expertise: form.expertise.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast("Profil berhasil diperbarui.");
      // Trade-off reload penuh: profil tersimpan di profiles (Supabase), sedangkan
      // state.users di-store diisi oleh fetchRemoteState saat boot — tidak ada aksi
      // store granular untuk mem-patch satu user (store milik lane lain). Reload
      // menarik profil terbaru; delay singkat agar toast sempat terlihat.
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan profil.";
      setEditError(message);
      toast(message, "error");
      setSaving(false);
    }
  }

  function openInterests() {
    setInterestDraft(state.interests);
    setInterestsOpen(true);
  }

  function toggleInterest(id: string) {
    setInterestDraft((draft) => (draft.includes(id) ? draft.filter((x) => x !== id) : [...draft, id]));
  }

  async function saveInterests() {
    setSavingInterests(true);
    try {
      await setInterests(interestDraft);
      toast("Minat berhasil disimpan.");
      setInterestsOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan minat.", "error");
    } finally {
      setSavingInterests(false);
    }
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs items={[{ label: "Profil", href: "#" }, { label: user.name }]} />

      {/* Profile header */}
      <div className="card mb-8 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <Avatar
          name={user.name}
          src={user.avatarUrl || undefined}
          size="lg"
          className="!h-20 !w-20 !text-2xl"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold text-content">{user.name}</h1>
            <span className="badge bg-brand-soft text-brand">{user.role}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          {user.bio ? <p className="mt-2 max-w-2xl text-sm text-content">{user.bio}</p> : null}
          {user.expertise.length > 0 ? (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {user.expertise.map((skill) => (
                <span key={skill} className="badge bg-surface-hover text-content text-xs">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-xs text-subtle">Bergabung {user.joinedAt}</p>
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

      {/* Pencapaian — hanya untuk profil sendiri (poin/streak/badge milik session) */}
      {isCurrentUser ? (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-content">Pencapaian</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card flex items-center gap-4 p-5">
              <span aria-hidden="true" className="text-3xl">
                ⭐
              </span>
              <div>
                <p className="text-3xl font-bold text-content">{state.points}</p>
                <p className="text-xs text-muted">Poin Belajar</p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <span aria-hidden="true" className="text-3xl">
                🔥
              </span>
              <div>
                <p className="text-3xl font-bold text-content">{state.activity.streak}</p>
                <p className="text-xs text-muted">Hari Streak</p>
              </div>
            </div>
            <div className="card p-5 sm:col-span-2 lg:col-span-1">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Lencana</p>
              {earnedBadges.length === 0 ? (
                <p className="text-sm text-muted">
                  Belum ada lencana — selesaikan pelajaran atau aktif di forum untuk meraihnya!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.map((b) => (
                    <span
                      key={b.id}
                      title={b.description}
                      className="badge bg-brand-soft text-brand text-xs"
                    >
                      <span aria-hidden="true" className="mr-1">
                        {b.emoji}
                      </span>
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Minat — hanya untuk profil sendiri */}
      {isCurrentUser ? (
        <section className="mb-8">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-content">Minat</h2>
              {!interestsOpen ? (
                <button type="button" className="btn-secondary" onClick={openInterests}>
                  Edit minat
                </button>
              ) : null}
            </div>
            {interestsOpen ? (
              <div>
                <p className="mb-3 text-sm text-muted">Pilih satu atau beberapa minat belajar Anda.</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {INTEREST_DEFS.map((i) => {
                    const active = interestDraft.includes(i.id);
                    return (
                      <button
                        key={i.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleInterest(i.id)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-content"
                        }`}
                      >
                        <span aria-hidden="true" className="mr-1">
                          {i.emoji}
                        </span>
                        {i.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary" onClick={saveInterests} disabled={savingInterests}>
                    {savingInterests ? "Menyimpan…" : "Simpan minat"}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setInterestsOpen(false)}>
                    Batal
                  </button>
                </div>
              </div>
            ) : selectedInterests.length === 0 ? (
              <p className="text-sm text-muted">
                Belum ada minat dipilih — rekomendasi materi memakai daftar ini.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map((i) => (
                  <span key={i.id} className="badge bg-brand-soft text-brand text-xs">
                    <span aria-hidden="true" className="mr-1">
                      {i.emoji}
                    </span>
                    {i.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Edit Profil — hanya untuk profil sendiri */}
      {isCurrentUser ? (
        <section className="mb-8">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-content">Edit Profil</h2>
              {!editOpen ? (
                <button type="button" className="btn-secondary" onClick={openEdit}>
                  Ubah profil
                </button>
              ) : null}
            </div>
            {editOpen ? (
              <form onSubmit={submitProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="profile-name" className="label">
                      Nama
                    </label>
                    <input
                      id="profile-name"
                      className="input"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-avatar" className="label">
                      URL Foto (opsional)
                    </label>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={form.name || user.name}
                        src={form.avatarUrl || undefined}
                        size="md"
                      />
                      <input
                        id="profile-avatar"
                        className="input"
                        type="url"
                        placeholder="https://…"
                        value={form.avatarUrl}
                        onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="profile-bio" className="label">
                    Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    className="input min-h-24 resize-y"
                    placeholder="Ceritakan singkat tentang diri Anda…"
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="profile-expertise" className="label">
                    Keahlian (pisahkan dengan koma)
                  </label>
                  <input
                    id="profile-expertise"
                    className="input"
                    placeholder="Python, Machine Learning, …"
                    value={form.expertise}
                    onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
                  />
                </div>
                {editError ? <p className="text-sm text-danger">{editError}</p> : null}
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? "Menyimpan…" : "Simpan perubahan"}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setEditOpen(false)} disabled={saving}>
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted">
                Perbarui nama, bio, foto, dan keahlian Anda. Perubahan tersimpan ke database.
              </p>
            )}
          </div>
        </section>
      ) : null}

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

      {/* Komentar forum */}
      <section className="mt-6">
        <h2 className="mb-4 text-lg font-bold text-content">Komentar Forum</h2>
        {userComments.length === 0 ? (
          <EmptyState icon="🗨️" title="Belum ada komentar" description="Pengguna ini belum menulis komentar di forum." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {userComments.map((c) => {
              const thread = threadById.get(c.threadId);
              return (
                <Link
                  key={c.id}
                  href={`/forum/${c.threadId}`}
                  className="card block p-5 transition-colors hover:bg-surface-hover/50"
                >
                  <h3 className="mb-1 font-semibold text-content hover:text-brand">
                    {thread ? thread.title : `Thread #${c.threadId}`}
                  </h3>
                  <p className="mb-2 line-clamp-2 text-sm text-muted">{c.body}</p>
                  <p className="text-xs text-subtle">{c.createdAt}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
