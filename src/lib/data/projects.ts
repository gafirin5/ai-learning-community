import type { Project, ProjectComment } from "../types";

export const projects: Project[] = [
  {
    id: 1,
    userId: 4,
    title: "Klasifikasi Sentimen Ulasan Aplikasi",
    description:
      "Model klasifikasi sentimen ulasan aplikasi berbahasa Indonesia menggunakan TF-IDF + Logistic Regression. Akurasi test set 87%.",
    repoUrl: "https://github.com/example/sentimen-ulasan",
    tags: ["nlp", "klasifikasi", "python"],
    level: "pemula",
    createdAt: "2026-07-20",
    commentIds: [1, 2],
    likeCount: 18,
  },
  {
    id: 2,
    userId: 3,
    title: "Prediksi Harga Rumah Jakarta",
    description:
      "Regresi untuk memperkirakan harga rumah di Jakarta berdasarkan luas, lokasi, dan fasilitas. Termasuk analisis fitur dan visualisasi.",
    repoUrl: "https://github.com/example/harga-rumah-jkt",
    tags: ["regresi", "pandas", "visualisasi"],
    level: "pemula",
    createdAt: "2026-07-20",
    commentIds: [3],
    likeCount: 12,
  },
  {
    id: 3,
    userId: 5,
    title: "Klasifikasi Gambar Daun dengan CNN",
    description:
      "Menggunakan convolutional neural network untuk mengklasifikasi 10 jenis daun tanaman obat dengan PyTorch. Akurasi 91%.",
    repoUrl: "https://github.com/example/cnn-daun",
    tags: ["deep-learning", "computer-vision", "pytorch"],
    level: "menengah",
    createdAt: "2026-08-05",
    commentIds: [4, 5],
    likeCount: 26,
  },
];

export const projectComments: ProjectComment[] = [
  { id: 1, projectId: 1, userId: 2, body: "Bagus! Coba tambahkan penanganan kata negasi untuk meningkatkan akurasi.", createdAt: "2026-07-21" },
  { id: 2, projectId: 1, userId: 5, body: "Notebook-nya rapi dan mudah diikuti. Terima kasih sudah berbagi!", createdAt: "2026-07-22" },
  { id: 3, projectId: 2, userId: 1, body: "Fitur lokasi bisa di-encode lebih baik, coba one-hot encoding per kecamatan.", createdAt: "2026-07-29" },
  { id: 4, projectId: 3, userId: 1, body: "Keren! Pertimbangkan data augmentation untuk memperkuat generalisasi.", createdAt: "2026-08-06" },
  { id: 5, projectId: 3, userId: 3, body: "Bolehkah saya lihat arsitektur CNN-nya? Sangat inspiratif.", createdAt: "2026-08-07" },
];
