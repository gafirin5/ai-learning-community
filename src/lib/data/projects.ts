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
  {
    id: 4,
    userId: 5,
    title: "Chatbot FAQ Berbahasa Indonesia dengan TF-IDF",
    description:
      "Chatbot sederhana yang mencocokkan pertanyaan pengguna dengan basis FAQ menggunakan cosine similarity atas representasi TF-IDF — tanpa API LLM eksternal.",
    repoUrl: "https://github.com/example/chatbot-faq-tfidf",
    tags: ["nlp", "chatbot", "python"],
    level: "menengah",
    createdAt: "2026-08-18",
    commentIds: [6, 7],
    likeCount: 14,
  },
  {
    id: 5,
    userId: 3,
    title: "Deteksi Masker Wajah dengan Transfer Learning (MobileNetV2)",
    description:
      "Klasifikasi gambar wajah bermasker vs tidak bermasker menggunakan fine-tuning MobileNetV2, dilatih dengan dataset kecil (~800 gambar) dan augmentasi data.",
    repoUrl: "https://github.com/example/deteksi-masker-mobilenet",
    tags: ["computer-vision", "transfer-learning", "keras"],
    level: "menengah",
    createdAt: "2026-08-21",
    commentIds: [8],
    likeCount: 21,
  },
  {
    id: 6,
    userId: 4,
    title: "Deploy Prediksi Harga Rumah sebagai REST API dengan FastAPI",
    description:
      "Membungkus model regresi harga rumah sebagai endpoint /predict dengan FastAPI + joblib, lengkap dengan validasi request memakai Pydantic dan contoh deployment container.",
    repoUrl: "https://github.com/example/harga-rumah-fastapi",
    tags: ["mlops", "fastapi", "deployment"],
    level: "lanjutan",
    createdAt: "2026-08-26",
    commentIds: [9],
    likeCount: 16,
  },
];

export const projectComments: ProjectComment[] = [
  { id: 1, projectId: 1, userId: 2, body: "Bagus! Coba tambahkan penanganan kata negasi untuk meningkatkan akurasi.", createdAt: "2026-07-21" },
  { id: 2, projectId: 1, userId: 5, body: "Notebook-nya rapi dan mudah diikuti. Terima kasih sudah berbagi!", createdAt: "2026-07-22" },
  { id: 3, projectId: 2, userId: 1, body: "Fitur lokasi bisa di-encode lebih baik, coba one-hot encoding per kecamatan.", createdAt: "2026-07-29" },
  { id: 4, projectId: 3, userId: 1, body: "Keren! Pertimbangkan data augmentation untuk memperkuat generalisasi.", createdAt: "2026-08-06" },
  { id: 5, projectId: 3, userId: 3, body: "Bolehkah saya lihat arsitektur CNN-nya? Sangat inspiratif.", createdAt: "2026-08-07" },
  { id: 6, projectId: 4, userId: 2, body: "Ide bagus untuk FAQ internal! Coba tambahkan threshold similarity minimum supaya bot bisa bilang 'tidak tahu' alih-alih memaksa jawab dengan skor rendah.", createdAt: "2026-08-19" },
  { id: 7, projectId: 4, userId: 1, body: "Rapi. Pertimbangkan juga stemming Bahasa Indonesia (mis. Sastrawi) supaya variasi imbuhan tidak mengurangi akurasi pencocokan.", createdAt: "2026-08-19" },
  { id: 8, projectId: 5, userId: 1, body: "Akurasinya berapa di validation set? Kalau sempat, coba bandingkan freeze penuh vs fine-tune beberapa layer terakhir.", createdAt: "2026-08-22" },
  { id: 9, projectId: 6, userId: 2, body: "Contoh validasi Pydantic-nya sangat membantu pemula. Mungkin tambahkan endpoint /health untuk cek kesiapan servis di deployment nyata.", createdAt: "2026-08-27" },
];
