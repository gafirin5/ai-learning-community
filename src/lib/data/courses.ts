// Seed: courses + lessons + quizzes (542L). Future: pecah jadi lessons.ts/quizzes.ts jika lane butuh ownership terpisah.
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
  {
    id: 8,
    courseId: 4,
    title: "Apa itu NLP dan Kenapa Penting?",
    order: 1,
    summary:
      "Mengenal Natural Language Processing (NLP): tantangan bahasa manusia bagi komputer dan penerapannya sehari-hari.",
    content: `## NLP: Membuat Komputer Memahami Bahasa Manusia

**Natural Language Processing** (NLP) adalah cabang AI yang berfokus pada interaksi antara komputer dan bahasa manusia — baik teks maupun ucapan. Tujuannya: membuat komputer bisa membaca, memahami, dan menghasilkan bahasa seperti manusia.

## Kenapa Bahasa itu Sulit bagi Komputer?

Bahasa manusia penuh ambiguitas dan konteks yang bagi manusia terasa alami, tapi sulit bagi mesin:

- **Ambiguitas kata** — "bisa" berarti mampu atau racun ular, tergantung konteks.
- **Struktur fleksibel** — Bahasa Indonesia punya banyak imbuhan (me-, di-, -kan, -nya) yang mengubah bentuk kata dasar.
- **Sarkasme & nada** — "Wah, bagus sekali" bisa berarti pujian atau sindiran.
- **Kosakata tak terbatas** — kata baru, slang, dan singkatan terus bermunculan.

## Penerapan NLP di Sekitar Kita

- **Penerjemah otomatis** (Google Translate) — menerjemahkan antar bahasa.
- **Chatbot & asisten virtual** — memahami pertanyaan dan memberi jawaban relevan.
- **Filter spam email** — mengklasifikasikan email berdasarkan isinya.
- **Analisis sentimen** — mengetahui apakah ulasan produk positif atau negatif.
- **Ringkasan otomatis** — memadatkan artikel panjang menjadi beberapa kalimat.

## Dua Pendekatan Besar

1. **Berbasis statistik klasik** — menghitung frekuensi kata, TF-IDF, bag-of-words. Cepat, mudah dijelaskan, cocok untuk kasus sederhana.
2. **Berbasis deep learning modern** — word embedding dan arsitektur Transformer (seperti BERT, GPT). Lebih akurat untuk kasus kompleks, tapi butuh data dan komputasi besar.

Kursus ini mulai dari pendekatan klasik agar intuisinya kuat, sebelum menyinggung pendekatan modern secara singkat di pelajaran terakhir.

## Rangkuman

NLP membalik masalah bahasa menjadi masalah data: mengubah teks menjadi representasi yang bisa diproses model, tanpa kehilangan makna pentingnya.`,
  },
  {
    id: 9,
    courseId: 4,
    title: "Tokenisasi, Stopword, dan Representasi Teks",
    order: 2,
    summary:
      "Tahapan dasar preprocessing teks: tokenisasi, stopword removal, stemming, dan mengubah teks menjadi angka dengan Bag-of-Words dan TF-IDF.",
    content: `## Dari Kalimat ke Token

Langkah pertama mengolah teks adalah **tokenisasi** — memecah kalimat menjadi unit lebih kecil (biasanya kata):

\`\`\`
"Saya suka belajar machine learning"
→ ["saya", "suka", "belajar", "machine", "learning"]
\`\`\`

## Normalisasi Teks

Sebelum dianalisis, teks biasanya dibersihkan lebih dulu:

- **Lowercase** — "Belajar" dan "belajar" dianggap kata yang sama.
- **Hapus tanda baca & angka** yang tidak relevan.
- **Stopword removal** — membuang kata umum yang minim makna seperti "yang", "di", "dan", "adalah".
- **Stemming/lemmatization** — mengubah kata ke bentuk dasarnya, misalnya "belajar", "mempelajari", "pembelajaran" menjadi "ajar".

## Mengubah Teks Jadi Angka

Model machine learning butuh angka, bukan teks mentah. Cara paling sederhana adalah **Bag-of-Words (BoW)**: menghitung kemunculan tiap kata tanpa memperhatikan urutannya.

| Dokumen | belajar | ml | seru | sulit |
|---|---|---|---|---|
| "belajar ml seru" | 1 | 1 | 1 | 0 |
| "belajar ml sulit" | 1 | 1 | 0 | 1 |

## TF-IDF: Lebih dari Sekadar Hitung Kata

**TF-IDF** (Term Frequency–Inverse Document Frequency) memberi bobot lebih tinggi pada kata yang sering muncul di satu dokumen tapi jarang muncul di dokumen lain — sehingga kata umum seperti "yang" otomatis mendapat bobot rendah.

\`\`\`python
from sklearn.feature_extraction.text import TfidfVectorizer

corpus = [
    "belajar machine learning itu seru",
    "belajar deep learning itu sulit tapi seru",
]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(corpus)
print(vectorizer.get_feature_names_out())
print(X.toarray())
\`\`\`

## Kenapa Representasi Ini Penting?

Kualitas representasi teks menentukan seberapa baik model berikutnya (klasifikasi, clustering, pencarian) bisa "memahami" isi dokumen. Preprocessing yang ceroboh — misalnya lupa membuang stopword — bisa membuat model bias pada kata yang tidak bermakna.`,
  },
  {
    id: 10,
    courseId: 4,
    title: "Klasifikasi Teks & Analisis Sentimen",
    order: 3,
    summary:
      "Membangun model klasifikasi sentimen sederhana dari teks berbahasa Indonesia menggunakan TF-IDF dan Logistic Regression.",
    content: `## Studi Kasus: Sentimen Ulasan Produk

Bayangkan Anda punya ribuan ulasan produk dan ingin tahu otomatis mana yang positif dan negatif. Ini adalah tugas **klasifikasi teks** — sama seperti klasifikasi pada data tabular, hanya inputnya berupa teks yang sudah diubah menjadi angka (TF-IDF).

## Pipeline Lengkap

\`\`\`
Teks mentah → Preprocessing → TF-IDF → Model klasifikasi → Label (positif/negatif)
\`\`\`

## Implementasi dengan scikit-learn

\`\`\`python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

ulasan = [
    "aplikasinya sangat membantu dan mudah dipakai",
    "pengiriman cepat, kualitas bagus",
    "aplikasi sering error, mengecewakan",
    "barang rusak saat diterima, tidak sesuai deskripsi",
]
label = [1, 1, 0, 0]  # 1 = positif, 0 = negatif

X_train, X_test, y_train, y_test = train_test_split(
    ulasan, label, test_size=0.5, random_state=42
)

vectorizer = TfidfVectorizer()
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

model = LogisticRegression()
model.fit(X_train_vec, y_train)
print(model.predict(X_test_vec))
\`\`\`

## Metrik yang Tepat untuk Data Tidak Seimbang

Pada sentimen, kelas sering tidak seimbang (misalnya 90% ulasan positif). Akurasi saja bisa menyesatkan — model yang selalu menjawab "positif" bisa terlihat "akurat" padahal tidak berguna. Gunakan **precision**, **recall**, dan **F1-score** per kelas untuk gambaran yang lebih jujur.

## Melampaui TF-IDF: Word Embedding & Transformer

TF-IDF tidak memahami makna atau sinonim — "bagus" dan "keren" dianggap kata yang sama sekali berbeda. Pendekatan modern seperti **word embedding** (Word2Vec, GloVe) dan model **Transformer** (BERT, IndoBERT untuk Bahasa Indonesia) memetakan kata bermakna serupa ke ruang vektor yang berdekatan — sehingga model memahami konteks jauh lebih baik. Ini menjadi pijakan alami untuk belajar deep learning lebih lanjut.

## Rangkuman

Klasifikasi teks mengikuti pola yang sama seperti klasifikasi pada umumnya: ubah input menjadi angka, latih model, evaluasi dengan metrik yang tepat — hanya representasi awalnya (TF-IDF) yang khas untuk teks.`,
  },
  {
    id: 11,
    courseId: 5,
    title: "Bagaimana Komputer 'Melihat' Gambar?",
    order: 1,
    summary:
      "Memahami representasi gambar sebagai piksel dan matriks angka, serta tantangan computer vision.",
    content: `## Gambar adalah Angka

Bagi komputer, gambar hanyalah **matriks angka**. Gambar grayscale (hitam-putih) direpresentasikan sebagai satu matriks 2D, di mana setiap sel berisi nilai intensitas piksel dari 0 (hitam) sampai 255 (putih):

\`\`\`
[[ 12,  45, 200],
 [ 34,  90, 210],
 [ 78, 130, 255]]
\`\`\`

Gambar berwarna (RGB) punya **tiga** matriks seperti ini yang ditumpuk — satu untuk merah, hijau, dan biru. Gambar beresolusi 224×224 piksel berwarna berarti ada 224 × 224 × 3, sekitar 150.000 angka input.

## Kenapa Computer Vision Sulit?

- **Variasi cahaya** — objek yang sama terlihat sangat berbeda di siang vs malam.
- **Sudut & skala** — kucing dari depan vs dari samping tetap harus dikenali sebagai "kucing".
- **Oklusi** — objek terhalang sebagian oleh objek lain.
- **Dimensi tinggi** — jutaan piksel per gambar membuat pendekatan tradisional (fitur manual) sulit diskalakan.

## Pendekatan Klasik vs Modern

Sebelum deep learning populer, computer vision mengandalkan fitur buatan tangan (hand-crafted features) — misalnya mendeteksi tepi (edge) atau sudut (corner) dengan rumus matematika tetap, lalu memasukkannya ke model klasik seperti SVM.

Pendekatan modern membiarkan model belajar fitur relevan langsung dari data lewat **Convolutional Neural Network (CNN)** — inilah yang akan kita bahas di pelajaran berikutnya.

## Tugas Umum dalam Computer Vision

- **Klasifikasi gambar** — gambar ini "kucing" atau "anjing"?
- **Deteksi objek** — di mana letak objek dalam gambar (bounding box)?
- **Segmentasi** — piksel mana saja yang termasuk objek tertentu?

## Rangkuman

Computer vision mengubah masalah visual menjadi masalah angka: gambar menjadi matriks piksel, lalu model belajar mengenali pola dari angka-angka tersebut.`,
  },
  {
    id: 12,
    courseId: 5,
    title: "Convolutional Neural Network (CNN) — Intuisi",
    order: 2,
    summary:
      "Intuisi di balik convolution, filter/kernel, pooling, dan mengapa CNN efektif untuk gambar.",
    content: `## Masalah dengan Jaringan Saraf Biasa

Jaringan saraf biasa (fully-connected) memperlakukan tiap piksel sebagai input independen — untuk gambar 224×224×3, itu sekitar 150.000 koneksi per neuron di layer pertama saja. Selain mahal secara komputasi, pendekatan ini juga mengabaikan satu hal penting: **piksel yang berdekatan saling berkaitan** (membentuk tepi, tekstur, bentuk).

## Operasi Convolution

**CNN** memindai gambar menggunakan filter/kernel kecil (misalnya 3×3) yang bergeser ke seluruh gambar, menghitung kombinasi linear di tiap posisi. Filter ini bertindak seperti "detektor pola lokal" — satu filter bisa belajar mendeteksi tepi vertikal, filter lain tepi horizontal, dan seterusnya.

\`\`\`
Filter deteksi tepi vertikal sederhana:
[-1  0  1]
[-1  0  1]
[-1  0  1]
\`\`\`

Hasil dari operasi convolution disebut **feature map** — semacam "gambar baru" yang menonjolkan pola tertentu.

## Pooling: Menyederhanakan Informasi

Setelah convolution, **pooling** (biasanya max pooling) mengecilkan ukuran feature map dengan mengambil nilai maksimum dari tiap area kecil (misalnya 2×2). Ini membuat model lebih tahan terhadap pergeseran kecil posisi objek dan mengurangi jumlah parameter.

## Hierarki Fitur

Lapisan CNN yang ditumpuk membentuk hierarki fitur:

1. **Lapisan awal** — mendeteksi tepi dan warna sederhana.
2. **Lapisan tengah** — mengombinasikan tepi menjadi bentuk/tekstur (mata, telinga).
3. **Lapisan akhir** — mengenali objek utuh (wajah kucing).

## Contoh Kode (Keras)

\`\`\`python
from tensorflow import keras
from tensorflow.keras import layers

model = keras.Sequential([
    layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation="relu"),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(128, activation="relu"),
    layers.Dense(1, activation="sigmoid"),
])
\`\`\`

## Rangkuman

CNN efektif untuk gambar karena tiga alasan utama: berbagi parameter lewat filter (efisien), menangkap pola lokal (tepi/tekstur), dan menyusun fitur secara hierarkis (dari sederhana ke kompleks).`,
  },
  {
    id: 13,
    courseId: 5,
    title: "Transfer Learning untuk Klasifikasi Gambar",
    order: 3,
    summary:
      "Memanfaatkan model CNN yang sudah dilatih (pretrained) untuk mempercepat pelatihan model klasifikasi gambar baru.",
    content: `## Masalah: Melatih CNN dari Nol itu Mahal

CNN yang bagus butuh jutaan gambar berlabel dan berjam-jam (atau berhari-hari) komputasi GPU untuk dilatih dari nol. Kebanyakan proyek nyata tidak punya resource sebesar itu.

## Solusinya: Pakai Model yang Sudah Dilatih

**Transfer learning** memanfaatkan model CNN yang sudah dilatih pada dataset besar (misalnya ImageNet, 1,4 juta gambar, 1000 kategori) sebagai titik awal, lalu menyesuaikannya untuk tugas baru dengan dataset yang jauh lebih kecil.

Intuisinya: fitur-fitur dasar yang dipelajari model besar (tepi, tekstur, bentuk umum) berlaku universal untuk hampir semua gambar — tidak perlu dipelajari ulang dari nol.

## Model Pretrained Populer

- **MobileNet** — ringan, cocok untuk perangkat mobile/edge.
- **ResNet** — akurat, banyak dipakai sebagai baseline penelitian.
- **VGG** — sederhana secara arsitektur, cocok untuk belajar konsep.

## Dua Strategi Fine-Tuning

1. **Feature extraction** — bekukan (freeze) seluruh layer pretrained, hanya latih layer klasifikasi baru di atasnya. Cepat, cocok untuk dataset kecil.
2. **Fine-tuning penuh** — buka beberapa layer terakhir untuk dilatih ulang dengan learning rate kecil, agar fitur menyesuaikan sedikit ke domain baru tanpa merusak bobot yang sudah baik.

## Contoh Kode (Keras + MobileNetV2)

\`\`\`python
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, Model

base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights="imagenet")
base_model.trainable = False

x = layers.GlobalAveragePooling2D()(base_model.output)
x = layers.Dense(64, activation="relu")(x)
output = layers.Dense(1, activation="sigmoid")(x)

model = Model(inputs=base_model.input, outputs=output)
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
\`\`\`

## Tips Praktis

- **Augmentasi data** (rotasi, flip, crop acak) membantu model lebih general dengan dataset kecil.
- Gunakan learning rate kecil saat fine-tuning agar tidak merusak bobot pretrained.
- Normalisasi input harus sama dengan yang dipakai saat model pretrained dilatih.

## Rangkuman

Transfer learning membuat computer vision praktis dipakai tanpa dataset atau komputasi raksasa — cukup ambil model pretrained, ganti "kepala" klasifikasinya, dan latih ulang secukupnya untuk tugas spesifik Anda.`,
  },
  {
    id: 14,
    courseId: 6,
    title: "Dari Notebook ke Produksi: Kenapa MLOps?",
    order: 1,
    summary:
      "Memahami kesenjangan antara model di notebook dan model yang benar-benar dipakai di produksi, serta peran MLOps.",
    content: `## "Model Saya Bekerja di Notebook, Kok di Produksi Gagal?"

Ini adalah keluhan paling umum dalam proyek ML nyata. Notebook adalah tempat yang bagus untuk eksplorasi, tapi punya kelemahan serius untuk produksi:

- Sel bisa dijalankan tidak berurutan — sulit dipastikan reproducible.
- Tidak ada versi yang jelas untuk data dan model yang dipakai.
- Tidak ada mekanisme otomatis untuk memantau performa model setelah dirilis.

## Apa itu MLOps?

**MLOps** (Machine Learning Operations) adalah kumpulan praktik untuk membuat siklus hidup model ML — dari data, pelatihan, deployment, sampai monitoring — dapat diandalkan, reproducible, dan mudah dipelihara. Konsepnya mirip **DevOps**, tapi dengan tantangan tambahan khas ML: data berubah, model bisa "membusuk" (drift) seiring waktu, dan eksperimen perlu dilacak.

## Siklus Hidup MLOps

\`\`\`
Kumpulkan & versi data
        ↓
   Latih & evaluasi model
        ↓
  Kemas model (packaging)
        ↓
     Deploy ke produksi
        ↓
  Monitor performa & data
        ↓
 Retrain saat performa turun
        ↓
     (kembali ke atas)
\`\`\`

## Perbedaan Utama dengan Software Konvensional

| Aspek | Software biasa | Sistem ML |
|---|---|---|
| Yang di-versi-kan | Kode | Kode, data, dan model |
| Sumber bug | Logika program | Logika, data, dan asumsi statistik |
| Degradasi performa | Jarang tanpa perubahan kode | Bisa terjadi walau kode tak berubah (data drift) |
| Testing | Unit/integration test | Ditambah validasi data & evaluasi model |

## Kenapa Ini Penting Dipelajari?

Banyak model ML yang bagus secara akurasi di notebook, tapi tidak pernah benar-benar dipakai karena tidak ada rencana untuk menyajikannya secara andal ke pengguna nyata. MLOps menjembatani kesenjangan antara "model yang berhasil" dan "model yang benar-benar memberi nilai".

## Rangkuman

MLOps bukan tentang algoritma baru, tapi tentang disiplin teknik — reproducibility, packaging, deployment, dan monitoring — yang membuat model ML bisa diandalkan di dunia nyata, bukan hanya di notebook.`,
  },
  {
    id: 15,
    courseId: 6,
    title: "Membungkus Model Sebagai API",
    order: 2,
    summary:
      "Menyimpan model terlatih dan menyajikannya lewat REST API sederhana menggunakan FastAPI.",
    content: `## Dari Objek Python ke Layanan yang Bisa Diakses

Supaya aplikasi lain (web, mobile, sistem lain) bisa memakai model Anda, model perlu disajikan lewat API — biasanya REST API yang menerima input dan mengembalikan prediksi dalam format JSON.

## Langkah 1: Simpan Model Terlatih

\`\`\`python
import joblib
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)

joblib.dump(model, "model.pkl")
\`\`\`

\`joblib.dump()\` menyimpan objek model Python ke file, sehingga tidak perlu melatih ulang setiap kali aplikasi dijalankan.

## Langkah 2: Bungkus dengan FastAPI

\`\`\`python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()
model = joblib.load("model.pkl")

class PredictRequest(BaseModel):
    luas: float
    kamar: int

@app.post("/predict")
def predict(req: PredictRequest):
    fitur = [[req.luas, req.kamar]]
    hasil = model.predict(fitur)
    return {"prediksi_harga": float(hasil[0])}
\`\`\`

Pydantic (lewat class \`PredictRequest\`) memvalidasi bentuk input secara otomatis — request yang tidak sesuai skema langsung ditolak dengan error yang jelas, sebelum sampai ke model.

## Langkah 3: Jalankan & Uji

\`\`\`bash
uvicorn main:app --reload

curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d '{"luas": 90, "kamar": 2}'
\`\`\`

## Hal yang Perlu Diperhatikan

- **Statelessness** — API sebaiknya tidak menyimpan state antar-request, agar mudah di-scale dengan menjalankan banyak instance.
- **Validasi input** — data dari pengguna nyata jauh lebih "berantakan" daripada data latih; validasi mencegah error yang tidak jelas.
- **Versi model** — beri nama/tag versi berkas (misalnya \`model_v1.pkl\`) agar mudah dibedakan dan bisa rollback bila versi baru bermasalah.
- **Latensi** — ukur waktu respons; model yang kompleks mungkin perlu dioptimasi atau dijalankan di GPU untuk skala besar.

## Rangkuman

Membungkus model sebagai API mengubahnya dari sekadar file \`.pkl\` menjadi layanan yang bisa dipanggil aplikasi lain — inilah jembatan pertama dari "model selesai dilatih" ke "model dipakai pengguna".`,
  },
  {
    id: 16,
    courseId: 6,
    title: "Monitoring & Model Drift",
    order: 3,
    summary:
      "Mengenali data drift dan model drift, serta strategi pemantauan dan retraining model di produksi.",
    content: `## Model yang Bagus Hari Ini, Belum Tentu Bagus Bulan Depan

Berbeda dengan software biasa, performa model ML bisa menurun tanpa ada perubahan kode sama sekali — karena dunia nyata (dan datanya) terus berubah. Fenomena ini disebut **drift**.

## Dua Jenis Drift

- **Data drift** — distribusi input berubah. Contoh: model prediksi harga rumah dilatih sebelum inflasi tinggi; setelah harga material naik drastis, pola harga di pasar sudah berbeda dari data latih.
- **Concept drift** — hubungan antara input dan output berubah. Contoh: kata-kata yang dulu menandakan "spam" berubah karena spammer beradaptasi menghindari filter.

## Sinyal yang Perlu Dipantau

1. **Distribusi input** — bandingkan statistik fitur produksi vs data latih (rata-rata, rentang nilai, kategori baru yang muncul).
2. **Distribusi output/prediksi** — apakah proporsi prediksi tiap kelas berubah drastis dari waktu ke waktu?
3. **Metrik performa nyata** — bila ground truth tersedia (misalnya label yang baru masuk beberapa hari kemudian), bandingkan prediksi vs kenyataan secara berkala.
4. **Latensi & error rate** — masalah operasional (bukan statistik) yang sama pentingnya untuk dipantau.

## Tantangan: Ground Truth yang Tertunda

Berbeda dengan metrik sistem (latensi, error rate) yang tersedia real-time, label sesungguhnya (ground truth) sering baru tersedia belakangan — kadang berhari-hari atau berbulan-bulan (misalnya, apakah pelanggan benar jadi churn). Karena itu, memantau distribusi input menjadi sinyal peringatan dini yang penting sebelum ground truth tersedia.

## Strategi Retraining

- **Terjadwal** (scheduled) — retrain rutin tiap minggu/bulan, terlepas ada drift atau tidak. Sederhana, tapi bisa boros resource.
- **Dipicu** (triggered) — retrain otomatis saat metrik monitoring melewati ambang tertentu. Lebih efisien, tapi butuh sistem monitoring yang matang lebih dulu.

## Rangkuman

Deployment bukan garis akhir — model produksi butuh pemantauan berkelanjutan terhadap data dan performanya, karena dunia nyata terus bergeser dan model yang tidak dipantau perlahan menjadi usang tanpa disadari.`,
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
  {
    id: 8,
    lessonId: 8,
    title: "Kuis — Apa itu NLP?",
    questions: [
      {
        id: 1,
        text: "NLP adalah cabang AI yang berfokus pada…",
        options: ["Pengolahan gambar", "Interaksi komputer dengan bahasa manusia", "Optimasi database", "Simulasi fisika"],
        correctIndex: 1,
        explanation: "NLP (Natural Language Processing) berfokus pada bagaimana komputer memahami dan menghasilkan bahasa manusia.",
      },
      {
        id: 2,
        text: "Salah satu alasan bahasa manusia sulit diproses komputer adalah…",
        options: ["Selalu terdiri dari angka", "Ambiguitas makna kata", "Tidak pernah berubah", "Hanya ada satu bahasa di dunia"],
        correctIndex: 1,
        explanation: "Ambiguitas (satu kata bisa punya beberapa makna) adalah salah satu tantangan utama NLP.",
      },
      {
        id: 3,
        text: "Contoh penerapan NLP dalam kehidupan sehari-hari adalah…",
        options: ["Filter spam email", "Kompresi video", "Rendering grafis 3D", "Manajemen basis data"],
        correctIndex: 0,
        explanation: "Filter spam mengklasifikasikan teks email — ini adalah penerapan klasik NLP.",
      },
    ],
  },
  {
    id: 9,
    lessonId: 9,
    title: "Kuis — Tokenisasi & Representasi Teks",
    questions: [
      {
        id: 1,
        text: "Tokenisasi adalah proses…",
        options: ["Menghapus dataset", "Memecah teks menjadi unit lebih kecil seperti kata", "Melatih model deep learning", "Mengurutkan dokumen"],
        correctIndex: 1,
        explanation: "Tokenisasi memecah kalimat menjadi token (biasanya kata) sebagai langkah awal pemrosesan teks.",
      },
      {
        id: 2,
        text: "Kata umum yang minim makna dan biasa dibuang saat preprocessing disebut…",
        options: ["Token", "Stopword", "Label", "Korpus"],
        correctIndex: 1,
        explanation: "Stopword adalah kata umum (seperti 'yang', 'di', 'dan') yang biasanya dibuang karena minim informasi.",
      },
      {
        id: 3,
        text: "Kelebihan TF-IDF dibanding sekadar Bag-of-Words adalah…",
        options: ["Mengabaikan seluruh kata", "Memberi bobot lebih rendah pada kata yang umum di banyak dokumen", "Hanya bisa dipakai untuk gambar", "Selalu lebih cepat dihitung"],
        correctIndex: 1,
        explanation: "TF-IDF menurunkan bobot kata yang sering muncul di banyak dokumen (kurang informatif) dan menaikkan bobot kata yang khas pada suatu dokumen.",
      },
    ],
  },
  {
    id: 10,
    lessonId: 10,
    title: "Kuis — Klasifikasi Teks & Sentimen",
    questions: [
      {
        id: 1,
        text: "Sebelum masuk ke model klasifikasi, teks pada pipeline analisis sentimen biasanya diubah menjadi…",
        options: ["Gambar", "Representasi numerik seperti TF-IDF", "Suara", "Video"],
        correctIndex: 1,
        explanation: "Model ML butuh input numerik; TF-IDF adalah salah satu cara representasi teks menjadi angka.",
      },
      {
        id: 2,
        text: "Pada dataset sentimen yang tidak seimbang, metrik yang lebih informatif dibanding akurasi saja adalah…",
        options: ["Ukuran dataset", "Precision, recall, dan F1-score", "Jumlah kata unik", "Waktu training"],
        correctIndex: 1,
        explanation: "Precision/recall/F1 memberi gambaran performa per kelas, penting saat kelas tidak seimbang.",
      },
      {
        id: 3,
        text: "Kelemahan utama TF-IDF dibanding word embedding adalah…",
        options: ["TF-IDF tidak bisa dihitung dengan Python", "TF-IDF tidak memahami kemiripan makna antar kata (misal sinonim)", "TF-IDF hanya bisa untuk satu dokumen", "TF-IDF tidak bisa dipakai untuk klasifikasi"],
        correctIndex: 1,
        explanation: "TF-IDF memperlakukan setiap kata sebagai unit terpisah tanpa memahami makna; word embedding menangkap kemiripan makna antar kata.",
      },
    ],
  },
  {
    id: 11,
    lessonId: 11,
    title: "Kuis — Bagaimana Komputer Melihat Gambar",
    questions: [
      {
        id: 1,
        text: "Bagi komputer, gambar grayscale direpresentasikan sebagai…",
        options: ["Teks biasa", "Matriks nilai intensitas piksel", "File audio", "Grafik vektor"],
        correctIndex: 1,
        explanation: "Gambar grayscale adalah matriks 2D berisi nilai intensitas piksel (0-255).",
      },
      {
        id: 2,
        text: "Gambar berwarna (RGB) berbeda dari grayscale karena…",
        options: ["Tidak memiliki piksel", "Terdiri dari tiga matriks (merah, hijau, biru) yang ditumpuk", "Selalu berukuran lebih kecil", "Tidak bisa diproses komputer"],
        correctIndex: 1,
        explanation: "Gambar RGB terdiri dari tiga channel warna, masing-masing sebagai matriks 2D terpisah.",
      },
      {
        id: 3,
        text: "Salah satu tantangan utama computer vision adalah…",
        options: ["Gambar selalu memiliki ukuran yang sama", "Variasi cahaya, sudut, dan oklusi membuat objek yang sama terlihat berbeda", "Komputer tidak bisa menyimpan gambar", "Warna tidak memengaruhi hasil"],
        correctIndex: 1,
        explanation: "Variasi visual (cahaya, sudut pandang, objek yang terhalang) adalah tantangan klasik computer vision.",
      },
    ],
  },
  {
    id: 12,
    lessonId: 12,
    title: "Kuis — CNN",
    questions: [
      {
        id: 1,
        text: "Fungsi utama filter/kernel dalam convolution adalah…",
        options: ["Menghapus gambar yang buruk", "Mendeteksi pola lokal seperti tepi atau tekstur", "Mengubah gambar jadi teks", "Mempercepat koneksi internet"],
        correctIndex: 1,
        explanation: "Filter convolution bertindak sebagai detektor pola lokal (tepi, tekstur, dsb.) yang bergeser ke seluruh gambar.",
      },
      {
        id: 2,
        text: "Tujuan utama max pooling dalam CNN adalah…",
        options: ["Menambah jumlah piksel", "Mengecilkan ukuran feature map dan mengurangi parameter", "Mengganti warna gambar", "Menghapus filter yang sudah dipakai"],
        correctIndex: 1,
        explanation: "Pooling menyederhanakan feature map (downsampling) sehingga model lebih efisien dan tahan pergeseran kecil.",
      },
      {
        id: 3,
        text: "Hierarki fitur pada CNN umumnya bergerak dari…",
        options: ["Objek utuh ke tepi sederhana", "Tepi/warna sederhana di layer awal ke bentuk objek kompleks di layer akhir", "Acak tanpa urutan tertentu", "Teks ke gambar"],
        correctIndex: 1,
        explanation: "Layer awal CNN menangkap fitur sederhana (tepi), layer dalam menggabungkannya menjadi fitur kompleks (objek).",
      },
    ],
  },
  {
    id: 13,
    lessonId: 13,
    title: "Kuis — Transfer Learning",
    questions: [
      {
        id: 1,
        text: "Alasan utama transfer learning banyak dipakai adalah…",
        options: ["Selalu menghasilkan model yang lebih besar", "Menghindari kebutuhan dataset dan komputasi besar untuk melatih dari nol", "Tidak membutuhkan data sama sekali", "Hanya berlaku untuk teks"],
        correctIndex: 1,
        explanation: "Transfer learning memanfaatkan model pretrained sehingga tidak perlu dataset raksasa dan komputasi mahal untuk melatih dari nol.",
      },
      {
        id: 2,
        text: "Pada strategi feature extraction, layer pretrained biasanya…",
        options: ["Dihapus seluruhnya", "Dibekukan (freeze) dan hanya layer klasifikasi baru yang dilatih", "Dilatih ulang dengan learning rate sangat besar", "Diganti dengan model acak"],
        correctIndex: 1,
        explanation: "Feature extraction membekukan bobot pretrained dan hanya melatih layer klasifikasi baru di atasnya.",
      },
      {
        id: 3,
        text: "Dataset yang umum dipakai untuk melatih model pretrained seperti ResNet/MobileNet adalah…",
        options: ["MNIST", "ImageNet", "Titanic", "Iris"],
        correctIndex: 1,
        explanation: "ImageNet (1,4 juta gambar, 1000 kategori) adalah dataset standar untuk melatih model CNN pretrained.",
      },
    ],
  },
  {
    id: 14,
    lessonId: 14,
    title: "Kuis — Kenapa MLOps?",
    questions: [
      {
        id: 1,
        text: "Salah satu kelemahan notebook untuk produksi adalah…",
        options: ["Terlalu cepat dijalankan", "Sel bisa dijalankan tidak berurutan sehingga sulit reproducible", "Tidak bisa menulis kode Python", "Selalu otomatis termonitor"],
        correctIndex: 1,
        explanation: "Eksekusi sel notebook yang tidak berurutan membuat hasil sulit direproduksi secara konsisten.",
      },
      {
        id: 2,
        text: "Dibanding software biasa, sistem ML punya tantangan tambahan berupa…",
        options: ["Kode yang tidak bisa di-versi", "Performa bisa menurun akibat data drift walau kode tidak berubah", "Tidak pernah butuh testing", "Tidak bisa dijalankan di server"],
        correctIndex: 1,
        explanation: "Model ML bisa 'membusuk' (drift) seiring perubahan data dunia nyata, meski kodenya tidak berubah sama sekali.",
      },
      {
        id: 3,
        text: "MLOps pada dasarnya adalah…",
        options: ["Algoritma machine learning baru", "Praktik teknik untuk membuat siklus hidup model ML reproducible dan andal di produksi", "Framework deep learning", "Jenis database khusus AI"],
        correctIndex: 1,
        explanation: "MLOps adalah kumpulan praktik/disiplin teknik (bukan algoritma) untuk operasional model ML yang andal.",
      },
    ],
  },
  {
    id: 15,
    lessonId: 15,
    title: "Kuis — Model sebagai API",
    questions: [
      {
        id: 1,
        text: "Fungsi joblib.dump() pada kode model adalah untuk…",
        options: ["Melatih model dari awal", "Menyimpan objek model terlatih ke file", "Menghapus model", "Mengirim data ke database"],
        correctIndex: 1,
        explanation: "joblib.dump() menyerialisasi (menyimpan) objek Python seperti model terlatih ke sebuah file.",
      },
      {
        id: 2,
        text: "Pada contoh FastAPI, Pydantic (class PredictRequest) berfungsi untuk…",
        options: ["Melatih ulang model", "Memvalidasi bentuk/tipe data request secara otomatis", "Menyimpan log server", "Mengatur tampilan frontend"],
        correctIndex: 1,
        explanation: "Pydantic memvalidasi skema request masuk sebelum diproses model, menolak input yang tidak sesuai format.",
      },
      {
        id: 3,
        text: "Alasan API prediksi sebaiknya bersifat stateless adalah…",
        options: ["Agar lebih sulit dites", "Agar mudah di-scale dengan menjalankan banyak instance secara paralel", "Agar model otomatis lebih akurat", "Karena database tidak mendukung state"],
        correctIndex: 1,
        explanation: "Layanan stateless tidak menyimpan status antar-request, sehingga bisa diperbanyak instance-nya (horizontal scaling) dengan mudah.",
      },
    ],
  },
  {
    id: 16,
    lessonId: 16,
    title: "Kuis — Monitoring & Drift",
    questions: [
      {
        id: 1,
        text: "Perubahan distribusi data input dari waktu ke waktu disebut…",
        options: ["Overfitting", "Data drift", "Backpropagation", "Regularisasi"],
        correctIndex: 1,
        explanation: "Data drift adalah perubahan distribusi input dibandingkan data saat model dilatih.",
      },
      {
        id: 2,
        text: "Concept drift terjadi ketika…",
        options: ["Kode aplikasi diperbarui", "Hubungan antara input dan output berubah seiring waktu", "Model dihapus dari server", "Dataset bertambah besar"],
        correctIndex: 1,
        explanation: "Concept drift adalah perubahan pola hubungan input-output itu sendiri, bukan sekadar distribusi input.",
      },
      {
        id: 3,
        text: "Tantangan memantau performa model lewat ground truth adalah…",
        options: ["Ground truth selalu tersedia secara instan", "Ground truth sering baru tersedia belakangan, sehingga distribusi input dipantau sebagai sinyal dini", "Ground truth tidak pernah dibutuhkan", "Ground truth hanya ada untuk data gambar"],
        correctIndex: 1,
        explanation: "Label sesungguhnya (ground truth) sering tertunda; memantau distribusi input jadi sinyal peringatan dini sebelum itu tersedia.",
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
  {
    id: 4,
    mentorId: 2,
    title: "Pengantar NLP (Natural Language Processing)",
    slug: "pengantar-nlp",
    description:
      "Pelajari dasar-dasar pengolahan bahasa alami: dari tokenisasi dan TF-IDF sampai membangun model klasifikasi sentimen teks berbahasa Indonesia.",
    level: "menengah",
    topics: ["nlp", "text-processing", "sentimen"],
    lessonIds: [8, 9, 10],
    createdAt: "2026-05-04",
  },
  {
    id: 5,
    mentorId: 2,
    title: "Computer Vision untuk Pemula",
    slug: "computer-vision-untuk-pemula",
    description:
      "Kenali bagaimana komputer memahami gambar, intuisi di balik convolutional neural network, dan cara memanfaatkan transfer learning untuk klasifikasi gambar.",
    level: "menengah",
    topics: ["computer-vision", "cnn", "transfer-learning"],
    lessonIds: [11, 12, 13],
    createdAt: "2026-05-20",
  },
  {
    id: 6,
    mentorId: 1,
    title: "MLOps & Deployment Model",
    slug: "mlops-dan-deployment-model",
    description:
      "Jembatani model dari notebook ke produksi: kemas model sebagai API, pahami monitoring, data drift, dan strategi retraining.",
    level: "lanjutan",
    topics: ["mlops", "deployment", "produksi"],
    lessonIds: [14, 15, 16],
    createdAt: "2026-06-08",
  },
];

export const quizByLesson = new Map(quizzes.map((q) => [q.lessonId, q]));
export const lessonById = new Map(lessons.map((l) => [l.id, l]));
export const courseById = new Map(courses.map((c) => [c.id, c]));
