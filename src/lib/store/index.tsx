"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { StoreState } from "@/lib/types";
import { initialState } from "./initial";
import { StoreContext, type StoreContextValue } from "./context";
import { loadState, mergeSeeds, STORAGE_KEY } from "./persistence";
import { useAuthActions } from "./auth";
import { useProgressActions } from "./progress";
import { useChatActions } from "./chat";
import { useForumActions } from "./forum";
import { useProjectsActions } from "./projects";
import { useAdminActions } from "./admin";
import { useNotificationActions } from "./notifications";
import { useGamificationActions } from "./gamification";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    const persisted = loadState();
    setState(mergeSeeds(persisted));
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const auth = useAuthActions(state, setState);
  const progress = useProgressActions(state, setState);
  const chat = useChatActions(state, setState);
  const forum = useForumActions(state, setState);
  const projects = useProjectsActions(state, setState);
  const admin = useAdminActions(state, setState);
  const notifications = useNotificationActions(setState);
  const gamification = useGamificationActions(state, setState);

  const value: StoreContextValue = {
    state,
    currentUser,
    ...auth,
    ...progress,
    ...chat,
    ...forum,
    ...projects,
    ...admin,
    ...notifications,
    ...gamification,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export { useStore } from "./context";
export type { StoreContextValue, AuthPayloadType } from "./context";
export type { ProgressStatus } from "@/lib/types";
