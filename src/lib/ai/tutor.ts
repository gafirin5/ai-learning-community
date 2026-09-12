import type { ChatMessage, Course, Lesson } from "@/lib/types";

/**
 * The AI tutor is scoped strictly to the active lesson's course. It answers
 * only questions related to that lesson/course and politely refuses anything
 * out of scope (PRD §2 & §7 — AI Scoping Rules).
 */
export function generateTutorReply(
  lessonId: number,
  message: string,
  lessons: Lesson[],
  courses: Course[]
): ChatMessage {
  const lesson = lessons.find((l) => l.id === lessonId);
  const course = lesson ? courses.find((c) => c.id === lesson.courseId) : undefined;
  const lessonTitle = lesson?.title ?? "pelajaran ini";
  const courseTitle = course?.title ?? "kursus ini";

  const normalized = message.toLowerCase();
  const keywords = [
    lesson?.title.toLowerCase() ?? "",
    course?.title.toLowerCase() ?? "",
    ...(lesson?.summary.toLowerCase().split(/\s+/) ?? []),
    ...(course?.topics ?? []),
  ].filter(Boolean);

  const onTopic = keywords.some((k) => k.length > 3 && normalized.includes(k));

  if (!onTopic) {
    return {
      id: Date.now(),
      lessonId,
      sender: "assistant",
      kind: "rejection",
      createdAt: new Date().toISOString(),
      content: `Maaf, saya hanya bisa membantu seputar materi **${lessonTitle}** dalam kursus **${courseTitle}**. Coba tanyakan hal yang berkaitan dengan pelajaran ini, misalnya konsep yang belum Anda pahami dari ringkasan: "${lesson?.summary ?? "—"}".`,
    };
  }

  return {
    id: Date.now(),
    lessonId,
    sender: "assistant",
    kind: "normal",
    createdAt: new Date().toISOString(),
    content: `Berdasarkan materi **${lessonTitle}** (${courseTitle}):\n\n${makeContextualAnswer(lessonId, message, lessonTitle)}`,
  };
}

