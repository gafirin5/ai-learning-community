import { useCallback } from "react";
import type { ForumCategoryId, ForumComment, ForumThread, ReactionKey, Report } from "@/lib/types";
import { todayKey } from "@/lib/tutor";
import type { StateSetter, StoreState } from "./types-helpers";

export function useForumActions(state: StoreState, setState: StateSetter) {
  const addThread = useCallback(
    (data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => {
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
    (threadId: number, body: string, parentId: number | null, images?: string[]) => {
      if (!body.trim() || !state.currentUserId) return;
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
    (threadId: number, delta: 1 | -1) => {
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
    (commentId: number, delta: 1 | -1) => {
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
    (threadId: number) => {
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
    (threadId: number) => {
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
    (threadId: number, commentId: number | null) => {
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
    (threadId: number, data: { title: string; body: string; tags: string[]; categoryId: ForumCategoryId; images?: string[] }) => {
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
    (threadId: number) => {
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
    (commentId: number, body: string, images?: string[]) => {
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
    (commentId: number) => {
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
    (threadId: number, pinned: boolean) => {
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId ? { ...t, pinned } : t)),
      }));
    },
    [setState]
  );

  const reportTarget = useCallback(
    (targetType: Report["targetType"], targetId: number, reason: string) => {
      if (!reason.trim() || !state.currentUserId) return;
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
    (threadId: number, reason: string) => reportTarget("thread", threadId, reason),
    [reportTarget]
  );

  const reportComment = useCallback(
    (commentId: number, reason: string) => reportTarget("comment", commentId, reason),
    [reportTarget]
  );

  const resolveReport = useCallback(
    (reportId: number) => {
      setState((s) => ({
        ...s,
        reports: s.reports.map((r) => (r.id === reportId ? { ...r, status: "resolved" as const } : r)),
      }));
    },
    [setState]
  );

  const hideThread = useCallback(
    (threadId: number, hidden: boolean) => {
      setState((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId ? { ...t, hidden } : t)),
      }));
    },
    [setState]
  );

  const hideComment = useCallback(
    (commentId: number, hidden: boolean) => {
      setState((s) => ({
        ...s,
        comments: s.comments.map((c) => (c.id === commentId ? { ...c, hidden } : c)),
      }));
    },
    [setState]
  );

  const reactTo = useCallback(
    (target: "thread" | "comment", id: number, key: ReactionKey) => {
      setState((s) => {
        const reactions = target === "thread" ? s.reactions.threads : s.reactions.comments;
        const myReactions = target === "thread" ? s.myReactions.threads : s.myReactions.comments;
        const currentKey = myReactions[id] ?? null;
        const nextKey = currentKey === key ? null : key;
        const counts = { ...(reactions[id] ?? {}) };
        if (currentKey) {
          counts[currentKey] = Math.max(0, (counts[currentKey] ?? 0) - 1);
          if (counts[currentKey] === 0) delete counts[currentKey];
        }
        if (nextKey) {
          counts[nextKey] = (counts[nextKey] ?? 0) + 1;
        }
        const nextReactions = { ...reactions };
        if (Object.keys(counts).length === 0) delete nextReactions[id];
        else nextReactions[id] = counts;
        const nextMy = { ...myReactions, [id]: nextKey };
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
    [setState]
  );

  const deleteReport = useCallback(
    (reportId: number) => {
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
