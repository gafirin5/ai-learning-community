# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Komunitas belajar AI/ML di Indonesia, campuran semua level — pemula, mahasiswa,
profesional yang upskill, sampai praktisi lanjutan — saling membantu dalam satu
platform. Role dalam produk: Guest → Learner, Mentor, Admin. Pengguna utama
berbahasa Indonesia dan sebagian besar mengakses dari desktop dan mobile web.

## Product Purpose

Platform komunitas untuk belajar AI/ML secara terstruktur dan bersama: jalur
kursus (kursus → pelajaran → kuis) dengan progress terlacak, AI tutor yang
hanya menjawab dalam konteks pelajaran aktif, forum diskusi, showcase proyek,
mentor hub, leaderboard/badge/challenges, jalur belajar dengan mastery gate,
dan kartu hafalan SRS. Sukses = pembelajar baru mulai pelajaran pertamanya
cepat (< 3 menit dari daftar) dan terus kembali karena progres, komunitas, dan
gamifikasi.

## Positioning

Belajar AI/ML dalam Bahasa Indonesia bersama komunitas — bukan sekadar katalog
video: AI tutor yang di-scope ke materi pelajaran aktif (menolak di luar topik),
didampingi forum, mentor sungguhan, dan showcase proyek pembelajar.

## Operating Context

- Self-paced web app; sesi belajar pendek (sela waktu) maupun panjang (mengerjakan kuis, membaca pelajaran).
- Data nyata tersedia: kursus terstruktur, thread forum, proyek showcase, papan peringkat, kartu hafalan.
- Backend Supabase (auth + data), dengan store frontend bertahan di localStorage.
- Live di VPS; login demo: `budi@example.com` (learner), `sari@example.com` (mentor), `admin@example.com` (admin), password `password123`.

## Capabilities and Constraints

- Next.js 14 App Router + React 18 + Tailwind CSS (design token via CSS variables, light/dark via `.dark`).
- Fitur yang harus tetap berfungsi: global search ⌘K, dark/light toggle, onboarding minat, kuis, forum (vote, komentar bersarang), showcase, mentor hub, leaderboard, challenges/referral, jalur belajar, flashcards SRS, AI tutor, admin & moderasi.
- Konten produk sepenuhnya Bahasa Indonesia.
- Repo multi-agent dengan aturan lane & PR (AGENTS.md): `main` protected, kerja di branch `feat/…`, verifikasi `lint && tsc --noEmit && build` wajib hijau.

## Brand Commitments

Dikunci pengguna (2026-08-29) untuk redesign:
- **Mode gelap wajib ada** dan diperlakukan setara dengan mode terang.
- **Semua copy tetap Bahasa Indonesia.**
- **Warna brand indigo tetap** (#4f46e5 sebagai jangkar brand; turunan/tone-nya boleh disempurnakan, identitas indigo tidak boleh dibuang).

Tidak dikunci: nama produk "AI Learning Community" boleh berubah, tetapi tidak ada keputusan rename — jangan ganti nama tanpa persetujuan eksplisit.

## Evidence on Hand

- Konten nyata berbahasa Indonesia: data kursus/pelajaran/kuis, thread forum, proyek, seed kartu hafalan (15 kartu), data leaderboard — di `src/lib/data/`.
- Tidak ada: logo file, testimoni nyata, press, foto pengguna asli. Jangan memfabrikasi klaim komersial, testimoni, atau pengguna nyata; data demo yang ada boleh dipakai sebagai konten nyata platform.

## Product Principles

1. **Jelas dulu, keren kemudian** — penonton datang untuk belajar; hierarki dan scanability tidak boleh dikorbankan untuk gaya (melayani campuran semua level).
2. **Progres terasa** — streak, mastery, badge, jalur: produk ini hidup dari rasa maju; desain harus membuat kemajuan terlihat dalam sekelep.
3. **Bahasa Indonesia sepenuh hati** — bukan terjemahan; copy, istilah, dan nada ditulis untuk pembelajar Indonesia.
4. **Komunitas itu bukti** — aktivitas nyata (forum, proyek, mentor, leaderboard) adalah bukti sosial; tunjukkan, jangan klaim.
5. **Satu sistem, semua halaman** — landing, belajar, forum, admin memakai satu dunia visual yang koheren.
