# AI Learning Community — Frontend (MVP)

Platform AI Learning Community ini adalah sebuah wadah edukasi interaktif yang dirancang untuk membantu pengguna mempelajari Kecerdasan Buatan (AI) dan Machine Learning (ML) melalui pendekatan yang praktis, kolaboratif, dan didukung oleh AI itu sendiri. Visi utama dari platform ini adalah mendemokratisasi akses terhadap pendidikan AI melalui materi terstruktur, ruang diskusi aktif, dan fitur mentoring.

Saat ini, repositori ini berisi **Implementasi Demo Frontend (MVP)** yang berjalan secara mandiri tanpa backend sungguhan — seluruh data (profil, progres kursus, diskusi) disimpan secara lokal di `localStorage` browser, dan AI tutor disimulasikan menggunakan logika pencocokan pola lokal (*scoping*).

## User Flow & Peran (Roles)

Platform ini mendukung tiga peran utama pengguna:
1. **Learner (Pembelajar):** Dapat mendaftar, mengatur minat belajar saat onboarding, mengambil kursus, membaca materi, mengerjakan kuis, bertanya pada AI Tutor, dan berdiskusi di forum serta memamerkan proyek portofolio mereka.
2. **Mentor:** Dapat membuat/membangun materi kursus (Course Builder), memberikan ulasan terhadap proyek siswa, serta menjawab pertanyaan-pertanyaan kompleks di forum diskusi.
3. **Admin:** Mengelola keseluruhan platform, termasuk manajemen pengguna, moderasi forum, dan kurasi kursus.

## Tech Stack

- **Next.js 14** (App Router, React, TypeScript)
- **Tailwind CSS** (v3.4.1) untuk styling (design token + mode gelap/terang)
- **React 18**
- State global berbasis React Context + `localStorage` (tanpa database persisten)
- **ESLint** untuk linting
- **PostCSS** untuk pemrosesan CSS

### Rencana Backend & Database Masa Depan
Berdasarkan Roadmap Pengembangan, aplikasi ini direncanakan akan bertransformasi dari Frontend MVP menjadi platform produksi penuh dengan menggunakan:
- **Database:** PostgreSQL melalui Supabase (Fase 1).
- **Backend/API:** Next.js Route Handlers / Server Actions (Fase 1).
- **Autentikasi:** NextAuth / Supabase Auth (Fase 1).
- **Integrasi AI:** Google Gemini API atau model LLM lain (Fase 1).

## Roadmap Pengembangan Sistem
Untuk mencapai visi tersebut, platform ini akan dikembangkan melalui beberapa fase utama:
- **Fase 1 (Produksi & Backend):** Migrasi dari `localStorage` ke Supabase/PostgreSQL, penerapan sistem Auth (OAuth), dan integrasi API LLM sungguhan untuk AI Tutor dengan batasan *rate limiting*.
- **Fase 2 (Interaktivitas):** Integrasi *In-Browser Code Playground* (Monaco + Pyodide) untuk eksekusi kode lokal dan fitur AI Code Reviewer.
- **Fase 3 (Gamifikasi):** Implementasi poin XP, Leaderboard, Daily Streak, dan sistem sertifikat otomatis.
- **Fase 4 (Showcase Proyek):** Kemampuan embed aplikasi demo interaktif (seperti Streamlit/Gradio) pada proyek pengguna.
- **Fase 5 (Skalabilitas Mentor):** Dashboard khusus mentor untuk *Course Builder* dan penjadwalan *Live Mentoring*.

## Fitur

