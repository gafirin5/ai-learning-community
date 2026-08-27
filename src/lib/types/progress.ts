export interface ChatMessage {
  id: number;
  lessonId: number;
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
  kind?: "normal" | "rejection" | "quota";
}

export type ProgressStatus = "belum" | "selesai";

export interface ProgressEntry {
  lessonId: number;
  status: ProgressStatus;
  quizScore: number | null;
}

export interface Interest {
  id: string;
  label: string;
  emoji: string;
  topics: string[];
}
