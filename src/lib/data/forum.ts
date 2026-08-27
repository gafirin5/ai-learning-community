import type { ForumCategory, ForumComment, ForumThread } from "../types";

export const forumCategories: ForumCategory[] = [
  { id: "ml", label: "Machine Learning", emoji: "🧠" },
  { id: "dl", label: "Deep Learning", emoji: "🧬" },
  { id: "data", label: "Data", emoji: "📊" },
  { id: "career", label: "Karier", emoji: "💼" },
  { id: "umum", label: "Umum", emoji: "💬" },
];

export const reportReasons: string[] = [
  "Spam",
  "Konten menyinggung/SARA",
  "Duplikat",
  "Informasi salah",
  "Lainnya",
];

export const forumThreads: ForumThread[] = [
  {
    id: 1,
    userId: 3,
    title: "Bingung bedanya supervised dan unsupervised learning",
    body: "Saya baru mulai belajar dan masih bingung kapan harus pakai supervised vs unsupervised. Ada yang bisa kasih analogi sederhana?",
    tags: ["machine-learning", "dasar"],
    voteCount: 12,
    viewCount: 120,
    acceptedCommentId: 1,
    createdAt: "2026-08-10",
    commentIds: [1, 2, 3],
    categoryId: "ml",
    pinned: false,
    hidden: false,
    images: [],
  },
  {
    id: 2,
    userId: 4,
    title: "Rekomendasi dataset publik untuk latihan klasifikasi",
    body: "Selain Iris dan Titanic, dataset apa yang menarik dan relatif mudah untuk pemula? Terutama yang berbahasa Indonesia kalau ada.",
    tags: ["dataset", "klasifikasi"],
    voteCount: 9,
    viewCount: 84,
    acceptedCommentId: null,
    createdAt: "2026-08-12",
    commentIds: [4, 5],
    categoryId: "data",
    pinned: false,
    hidden: false,
    images: [],
  },
  {
    id: 3,
    userId: 5,
    title: "Learning rate terlalu besar membuat model tidak konvergen",
    body: "Saya eksperimen dengan learning rate 0.9 dan loss-nya naik turun liar. Apakah ini normal atau tanda learning rate terlalu besar?",
    tags: ["deep-learning", "optimizer"],
    voteCount: 6,
    viewCount: 63,
    acceptedCommentId: 6,
    createdAt: "2026-08-15",
    commentIds: [6],
    categoryId: "dl",
    pinned: false,
    hidden: false,
    images: [],
  },
  {
    id: 4,
    userId: 2,
    title: "Tips menulis penjelasan model agar mudah dipahami non-teknis",
    body: "Sebagai mentor, saya sering diminta menjelaskan hasil model ke tim bisnis. Ada tips storytelling atau visualisasi yang efektif?",
    tags: ["komunikasi", "mentor"],
    voteCount: 15,
    viewCount: 210,
    acceptedCommentId: 7,
    createdAt: "2026-08-16",
    commentIds: [7, 8],
    categoryId: "career",
    pinned: true,
    hidden: false,
    images: [],
  },
];

export const forumComments: ForumComment[] = [
  { id: 1, threadId: 1, userId: 2, parentId: null, body: "Analogi sederhana: supervised = belajar dengan kunci jawaban, unsupervised = menemukan kelompok sendiri tanpa label.", voteCount: 8, createdAt: "2026-08-10", hidden: false, images: [] },
  { id: 2, threadId: 1, userId: 4, parentId: 1, body: "Bagus! Jadi clustering pelanggan itu unsupervised ya?", voteCount: 3, createdAt: "2026-08-10", hidden: false, images: [] },
  { id: 3, threadId: 1, userId: 2, parentId: 2, body: "Betul, clustering termasuk unsupervised learning.", voteCount: 2, createdAt: "2026-08-11", hidden: false, images: [] },
  { id: 4, threadId: 2, userId: 1, parentId: null, body: "Coba cek UCI ML Repository, banyak dataset klasik. Untuk bahasa Indonesia, bisa lihat dataset dari IndonesianNLP di GitHub.", voteCount: 5, createdAt: "2026-08-12", hidden: false, images: [] },
  { id: 5, threadId: 2, userId: 3, parentId: 4, body: "Terima kasih, langsung saya cek!", voteCount: 1, createdAt: "2026-08-12", hidden: false, images: [] },
  { id: 6, threadId: 3, userId: 2, parentId: null, body: "Ya, learning rate 0.9 terlalu besar. Coba turunkan bertahap ke 0.1, 0.01, 0.001 dan amati loss-nya.", voteCount: 4, createdAt: "2026-08-15", hidden: false, images: [] },
  { id: 7, threadId: 4, userId: 1, parentId: null, body: "Mulai dari metrik bisnis yang relevan, baru teknisnya. Gunakan grafik sederhana dan hindari jargon.", voteCount: 6, createdAt: "2026-08-16", hidden: false, images: [] },
  { id: 8, threadId: 4, userId: 3, parentId: 7, body: "Setuju, saya biasa pakai SHAP summary plot untuk menunjukan fitur yang paling berpengaruh.", voteCount: 2, createdAt: "2026-08-16", hidden: false, images: [] },
];

export const categoryById = new Map(forumCategories.map((c) => [c.id, c]));
