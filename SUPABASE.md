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

## 3. Terapkan schema (sekali)

Jalankan migration SQL di file [`supabase/migrations/20260827000000_init.sql`](supabase/migrations/20260827000000_init.sql) ke project Supabase. Migration ini **hanya DDL** (tabel + RLS), bukan seed user.

**Cara A — SQL Editor (paling cepat):** buka **SQL Editor** di dashboard, tempel seluruh isi file, klik **Run**.

**Cara B — Supabase CLI** (butuh login & link project):

```bash
npx supabase login
npx supabase link --project-ref oucvzigtxfsdquzhrpwf
npx supabase db push
```

> **Catatan koneksi (project ini):** host `db.<ref>.supabase.co` hanya resolve IPv6, jadi dari lingkungan tanpa IPv6 pakai **session pooler IPv4** dengan region **`ap-northeast-2`** (Seoul), port `6543`:
> `postgresql://postgres.oucvzigtxfsdquzhrpwf:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`

## 4. User & konten demo (seed)

User demo **tidak boleh** di-insert manual ke `auth.users` (record manual kehilangan `instance_id`/`identities` dan login gagal). Buat lewat **Auth Admin API** dengan secret key (`sb_secret_...`), misalnya:

```bash
curl -X POST 'https://oucvzigtxfsdquzhrpwf.supabase.co/auth/v1/admin/users' \
  -H 'apikey: <SECRET_KEY>' \
  -H 'Authorization: Bearer <SECRET_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"rina@example.com","password":"password123","email_confirm":true,"user_metadata":{"name":"Rina Putri","role":"learner"}}'
```

| Email | Password | Role |
|-------|----------|------|
| budi@example.com | password123 | mentor |
| sari@example.com | password123 | mentor |
| rina@example.com | password123 | learner |
| andi@example.com | password123 | learner |
| dewi@example.com | password123 | learner |
| admin@example.com | password123 | admin |

Trigger `handle_new_user()` otomatis membuat `profiles` + `user_stats` saat user dibuat. Konten (courses/lessons/threads/projects) di-seed lewat PostgREST/API setelah user ada.

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
