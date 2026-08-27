import { useCallback } from "react";
import type { Project, ProjectComment } from "@/lib/types";
import { todayKey } from "@/lib/tutor";
import type { StateSetter, StoreState } from "./types-helpers";

export function useProjectsActions(state: StoreState, setState: StateSetter) {
  const addProject = useCallback(
    (data: Omit<Project, "id" | "userId" | "createdAt" | "commentIds" | "likeCount">) => {
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
    (projectId: number, body: string) => {
      if (!body.trim() || !state.currentUserId) return;
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
    (projectId: number, delta: 1 | -1) => {
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
