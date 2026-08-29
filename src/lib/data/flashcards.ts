import type { Flashcard } from "../types";

// Seed kartu hafalan (fitur Lab) dari 7 pelajaran Machine Learning existing.
// SM-2 dihitung di client (src/lib/srs/sm2.ts) lalu progres di-persist per user.
export const flashcards: Flashcard[] = [
  // Lesson 1 — Apa itu Machine Learning?
  {
    id: 1,
    lessonId: 1,
    courseId: 1,
    front: "Apa definisi Machine Learning menurut Arthur Samuel?",
    back: "Bidang studi yang memberi komputer kemampuan belajar tanpa diprogram secara eksplisit.",
  },
  {
    id: 2,
    lessonId: 1,
    courseId: 1,
    front: "Apa beda supervised dan unsupervised learning?",
    back: "Supervised belajar dari data berlabel (ada jawaban benar); unsupervised mencari pola dari data tanpa label.",
  },
  {
    id: 3,
    lessonId: 1,
    courseId: 1,
    front: "Sebutkan contoh masalah supervised learning.",
    back: "Prediksi harga rumah (regresi) dan deteksi spam email (klasifikasi).",
  },
  // Lesson 2 — Data, Fitur, dan Label
  {
    id: 4,
    lessonId: 2,
    courseId: 1,
    front: "Apa itu fitur (feature) dalam dataset?",
    back: "Kolom input yang dipakai model untuk membuat prediksi, mis. luas rumah dan jumlah kamar.",
  },
  {
    id: 5,
    lessonId: 2,
    courseId: 1,
    front: "Apa itu label (target)?",
    back: "Nilai output yang ingin diprediksi model, mis. harga rumah.",
  },
  {
    id: 6,
    lessonId: 2,
    courseId: 1,
    front: "Kenapa data perlu dibagi jadi train & test set?",
    back: "Untuk mengukur kemampuan model pada data yang belum pernah dilihat — mencegah evaluasi yang terlalu optimis.",
  },
  // Lesson 3 — Model Pertama: Regresi Linear
  {
    id: 7,
    lessonId: 3,
    courseId: 1,
    front: "Apa yang dimodelkan oleh regresi linear?",
    back: "Hubungan linear antara fitur input dan output kontinu: y = w·x + b.",
  },
  {
    id: 8,
    lessonId: 3,
    courseId: 1,
    front: "Apa fungsi loss yang umum dipakai untuk regresi?",
    back: "Mean Squared Error (MSE) — rata-rata kuadrat selisih prediksi dan nilai sebenarnya.",
  },
  // Lesson 4 — Setup Python & Library Dasar
  {
    id: 9,
    lessonId: 4,
    courseId: 2,
    front: "Untuk apa numpy dipakai di data science?",
    back: "Operasi array/matriks numerik yang cepat (vectorized) — fondasi library ML lainnya.",
  },
  {
    id: 10,
    lessonId: 4,
    courseId: 2,
    front: "Kenapa perlu virtual environment (venv) per proyek?",
    back: "Mengisolasi versi package tiap proyek agar dependensi tidak saling bentrok.",
  },
  // Lesson 5 — Klasifikasi dengan scikit-learn
  {
    id: 11,
    lessonId: 5,
    courseId: 2,
    front: "Apa beda tugas klasifikasi dan regresi?",
    back: "Klasifikasi memprediksi kategori (diskrit); regresi memprediksi angka kontinu.",
  },
  {
    id: 12,
    lessonId: 5,
    courseId: 2,
    front: "Apa itu akurasi model klasifikasi?",
    back: "Persentase prediksi yang benar dari seluruh prediksi — mudah dibaca tapi menyesatkan pada data tidak seimbang.",
  },
  // Lesson 6 — Jaringan Saraf & Backpropagation
  {
    id: 13,
    lessonId: 6,
    courseId: 3,
    front: "Apa peran fungsi aktivasi pada neuron buatan?",
    back: "Menambahkan non-linearitas agar jaringan bisa mempelajari pola yang tidak linear.",
  },
  {
    id: 14,
    lessonId: 6,
    courseId: 3,
    front: "Apa yang dilakukan backpropagation?",
    back: "Menghitung gradien loss terhadap tiap bobot (aturan rantai) dari output ke input untuk update bobot.",
  },
  // Lesson 7 — Mengapa Model Overfitting?
  {
    id: 15,
    lessonId: 7,
    courseId: 3,
    front: "Apa ciri-ciri model yang overfitting?",
    back: "Loss training sangat rendah tapi loss validation/data baru jauh lebih tinggi — model menghafal, bukan menggeneralisasi.",
  },
];

export function flashcardById(id: number): Flashcard | undefined {
  return flashcards.find((c) => c.id === id);
}
