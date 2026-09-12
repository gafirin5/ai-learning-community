import { describe, it, expect } from 'vitest';
import { withTodayQuota, quotaUsed, DAILY_QUOTA } from '@/lib/ai/quota';
import { todayKey } from '@/lib/utils/date';
import type { StoreState } from '@/lib/types';

/** State minimal namun type-safe untuk menguji logika kuota (chatQuota saja
 * yang relevan; field lain diisi nilai kosong sesuai bentuk StoreState). */
function makeState(chatQuota: { date: string; used: number }): StoreState {
  return {
    currentUserId: null,
    users: [],
    courses: [],
    lessons: [],
    quizzes: [],
    seeded: false,
    progress: {},
    chat: {},
    chatQuota,
    threads: [],
    comments: [],
    savedThreadIds: [],
    reports: [],
    projects: [],
    projectComments: [],
    votes: { threads: {}, comments: {}, projects: {} },
    reactions: { threads: {}, comments: {} },
    myReactions: { threads: {}, comments: {} },
    interests: [],
    recentlyViewed: [],
    bookmarks: [],
    activity: { streak: 0, lastActiveDate: '' },
    notifications: [],
    certificates: [],
    points: 0,
    badges: [],
    mentoringSessions: [],
    mentorReviews: [],
    mentorAvailability: [],
  };
}

describe('withTodayQuota', () => {
  it('resets used to 0 and updates date when chatQuota.date differs from today', () => {
    const state = makeState({ date: '2000-01-01', used: 15 });
    const result = withTodayQuota(state);

    expect(result.chatQuota.date).toBe(todayKey());
    expect(result.chatQuota.used).toBe(0);
  });

  it('keeps state unchanged when chatQuota.date is already today', () => {
    const today = todayKey();
    const state = makeState({ date: today, used: 7 });
    const result = withTodayQuota(state);

    expect(result).toBe(state);
    expect(result.chatQuota.used).toBe(7);
  });
});

describe('quotaUsed', () => {
  it('returns used count for the current day', () => {
    const today = todayKey();
    const state = makeState({ date: today, used: 3 });
    expect(quotaUsed(state)).toBe(3);
  });

  it('returns 0 when stored date is stale (implicit reset)', () => {
    const state = makeState({ date: '2000-01-01', used: 42 });
    expect(quotaUsed(state)).toBe(0);
  });

  it('never exceeds DAILY_QUOTA in typical usage assumptions', () => {
    const today = todayKey();
    const state = makeState({ date: today, used: DAILY_QUOTA });
    expect(quotaUsed(state)).toBe(DAILY_QUOTA);
  });
});
