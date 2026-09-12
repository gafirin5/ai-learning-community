# 🚀 Feature Index - AI Learning Community

Dokumen ini memetakan semua fitur dalam proyek beserta status **nyata** (diverifikasi
terhadap kode & histori commit — bukan rencana). Untuk keputusan produk/desain yang
mengunci, lihat [`PRODUCT.md`](PRODUCT.md). Untuk aturan lane/PR, lihat [`AGENTS.md`](AGENTS.md).

> ⚠️ **Catatan migrasi dokumen (2026-09-10):** Versi sebelumnya dari file ini
> ("Last Updated: 2026-08-28") menggambarkan *rencana* multi-agent dan menandai
> hampir semua fitur sebagai "🟡 In Progress" / "📝 Draft" dengan estimasi progres
> keseluruhan 15%. Berdasarkan audit kode + tabel "Catatan Selesai" di `AGENTS.md`,
> **mayoritas fitur tersebut sudah selesai dibangun dan live** per 2026-08-30 —
> dokumen lama tidak sinkron dengan kenyataan. Tabel di bawah menggantikannya
> dengan status terverifikasi langsung dari kode.

---

## ✅ Selesai & Live

| Fitur | Detail | Bukti di kode |
|---|---|---|
| **Landing, auth, onboarding** | Guest → Learner, pilihan minat, dark/light toggle, global search ⌘K | `src/app/page.tsx`, `login/`, `register/`, `onboarding/` |
| **Kursus & pelajaran** | Daftar + filter level + search + sort, detail kursus, TOC, reading progress | `src/app/courses/` |
| **Kuis** | Pilihan ganda, skor, pembahasan | `src/components/quiz-panel.tsx` |
| **AI Tutor (mock ter-scope)** | Menjawab hanya dalam konteks pelajaran aktif, kuota 20/hari, riwayat chat **dipersist ke Supabase** | `src/lib/ai/tutor.ts` (rule-based, **bukan LLM sungguhan** — lihat catatan di bawah), `src/lib/ai/quota.ts` |
| **Forum** | Thread, tags, voting, sort, search, pagination, komentar bersarang + markdown + badge penulis, moderasi | `src/app/forum/`, tulis via Supabase (Lane I, 2026-08-28) |
| **Showcase Proyek + Gallery Pro** | Publikasi, filter, search, sort, voting, cover/demo, masonry layout, markdown | `src/app/projects/` |
| **Mentor Hub (booking nyata)** | Cari mentor, booking sesi, availability, review & rating — RPC + migration Supabase nyata | `src/features/mentor/api.ts`, `migrations/20260829_mentor_hub.sql` |
| **Notifikasi realtime** | Bell + unread counter, jembatan Supabase Realtime, `createNotificationRemote` | `src/features/realtime/`, `src/components/notifications-bell.tsx` |
| **Gamifikasi server-side** | Leaderboard 3 periode via RPC `get_leaderboard`, badge dipersist DB, poin, streak | `src/lib/use-leaderboard.ts` |
| **Profile Enhancement** | Bio, expertise, badge grid, edit profil | `src/app/profile/` |
| **Content Editor (dasar)** | `MarkdownEditor` + quiz builder dinamis di panel admin (tanpa dependency baru) | `src/components/admin/markdown-editor.tsx`, `quiz-editor.tsx` |
| **Admin Analytics** | RPC statistik (guard `is_admin`) + chart CSS-only | `src/components/admin/` |
| **Growth: Referral & Challenges** | Kode referral (+25/+25 poin), challenge board + halaman `/challenges` | `src/app/challenges/`, `register/page.tsx` |
| **Jalur Belajar (Learning Path)** | Mastery gate 80%, enrollment persist Supabase, bonus poin `claim_path_bonus`, badge pioneer/graduate | `src/app/paths/`, `src/lib/learning-path.ts` |
| **Kartu Hafalan (SRS)** | Algoritma SuperMemo-2 murni TS, 15 kartu seed, halaman review | `src/lib/srs/sm2.ts`, `src/app/flashcards/` |
| **Sertifikat Kursus** | Klaim otomatis saat kursus 100%, kartu sertifikat cetak/save-as-PDF, terdaftar di Tersimpan | `src/components/certificate-card.tsx`, `issueCertificate` |
| **Halaman Tersimpan (Bookmarks)** | Kursus/thread/proyek yang disimpan + daftar sertifikat | `src/app/bookmarks/page.tsx` |
| **Dashboard Admin/Mentor** | Panel admin (moderasi, kelola konten, analytics), Mentor Hub page | `src/app/admin/`, `src/app/mentor/` |
| **Redesign visual "Rapor & Register"** | Sistem desain penuh (indigo `#4f46e5`, kertas/tinta/karbon), diterapkan ke header, landing, dashboard, auth, kursus, leaderboard, jalur, forum, profil, proyek | `DESIGN.md`, commit `75b403e`, `e45127d` |
| **CI & governance multi-agent** | `AGENTS.md` lane rules, `CODEOWNERS`, CI (`lint && tsc --noEmit && build`) | `.github/workflows/ci.yml`, `.github/CODEOWNERS` |

