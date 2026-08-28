import { useCallback } from "react";
import type { ForumCategoryId, ForumComment, ForumThread, ReactionKey, Report } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  addThreadRemote,
  addCommentRemote,
  voteThreadRemote,
  voteCommentRemote,
  toggleSaveThreadRemote,
  incrementViewRemote,
  updateThreadRemote,
  deleteThreadCascadeRemote,
  updateCommentRemote,
  deleteCommentCascadeRemote,
  setThreadPinnedRemote,
  setAcceptedCommentRemote,
  setThreadHiddenRemote,
  setCommentHiddenRemote,
  toggleReactionRemote,
  createReportRemote,
  resolveReportRemote,
  deleteReportRemote,
} from "@/lib/api-write";
import type { StateSetter, StoreState } from "./context";

export function useForumActions(state: StoreState, setState: StateSetter) {
  const addThread = useCallback(
    async (data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => {
      if (isSupabaseConfigured()) {
        const thread = await addThreadRemote(data);
        setState((s) => ({ ...s, threads: [thread, ...s.threads] }));
        return thread.id;
      }
      // Fallback localStorage.
      const id = Date.now();
      const thread: ForumThread = {
        id,
        userId: state.currentUserId ?? 1,
        title: data.title.trim(),
        body: data.body.trim(),
        tags: data.tags,
        voteCount: 0,
        viewCount: 0,
        acceptedCommentId: null,
        createdAt: todayKey(),
        commentIds: [],
        categoryId: data.categoryId,
        pinned: false,
        hidden: false,
        images: data.images ?? [],
      };
      setState((s) => ({ ...s, threads: [thread, ...s.threads] }));
      return id;
    },
    [state.currentUserId, setState]
  );

  const addComment = useCallback(
    async (threadId: number, body: string, parentId: number | null, images?: string[]) => {
      if (!body.trim() || !state.currentUserId) return;
      if (isSupabaseConfigured()) {
        const comment = await addCommentRemote(threadId, body, parentId, images);
        setState((s) => ({
          ...s,
          comments: [...s.comments, comment],
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, commentIds: [...t.commentIds, comment.id] } : t
          ),
        }));
        return;
      }
      const comment: ForumComment = {
        id: Date.now(),
        threadId,
        userId: state.currentUserId,
        parentId,
        body: body.trim(),
        voteCount: 0,
        createdAt: todayKey(),
        hidden: false,
        images: images ?? [],
      };
      setState((s) => ({
        ...s,
        comments: [...s.comments, comment],
        threads: s.threads.map((t) =>
          t.id === threadId ? { ...t, commentIds: [...t.commentIds, comment.id] } : t
        ),
      }));
    },
    [state.currentUserId, setState]
  );

  const voteThread = useCallback(
    async (threadId: number, delta: 1 | -1) => {
      if (isSupabaseConfigured()) {
        const { voteCount, myVote } = await voteThreadRemote(threadId, delta);
        setState((s) => ({
          ...s,
          votes: { ...s.votes, threads: { ...s.votes.threads, [threadId]: myVote } },
          threads: s.threads.map((t) => (t.id === threadId ? { ...t, voteCount } : t)),
        }));
        return;
      }
      setState((s) => {
        const current = s.votes.threads[threadId] ?? 0;
        const next = current === delta ? 0 : delta;
        const netDelta = next - current;
        return {
          ...s,
          votes: { ...s.votes, threads: { ...s.votes.threads, [threadId]: next } },
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, voteCount: t.voteCount + netDelta } : t
          ),
        };
      });
    },
    [setState]
  );

  const voteComment = useCallback(
    async (commentId: number, delta: 1 | -1) => {
      if (isSupabaseConfigured()) {
        const { voteCount, myVote } = await voteCommentRemote(commentId, delta);
        setState((s) => ({
          ...s,
          votes: { ...s.votes, comments: { ...s.votes.comments, [commentId]: myVote } },
          comments: s.comments.map((c) => (c.id === commentId ? { ...c, voteCount } : c)),
        }));
        return;
      }
      setState((s) => {
        const current = s.votes.comments[commentId] ?? 0;
        const next = current === delta ? 0 : delta;
        const netDelta = next - current;
        return {
          ...s,
          votes: { ...s.votes, comments: { ...s.votes.comments, [commentId]: next } },
          comments: s.comments.map((c) =>
            c.id === commentId ? { ...c, voteCount: c.voteCount + netDelta } : c
          ),
        };
      });
    },
    [setState]
  );

  const viewThread = useCallback(
    async (threadId: number) => {
      if (isSupabaseConfigured()) {
        try {
          const viewCount = await incrementViewRemote(threadId);
          setState((s) => ({
            ...s,
            threads: s.threads.map((t) => (t.id === threadId ? { ...t, viewCount } : t)),
          }));
        } catch {
          /* offline → abaikan */
        }
        return;
      }
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) =>
          t.id === threadId ? { ...t, viewCount: (t.viewCount ?? 0) + 1 } : t
        ),
      }));
    },
    [setState]
  );

  const toggleSaveThread = useCallback(
    async (threadId: number) => {
      if (isSupabaseConfigured()) {
        const saved = await toggleSaveThreadRemote(threadId);
        setState((s) => ({
          ...s,
          savedThreadIds: saved
            ? [...s.savedThreadIds, threadId]
            : s.savedThreadIds.filter((id) => id !== threadId),
        }));
        return;
      }
      setState((s) => ({
        ...s,
        savedThreadIds: s.savedThreadIds.includes(threadId)
          ? s.savedThreadIds.filter((id) => id !== threadId)
          : [...s.savedThreadIds, threadId],
      }));
    },
    [setState]
  );

  const markAccepted = useCallback(
    async (threadId: number, commentId: number | null) => {
      if (isSupabaseConfigured()) await setAcceptedCommentRemote(threadId, commentId);
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) =>
          t.id === threadId ? { ...t, acceptedCommentId: commentId } : t
        ),
      }));
    },
    [setState]
  );

  const editThread = useCallback(
    async (threadId: number, data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => {
      if (isSupabaseConfigured()) {
        const updated = await updateThreadRemote(threadId, data);
        setState((s) => ({
          ...s,
          threads: s.threads.map((t) => (t.id === threadId ? { ...updated, commentIds: t.commentIds } : t)),
        }));
        return;
      }
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                title: data.title.trim(),
                body: data.body.trim(),
                tags: data.tags,
                categoryId: data.categoryId,
                images: data.images ?? t.images,
              }
            : t
        ),
      }));
    },
    [setState]
  );

  const deleteThread = useCallback(
    async (threadId: number) => {
      if (isSupabaseConfigured()) await deleteThreadCascadeRemote(threadId);
      setState((s) => {
        const commentIds = new Set(s.comments.filter((c) => c.threadId === threadId).map((c) => c.id));
        const votesComments = { ...s.votes.comments };
        commentIds.forEach((id) => delete votesComments[id]);
        const votesThreads = { ...s.votes.threads };
        delete votesThreads[threadId];
        const reactionsThreads = { ...s.reactions.threads };
        delete reactionsThreads[threadId];
        const reactionsComments = { ...s.reactions.comments };
        commentIds.forEach((id) => delete reactionsComments[id]);
        const myReactionsThreads = { ...s.myReactions.threads };
        delete myReactionsThreads[threadId];
        const myReactionsComments = { ...s.myReactions.comments };
        commentIds.forEach((id) => delete myReactionsComments[id]);
        return {
          ...s,
          threads: s.threads.filter((t) => t.id !== threadId),
          comments: s.comments.filter((c) => c.threadId !== threadId),
          savedThreadIds: s.savedThreadIds.filter((id) => id !== threadId),
          reports: s.reports.filter(
            (r) =>
              !(r.targetType === "thread" && r.targetId === threadId) &&
              !(r.targetType === "comment" && commentIds.has(r.targetId))
          ),
          votes: { ...s.votes, threads: votesThreads, comments: votesComments },
          reactions: { threads: reactionsThreads, comments: reactionsComments },
          myReactions: { threads: myReactionsThreads, comments: myReactionsComments },
        };
      });
    },
    [setState]
  );

  const editComment = useCallback(
    async (commentId: number, body: string, images?: string[]) => {
      if (isSupabaseConfigured()) {
        const updated = await updateCommentRemote(commentId, body, images);
        setState((s) => ({
          ...s,
          comments: s.comments.map((c) => (c.id === commentId ? updated : c)),
        }));
        return;
      }
      setState((s) => ({
        ...s,
        comments: s.comments.map((c) =>
          c.id === commentId ? { ...c, body: body.trim(), images: images ?? c.images } : c
        ),
      }));
    },
    [setState]
  );

  const deleteComment = useCallback(
    async (commentId: number) => {
      if (isSupabaseConfigured()) await deleteCommentCascadeRemote(commentId);
      setState((s) => {
        const toDelete = new Set<number>([commentId]);
        let changed = true;
        while (changed) {
          changed = false;
          s.comments.forEach((c) => {
            if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
              toDelete.add(c.id);
              changed = true;
            }
          });
        }
        const votesComments = { ...s.votes.comments };
        toDelete.forEach((id) => delete votesComments[id]);
        const reactionsComments = { ...s.reactions.comments };
        toDelete.forEach((id) => delete reactionsComments[id]);
        const myReactionsComments = { ...s.myReactions.comments };
        toDelete.forEach((id) => delete myReactionsComments[id]);
        return {
          ...s,
          comments: s.comments.filter((c) => !toDelete.has(c.id)),
          threads: s.threads.map((t) => {
            const next = { ...t, commentIds: t.commentIds.filter((id) => !toDelete.has(id)) };
            if (t.acceptedCommentId && toDelete.has(t.acceptedCommentId)) {
              next.acceptedCommentId = null;
            }
            return next;
          }),
          reports: s.reports.filter((r) => !(r.targetType === "comment" && toDelete.has(r.targetId))),
          votes: { ...s.votes, comments: votesComments },
          reactions: { ...s.reactions, comments: reactionsComments },
          myReactions: { ...s.myReactions, comments: myReactionsComments },
        };
      });
    },
    [setState]
  );

  const pinThread = useCallback(
    async (threadId: number, pinned: boolean) => {
      if (isSupabaseConfigured()) await setThreadPinnedRemote(threadId, pinned);
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId ? { ...t, pinned } : t)),
      }));
    },
    [setState]
  );

  const reportTarget = useCallback(
    async (targetType: Report["targetType"], targetId: number, reason: string) => {
      if (!reason.trim() || !state.currentUserId) return;
      if (isSupabaseConfigured()) {
        const report = await createReportRemote(targetType, targetId, reason);
        setState((s) => ({ ...s, reports: [...s.reports, report] }));
        return;
      }
      setState((s) => {
        const alreadyReported = s.reports.some(
          (r) =>
            r.targetType === targetType &&
            r.targetId === targetId &&
            r.reporterId === s.currentUserId &&
            r.status === "open"
        );
        if (alreadyReported) return s;
        const report: Report = {
          id: Date.now(),
          targetType,
          targetId,
          reporterId: s.currentUserId!,
          reason: reason.trim(),
          createdAt: todayKey(),
          status: "open",
        };
        return { ...s, reports: [...s.reports, report] };
      });
    },
    [state.currentUserId, setState]
  );

  const reportThread = useCallback(
    async (threadId: number, reason: string) => reportTarget("thread", threadId, reason),
    [reportTarget]
  );

  const reportComment = useCallback(
    async (commentId: number, reason: string) => reportTarget("comment", commentId, reason),
    [reportTarget]
  );

  const resolveReport = useCallback(
    async (reportId: number) => {
      if (isSupabaseConfigured()) await resolveReportRemote(reportId);
      setState((s) => ({
        ...s,
        reports: s.reports.map((r) => (r.id === reportId ? { ...r, status: "resolved" as const } : r)),
      }));
    },
    [setState]
  );

  const hideThread = useCallback(
    async (threadId: number, hidden: boolean) => {
      if (isSupabaseConfigured()) await setThreadHiddenRemote(threadId, hidden);
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId ? { ...t, hidden } : t)),
      }));
    },
    [setState]
  );

  const hideComment = useCallback(
    async (commentId: number, hidden: boolean) => {
      if (isSupabaseConfigured()) await setCommentHiddenRemote(commentId, hidden);
      setState((s) => ({
        ...s,
        comments: s.comments.map((c) => (c.id === commentId ? { ...c, hidden } : c)),
      }));
    },
    [setState]
  );

  const reactTo = useCallback(
    async (target: "thread" | "comment", id: number, key: ReactionKey) => {
      // Toggle single-reaction: klik key sama → hapus.
      const currentKey = target === "thread" ? state.myReactions.threads[id] : state.myReactions.comments[id];
      const nextKey = currentKey === key ? null : key;
      if (isSupabaseConfigured()) await toggleReactionRemote(target, id, nextKey);
      setState((s) => {
        const reactions = target === "thread" ? s.reactions.threads : s.reactions.comments;
        const myReactions = target === "thread" ? s.myReactions.threads : s.myReactions.comments;
        const prevKey = myReactions[id] ?? null;
        const finalKey = prevKey === key ? null : key;
        const counts = { ...(reactions[id] ?? {}) };
        if (prevKey) {
          counts[prevKey] = Math.max(0, (counts[prevKey] ?? 0) - 1);
          if (counts[prevKey] === 0) delete counts[prevKey];
        }
        if (finalKey) {
          counts[finalKey] = (counts[finalKey] ?? 0) + 1;
        }
        const nextReactions = { ...reactions };
        if (Object.keys(counts).length === 0) delete nextReactions[id];
        else nextReactions[id] = counts;
        const nextMy = { ...myReactions, [id]: finalKey };
        return target === "thread"
          ? {
              ...s,
              reactions: { ...s.reactions, threads: nextReactions },
              myReactions: { ...s.myReactions, threads: nextMy },
            }
          : {
              ...s,
              reactions: { ...s.reactions, comments: nextReactions },
              myReactions: { ...s.myReactions, comments: nextMy },
            };
      });
    },
    [state.myReactions, setState]
  );

  const deleteReport = useCallback(
    async (reportId: number) => {
      if (isSupabaseConfigured()) await deleteReportRemote(reportId);
      setState((s) => ({
        ...s,
        reports: s.reports.filter((r) => r.id !== reportId),
      }));
    },
    [setState]
  );

  return {
    addThread,
    addComment,
    voteThread,
    voteComment,
    viewThread,
    toggleSaveThread,
    markAccepted,
    editThread,
    deleteThread,
    editComment,
    deleteComment,
    pinThread,
    reportThread,
    reportComment,
    resolveReport,
    hideThread,
    hideComment,
    reactTo,
    deleteReport,
  };
}
