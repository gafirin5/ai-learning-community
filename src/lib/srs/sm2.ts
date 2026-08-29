// Algoritma SuperMemo-2 (SM-2) untuk spaced repetition — port pure TypeScript
// tanpa dependency. Referensi: Stack Overflow #49047159 ("Spaced repetition
// algorithm from SuperMemo (SM-2)") & open-spaced-repetition/sm-2-ts.
//
// Aturan inti SM-2:
// - Kualitas jawaban q ∈ 0..5 (di sini dipetakan dari 4 tombol ala Anki).
// - EF' = EF + (0.1 − (5−q)·(0.08 + (5−q)·0.02)), dibatasi min 1.3.
// - q ≥ 3: interval 1 hari (repetisi 1) → 6 hari (repetisi 2) → EF × interval.
// - q < 3: reset ke repetisi 0, interval 1 hari (belajar ulang).

export type SrsRating = "again" | "hard" | "good" | "easy";

export interface SrsState {
  /** Easiness factor (awal 2.5, minimum 1.3). */
  ease: number;
  /** Interval berikutnya dalam hari. */
  intervalDays: number;
  /** Berapa kali berturut-turut jawaban berkualitas (q ≥ 3). */
  repetitions: number;
}

export const SRS_INITIAL_STATE: SrsState = { ease: 2.5, intervalDays: 0, repetitions: 0 };
export const MIN_EASE = 1.3;

/** Pemetaan tombol rating ala Anki → skala kualitas 0-5 SM-2. */
const RATING_QUALITY: Record<SrsRating, number> = { again: 0, hard: 3, good: 4, easy: 5 };

export function ratingQuality(rating: SrsRating): number {
  return RATING_QUALITY[rating];
}

/** Satu langkah review SM-2 — pure, mudah diuji. */
export function reviewSm2(state: SrsState, rating: SrsRating): SrsState {
  const q = RATING_QUALITY[rating];
  const ease = Math.max(
    MIN_EASE,
    state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  if (q < 3) {
    return { ease, intervalDays: 1, repetitions: 0 };
  }

  const repetitions = state.repetitions + 1;
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(state.intervalDays * ease);
  return { ease, intervalDays: Math.max(intervalDays, 1), repetitions };
}

/** Tanggal jatuh tempo berikutnya (ISO yyyy-mm-dd) dari interval hari. */
export function dueAtFrom(now: Date, intervalDays: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + Math.max(intervalDays, 1));
  return d.toISOString().slice(0, 10);
}

/** Key hari ini (ISO yyyy-mm-dd) untuk membandingkan kartu jatuh tempo. */
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
