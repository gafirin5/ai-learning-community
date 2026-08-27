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
  return `Pertanyaan Anda berkaitan dengan materi **${lessonTitle}**. Silakan perjelas bagian mana yang ingin didalami.`;
}
