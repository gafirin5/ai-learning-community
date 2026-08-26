"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState, LevelBadge, Tag } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { VoteControl } from "@/features/forum/vote-control";
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

const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

function bannerGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function ProjectsPage() {
  const { state, currentUser, addProject, voteProject } = useStore();
  const { toast } = useToast();
  const [level, setLevel] = useState<"semua" | Level>("semua");
  const [tag, setTag] = useState<string>("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("terbaru");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [projLevel, setProjLevel] = useState<Level>("pemula");

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
      if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tags.some((t) => t.includes(q))) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "populer") sorted.sort((a, b) => b.commentIds.length - a.commentIds.length);
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [state.projects, level, tag, query, sort]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    addProject({ title, description, repoUrl, tags, level: projLevel });
    setTitle("");
    setDescription("");
    setRepoUrl("");
    setTagsInput("");
    setShowForm(false);
    toast("Proyek berhasil dipublikasikan");
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-content">Showcase Proyek</h1>
          <p className="text-muted">Lihat dan bagikan proyek AI/ML dari komunitas.</p>
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
          <button type="submit" className="btn-primary">
            Publikasikan
          </button>
        </form>
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden="true">
            🔍
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
          icon="🚀"
          title="Belum ada proyek yang cocok"
          description="Coba ubah filter, atau publikasikan proyek Anda sendiri."
        />
      ) : (
        <div key={`${level}-${tag}-${sort}-${query}`} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, i) => {
            const owner = state.users.find((u) => u.id === project.userId);
            const voteVal = state.votes.projects?.[project.id] ?? 0;
            const likeCount = (project.likeCount ?? 0) + voteVal;
            return (
              <Reveal key={project.id} delay={Math.min(i, 5) * 60} className="h-full">
                <div className="card card-hover group flex h-full flex-col overflow-hidden">
                  {/* Gradient banner */}
                  <div className={`flex h-24 items-end bg-gradient-to-br gradient-animate ${bannerGradient(project.title)} p-4`}>
                    <span className="text-sm font-bold text-white/90">{project.title.slice(0, 1).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <LevelBadge level={project.level} />
                      <span className="text-xs text-subtle">{project.commentIds.length} komentar</span>
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
