"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState, LevelBadge, Tag } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { VoteControl } from "@/components/vote-control";
import { Reveal } from "@/components/reveal";
import { useToast } from "@/components/toast";
import type { Level } from "@/lib/types";

const LEVEL_FILTERS: Array<{ value: "semua" | Level; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "pemula", label: "Pemula" },
  { value: "menengah", label: "Menengah" },
  { value: "lanjutan", label: "Lanjutan" },
];

type SortMode = "terbaru" | "populer";

export default function ProjectsPage() {
  const { state, currentUser, addProject, voteProject } = useStore();
  const { toast } = useToast();
  const [level, setLevel] = useState<"semua" | Level>("semua");
  const [tag, setTag] = useState<string>("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("terbaru");
  const [hasDemo, setHasDemo] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [projLevel, setProjLevel] = useState<Level>("pemula");
  const [coverUrl, setCoverUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    state.projects.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [state.projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.projects.filter((p) => {
      if (level !== "semua" && p.level !== level) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (hasDemo && !(p.demoUrl ?? "")) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tags.some((t) => t.includes(q))) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "populer") {
      sorted.sort((a, b) => {
        // Gabungkan likeCount dan jumlah commentIds
        const scoreA = (a.likeCount ?? 0) + a.commentIds.length;
        const scoreB = (b.likeCount ?? 0) + b.commentIds.length;
        return scoreB - scoreA;
      });
    } else {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }
    return sorted;
  }, [state.projects, level, tag, hasDemo, query, sort]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    try {
      await addProject({
        title,
        description,
        repoUrl,
        tags,
        level: projLevel,
        coverImageUrl: coverUrl.trim(),
        demoUrl: demoUrl.trim(),
      });
    } catch {
      toast("Gagal menambahkan proyek", "error");
      return;
    }
    setTitle("");
    setDescription("");
    setRepoUrl("");
    setTagsInput("");
    setCoverUrl("");
    setDemoUrl("");
    setShowForm(false);
    toast("Proyek berhasil dipublikasikan");
  }

  return (
    <div className="container-app py-10">
      <div className="kop mb-6 flex flex-wrap items-end justify-between gap-3 pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-subtle">
            Register Karya · AI Learning Community
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-content">
            Pamerkan karyamu.
          </h1>
          <p className="mt-1 text-muted">Lihat dan bagikan proyek AI/ML dari komunitas.</p>
        </div>
        {currentUser ? (
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            {showForm ? "Tutup" : "+ Publikasikan Proyek"}
          </button>
        ) : (
          <Link href="/login" className="btn-primary">
            Masuk untuk mempublikasikan
          </Link>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4 p-6 animate-slide-up">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="proj-title">Judul proyek</label>
              <input
                id="proj-title"
                className="input"
                placeholder="Nama proyek Anda"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="proj-repo">Tautan repositori</label>
              <input
                id="proj-repo"
                className="input"
                placeholder="https://github.com/…"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="proj-desc">Deskripsi</label>
            <textarea
              id="proj-desc"
              className="input min-h-24 resize-y"
              placeholder="Apa yang proyek ini lakukan, dan apa hasilnya?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="proj-tags">Tags (pisahkan dengan koma)</label>
              <input
                id="proj-tags"
                className="input"
                placeholder="nlp, klasifikasi, python"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="proj-level">Level</label>
              <select
                id="proj-level"
                className="input"
                value={projLevel}
                onChange={(e) => setProjLevel(e.target.value as Level)}
              >
                <option value="pemula">Pemula</option>
                <option value="menengah">Menengah</option>
                <option value="lanjutan">Lanjutan</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="proj-cover">URL gambar cover (opsional)</label>
              <input
                id="proj-cover"
                type="url"
                className="input"
                placeholder="https://…/cover.png"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="proj-demo">URL demo live (opsional)</label>
              <input
                id="proj-demo"
                type="url"
                className="input"
                placeholder="https://demo-proyek-anda…"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Publikasikan
          </button>
        </form>
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
          </span>
          <input
            className="input pl-9"
            placeholder="Cari proyek…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["terbaru", "populer"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              className={`pill ${sort === mode ? "pill-active" : "pill-idle"}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {LEVEL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setLevel(f.value)}
            className={`pill ${level === f.value ? "pill-active" : "pill-idle"}`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setHasDemo((v) => !v)}
          aria-pressed={hasDemo}
          className={`pill ${hasDemo ? "pill-active" : "pill-idle"}`}
        >
          Ada Demo
        </button>
        <select
          className="input ml-auto w-full sm:w-56"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          aria-label="Filter topik"
        >
          <option value="">Semua topik</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4c3 0 6 3 6 6-2.5.5-4.5 2.5-5 5-3 0-6-3-6-6 .5-2.5 2.5-4.5 5-5z" />
              <circle cx="14.5" cy="9.5" r="1.5" />
              <path d="M9 15l-4 5M11.5 12.5L5 19" />
            </svg>
          }
          title="Belum ada proyek yang cocok"
          description="Coba ubah filter, atau publikasikan proyek Anda sendiri."
        />
      ) : (
        <div key={`${level}-${tag}-${sort}-${query}-${hasDemo}`} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((project, i) => {
            const owner = state.users.find((u) => u.id === project.userId);
            const voteVal = state.votes.projects?.[project.id] ?? 0;
            const likeCount = (project.likeCount ?? 0) + voteVal;
            const cover = project.coverImageUrl ?? "";
            const demo = project.demoUrl ?? "";
            return (
              <Reveal key={project.id} delay={Math.min(i, 5) * 60} className="mb-4 break-inside-avoid">
                <div className="card card-hover group flex flex-col overflow-hidden">
                  {/* Cover: foto asli, atau sampul kertas berhuruf (tanpa gradien) */}
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={project.title}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="ruled flex h-24 items-end justify-between bg-brand-soft p-4">
                      <span className="text-lg font-extrabold uppercase tracking-[0.09em] text-brand">
                        {project.title.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="num-tabular text-xs text-subtle">
                        {String(project.id).padStart(3, "0")}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LevelBadge level={project.level} />
                        {demo && (
                          <span className="badge text-brand">
                            Demo
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3 w-3" aria-hidden="true">
                              <path d="M7 4h9v9M16 4L6 14" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className="num-tabular text-xs text-subtle">{project.commentIds.length} komentar</span>
                    </div>
                    <Link
                      href={`/projects/${project.id}`}
                      className="mb-2 text-lg font-semibold text-content hover:text-brand"
                    >
                      {project.title}
                    </Link>
                    <p className="mb-4 flex-1 text-sm leading-6 text-muted">{project.description}</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {project.tags.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <VoteControl
                        count={likeCount}
                        value={voteVal}
                        onVote={(d) => voteProject(project.id, d)}
                      />
                      <span className="ml-auto flex items-center gap-1.5">
                        <Link href={`/profile/${owner?.id}`} className="flex items-center gap-1.5 font-medium text-content hover:text-brand">
                          <Avatar name={owner?.name ?? "Pengguna"} size="sm" />
                          <span>{owner?.name ?? "Pengguna"}</span>
                        </Link>
                        <span>·</span>
                        <span>{project.createdAt}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
