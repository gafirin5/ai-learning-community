import type { Course, Lesson, Quiz } from "../types";

export const lessons: Lesson[] = [
  {
    id: 1,
    courseId: 1,
    title: "Apa itu Machine Learning?",
    order: 1,
    summary:
      "Memahami definisi ML, perbedaannya dengan pemrograman tradisional, dan contoh nyata di sekitar kita.",
    content: `## Definisi Sederhana

*Machine learning* (ML) adalah cabang dari kecerdasan buatan yang membuat komputer **belajar dari data** alih-alih diprogram secara eksplisit dengan aturan yang kaku.

> **Inti idenya:** beri komputer banyak contoh, dan ia menemukan polanya sendiri.

## Pemrograman Tradisional vs ML

Dalam pemrograman tradisional, kita menulis **aturan** dan **data**, lalu komputer menghasilkan **jawaban**:

\`\`\`
Data + Aturan  →  Jawaban
\`\`\`

Dalam machine learning, kita memberi **data** dan **jawaban yang benar** (label), lalu komputer mempelajari **aturan**-nya:

\`\`\`
Data + Jawaban  →  Aturan (model)
\`\`\`

## Contoh di Sekitar Kita

- **Filter spam** di email belajar dari email yang Anda tandai sebagai spam.
- **Rekomendasi video** belajar dari video yang Anda tonton sampai selesai.
- **Asisten suara** belajar mengenali ucapan dari jutaan rekaman.

## Tiga Jenis Utama

1. **Supervised learning** — belajar dari data berlabel (contoh: foto yang sudah diberi label "kucing" atau "anjing").
2. **Unsupervised learning** — menemukan pola tanpa label (contoh: mengelompokkan pelanggan yang mirip).
3. **Reinforcement learning** — belajar lewat hadiah dan hukuman (contoh: AI yang main game).

## Rangkuman

Machine learning membalik cara kita memandang pemrograman: alih-alih menulis aturan, kita memberi data dan membiarkan model menemukan polanya.`,
  },
  {
    id: 2,
    courseId: 1,
    title: "Data, Fitur, dan Label",
    order: 2,
    summary:
      "Konsep dasar dataset: baris sebagai sampel, kolom sebagai fitur, dan target sebagai label.",
    content: `## Dataset: Tabel Sederhana

Sebuah *dataset* biasanya direpresentasikan sebagai tabel. Setiap **baris** adalah satu contoh (sampel), dan setiap **kolom** adalah satu ciri.

## Fitur (*Feature*)

Fitur adalah informasi yang kita gunakan untuk membuat prediksi. Misalnya, untuk memprediksi harga rumah:

| Luas (m²) | Kamar Tidur | Lokasi | Harga (juta) |
|-----------|-------------|--------|--------------|
| 45        | 1           | Suburb | 500          |
| 90        | 2           | Kota   | 1.200        |
| 120       | 3           | Kota   | 2.000        |

Kolom **Luas**, **Kamar Tidur**, dan **Lokasi** adalah fitur.

## Label (*Target*)

Kolom yang ingin kita prediksi disebut **label** atau *target*. Pada tabel di atas, **Harga** adalah labelnya.

## Kenapa Data Penting?

Kualitas model sangat bergantung pada kualitas data. Istilah yang sering muncul:

- **Garbage in, garbage out** — data buruk menghasilkan model buruk.
- **Training set** — data untuk melatih model.
- **Test set** — data terpisah untuk menguji seberapa baik model menggeneralisasi.

## Latihan Kecil

Coba sebutkan fitur dan label untuk kasus *memprediksi apakah sebuah email adalah spam*:

- Fitur: kata-kata di isi email, alamat pengirim, jumlah tautan.
- Label: spam (1) atau bukan spam (0).`,
  },
  {
    id: 3,
    courseId: 1,
    title: "Model Pertama: Regresi Linear",
    order: 3,
    summary:
      "Memahami regresi linear sebagai model paling sederhana untuk memprediksi nilai kontinu.",
    content: `## Apa itu Regresi Linear?

Regresi linear adalah model yang mencari **garis lurus terbaik** yang mewakili hubungan antara fitur dan target.

## Persamaan Garis

\`\`\`
y = w·x + b
\`\`\`

- \`y\` — prediksi (target)
- \`x\` — fitur (input)
- \`w\` — bobot (kemiringan garis)
- \`b\` — bias (titik potong)

## Konsep "Belajar"

Melatih model berarti **menyesuaikan \`w\` dan \`b\`** hingga garisnya sedekat mungkin dengan semua titik data. Kedekatan ini diukur dengan *loss function*, misalnya *mean squared error* (MSE).

## Contoh Sederhana dalam Python

\`\`\`python
import numpy as np

# Data: luas rumah (m²) vs harga (juta)
x = np.array([45, 90, 120, 150])
y = np.array([500, 1200, 2000, 2600])

# Cari garis terbaik dengan least squares
A = np.vstack([x, np.ones(len(x))]).T
w, b = np.linalg.lstsq(A, y, rcond=None)[0]
print(f"w = {w:.2f}, b = {b:.2f}")
\`\`\`

## Kapan Regresi Linear Cocok?

- Target berupa **angka kontinu** (harga, suhu, penjualan).
- Hubungan antar variabel cenderung **linear**.
- Anda butuh model yang **mudah diinterpretasi**.

Regresi linear sering jadi titik awal sebelum mencoba model yang lebih kompleks.`,
  },
  {
    id: 4,
    courseId: 2,
    title: "Setup Python & Library Dasar",
    order: 1,
    summary: "Menyiapkan lingkungan Python dan mengenal NumPy serta Pandas untuk manipulasi data.",
    content: `## Kenapa Python?

Python adalah bahasa paling populer untuk ML karena ekosistemnya yang kaya: NumPy, Pandas, scikit-learn, PyTorch, dan TensorFlow.

## Instalasi

\`\`\`bash
# Menggunakan pip
pip install numpy pandas scikit-learn
\`\`\`

Sebaiknya gunakan *virtual environment* agar dependensi tiap proyek terisolasi.

## NumPy: Komputasi Numerik

\`\`\`python
import numpy as np

a = np.array([1, 2, 3, 4])
print(a * 2)          # [2 4 6 8]
print(a.mean())       # 2.5
print(a.reshape(2, 2))
\`\`\`

## Pandas: Manipulasi Data Tabular

\`\`\`python
import pandas as pd

df = pd.DataFrame({
    "nama": ["Budi", "Sari", "Rina"],
    "skor": [85, 92, 78],
})
print(df[df["skor"] > 80])
print(df["skor"].describe())
\`\`\`

## Kebiasaan Baik

- Selalu periksa \`df.head()\` dan \`df.info()\` sebelum menganalisis.
- Tangani nilai kosong (\`NaN\`) secara sadar, jangan diabaikan.`,
  },
  {
    id: 5,
    courseId: 2,
    title: "Klasifikasi dengan scikit-learn",
    order: 2,
    summary: "Membangun model klasifikasi pertama menggunakan decision tree dan metrik akurasi.",
    content: `## Masalah Klasifikasi

Klasifikasi adalah memprediksi **kategori** (label diskrit), misalnya "spam" vs "bukan spam".

## Pipeline Dasar scikit-learn

1. Siapkan fitur (\`X\`) dan label (\`y\`).
2. Bagi data menjadi training dan test.
3. Latih model.
4. Evaluasi dengan metrik.

\`\`\`python
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

X = [[0, 0], [1, 1], [2, 2], [3, 3]]
y = [0, 0, 1, 1]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42
)

model = DecisionTreeClassifier()
model.fit(X_train, y_train)
pred = model.predict(X_test)

print("Akurasi:", accuracy_score(y_test, pred))
\`\`\`

## Metrik Umum

- **Accuracy** — proporsi prediksi benar.
- **Precision** — dari yang diprediksi positif, berapa yang benar positif.
- **Recall** — dari yang benar-benar positif, berapa yang terdeteksi.

## Pentingnya Split Data

Jangan pernah menguji model dengan data yang sama dengan data latih — itu memberi hasil yang terlalu optimistis dan tidak mencerminkan kemampuan generalisasi.`,
  },
  {
    id: 6,
    courseId: 3,
    title: "Jaringan Saraf & Backpropagation",
    order: 1,
    summary: "Memahami neuron buatan, forward pass, dan bagaimana backpropagation memperbarui bobot.",
    content: `## Dari Regresi ke Jaringan Saraf

Jaringan saraf adalah rangkaian banyak unit kecil (neuron) yang disusun berlapis. Tiap neuron menghitung kombinasi linear lalu melewati fungsi aktivasi non-linear.

## Neuron Tunggal

\`\`\`
output = aktivasi(w₁x₁ + w₂x₂ + ... + b)
\`\`\`

Fungsi aktivasi yang umum: **ReLU**, **sigmoid**, dan **tanh**. Non-linearitas inilah yang membuat jaringan bisa mempelajari pola kompleks.

## Forward Pass

*Forward pass* adalah proses menghitung output dari input melalui seluruh lapisan jaringan, dari input → hidden → output.

## Backpropagation

*Backpropagation* adalah algoritma untuk menghitung **gradien** (seberapa besar tiap bobot memengaruhi error), lalu memperbarui bobot ke arah yang mengurangi error:

\`\`\`
w ← w − learning_rate × gradien
\`\`\`

## Konsep Penting

- **Learning rate** — seberapa besar langkah pembaruan; terlalu besar bisa melompati solusi, terlalu kecil lambat konvergen.
- **Epoch** — satu kali lintasan penuh atas seluruh data latih.
- **Batch** — sebagian data yang diproses sekaligus.`,
  },
  {
    id: 7,
    courseId: 3,
    title: "Mengapa Model Overfitting?",
    order: 2,
    summary: "Memahami overfitting, underfitting, dan cara mencegahnya dengan regularisasi.",
    content: `## Overfitting vs Underfitting

- **Underfitting** — model terlalu sederhana, gagal menangkap pola (error tinggi di training dan test).
- **Overfitting** — model terlalu kompleks, menghafal data latih termasuk noise-nya, gagal di data baru.

## Gejala Overfitting

Model memiliki akurasi **hampir sempurna di data latih**, tapi **jeblok di data uji**.

## Cara Mencegah Overfitting

1. **Tambah data** — lebih banyak contoh mengurangi penghafalan.
2. **Regularisasi** — menambah penalti pada bobot besar (L1/L2).
3. **Dropout** — mematikan sebagian neuron secara acak saat latih.
4. **Early stopping** — berhenti latih saat error validasi mulai naik.
5. **Cross-validation** — membagi data menjadi beberapa lipatan untuk estimasi yang lebih stabil.

## Aturan Praktis

Selalu pisahkan data uji sejak awal, dan jangan menyentuhnya sampai model final. Gunakan data validasi untuk menyetel hyperparameter.`,
  },
];

