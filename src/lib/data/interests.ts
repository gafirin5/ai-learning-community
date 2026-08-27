import type { Interest } from "../types";

export const interests: Interest[] = [
  { id: "ml-dasar", label: "Machine Learning Dasar", emoji: "📈", topics: ["machine-learning", "dasar", "regresi"] },
  { id: "python", label: "Python & Data", emoji: "🐍", topics: ["python", "pandas"] },
  { id: "deep-learning", label: "Deep Learning", emoji: "🧠", topics: ["deep-learning", "neural-network"] },
  { id: "nlp", label: "NLP & Bahasa", emoji: "💬", topics: ["nlp"] },
  { id: "computer-vision", label: "Computer Vision", emoji: "👁️", topics: ["computer-vision"] },
  { id: "mlops", label: "MLOps & Deployment", emoji: "🚀", topics: ["mlops"] },
];

export const LEVEL_LABEL: Record<string, string> = {
  pemula: "Pemula",
  menengah: "Menengah",
  lanjutan: "Lanjutan",
};

export const LEVEL_BADGE: Record<string, string> = {
  pemula: "bg-success-soft text-success",
  menengah: "bg-warning-soft text-warning",
  lanjutan: "bg-danger-soft text-danger",
};
