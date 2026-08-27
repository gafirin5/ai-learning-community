export type ProgressStatus = "belum" | "selesai";

export interface ProgressEntry {
  lessonId: number;
  status: ProgressStatus;
  quizScore: number | null;
}
