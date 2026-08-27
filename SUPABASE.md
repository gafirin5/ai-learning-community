# Aktivasi Supabase (Backend v2)

Aplikasi ini sekarang disiapkan memakai **Supabase sebagai backend penuh** (Auth + Postgres + PostgREST), menggantikan `localStorage`. Backend Express + docker-compose yang sempat dibuat sudah dihapus sesuai keputusan: pakai Supabase full BaaS.

> Status: **siap pakai, menunggu kredensial.** Semua kode & schema sudah ada; kamu tinggal buat project Supabase dan tempel kredensial. Tanpa kredensial, frontend tetap jalan seperti biasa (localStorage), dan tidak crash.

## 1. Buat project Supabase (sekali)

1. Buka <https://supabase.com> → **New project**.
2. Pilih region terdekat, set nama (mis. `aic`), dan simpan **database password** (dipakai untuk migration via CLI, bukan untuk frontend).
3. Setelah project jadi, buka **Project Settings → API**, salin dua nilai ini:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Tempel kredensial

Buat file `.env.local` di root repo (jangan commit), isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Lalu restart `npm run dev`.

## 3. Terapkan schema + seed (sekali)

Jalankan migration SQL di file [`supabase/migrations/20260827000000_init.sql`](supabase/migrations/20260827000000_init.sql) ke project Supabase. Dua cara:

**Cara A — SQL Editor (paling cepat):** buka **SQL Editor** di dashboard, tempel seluruh isi file, klik **Run**.

**Cara B — Supabase CLI:** (butuh login & link project)

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Migration ini: membuat semua tabel (courses, lessons, quizzes, progress, forum, projects, notifications, certificates, badges, dll), menyalakan **Row Level Security**, dan menyuntik **seed data** (3 kursus, 7 pelajaran, 4 thread, 3 proyek, 6 user demo).

## 4. User seed (login demo)

Schema membuat 6 user demo dengan password `password123`:

| Email | Role |
|-------|------|
| budi@example.com | mentor |
| sari@example.com | mentor |
| rina@example.com | learner |
| andi@example.com | learner |
| dewi@example.com | learner |
| admin@example.com | admin |

> Catatan: login user seed via UI Supabase Auth terkadang butuh email terkonfirmasi. Kalau login seed gagal, daftar akun baru lewat halaman register (trigger `handle_new_user()` otomatis membuat `profiles` + `user_stats`).

## 5. Menghubungkan frontend (migrasi penuh)

Setelah kredensial aktif, migrasi store `localStorage` → Supabase dilakukan bertahap per slice:

1. **Auth** — ganti `login/register/logout` di `src/lib/store/auth.ts` jadi `supabase.auth.signInWithPassword` / `signUp` / `signOut`.
2. **Baca konten** — ambil `courses`/`lessons`/`quizzes`/`threads`/`comments`/`projects` dari PostgREST (`supabase.from(...).select()`).
3. **Tulis** — progress, votes, saves, bookmarks, projects, comments ke PostgREST (RLS otomatis membatasi ke `auth.uid()`).
4. **Leaderboard** — query `user_stats` + aggregate kontribusi (sekarang poin belajar user lain terlihat, tidak lagi 0).

Kontrak tipe tetap di `src/lib/types/*`; hanya sumber data yang berubah dari `localStorage` ke Supabase.

## Catatan keamanan

- `anon key` aman diekspos ke browser (itulah fungsinya), tapi **jangan** commit `service_role` key.
- RLS di schema memastikan user hanya bisa menulis data miliknya (`user_id = auth.uid()`).
- Password disimpan sebagai hash bcrypt oleh Supabase Auth, bukan plaintext.
