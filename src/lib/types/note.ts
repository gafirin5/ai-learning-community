/** Catatan pribadi milik satu user untuk satu pelajaran (privat, tidak dibagikan). */
export interface LessonNote {
  lessonId: number;
  content: string;
  /** ISO datetime — kapan terakhir disimpan. */
  updatedAt: string;
}