---

## 🟡 Selesai Sebagian (gap nyata, terverifikasi 2026-09-10)

### **AI Tutor Production (LLM sungguhan)**
**Status kode nyata:** ❌ Belum ada — `CONTRACTS.md` menandai kontrak ini "✅ Published v1.0.0"
dan menyebut file `src/features/ai-tutor/providers/openrouter.ts`, tapi **file itu tidak
ada di repo**. Implementasi yang benar-benar berjalan adalah `src/lib/ai/tutor.ts`
(pencocokan kata kunci lokal, bukan panggilan LLM). Hanya **persistensi riwayat chat +
kuota** yang sudah nyata terhubung ke Supabase (`src/features/ai-tutor/hooks/useChat.ts`).
**Untuk melanjutkan:** butuh `OPENROUTER_API_KEY` + implementasi provider — belum bisa
dikerjakan tanpa kredensial tersebut.

### **Mentor Session Video Call**
**Status kode nyata:** 🟡 Diupgrade 2026-09-10 — `SessionVideo.tsx` sebelumnya adalah stub
statis (`console.log`, tanpa fungsi nyata). Sekarang menampilkan **pratinjau kamera/mic
lokal sungguhan** (`getUserMedia`) dengan kontrol mute/kamera yang benar-benar berfungsi,
dan copy Bahasa Indonesia. **Belum ada** koneksi video peer-to-peer sungguhan antar
mentor-learner — itu butuh integrasi WebRTC/Daily.co/Zoom (biaya/API key eksternal),
dicatat sebagai titik ekstensi jelas di komponen.

### **Testing Infrastructure**
**Status kode nyata:** 🟡 Fondasi terpasang, isi minim. `vitest` + `playwright` + `msw`
terinstal dan terkonfigurasi (`vitest.config.ts`, `playwright.config.ts`), struktur folder
lengkap (`fixtures/`, `mocks/`, `unit/`, `e2e/`), **tapi hanya 2 file unit test** (`date.test.ts`,
`slug.test.ts`, 10 kasus) sebelum audit ini. Tidak ada test komponen, tidak ada e2e nyata.
**Catatan lingkungan:** di Windows sandbox, `vitest run` default (`pool: forks`) timeout —
gunakan `vitest run --pool=threads`.

### **Content Authoring Toolkit (visi penuh)**
**Status kode nyata:** 🟡 Versi dasar sudah jalan (Markdown + quiz builder di admin),
tapi visi awal (rich text editor TipTap, block-based schema, course wizard multi-step)
belum dibangun — `src/features/content-editor/` (folder di visi lama) tidak pernah dibuat;
implementasi nyata ada di `src/components/admin/` dengan pendekatan lebih sederhana.

---

