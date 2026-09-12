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
  // Lesson 8 — Apa itu NLP dan Kenapa Penting?
  {
    id: 16,
    lessonId: 8,
    courseId: 4,
    front: "Apa itu Natural Language Processing (NLP)?",
    back: "Cabang AI yang berfokus pada interaksi komputer dengan bahasa manusia — memahami dan menghasilkan teks/ucapan.",
  },
  {
    id: 17,
    lessonId: 8,
    courseId: 4,
    front: "Sebutkan dua pendekatan besar dalam NLP.",
    back: "Pendekatan statistik klasik (TF-IDF, bag-of-words) dan pendekatan deep learning modern (word embedding, Transformer).",
  },
  // Lesson 9 — Tokenisasi, Stopword, dan Representasi Teks
  {
    id: 18,
    lessonId: 9,
    courseId: 4,
    front: "Apa itu tokenisasi?",
    back: "Proses memecah kalimat/teks menjadi unit lebih kecil, biasanya kata (token).",
  },
  {
    id: 19,
    lessonId: 9,
    courseId: 4,
    front: "Apa itu TF-IDF?",
    back: "Term Frequency-Inverse Document Frequency — pembobotan kata yang menaikkan bobot kata khas suatu dokumen dan menurunkan bobot kata umum di banyak dokumen.",
  },
  // Lesson 10 — Klasifikasi Teks & Analisis Sentimen
  {
    id: 20,
    lessonId: 10,
    courseId: 4,
    front: "Kenapa akurasi saja bisa menyesatkan untuk data sentimen yang tidak seimbang?",
    back: "Model yang selalu menjawab kelas mayoritas bisa terlihat 'akurat' tapi tidak berguna; precision/recall/F1 lebih informatif per kelas.",
  },
  {
    id: 21,
    lessonId: 10,
    courseId: 4,
    front: "Apa kelemahan TF-IDF dibanding word embedding?",
    back: "TF-IDF tidak memahami kemiripan makna antar kata (sinonim); word embedding memetakan kata bermakna serupa ke vektor yang berdekatan.",
  },
  // Lesson 11 — Bagaimana Komputer 'Melihat' Gambar?
  {
    id: 22,
    lessonId: 11,
    courseId: 5,
    front: "Bagaimana gambar grayscale direpresentasikan di komputer?",
    back: "Sebagai matriks 2D berisi nilai intensitas piksel dari 0 (hitam) sampai 255 (putih).",
  },
  {
    id: 23,
    lessonId: 11,
    courseId: 5,
    front: "Sebutkan tiga tantangan utama computer vision.",
    back: "Variasi cahaya, variasi sudut/skala, dan oklusi (objek terhalang sebagian).",
  },
  // Lesson 12 — Convolutional Neural Network (CNN) — Intuisi
  {
    id: 24,
    lessonId: 12,
    courseId: 5,
    front: "Apa fungsi filter/kernel pada operasi convolution?",
    back: "Mendeteksi pola lokal (tepi, tekstur) dengan bergeser ke seluruh gambar dan menghasilkan feature map.",
  },
  {
    id: 25,
    lessonId: 12,
    courseId: 5,
    front: "Apa tujuan max pooling dalam CNN?",
    back: "Mengecilkan ukuran feature map (downsampling), mengurangi parameter, dan membuat model tahan pergeseran kecil posisi objek.",
  },
  // Lesson 13 — Transfer Learning untuk Klasifikasi Gambar
  {
    id: 26,
    lessonId: 13,
    courseId: 5,
    front: "Apa itu transfer learning?",
    back: "Memanfaatkan model CNN yang sudah dilatih pada dataset besar (misalnya ImageNet) sebagai titik awal untuk tugas baru dengan dataset yang lebih kecil.",
  },
  {
    id: 27,
    lessonId: 13,
    courseId: 5,
    front: "Apa beda feature extraction dan fine-tuning penuh?",
    back: "Feature extraction membekukan seluruh layer pretrained; fine-tuning penuh melatih ulang beberapa layer terakhir dengan learning rate kecil.",
  },
  // Lesson 14 — Dari Notebook ke Produksi: Kenapa MLOps?
  {
    id: 28,
    lessonId: 14,
    courseId: 6,
    front: "Apa itu MLOps?",
    back: "Praktik teknik untuk membuat siklus hidup model ML (data, training, deployment, monitoring) reproducible dan andal di produksi.",
  },
  {
    id: 29,
    lessonId: 14,
    courseId: 6,
    front: "Sebutkan satu perbedaan utama sistem ML vs software biasa.",
    back: "Sistem ML perlu mem-versi-kan data dan model (bukan cuma kode), dan performanya bisa menurun akibat data drift walau kode tak berubah.",
  },
  // Lesson 15 — Membungkus Model Sebagai API
  {
    id: 30,
    lessonId: 15,
    courseId: 6,
    front: "Apa fungsi joblib dalam deployment model?",
    back: "Menyimpan (serialize) objek model Python terlatih ke file, agar tidak perlu dilatih ulang setiap kali aplikasi berjalan.",
  },
  {
    id: 31,
    lessonId: 15,
    courseId: 6,
    front: "Kenapa API prediksi sebaiknya bersifat stateless?",
    back: "Agar mudah di-scale — banyak instance bisa dijalankan paralel tanpa perlu berbagi status antar-request.",
  },
  // Lesson 16 — Monitoring & Model Drift
  {
    id: 32,
    lessonId: 16,
    courseId: 6,
    front: "Apa beda data drift dan concept drift?",
    back: "Data drift = distribusi input berubah; concept drift = hubungan antara input dan output itu sendiri yang berubah.",
  },
  {
    id: 33,
    lessonId: 16,
    courseId: 6,
    front: "Sebutkan dua strategi retraining model di produksi.",
    back: "Terjadwal (rutin per periode waktu) dan dipicu (otomatis saat metrik monitoring melewati ambang tertentu).",
  },
];

export function flashcardById(id: number): Flashcard | undefined {
  return flashcards.find((c) => c.id === id);
}