export const quizzes: Quiz[] = [
  {
    id: 1,
    lessonId: 1,
    title: "Kuis — Apa itu Machine Learning?",
    questions: [
      {
        id: 1,
        text: "Dalam machine learning, komputer menemukan pola dari…",
        options: ["Aturan yang ditulis manual", "Data", "Hardware khusus", "Kompilasi kode"],
        correctIndex: 1,
        explanation: "ML belajar pola dari data, bukan dari aturan yang ditulis manual.",
      },
      {
        id: 2,
        text: "Jenis ML yang belajar dari data berlabel disebut…",
        options: ["Unsupervised learning", "Reinforcement learning", "Supervised learning", "Deep learning"],
        correctIndex: 2,
        explanation: "Supervised learning menggunakan data berlabel untuk belajar.",
      },
      {
        id: 3,
        text: "Contoh penerapan ML di kehidupan sehari-hari adalah…",
        options: ["Filter spam email", "Kalkulator", "Text editor", "Jam analog"],
        correctIndex: 0,
        explanation: "Filter spam adalah contoh klasik supervised learning.",
      },
    ],
  },
  {
    id: 2,
    lessonId: 2,
    title: "Kuis — Data, Fitur, dan Label",
    questions: [
      {
        id: 1,
        text: "Kolom yang ingin kita prediksi dalam dataset disebut…",
        options: ["Fitur", "Label", "Baris", "Indeks"],
        correctIndex: 1,
        explanation: "Label/target adalah kolom yang diprediksi; fitur adalah input.",
      },
      {
        id: 2,
        text: "Pada prediksi harga rumah, 'luas rumah' adalah contoh…",
        options: ["Label", "Target", "Fitur", "Model"],
        correctIndex: 2,
        explanation: "Luas rumah adalah ciri (fitur) yang digunakan untuk memprediksi harga.",
      },
      {
        id: 3,
        text: "Data yang dipakai untuk menguji generalisasi model disebut…",
        options: ["Training set", "Test set", "Validation set", "Batch"],
        correctIndex: 1,
        explanation: "Test set digunakan untuk mengukur performa pada data yang belum pernah dilihat.",
      },
    ],
  },
  {
    id: 3,
    lessonId: 3,
    title: "Kuis — Regresi Linear",
    questions: [
      {
        id: 1,
        text: "Regresi linear cocok untuk memprediksi target berupa…",
        options: ["Kategori", "Angka kontinu", "Label biner saja", "Teks"],
        correctIndex: 1,
        explanation: "Regresi memprediksi nilai kontinu seperti harga atau suhu.",
      },
      {
        id: 2,
        text: "Pada persamaan y = w·x + b, 'w' disebut…",
        options: ["Bias", "Bobot", "Label", "Fitur"],
        correctIndex: 1,
        explanation: "w adalah bobot (kemiringan), b adalah bias.",
      },
      {
        id: 3,
        text: "Fungsi loss mengukur…",
        options: ["Kecepatan komputasi", "Kedekatan prediksi dengan nilai sebenarnya", "Ukuran dataset", "Jumlah fitur"],
        correctIndex: 1,
        explanation: "Loss function mengukur seberapa jauh prediksi dari nilai aktual.",
      },
    ],
  },
  {
    id: 4,
    lessonId: 4,
    title: "Kuis — Setup Python & Library",
    questions: [
      {
        id: 1,
        text: "Library Python untuk komputasi numerik adalah…",
        options: ["Pandas", "NumPy", "Flask", "React"],
        correctIndex: 1,
        explanation: "NumPy untuk array dan komputasi numerik.",
      },
      {
        id: 2,
        text: "Library untuk manipulasi data tabular (DataFrame) adalah…",
        options: ["NumPy", "Pandas", "Matplotlib", "pytest"],
        correctIndex: 1,
        explanation: "Pandas menyediakan DataFrame untuk data tabular.",
      },
      {
        id: 3,
        text: "Perintah untuk melihat ringkasan info DataFrame adalah…",
        options: ["df.head()", "df.info()", "df.tail()", "df.shape"],
        correctIndex: 1,
        explanation: "df.info() menampilkan ringkasan tipe data dan nilai kosong.",
      },
    ],
  },
  {
    id: 5,
    lessonId: 5,
    title: "Kuis — Klasifikasi",
    questions: [
      {
        id: 1,
        text: "Klasifikasi memprediksi…",
        options: ["Nilai kontinu", "Kategori/label diskrit", "Urutan waktu", "Gambar mentah"],
        correctIndex: 1,
        explanation: "Klasifikasi memprediksi kategori diskrit.",
      },
      {
        id: 2,
        text: "Proporsi prediksi yang benar disebut…",
        options: ["Precision", "Recall", "Accuracy", "F1"],
        correctIndex: 2,
        explanation: "Accuracy adalah proporsi prediksi benar secara keseluruhan.",
      },
      {
        id: 3,
        text: "Mengapa data harus dipisah training/test?",
        options: [
          "Agar dataset lebih kecil",
          "Untuk mengukur generalisasi di data baru",
          "Untuk mempercepat komputasi",
          "Agar label hilang",
        ],
        correctIndex: 1,
        explanation: "Split memastikan evaluasi dilakukan pada data yang belum pernah dilihat model.",
      },
    ],
  },
  {
    id: 6,
    lessonId: 6,
    title: "Kuis — Jaringan Saraf",
    questions: [
      {
        id: 1,
        text: "Algoritma untuk menghitung gradien dan memperbarui bobot adalah…",
        options: ["Backpropagation", "Bubble sort", "K-means", "A*"],
        correctIndex: 0,
        explanation: "Backpropagation menghitung gradien error terhadap bobot.",
      },
      {
        id: 2,
        text: "Fungsi aktivasi memperkenalkan…",
        options: ["Linearitas", "Non-linearitas", "Kecepatan", "Memori"],
        correctIndex: 1,
        explanation: "Non-linearitas memungkinkan jaringan mempelajari pola kompleks.",
      },
      {
        id: 3,
        text: "Satu kali lintasan penuh atas data latih disebut…",
        options: ["Batch", "Epoch", "Learning rate", "Gradient"],
        correctIndex: 1,
        explanation: "Epoch adalah satu lintasan penuh seluruh data latih.",
      },
    ],
  },
  {
    id: 7,
    lessonId: 7,
    title: "Kuis — Overfitting",
    questions: [
      {
        id: 1,
        text: "Model yang menghafal data latih dan gagal di data baru mengalami…",
        options: ["Underfitting", "Overfitting", "Convergence", "Regularization"],
        correctIndex: 1,
        explanation: "Overfitting = model terlalu kompleks dan menghafal noise.",
      },
      {
        id: 2,
        text: "Teknik mematikan sebagian neuron saat latih adalah…",
        options: ["Dropout", "Early stopping", "Bagging", "Normalization"],
        correctIndex: 0,
        explanation: "Dropout mematikan neuron secara acak untuk mengurangi overfitting.",
      },
      {
        id: 3,
        text: "Penalti pada bobot besar untuk mencegah overfitting disebut…",
        options: ["Regularisasi", "Overfitting", "Learning rate", "Boosting"],
        correctIndex: 0,
        explanation: "Regularisasi (L1/L2) memberi penalti pada bobot besar.",
      },
    ],
  },
];

