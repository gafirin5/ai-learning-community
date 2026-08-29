import type { SrsState } from "@/lib/srs/sm2";

/** Kartu hafalan (fitur Lab) — tertaut ke pelajaran untuk latihan kontekstual. */
export interface Flashcard {
  id: number;
  lessonId: number | null;
  courseId: number | null;
  front: string;
  back: string;
  hint?: string;
}

/** Progres SRS satu kartu untuk satu user (SM-2 dihitung di client). */
export interface FlashcardProgress extends SrsState {
  cardId: number;
  /** ISO yyyy-mm-dd. */
  dueAt: string;
  lastReviewedAt: string | null;
}