| Area | Status |
|------|--------|
| Landing page & brand | ✅ |
| Registrasi / login (Guest → Learner) | ✅ |
| Onboarding pilihan minat | ✅ |
| **Dashboard pembelajar** (streak, progres, lanjut belajar) | ✅ |
| **Global search** (⌘K / Ctrl+K) | ✅ |
| **Mode gelap/terang** (toggle + deteksi sistem) | ✅ |
| Daftar kursus + filter level + search + sort | ✅ |
| Detail kursus + progress + mentor + simpan | ✅ |
| Pelajaran + **daftar isi (TOC) + reading progress** | ✅ |
| Kuis pilihan ganda + skor + pembahasan | ✅ |
| AI Tutor (scoping + kuota + **salin jawaban + chips saran**) | ✅ |
| **Code block dengan syntax highlighting + tombol salin** | ✅ |
| Forum: thread, tags, voting, sort, search, **pagination** | ✅ |
| Komentar bersarang + **markdown + badge penulis** | ✅ |
| Showcase proyek: publikasi, filter, search, sort, **voting** | ✅ |
| **Halaman profil pengguna** | ✅ |
| **Toast, skeleton, empty states, breadcrumbs** | ✅ |

## Menjalankan

```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:3000.

Produksi:

```bash
npm run build
npm run start
```

## Fitur yang Diimplementasikan

| Area | Status |
|------|--------|
| Landing page & brand | ✅ |
| Registrasi / login (Guest → Learner) | ✅ |
| Onboarding pilihan minat | ✅ |
| Daftar kursus + filter level | ✅ |
| Detail kursus + progress per kursus | ✅ |
| Halaman pelajaran (konten Markdown-lite) | ✅ |
| Kuis pilihan ganda + skor + pembahasan | ✅ |
| AI Tutor / chat dengan scoping materi + kuota harian | ✅ |
| Forum: thread, tags, voting, sort, pencarian | ✅ |
| Komentar bersarang (balasan) | ✅ |
| Showcase proyek: publikasi, filter, komentar | ✅ |
| Gamifikasi (XP, Streak, Sertifikat Kelulusan) | ✅ (Mock / Local) |
| Forum: Dukungan Markdown (LaTeX basic) & Mark as Solution | ✅ |

## Akun Demo

| Role | Email | Catatan |
|------|-------|---------|
| Learner | `budi@example.com` | — |
| Mentor | `sari@example.com` | — |
| Admin | `admin@example.com` | — |

Kata sandi **apa saja** diterima (demo). Atau daftar akun baru — role default
`learner`.

## Struktur Kode

```
src/
  app/                      # routing App Router
    page.tsx                # landing
    login/ register/ onboarding/
    courses/                # daftar + detail + pelajaran
    forum/                  # daftar + detail thread
    projects/               # showcase + detail proyek
  components/               # UI & fitur (header, tutor chat, quiz, dll.)
  lib/
    types.ts                # definisi tipe data
    data.ts                 # data seed (kursus, kuis, forum, proyek)
    store.tsx               # state global + actions + persistence
    tutor.ts                # logika scoping & jawaban AI tutor
```

## Catatan Implementasi (menyimpang dari backend riil)

- **Auth**: sesi disimpan di `localStorage` (bukan JWT/session server). Role
  mentor/admin ditentukan manual (sesuai `[ASSUMPTION]` PRD).
- **AI Tutor**: `generateTutorReply` di `src/lib/tutor.ts` mensimulasikan LLM
  dengan pencocokan kata kunci terhadap konteks pelajaran. Aturan scoping
  (menolak di luar materi, kuota 20/hari) diterapkan secara lokal.
- **Persistensi**: semua data (progress, chat, thread, proyek, vote) tersimpan
  di `localStorage` per browser; refresh halaman tidak menghapus data.
- **Typografi**: mengikuti PRD §7 (sans untuk UI/body, serif opsional untuk
  judul, mono untuk kode).

## Menghubungkan ke Backend Riil

Untuk memakai API sungguhan (PostgreSQL + LLM), ganti implementasi di
`src/lib/store.tsx` dengan pemanggilan `fetch` ke endpoint PRD
(`/api/chat`, `/api/courses`, `/api/threads`, dst.) dan ganti
`generateTutorReply` dengan panggilan ke service AI.
