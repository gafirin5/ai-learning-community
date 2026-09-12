"use client";

// Galeri deck kartu hafalan buatan pengguna — tab "Buatan Saya" (privat +
// publik milik sendiri) dan "Komunitas" (publik milik orang lain). Kartu
// bawaan statis (seed) tidak terpengaruh — tetap di halaman /flashcards.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useLabFlag } from "@/lib/flags";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/ui";
import { listFlashcardDecks, setFlashcardDeckPublic } from "@/lib/store/flashcards-remote";
import type { FlashcardDeck } from "@/lib/types";

type Scope = "mine" | "public";

export default function FlashcardDecksPage() {
  const { state } = useStore();
  const { toast } = useToast();
  const [enabled, , flagReady] = useLabFlag("flashcards");
  const isLoggedIn = state.currentUserId != null;

  const [scope, setScope] = useState<Scope>("mine");
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async (s: Scope) => {
    setLoading(true);
    setError(null);
    try {
      setDecks(await listFlashcardDecks(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat deck.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    void load(scope);
  }, [scope, isLoggedIn, load]);

  async function toggleShare(deck: FlashcardDeck) {
    setTogglingId(deck.id);
    try {
      await setFlashcardDeckPublic(deck.id, !deck.isPublic);
      setDecks((ds) => ds.map((d) => (d.id === deck.id ? { ...d, isPublic: !deck.isPublic } : d)));
      toast(!deck.isPublic ? "Deck dibagikan ke komunitas" : "Deck dijadikan privat", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal mengubah status bagikan.", "error");
    } finally {
      setTogglingId(null);
    }
  }

  if (flagReady && !enabled) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🧪</p>
        <h1 className="text-2xl font-bold text-content">Deck Kartu Hafalan sedang di Lab</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Fitur ini masih eksperimental dan nonaktif di perangkatmu. Aktifkan dari halaman Lab untuk mencobanya.
        </p>
        <Link href="/labs" className="btn-primary mt-5">
          Buka Lab
        </Link>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🗂️</p>
        <h1 className="text-2xl font-bold text-content">Deck Kartu Hafalan</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Buat deck kartu hafalanmu sendiri, atau pelajari &amp; duplikat deck yang dibagikan pembelajar lain.
        </p>
        <Link href="/login?redirect=/flashcards/decks" className="btn-primary mt-5">
          Masuk untuk melanjutkan
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-content">🗂️ Deck Kartu Hafalan</h1>
            <span className="badge bg-warning-soft text-warning">Eksperimental</span>
          </div>
          <p className="max-w-2xl text-muted">
            Buat deck kartu hafalanmu sendiri, atau jelajahi deck komunitas untuk dipelajari maupun dijadikan
            template.
          </p>
        </div>
        <Link href="/flashcards/decks/new" className="btn-primary shrink-0">
          + Buat Deck Baru
        </Link>
      </div>

      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setScope("mine")}
          className={scope === "mine" ? "btn-primary text-sm" : "btn-secondary text-sm"}
        >
          Buatan Saya
        </button>
        <button
          type="button"
          onClick={() => setScope("public")}
          className={scope === "public" ? "btn-primary text-sm" : "btn-secondary text-sm"}
        >
          Komunitas
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-40 animate-pulse bg-surface-hover" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="mb-4 text-sm text-danger">{error}</p>
          <button type="button" onClick={() => void load(scope)} className="btn-secondary">
            Coba lagi
          </button>
        </div>
      ) : decks.length === 0 ? (
        <EmptyState
          title={scope === "mine" ? "Belum ada deck buatanmu" : "Belum ada deck publik dari komunitas"}
          description={
            scope === "mine"
              ? "Buat deck pertamamu — kumpulkan pertanyaan & jawaban seputar materi yang ingin kamu hafal."
              : "Jadilah yang pertama membagikan deck ke komunitas!"
          }
          action={
            <Link href="/flashcards/decks/new" className="btn-primary">
              Buat Deck Baru
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div key={deck.id} className="card flex flex-col p-5">
              <Link href={`/flashcards/decks/${deck.id}`} className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="line-clamp-1 font-semibold text-content">{deck.title}</h3>
                  {deck.isPublic && <span className="badge bg-success-soft text-success shrink-0">Publik</span>}
                </div>
                <p className="line-clamp-2 text-sm text-muted">{deck.description || "Tanpa deskripsi."}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between text-xs text-subtle">
                <span>🗂 {deck.cardCount} kartu</span>
                {scope === "public" && <span>oleh {deck.ownerName}</span>}
              </div>
              {scope === "mine" && (
                <button
                  type="button"
                  disabled={togglingId === deck.id}
                  onClick={() => void toggleShare(deck)}
                  className="btn-secondary mt-3 text-xs disabled:opacity-60"
                >
                  {togglingId === deck.id
                    ? "Memproses…"
                    : deck.isPublic
                      ? "🔒 Jadikan privat"
                      : "🔗 Bagikan ke komunitas"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        Fitur eksperimental — kelola dari{" "}
        <Link href="/labs" className="font-medium text-brand underline-offset-2 hover:underline">
          halaman Lab
        </Link>
        . Latihan kartu bawaan tetap ada di{" "}
        <Link href="/flashcards" className="font-medium text-brand underline-offset-2 hover:underline">
          halaman utama Kartu Hafalan
        </Link>
        .
      </p>
    </div>
  );
}
