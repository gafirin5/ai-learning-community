"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { LevelBadge, Tag } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { VoteControl } from "@/components/vote-control";
import { MarkdownLite } from "@/components/markdown-lite";
import { useToast } from "@/components/toast";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { state, currentUser, addProjectComment, voteProject } = useStore();
  const { toast } = useToast();
  const [commentBody, setCommentBody] = useState("");

  const project = state.projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Proyek tidak ditemukan</h1>
        <Link href="/projects" className="btn-primary mt-4">
          Kembali ke showcase
        </Link>
      </div>
    );
  }

  const owner = state.users.find((u) => u.id === project.userId);
  const comments = state.projectComments.filter((c) => c.projectId === projectId);
  const voteVal = state.votes.projects[project.id] ?? 0;

  function handleComment() {
    if (!commentBody.trim()) return;
    addProjectComment(projectId, commentBody);
    setCommentBody("");
    toast("Feedback berhasil dikirim");
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs
        items={[{ label: "Proyek", href: "/projects" }, { label: project.title }]}
      />

      <div className="card mb-8 p-6 sm:p-8">
        {project.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="mb-6 max-h-96 w-full rounded-xl object-cover"
          />
        )}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <LevelBadge level={project.level} />
          {project.demoUrl && <span className="badge bg-brand-soft text-brand">🚀 Demo</span>}
          {project.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="mb-3 text-3xl font-bold text-content">{project.title}</h1>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted">
              <Link href={`/profile/${owner?.id}`} className="flex items-center gap-1.5 font-medium text-content hover:text-brand">
                <Avatar name={owner?.name ?? "Pengguna"} size="sm" />
                <span>{owner?.name ?? "Pengguna"}</span>
              </Link>
              <span>·</span>
              <span>{project.createdAt}</span>
            </div>
          </div>
          <VoteControl
            count={project.likeCount ?? 0}
            value={voteVal}
            onVote={(d) => voteProject(project.id, d)}
          />
        </div>
        <MarkdownLite source={project.description} />
        {(project.repoUrl || project.demoUrl) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                🚀 Lihat Demo
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                🔗 Lihat Repositori
              </a>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-4 text-lg font-bold text-content">Feedback ({comments.length})</h2>

      <div className="card mb-6 p-5">
        {currentUser ? (
          <>
            <textarea
              className="input min-h-24 resize-y"
              placeholder="Berikan feedback konstruktif untuk proyek ini…"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <button onClick={handleComment} disabled={!commentBody.trim()} className="btn-primary">
                Kirim Feedback
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="font-medium text-brand hover:underline">
              Masuk
            </Link>{" "}
            untuk memberi feedback.
          </p>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-muted">Belum ada feedback. Jadilah yang pertama!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const commentAuthor = state.users.find((u) => u.id === comment.userId);
            return (
              <div key={comment.id} className="card flex gap-3 p-5">
                <Link href={`/profile/${commentAuthor?.id}`}>
                  <Avatar name={commentAuthor?.name ?? "Pengguna"} size="md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                    <Link href={`/profile/${commentAuthor?.id}`} className="font-medium text-content hover:text-brand">
                      {commentAuthor?.name ?? "Pengguna"}
                    </Link>
                    <span>· {comment.createdAt}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-content">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
