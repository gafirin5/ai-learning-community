import type { Level } from "./common";

/**
 * Jalur belajar terkurasi (fitur Lab). Urutan `courseIds` membentuk mastery
 * gate antar kursus — lihat src/lib/learning-path.ts untuk aturan buka kunci.
 */
export interface LearningPath {
  id: number;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  level: Level;
  /** Urutan kursus — pelajari indeks 0 lebih dulu. */
  courseIds: number[];
  tags: string[];
  /** Kompetensi yang diraih setelah menyelesaikan jalur. */
  outcomes: string[];
  /** Estimasi total jam belajar. */
  estimatedHours: number;
}
