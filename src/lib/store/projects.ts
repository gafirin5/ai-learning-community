import { useCallback } from "react";
import type { Project, ProjectComment } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import {
  addProjectRemote,
  addProjectCommentRemote,
  voteProjectRemote,
} from "@/lib/api-write";
import type { StateSetter, StoreState } from "./context";

export function useProjectsActions(state: StoreState, setState: StateSetter) {
  const addProject = useCallback(
    async (data: Omit<Project, "id" | "userId" | "createdAt" | "commentIds" | "likeCount">) => {
      const coverImageUrl = data.coverImageUrl ?? "";
      const demoUrl = data.demoUrl ?? "";
      if (isSupabaseConfigured()) {
        const project = await addProjectRemote(data);
        // addProjectRemote (api-write, file lane lain) belum kenal kolom
        // cover_image_url/demo_url — patch via update by id (RLS projects:
        // update owner-or-admin; baris baru saja dibuat user ini).
        if (coverImageUrl || demoUrl) {
          const supabase = getSupabase();
          const { error } = await supabase
            .from("projects")
            .update({ cover_image_url: coverImageUrl, demo_url: demoUrl })
            .eq("id", project.id);
          if (error) throw error;
        }
        setState((s) => ({
          ...s,
          projects: [{ ...project, coverImageUrl, demoUrl }, ...s.projects],
        }));
        return;
      }
      const project: Project = {
        ...data,
        id: Date.now(),
        userId: state.currentUserId ?? 1,
        createdAt: todayKey(),
        commentIds: [],
        likeCount: 0,
      };
      setState((s) => ({ ...s, projects: [project, ...s.projects] }));
    },
    [state.currentUserId, setState]
  );

  const addProjectComment = useCallback(
    async (projectId: number, body: string) => {
      if (!body.trim() || !state.currentUserId) return;
      if (isSupabaseConfigured()) {
        const comment = await addProjectCommentRemote(projectId, body);
        setState((s) => ({
          ...s,
          projectComments: [...s.projectComments, comment],
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, commentIds: [...p.commentIds, comment.id] } : p
          ),
        }));
        return;
      }
      const comment: ProjectComment = {
        id: Date.now(),
        projectId,
        userId: state.currentUserId,
        body: body.trim(),
        createdAt: todayKey(),
      };
      setState((s) => ({
        ...s,
        projectComments: [...s.projectComments, comment],
        projects: s.projects.map((p) =>
          p.id === projectId ? { ...p, commentIds: [...p.commentIds, comment.id] } : p
        ),
      }));
    },
    [state.currentUserId, setState]
  );

  const voteProject = useCallback(
    async (projectId: number, delta: 1 | -1) => {
      if (isSupabaseConfigured()) {
        const { likeCount, myVote } = await voteProjectRemote(projectId, delta);
        setState((s) => ({
          ...s,
          votes: { ...s.votes, projects: { ...s.votes.projects, [projectId]: myVote } },
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, likeCount } : p)),
        }));
        return;
      }
      setState((s) => {
        const current = s.votes.projects[projectId] ?? 0;
        const next = current === delta ? 0 : delta;
        const netDelta = next - current;
        return {
          ...s,
          votes: { ...s.votes, projects: { ...s.votes.projects, [projectId]: next } },
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, likeCount: (p.likeCount ?? 0) + netDelta } : p
          ),
        };
      });
    },
    [setState]
  );

  return { addProject, addProjectComment, voteProject };
}
