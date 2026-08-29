import type { LearningPath } from "../types";

// Seed jalur belajar (fitur Lab, frontend-only). Path mereferensikan kursus
// lewat id — kursus yang belum ada difilter dengan anggun di saat render,
// jadi seed tetap valid saat admin menambah/menghapus kursus di Supabase.
export const learningPaths: LearningPath[] = [
  {
    id: 1,
    slug: "dasar-data-science",
    title: "Dasar Data Science",
    description:
      "Mulai dari nol: pahami apa itu machine learning, siapkan Python, lalu bangun model klasifikasi pertamamu.",
    emoji: "🌱",
    level: "pemula",
    courseIds: [1, 2],
    tags: ["machine-learning", "python"],
    outcomes: [
      "Menjelaskan konsep data, fitur, dan label",
      "Menyiapkan lingkungan Python & library dasar",
      "Membangun model klasifikasi pertama dengan scikit-learn",
    ],
    estimatedHours: 6,
  },
  {
    id: 2,
    slug: "menuju-deep-learning",
    title: "Menuju Deep Learning",
    description:
      "Naik level: dari klasifikasi dengan scikit-learn sampai memahami jaringan saraf, backpropagation, dan overfitting.",
    emoji: "🤖",
    level: "menengah",
    courseIds: [2, 3],
    tags: ["deep-learning", "neural-network"],
    outcomes: [
      "Membangun klasifikasi dengan scikit-learn",
      "Memahami jaringan saraf & backpropagation",
      "Mendiagnosis dan mengatasi overfitting",
    ],
    estimatedHours: 5,
  },
  {
    id: 3,
    slug: "fast-track-ai",
    title: "Fast Track AI",
    description:
      "Jalur lengkap dari konsep machine learning dasar sampai deep learning — untuk kamu yang ingin belajar serius end-to-end.",
    emoji: "🚀",
    level: "lanjutan",
    courseIds: [1, 2, 3],
    tags: ["machine-learning", "python", "deep-learning"],
    outcomes: [
      "Menguasai fondasi machine learning end-to-end",
      "Membangun & mengevaluasi model klasifikasi",
      "Memahami arsitektur jaringan saraf modern",
    ],
    estimatedHours: 10,
  },
];

export function learningPathBySlug(slug: string): LearningPath | undefined {
  return learningPaths.find((p) => p.slug === slug);
}
