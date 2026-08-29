"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  completeChallengeRemote,
  ensureMyReferralCode,
  joinChallengeRemote,
  listChallengesRemote,
  type ChallengeRow,
} from "@/lib/store/growth-remote";

function formatDeadline(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ChallengesPage() {
  const { state } = useStore();
  const { toast } = useToast();
  const isLoggedIn = state.currentUserId != null;

  // Daftar challenge (remote)
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Referral
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [refLoading, setRefLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setChallenges(await listChallengesRemote());
    } catch (e) {
      setChallenges([]);
      setLoadError(e instanceof Error ? e.message : "Gagal memuat challenge.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleShowCode() {
    setRefLoading(true);
    try {
      setReferralCode(await ensureMyReferralCode());
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyiapkan kode referral.", "error");
    } finally {
      setRefLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      toast("Kode referral disalin!", "success");
    } catch {
      toast("Gagal menyalin otomatis — salin manual kode di atas.", "error");
    }
  }

  async function handleJoin(c: ChallengeRow) {
    setBusyId(c.id);
    try {
      await joinChallengeRemote(c.id);
      toast(`Kamu ikut challenge "${c.title}"!`, "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal ikut challenge.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(c: ChallengeRow) {
    setBusyId(c.id);
    try {
      const done = await completeChallengeRemote(c.id);
      if (done) {
        toast(`Challenge selesai! +${c.pointsReward} poin`, "success");
      } else {
        toast("Challenge ini sudah selesai sebelumnya.", "info");
      }
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menandai selesai.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-content">Challenge</h1>
        <p className="max-w-2xl text-muted">
          Selesaikan challenge berkala untuk poin tambahan, dan ajak teman bergabung lewat kode
          referral — kalian berdua sama-sama diuntungkan.
        </p>
      </div>

      {/* CTA tamu: challenge bisa dilihat semua orang */}
      {!isLoggedIn && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-muted">
            Masuk untuk ikut challenge, mengumpulkan poin, dan mendapat kode referral.
          </p>
          <Link
            href="/login?redirect=/challenges"
            className="btn-primary shrink-0"
          >
            Masuk untuk ikut challenge
          </Link>
        </div>
      )}

      {/* Kartu referral (hanya user login) */}
      {isLoggedIn && (
        <div className="card mb-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="mb-1 text-lg font-bold text-content">Ajak teman, dapat poin</h2>
              <p className="text-sm text-muted">
                Teman daftar pakai kodemu: kalian berdua dapat +25 poin.
              </p>
            </div>
            {referralCode ? (
              <div className="flex flex-wrap items-center gap-3">
                <code
                  data-testid="referral-code"
                  className="rounded-lg border border-border bg-surface-hover px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em] text-content"
                >
                  {referralCode}
                </code>
                <button type="button" onClick={handleCopyCode} className="btn-secondary">
                  Salin kode
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleShowCode}
                disabled={refLoading}
                className="btn-primary shrink-0"
              >
                {refLoading ? "Menyiapkan…" : "Tampilkan kode saya"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Daftar challenge */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Memuat challenge">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-surface-hover" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-surface-hover" />
              <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-surface-hover" />
              <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-hover" />
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="mb-2 text-4xl" aria-hidden="true">🎯</p>
          <p className="font-semibold text-content">Belum ada challenge</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {loadError
              ? `Gagal memuat challenge: ${loadError}`
              : isSupabaseConfigured()
                ? "Challenge baru akan segera hadir. Cek halaman ini lagi nanti."
                : "Mode offline — challenge tersedia saat backend aktif."}
          </p>
          {loadError && (
            <button type="button" onClick={() => void load()} className="btn-secondary mt-4">
              Coba lagi
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((c) => (
            <div key={c.id} className="card card-hover flex flex-col p-6">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-bold text-content">{c.title}</h3>
                {c.completed ? (
                  <span className="badge shrink-0 bg-success/10 text-success">✅ Selesai</span>
                ) : c.joined ? (
                  <span className="badge shrink-0 bg-brand-soft text-brand">✔️ Ikut</span>
                ) : null}
              </div>
              {c.description && (
                <p className="mb-3 flex-1 text-sm text-muted">{c.description}</p>
              )}
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="font-semibold text-brand">🎁 {c.pointsReward} poin</span>
                <span>👥 {c.participantsCount} peserta</span>
                {c.endsAt && <span>⏳ s/d {formatDeadline(c.endsAt)}</span>}
                {c.creatorName && <span>dibuat oleh {c.creatorName}</span>}
              </div>
              <div className="mt-auto">
                {c.completed ? (
                  <p className="text-sm font-medium text-success">
                    Hebat! Kamu mendapat +{c.pointsReward} poin.
                  </p>
                ) : c.joined ? (
                  <button
                    type="button"
                    onClick={() => void handleComplete(c)}
                    disabled={busyId === c.id}
                    className="btn-primary"
                  >
                    {busyId === c.id ? "Memproses…" : "Tandai Selesai"}
                  </button>
                ) : isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => void handleJoin(c)}
                    disabled={busyId === c.id}
                    className="btn-primary"
                  >
                    {busyId === c.id ? "Memproses…" : "Ikut"}
                  </button>
                ) : (
                  <Link
                    href={`/login?redirect=/challenges`}
                    className="btn-secondary"
                    aria-label={`Masuk untuk ikut challenge ${c.title}`}
                  >
                    Masuk untuk ikut
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
