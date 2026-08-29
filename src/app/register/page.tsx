"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { claimReferralRemote } from "@/lib/store/growth-remote";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/toast";

export default function RegisterPage() {
  const { register } = useStore();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [referral, setReferral] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await register({ name, email, password });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal mendaftar.");
      return;
    }
    // Klaim kode referral (best-effort, TIDAK memblokir onboarding).
    if (referral.trim()) {
      if (!isSupabaseConfigured()) {
        console.warn("Kode referral dilewati: mode offline (Supabase belum dikonfigurasi).");
      } else if (res.needsConfirmation) {
        // Tanpa session (perlu konfirmasi email) RPC claim_referral akan gagal.
        console.warn("Kode referral dilewati: konfirmasi email terlebih dahulu.");
      } else {
        try {
          await claimReferralRemote(referral.trim());
        } catch (e) {
          // Gagal klaim bukan fatal — user tetap lanjut ke onboarding.
          console.warn("Gagal klaim kode referral:", e);
        }
      }
    }
    toast(res.needsConfirmation ? "Cek email untuk konfirmasi" : "Akun berhasil dibuat");
    router.push("/onboarding");
  }

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="mb-1 text-2xl font-bold text-content">Daftar Akun</h1>
          <p className="mb-6 text-sm text-muted">
            Gratis. Setelah mendaftar Anda menjadi Learner dan bisa langsung belajar.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-content">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Nama lengkap</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="nama@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Kata sandi</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-subtle hover:text-content"
                  aria-label={showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPw ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="referral">Kode referral (opsional)</label>
              <input
                id="referral"
                type="text"
                className="input uppercase"
                placeholder="Kode dari teman Anda"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                autoComplete="off"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Memproses…" : "Daftar"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            Dengan mendaftar, Anda menyetujui ketentuan layanan demo ini.
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
