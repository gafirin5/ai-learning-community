export interface PlaygroundSnippet {
  id: string;
  label: string;
  code: string;
}

export const PLAYGROUND_SNIPPETS: PlaygroundSnippet[] = [
  {
    id: "normalisasi",
    label: "Normalisasi Array",
    code: `// Normalisasi Min-Max — langkah dasar preprocessing data di ML.
// Mengubah semua nilai array menjadi rentang 0..1.

function normalisasiMinMax(data) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  if (max === min) {
    return data.map(() => 0);
  }
  return data.map((nilai) => (nilai - min) / (max - min));
}

const dataMentah = [12, 45, 7, 89, 23, 56];
const dataNormal = normalisasiMinMax(dataMentah);

console.log("Data mentah:", dataMentah);
console.log("Data ternormalisasi:", dataNormal);
`,
  },
  {
    id: "rata-rata",
    label: "Rata-rata",
    code: `// Menghitung rata-rata (mean) dari kumpulan skor.

function hitungRataRata(angka) {
  const total = angka.reduce((jumlah, n) => jumlah + n, 0);
  return total / angka.length;
}

const skorKuis = [80, 92, 75, 88, 95];

console.log("Skor:", skorKuis);
console.log("Rata-rata:", hitungRataRata(skorKuis));
`,
  },
  {
    id: "filter",
    label: "Filter Array",
    code: `// Memfilter dataset: ambil hanya prediksi di atas ambang batas (threshold).

const prediksiModel = [0.12, 0.87, 0.45, 0.93, 0.3, 0.68];
const ambangBatas = 0.5;

const prediksiPositif = prediksiModel.filter((skor) => skor >= ambangBatas);

console.log("Semua prediksi:", prediksiModel);
console.log("Prediksi positif (>= 0.5):", prediksiPositif);
`,
  },
  {
    id: "rekursif",
    label: "Fungsi Rekursif",
    code: `// Fibonacci rekursif — dasar algoritma sebelum masuk ke ML.

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 8; i++) {
  console.log("fibonacci(" + i + ") =", fibonacci(i));
}
`,
  },
];

export const DEFAULT_SNIPPET: PlaygroundSnippet = PLAYGROUND_SNIPPETS[0];
