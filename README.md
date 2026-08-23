# AI Learning Community — Frontend (MVP)

Frontend web untuk platform komunitas belajar AI/ML, dibangun dari PRD
`ai-learning-community-prd.md`. Implementasi **demo frontend** yang berjalan
tanpa backend — data disimpan di `localStorage` browser, dan AI tutor
disimulasikan dengan aturan *scoping* lokal.

## Tech Stack

- **Next.js 14** (App Router, React, TypeScript)
- **Tailwind CSS** untuk styling (design token + mode gelap/terang)
- State global berbasis React Context + `localStorage` (tanpa database)

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
