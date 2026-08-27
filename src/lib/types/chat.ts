export interface ChatMessage {
  id: number;
  lessonId: number;
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
  kind?: "normal" | "rejection" | "quota";
}