function makeContextualAnswer(lessonId: number, message: string, lessonTitle: string): string {
  const lower = message.toLowerCase();

  if (lessonId === 1) {
    if (lower.includes("supervis") || lower.includes("unsupervis"))
      return "Supervised learning memakai data berlabel (ada kunci jawaban), sedangkan unsupervised learning mencari pola tanpa label. Keduanya dibahas di bagian *Tiga Jenis Utama* pada pelajaran ini.";
    if (lower.includes("reinfor"))
      return "Reinforcement learning belajar lewat hadiah dan hukuman — contohnya AI yang bermain game dan mendapat skor sebagai sinyal umpan balik.";
    if (lower.includes("tradisional") || lower.includes("perbedaan"))
      return "Pemrograman tradisional: Data + Aturan → Jawaban. Machine learning: Data + Jawaban → Aturan (model). Jadi ML membalik alurnya dengan belajar pola dari contoh.";
    return "Machine learning adalah cabang AI yang membuat komputer belajar dari data, bukan dari aturan yang ditulis manual. Perhatikan kembali diagram Data + Jawaban → Aturan pada pelajaran.";
  }
  if (lessonId === 2) {
    if (lower.includes("fitur") || lower.includes("feature"))
      return "Fitur adalah ciri yang dipakai untuk memprediksi. Pada tabel harga rumah, fitur adalah Luas, Kamar Tidur, dan Lokasi.";
    if (lower.includes("label") || lower.includes("target"))
      return "Label/target adalah kolom yang ingin diprediksi. Pada contoh tabel harga rumah, kolom Harga adalah labelnya.";
    return "Dataset berbentuk tabel: baris = sampel, kolom = fitur, dan kolom yang diprediksi = label. Lihat bagian *Data, Fitur, dan Label*.";
  }
  if (lessonId === 3) {
    if (lower.includes("w") || lower.includes("bobot") || lower.includes("bias"))
      return "Pada persamaan y = w·x + b: w adalah bobot (kemiringan garis) dan b adalah bias (titik potong). Melatih model berarti menyesuaikan keduanya agar garis sedekat mungkin dengan data.";
    if (lower.includes("loss") || lower.includes("mse"))
      return "Loss function (mis. Mean Squared Error) mengukur seberapa jauh prediksi dari nilai sebenarnya. Tujuan latih adalah meminimalkan nilai loss ini.";
    return "Regresi linear mencari garis lurus terbaik untuk memprediksi nilai kontinu. Coba pahami persamaan y = w·x + b pada pelajaran.";
  }
  if (lessonId === 4) {
    if (lower.includes("numpy"))
      return "NumPy adalah library untuk komputasi numerik — array, operasi vektor, dan aljabar linear. Contoh: np.array([1,2,3]).mean() mengembalikan 2.0.";
    if (lower.includes("pandas"))
      return "Pandas menyediakan DataFrame untuk data tabular. Gunakan df.head() untuk melihat data awal dan df.info() untuk ringkasan.";
    return "Untuk setup: pip install numpy pandas scikit-learn, lalu gunakan virtual environment agar dependensi terisolasi.";
  }
  if (lessonId === 5) {
    if (lower.includes("metrik") || lower.includes("akurasi") || lower.includes("precision"))
      return "Akurasi = proporsi prediksi benar; precision = dari yang diprediksi positif, berapa yang benar; recall = dari yang benar positif, berapa yang terdeteksi.";
    if (lower.includes("split") || lower.includes("train") || lower.includes("test"))
      return "Bagi data dengan train_test_split agar evaluasi dilakukan pada data yang belum pernah dilihat model — mencegah hasil yang terlalu optimistis.";
    return "Pipeline dasar scikit-learn: siapkan X dan y → split → model.fit() → model.predict() → evaluasi akurasi.";
  }
  if (lessonId === 6) {
    if (lower.includes("backprop"))
      return "Backpropagation menghitung gradien error terhadap tiap bobot, lalu memperbarui bobot ke arah yang mengurangi error: w ← w − learning_rate × gradien.";
    if (lower.includes("aktivasi") || lower.includes("relu") || lower.includes("sigmoid"))
      return "Fungsi aktivasi (ReLU, sigmoid, tanh) memperkenalkan non-linearitas sehingga jaringan bisa mempelajari pola kompleks.";
    return "Jaringan saraf tersusun dari neuron yang menghitung kombinasi linear lalu lewat fungsi aktivasi. Forward pass menghasilkan output; backpropagation memperbarui bobot.";
  }
  if (lessonId === 7) {
    if (lower.includes("overfit"))
      return "Overfitting terjadi saat model terlalu kompleks dan menghafal data latih, sehingga akurasi latih tinggi tapi gagal di data baru.";
    if (lower.includes("dropout"))
      return "Dropout mematikan sebagian neuron secara acak saat latih, memaksa jaringan lebih general dan mengurangi overfitting.";
    return "Cegah overfitting dengan: tambah data, regularisasi (L1/L2), dropout, early stopping, dan cross-validation.";
  }
  if (lessonId === 8) {
    if (lower.includes("ambigu"))
      return "Ambiguitas kata (satu kata bisa punya beberapa makna, mis. 'bisa') adalah salah satu alasan bahasa manusia sulit diproses komputer secara langsung.";
    if (lower.includes("contoh") || lower.includes("aplikasi") || lower.includes("penerapan"))
      return "Contoh penerapan NLP: filter spam email, chatbot, analisis sentimen, penerjemah otomatis, dan ringkasan otomatis.";
    if (lower.includes("transformer") || lower.includes("modern") || lower.includes("klasik"))
      return "Pendekatan klasik (TF-IDF, bag-of-words) menghitung statistik kata; pendekatan modern (word embedding, Transformer seperti BERT) memahami makna dan konteks lebih dalam, tapi butuh data & komputasi lebih besar.";
    return "NLP membuat komputer memahami dan menghasilkan bahasa manusia. Perhatikan kembali bagian *Kenapa Bahasa itu Sulit bagi Komputer* untuk intuisi dasarnya.";
  }
  if (lessonId === 9) {
    if (lower.includes("token"))
      return "Tokenisasi memecah kalimat menjadi unit lebih kecil (biasanya kata) — langkah pertama sebelum teks bisa diproses lebih lanjut.";
    if (lower.includes("stopword") || lower.includes("stemming"))
      return "Stopword removal membuang kata umum minim makna (mis. 'yang', 'di'); stemming/lemmatization menyederhanakan kata ke bentuk dasarnya.";
    if (lower.includes("tf-idf") || lower.includes("tfidf") || lower.includes("bobot"))
      return "TF-IDF memberi bobot lebih tinggi pada kata yang khas di satu dokumen, dan bobot lebih rendah pada kata yang umum di banyak dokumen.";
    return "Representasi teks (Bag-of-Words, TF-IDF) mengubah kata menjadi angka agar bisa diproses model. Lihat kembali contoh TfidfVectorizer pada pelajaran.";
  }
  if (lessonId === 10) {
    if (lower.includes("metrik") || lower.includes("precision") || lower.includes("recall") || lower.includes("f1"))
      return "Untuk data sentimen yang tidak seimbang, precision, recall, dan F1-score lebih informatif daripada akurasi saja.";
    if (lower.includes("embedding") || lower.includes("transformer") || lower.includes("bert"))
      return "Word embedding dan model Transformer (mis. IndoBERT) memahami kemiripan makna antar kata — sesuatu yang tidak bisa dilakukan TF-IDF.";
    if (lower.includes("pipeline") || lower.includes("logistic"))
      return "Pipeline klasifikasi teks: teks mentah → preprocessing → TF-IDF → model (mis. Logistic Regression) → label sentimen.";
    return "Klasifikasi teks mengikuti pola klasifikasi pada umumnya — hanya representasi awalnya (TF-IDF) yang khas untuk teks. Lihat kembali contoh pipeline pada pelajaran.";
  }
  if (lessonId === 11) {
    if (lower.includes("piksel") || lower.includes("matriks"))
      return "Gambar grayscale adalah matriks 2D berisi nilai intensitas piksel (0-255); gambar RGB punya tiga matriks seperti itu yang ditumpuk.";
    if (lower.includes("rgb") || lower.includes("warna"))
      return "Gambar berwarna (RGB) terdiri dari tiga channel — merah, hijau, biru — masing-masing sebagai matriks 2D terpisah.";
    if (lower.includes("tantangan") || lower.includes("cahaya") || lower.includes("oklusi"))
      return "Tantangan computer vision: variasi cahaya, sudut/skala, dan oklusi (objek terhalang sebagian) membuat objek yang sama bisa terlihat sangat berbeda.";
    return "Bagi komputer, gambar hanyalah matriks angka (nilai piksel). Perhatikan kembali contoh matriks grayscale pada pelajaran.";
  }
  if (lessonId === 12) {
    if (lower.includes("filter") || lower.includes("kernel") || lower.includes("convolution"))
      return "Filter/kernel bergeser ke seluruh gambar dan mendeteksi pola lokal seperti tepi atau tekstur, menghasilkan feature map.";
    if (lower.includes("pooling"))
      return "Max pooling mengecilkan ukuran feature map dengan mengambil nilai maksimum per area kecil — mengurangi parameter dan menambah ketahanan terhadap pergeseran posisi objek.";
    if (lower.includes("hierarki") || lower.includes("layer"))
      return "CNN menyusun fitur secara hierarkis: layer awal menangkap tepi/warna sederhana, layer akhir mengenali objek utuh.";
    return "CNN efektif untuk gambar karena berbagi parameter lewat filter dan menangkap pola lokal. Lihat kembali bagian *Operasi Convolution* pada pelajaran.";
  }
  if (lessonId === 13) {
    if (lower.includes("imagenet") || lower.includes("pretrained"))
      return "Model pretrained (ResNet, MobileNet, VGG) dilatih pada dataset besar seperti ImageNet, sehingga fitur dasarnya (tepi, tekstur) bisa dipakai ulang untuk tugas baru.";
    if (lower.includes("freeze") || lower.includes("feature extraction") || lower.includes("fine-tun") || lower.includes("fine tun"))
      return "Feature extraction membekukan seluruh layer pretrained dan hanya melatih layer klasifikasi baru; fine-tuning penuh melatih ulang beberapa layer terakhir dengan learning rate kecil.";
    if (lower.includes("augmentasi"))
      return "Augmentasi data (rotasi, flip, crop acak) membantu model tetap general walau dataset yang tersedia kecil.";
    return "Transfer learning memakai model CNN yang sudah dilatih sebagai titik awal, sehingga tidak perlu dataset dan komputasi raksasa untuk melatih dari nol.";
  }
  if (lessonId === 14) {
    if (lower.includes("notebook"))
      return "Notebook bagus untuk eksplorasi, tapi sel yang dijalankan tidak berurutan dan tidak ada versi data/model membuatnya rawan sulit direproduksi di produksi.";
    if (lower.includes("siklus") || lower.includes("lifecycle"))
      return "Siklus hidup MLOps: kumpulkan & versi data → latih & evaluasi → kemas model → deploy → monitor → retrain saat performa turun.";
    if (lower.includes("drift"))
      return "Model bisa 'membusuk' (drift) seiring waktu walau kodenya tidak berubah — ini dibahas lebih detail di pelajaran Monitoring & Model Drift.";
    return "MLOps adalah disiplin teknik agar siklus hidup model ML (data, training, deployment, monitoring) reproducible dan andal di produksi — bukan sekadar algoritma baru.";
  }
  if (lessonId === 15) {
    if (lower.includes("joblib") || lower.includes("simpan") || lower.includes("pickle"))
      return "joblib.dump() menyimpan objek model Python terlatih ke file (mis. model.pkl), sehingga tidak perlu dilatih ulang setiap aplikasi dijalankan.";
    if (lower.includes("fastapi") || lower.includes("pydantic") || lower.includes("validasi"))
      return "FastAPI membungkus model sebagai endpoint REST; Pydantic memvalidasi bentuk request secara otomatis sebelum data sampai ke model.";
    if (lower.includes("stateless") || lower.includes("scale"))
      return "API prediksi sebaiknya stateless (tidak menyimpan status antar-request) agar mudah di-scale dengan menjalankan banyak instance secara paralel.";
    return "Membungkus model sebagai API mengubahnya dari file .pkl menjadi layanan yang bisa dipanggil aplikasi lain. Lihat kembali langkah-langkah pada pelajaran.";
  }
  if (lessonId === 16) {
    if (lower.includes("data drift"))
      return "Data drift adalah perubahan distribusi input dibandingkan data saat model dilatih — bisa dipantau lewat statistik fitur produksi vs data latih.";
    if (lower.includes("concept drift"))
      return "Concept drift terjadi ketika hubungan antara input dan output berubah, bukan sekadar distribusi inputnya.";
    if (lower.includes("retrain"))
      return "Dua strategi retraining: terjadwal (rutin per periode waktu) atau dipicu (otomatis saat metrik monitoring melewati ambang tertentu).";
    return "Performa model bisa menurun akibat data drift atau concept drift meski kodenya tidak berubah — karena itu produksi butuh pemantauan berkelanjutan.";
  }
  return `Pertanyaan Anda berkaitan dengan materi **${lessonTitle}**. Silakan perjelas bagian mana yang ingin didalami.`;
}