export const courses: Course[] = [
  {
    id: 1,
    mentorId: 1,
    title: "Pengantar Machine Learning",
    slug: "pengantar-machine-learning",
    description:
      "Kenali konsep dasar machine learning dari nol: apa itu ML, data & fitur, hingga membangun model regresi linear pertama Anda.",
    level: "pemula",
    topics: ["machine-learning", "dasar", "regresi"],
    lessonIds: [1, 2, 3],
    createdAt: "2026-03-01",
  },
  {
    id: 2,
    mentorId: 1,
    title: "Python untuk Data Science",
    slug: "python-untuk-data-science",
    description:
      "Siapkan lingkungan Python dan kuasai NumPy, Pandas, serta scikit-learn untuk klasifikasi — fondasi praktis sebelum masuk deep learning.",
    level: "pemula",
    topics: ["python", "pandas", "scikit-learn"],
    lessonIds: [4, 5],
    createdAt: "2026-03-15",
  },
  {
    id: 3,
    mentorId: 2,
    title: "Deep Learning: Dasar & Intuisi",
    slug: "deep-learning-dasar",
    description:
      "Pahami jaringan saraf, backpropagation, dan mengapa model bisa overfitting — dengan intuisi, bukan sekadar rumus.",
    level: "menengah",
    topics: ["deep-learning", "neural-network", "overfitting"],
    lessonIds: [6, 7],
    createdAt: "2026-04-02",
  },
];

export const quizByLesson = new Map(quizzes.map((q) => [q.lessonId, q]));
export const lessonById = new Map(lessons.map((l) => [l.id, l]));
export const courseById = new Map(courses.map((c) => [c.id, c]));
