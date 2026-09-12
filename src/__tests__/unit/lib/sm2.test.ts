import { describe, it, expect } from 'vitest';
import {
  reviewSm2,
  ratingQuality,
  dueAtFrom,
  todayKey,
  SRS_INITIAL_STATE,
  MIN_EASE,
  type SrsState,
} from '@/lib/srs/sm2';

describe('ratingQuality', () => {
  it('maps Anki-style ratings to SM-2 quality scale', () => {
    expect(ratingQuality('again')).toBe(0);
    expect(ratingQuality('hard')).toBe(3);
    expect(ratingQuality('good')).toBe(4);
    expect(ratingQuality('easy')).toBe(5);
  });
});

describe('reviewSm2', () => {
  it('resets repetitions to 0 and interval to 1 day on "again" (q<3)', () => {
    const state: SrsState = { ease: 2.5, intervalDays: 6, repetitions: 2 };
    const result = reviewSm2(state, 'again');
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it('advances repetitions 0 -> 1 with 1 day interval on "good"', () => {
    const result = reviewSm2(SRS_INITIAL_STATE, 'good');
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
  });

  it('advances repetitions 1 -> 2 with 6 day interval on "good"', () => {
    const afterFirst = reviewSm2(SRS_INITIAL_STATE, 'good');
    const afterSecond = reviewSm2(afterFirst, 'good');
    expect(afterSecond.repetitions).toBe(2);
    expect(afterSecond.intervalDays).toBe(6);
  });

  it('advances repetitions 2 -> 3+ using interval * ease', () => {
    const afterFirst = reviewSm2(SRS_INITIAL_STATE, 'good');
    const afterSecond = reviewSm2(afterFirst, 'good');
    const afterThird = reviewSm2(afterSecond, 'good');
    expect(afterThird.repetitions).toBe(3);
    expect(afterThird.intervalDays).toBe(Math.round(afterSecond.intervalDays * afterThird.ease));
  });

  it('never lets ease drop below MIN_EASE, even with repeated "again"', () => {
    let state: SrsState = SRS_INITIAL_STATE;
    for (let i = 0; i < 20; i++) {
      state = reviewSm2(state, 'again');
    }
    expect(state.ease).toBeGreaterThanOrEqual(MIN_EASE);
    expect(state.ease).toBeCloseTo(MIN_EASE, 5);
  });

  it('increases ease on "easy" ratings', () => {
    const result = reviewSm2(SRS_INITIAL_STATE, 'easy');
    expect(result.ease).toBeGreaterThan(SRS_INITIAL_STATE.ease);
  });

  it('decreases ease on "hard" ratings but keeps repetitions progressing (q=3)', () => {
    const result = reviewSm2(SRS_INITIAL_STATE, 'hard');
    expect(result.ease).toBeLessThan(SRS_INITIAL_STATE.ease);
    expect(result.repetitions).toBe(1);
  });

  it('keeps interval at minimum 1 day even for tiny computed intervals', () => {
    const state: SrsState = { ease: MIN_EASE, intervalDays: 0, repetitions: 2 };
    const result = reviewSm2(state, 'good');
    expect(result.intervalDays).toBeGreaterThanOrEqual(1);
  });
});

describe('dueAtFrom', () => {
  it('adds the interval in days to the given date', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(dueAtFrom(now, 1)).toBe('2026-01-02');
    expect(dueAtFrom(now, 6)).toBe('2026-01-07');
  });

  it('treats interval below 1 as 1 day minimum', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(dueAtFrom(now, 0)).toBe('2026-01-02');
    expect(dueAtFrom(now, -5)).toBe('2026-01-02');
  });
});

describe('todayKey', () => {
  it('returns ISO yyyy-mm-dd for a given date', () => {
    const date = new Date('2026-03-15T12:34:56.000Z');
    expect(todayKey(date)).toBe('2026-03-15');
  });

  it('defaults to current date when no argument is given', () => {
    const result = todayKey();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
