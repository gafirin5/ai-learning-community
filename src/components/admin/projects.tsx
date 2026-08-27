"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { EmptyState, LevelBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { Level } from "@/lib/types";

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: "pemula", label: "Pemula" },
  { value: "menengah", label: "Menengah" },
  { value: "lanjutan", label: "Lanjutan" },
];

interface ProjectForm {
  title: string;
  description: string;
  repoUrl: string;
  tags: string;
  level: Level;
}

export function Projects() {
  const { state, editProject, deleteProject, deleteProjectComment } = useStore();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectForm>({ title: "", description: "", repoUrl: "", tags: "", level: "pemula" });

  const commentsByProject = useMemo(() => {
    const map = new Map<number, typeof state.projectComments>();
    for (const comment of state.projectComments) {
      if (!map.has(comment.projectId)) {
        map.set(comment.projectId, []);
      }
      map.get(comment.projectId)!.push(comment);
    }
    return map;
  }, [state.projectComments]); // eslint-disable-line react-hooks/exhaustive-deps

  function userName(id: number) {
    return state.users.find((u) => u.id === id)?.name ?? "Pengguna";
  }

  function startEdit(projectId: number) {
    const p = state.projects.find((x) => x.id === projectId);
    if (!p) return;
    setForm({ title: p.title, description: p.description, repoUrl: p.repoUrl, tags: p.tags.join(", "), level: p.level });
    setEditingId(projectId);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId == null || !form.title.trim()) return;
    editProject(editingId, {
      title: form.title,
      description: form.description,
      repoUrl: form.repoUrl,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      level: form.level,
    });
    toast("Proyek diperbarui");
    setEditingId(null);
    setForm({ title: "", description: "", repoUrl: "", tags: "", level: "pemula" });
  }

  function handleDelete(projectId: number, title: string) {
    if (!window.confirm(`Hapus proyek "${title}" beserta komentarnya?`)) return;
    deleteProject(projectId);
    toast("Proyek dihapus");
  }

  function handleDeleteComment(commentId: number) {
    if (!window.confirm("Hapus komentar ini?")) return;
    deleteProjectComment(commentId);
    toast("Komentar dihapus");
  }

  return (
    <div className="space-y-3">
      {state.projects.length === 0 ? (
        <EmptyState icon="🚀" title="Tidak ada proyek" />
      ) : (
        state.projects.map((project) => (
          <div key={project.id} className="card p-5">
            {editingId === project.id ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul" />
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi" />
                <input className="input" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} placeholder="URL repositori" />
                <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tag (pisahkan dengan koma)" />
                <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })}>
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">Simpan</button>
                  <button type="button" onClick={() => setEditingId(null)} className="btn-secondary">Batal</button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-semibold text-content">{project.title}</h3>
                  <LevelBadge level={project.level} />
                </div>
                <p className="mb-2 text-sm text-muted">{project.description}</p>
                <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                  <Avatar name={userName(project.userId)} size="sm" />
                  <span>{userName(project.userId)}</span>
                  <span>·</span>
                  <span>{project.likeCount} suka</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => startEdit(project.id)} className="btn-secondary">Edit</button>
                  <button onClick={() => handleDelete(project.id, project.title)} className="btn-danger">Hapus</button>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {(commentsByProject.get(project.id) || []).map((comment) => (
                    <div key={comment.id} className="flex items-center gap-3 rounded-lg bg-surface-hover/50 p-2.5">
                      <Avatar name={userName(comment.userId)} size="sm" />
                      <p className="min-w-0 flex-1 truncate text-sm text-content">{comment.body}</p>
                      <button onClick={() => handleDeleteComment(comment.id)} className="btn-ghost px-2 py-1 text-xs text-danger hover:bg-danger-soft">
                        Hapus
                      </button>
                    </div>
                  ))}
                  {!(commentsByProject.get(project.id) || []).length && (
                    <p className="text-xs text-muted">Tidak ada komentar.</p>
                  )}
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