## 🔮 Belum Dikerjakan (backlog, disengaja)

| Fitur | Alasan ditunda |
|---|---|
| **Payment / Monetization** | Kompleksitas legal/compliance + integrasi payment processor pihak ketiga |
| **i18n / Multi-language** | Butuh ekstraksi string besar-besaran; baru relevan setelah fitur inti stabil |
| **Code Playground Interaktif** | Ide dari README, belum pernah dimulai sampai audit ini (lihat bagian di bawah) |

---

## 🆕 Ditambahkan pada gelombang fitur 2026-09-10

Menyusul audit dokumen ini, tiga item berikut dikerjakan dalam satu batch:

1. **Mentor Session Video** — upgrade dari stub statis ke pratinjau kamera/mic nyata (lihat di atas).
2. **Code Playground** — sandbox kode interaktif baru (halaman `/playground`), dijalankan aman
   di `<iframe sandbox>`, tanpa dependency baru. Lihat `src/app/playground/`.
3. **Unit test tambahan** — cakupan test untuk logika murni yang sebelumnya tidak diuji:
   SM-2 (`sm2.ts`), kuota AI tutor (`quota.ts`), mastery gate jalur belajar (`learning-path.ts`).
   Lihat `src/__tests__/unit/lib/`.

Detail masing-masing dan status verifikasi (lint/tsc/build/test) dicatat di tabel
"Catatan Selesai" pada [`AGENTS.md`](AGENTS.md).

---

## 🆕 Ditambahkan pada gelombang fitur 2026-09-12

1. **Catatan Pribadi per Pelajaran** — panel catatan privat (autosave, debounce) di
   halaman pelajaran, tersimpan per user ke tabel `lesson_notes` (RLS owner-only, tidak
   dibagikan ke siapa pun). Lihat `src/components/lesson-notes.tsx`,
   `src/lib/store/notes-remote.ts`, migration `20260912000001_lesson_notes.sql`.
2. **Deck Kartu Hafalan buatan sendiri + sharing/template** — perluasan Kartu Hafalan
   (SRS) yang sudah ada: pengguna bisa membuat deck kartu sendiri, membagikannya sebagai
   publik ke komunitas, dan menduplikat deck orang lain sebagai template pribadi. Kartu
   bawaan (seed statis 33 kartu) tidak diubah sama sekali — ini murni penambahan. Lihat
   `src/app/flashcards/decks/` (galeri, buat, detail/edit/belajar),
   `src/lib/store/flashcards-remote.ts` (fungsi deck), migration
   `20260912000002_flashcard_decks.sql` (tabel `flashcard_decks`/`flashcard_cards` + RPC
   `save_flashcard_deck`/`clone_flashcard_deck`/`list_flashcard_decks`).

**⚠️ Migration belum di-apply ke Supabase live** (dikerjakan di branch
`feat/notes-and-flashcard-decks`, belum di-PR/merge) — terapkan kedua file migration di
atas via SQL Editor atau `supabase db push` sebelum fitur ini aktif di produksi. Kode
sudah lolos `lint`, `tsc --noEmit`, dan `build` (28 route).

---

## 📞 Dokumentasi Terkait

- **[AGENTS.md](AGENTS.md)** — Aturan workspace & definisi lane, tabel "Catatan Selesai"
- **[CONTRACTS.md](CONTRACTS.md)** — Registry API contracts (⚠️ berisi beberapa kontrak
  berstatus "Published" yang implementasinya belum benar-benar ada di kode — cross-check
  dengan tabel di atas sebelum dipercaya)
- **[PRODUCT.md](PRODUCT.md)** — Product purpose, brand commitments
- **[DESIGN.md](DESIGN.md)** — Sistem desain "Rapor & Register"
- **[CODEOWNERS](.github/CODEOWNERS)** — Penentuan reviewer PR

---

**Last Updated:** 2026-09-10
**Diverifikasi terhadap:** kode aktual + histori commit (bukan dokumen rencana lama)
