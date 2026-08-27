import type { StoreState } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";

export const DAILY_QUOTA = 20;

export function withTodayQuota(state: StoreState): StoreState {
  const key = todayKey();
  if (state.chatQuota.date === key) return state;
  return { ...state, chatQuota: { date: key, used: 0 } };
}

export function quotaUsed(state: StoreState): number {
  return withTodayQuota(state).chatQuota.used;
}
