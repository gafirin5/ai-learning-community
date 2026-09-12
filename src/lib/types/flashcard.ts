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

/** Satu kartu di dalam deck buatan pengguna (id dari DB, mulai 100000). */
export interface FlashcardDeckCard {
  id: number;
  front: string;
  back: string;
  hint?: string;
}

/**
 * Deck kartu hafalan buatan pengguna — bisa dibagikan publik (`isPublic`)
 * supaya pembelajar lain bisa mempelajarinya atau menduplikatnya sebagai
 * template ("pakai sebagai milikku").
 */
export interface FlashcardDeck {
  id: number;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  isPublic: boolean;
  cardCount: number;
  /** true bila deck ini milik user yang sedang login. */
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Deck + seluruh kartunya (untuk halaman detail/edit/belajar). */
export interface FlashcardDeckDetail extends FlashcardDeck {
  /** Deck asal bila ini hasil duplikasi ("dari template"), null bila orisinal. */
  sourceDeckId: number | null;
  cards: FlashcardDeckCard[];
}
