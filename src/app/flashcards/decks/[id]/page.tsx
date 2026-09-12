"use client";

// Detail deck kartu hafalan buatan pengguna: lihat, belajar (SM-2), dan bila
// pemilik: edit / hapus / bagikan-privatkan. Bila publik & bukan pemilik:
// bisa dipelajari atau diduplikat ("pakai sebagai template").
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useLabFlag } from "@/lib/flags";
import { useToast } from "@/components/toast";
import { FlashcardDeckForm, type DeckFormValues } from "@/components/flashcard-deck-form";
import { FlashcardFlipCard } from "@/components/flashcard-flip-card";
import { ProgressBar } from "@/components/progress";
import {
  cloneFlashcardDeck,
  deleteFlashcardDeck,
  fetchFlashcardDeck,
  fetchMyFlashcardProgress,
  saveFlashcardDeck,
  setFlashcardDeckPublic,
  upsertFlashcardReview,
} from "@/lib/store/flashcards-remote";
import { dueAtFrom, reviewSm2, SRS_INITIAL_STATE, type SrsRating } from "@/lib/srs/sm2";
import type { FlashcardDeckDetail, FlashcardProgress } from "@/lib/types";

type Mode = "view" | "edit" | "study";

export default function FlashcardDeckDetailPage() {
  const params = useParams<{ id: string }>();
  const deckId = Number(params.id);
  const router = useRouter();
  const { state } = useStore();
  const { toast } = useToast();
  const [enabled, , flagReady] = useLabFlag("flashcards");
  const isLoggedIn = state.currentUserId != null;

  const [deck, setDeck] = useState<FlashcardDeckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDeck(await fetchFlashcardDeck(deckId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat deck.");
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    if (!isLoggedIn || !Number.isFinite(deckId)) return;
    void load();
  }, [isLoggedIn, deckId, load]);

  async function handleSave(values: DeckFormValues) {
    if (!deck) return;
    setBusy(true);
    try {
      await saveFlashcardDeck({
        id: deck.id,
        title: values.title,
        description: values.description,
        isPublic: values.isPublic,
        cards: values.cards,
      });
      toast("Deck disimpan", "success");
      setMode("view");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan deck.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deck) return;
    if (!window.confirm(`Hapus deck "${deck.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusy(true);
    try {
      await deleteFlashcardDeck(deck.id);
      toast("Deck dihapus", "success");
      router.push("/flashcards/decks");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus deck.", "error");
      setBusy(false);
    }
  }

  async function handleTogglePublic() {
    if (!deck) return;
    setBusy(true);
    try {
      await setFlashcardDeckPublic(deck.id, !deck.isPublic);
      setDeck((d) => (d ? { ...d, isPublic: !d.isPublic } : d));
      toast(!deck.isPublic ? "Deck dibagikan ke komunitas" : "Deck dijadikan privat", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal mengubah status bagikan.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleClone() {
    if (!deck) return;
    setBusy(true);
    try {
      const newId = await cloneFlashcardDeck(deck.id);
      toast("Deck diduplikat ke koleksimu", "success");
      router.push(`/flashcards/decks/${newId}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menduplikat deck.", "error");
      setBusy(false);
    }
  }

  // ----- Gate tampilan (hooks di atas sudah selesai) -----
  if (flagReady && !enabled) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🧪</p>
        <h1 className="text-2xl font-bold text-content">Deck Kartu Hafalan sedang di Lab</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">Aktifkan fitur ini dari halaman Lab untuk mencobanya.</p>
        <Link href="/labs" className="btn-primary mt-5">
          Buka Lab
        </Link>
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Masuk untuk melihat deck ini</h1>
        <Link href={`/login?redirect=/flashcards/decks/${params.id}`} className="btn-primary mt-5">
          Masuk
        </Link>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-xl bg-surface-hover" />
      </div>
    );
  }
  if (error || !deck) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Deck tidak ditemukan</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          {error ?? "Deck ini tidak ada, sudah dihapus, atau bersifat privat milik orang lain."}
        </p>
        <Link href="/flashcards/decks" className="btn-primary mt-5">
          Kembali ke daftar deck
        </Link>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="container-app max-w-3xl py-10">
        <button type="button" onClick={() => setMode("view")} className="mb-4 text-sm text-muted hover:text-brand">
          ← Batal edit
        </button>
        <h1 className="mb-6 text-3xl font-bold text-content">Edit Deck</h1>
        <FlashcardDeckForm
          initialTitle={deck.title}
          initialDescription={deck.description}
          initialIsPublic={deck.isPublic}
          initialCards={deck.cards}
          submitLabel="Simpan Perubahan"
          busy={busy}
          onSubmit={(v) => void handleSave(v)}
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  if (mode === "study") {
    return <DeckStudySession deck={deck} onExit={() => setMode("view")} />;
  }

  return (
    <div className="container-app max-w-3xl py-10">
      <Link href="/flashcards/decks" className="mb-4 inline-block text-sm text-muted hover:text-brand">
        ← Kembali ke daftar deck
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-bold text-content">{deck.title}</h1>
        {deck.isPublic && <span className="badge bg-success-soft text-success">Publik</span>}
        {deck.isMine && <span className="badge bg-brand-soft text-brand">Milikmu</span>}
      </div>
      {deck.description && <p className="mb-1 max-w-2xl text-muted">{deck.description}</p>}
      <p className="mb-6 text-sm text-subtle">
        🗂 {deck.cardCount} kartu · oleh {deck.ownerName}
        {deck.sourceDeckId != null && " · disalin dari deck lain"}
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("study")}
          className="btn-primary"
          disabled={deck.cards.length === 0}
        >
          ▶️ Mulai belajar
        </button>
        {deck.isMine ? (
          <>
            <button type="button" onClick={() => setMode("edit")} className="btn-secondary">
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={() => void handleTogglePublic()}
              disabled={busy}
              className="btn-secondary disabled:opacity-60"
            >
              {deck.isPublic ? "🔒 Jadikan privat" : "🔗 Bagikan ke komunitas"}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy}
              className="btn-secondary text-danger disabled:opacity-60"
            >
              🗑 Hapus
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void handleClone()}
            disabled={busy}
            className="btn-secondary disabled:opacity-60"
          >
            📋 Duplikat sebagai milikku
          </button>
        )}
      </div>

      <h2 className="mb-3 font-semibold text-content">Daftar kartu</h2>
      <ul className="space-y-2">
        {deck.cards.map((c, i) => (
          <li key={c.id} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Kartu {i + 1}</p>
            <p className="mt-1 font-medium text-content">{c.front}</p>
            <p className="mt-1 text-sm text-muted">{c.back}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SESSION_SIZE = 40;

/** Sesi belajar SM-2 untuk kartu-kartu satu deck (progres tetap di flashcard_progress). */
function DeckStudySession({ deck, onExit }: { deck: FlashcardDeckDetail; onExit: () => void }) {
  const { toast } = useToast();
  const [progressMap, setProgressMap] = useState<Record<number, FlashcardProgress>>({});
  const [queue, setQueue] = useState(deck.cards.slice(0, SESSION_SIZE));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyFlashcardProgress()
      .then((rows) => {
        if (cancelled) return;
        const ids = new Set(deck.cards.map((c) => c.id));
        const map: Record<number, FlashcardProgress> = {};
        for (const r of rows) if (ids.has(r.cardId)) map[r.cardId] = r;
        setProgressMap(map);
      })
      .catch(() => {
        /* best-effort: sesi belajar tetap jalan tanpa histori progres lama */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deck.cards]);

  const card = queue[pos] ?? null;
  const cardProgress = card
    ? progressMap[card.id] ?? { ...SRS_INITIAL_STATE, cardId: card.id, dueAt: "", lastReviewedAt: null }
    : null;

  function previewInterval(rating: SrsRating): string {
    if (!cardProgress) return "";
    return `+${reviewSm2(cardProgress, rating).intervalDays} hr`;
  }

  async function handleRate(rating: SrsRating) {
    if (!card || !cardProgress || busy) return;
    setBusy(true);
    const next = reviewSm2(cardProgress, rating);
    const updated: FlashcardProgress = {
      ...next,
      cardId: card.id,
      dueAt: dueAtFrom(new Date(), next.intervalDays),
      lastReviewedAt: new Date().toISOString(),
    };
    setProgressMap((m) => ({ ...m, [card.id]: updated }));
    try {
      await upsertFlashcardReview(updated);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan review.", "error");
    } finally {
      setBusy(false);
      setFlipped(false);
      setReviewedCount((n) => n + 1);
      if (rating === "again") setQueue((q) => [...q, card]);
      setPos((p) => p + 1);
    }
  }

  const sessionProgress = queue.length > 0 ? Math.min(100, Math.round((pos / queue.length) * 100)) : 100;

  return (
    <div className="container-app max-w-xl py-10">
      <button type="button" onClick={onExit} className="mb-4 text-sm text-muted hover:text-brand">
        ← Kembali ke deck
      </button>
      <h1 className="mb-4 text-2xl font-bold text-content">{deck.title}</h1>

      {loading ? (
        <div className="card p-10 text-center" aria-busy="true">
          <div className="mx-auto h-40 w-full max-w-md animate-pulse rounded-xl bg-surface-hover" />
        </div>
      ) : !card ? (
        <div className="card p-10 text-center">
          <p className="mb-2 text-4xl" aria-hidden="true">🎉</p>
          <p className="font-semibold text-content">Sesi selesai!</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {reviewedCount > 0 ? `Kamu mengulas ${reviewedCount} kartu dari deck ini.` : "Deck ini belum punya kartu."}
          </p>
          <button type="button" onClick={onExit} className="btn-secondary mt-4">
            Kembali ke deck
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <ProgressBar value={sessionProgress} className="h-2 flex-1" />
            <span className="shrink-0 text-xs font-semibold text-muted">
              {Math.min(pos + 1, queue.length)}/{queue.length}
            </span>
          </div>
          <FlashcardFlipCard
            front={card.front}
            back={card.back}
            hint={card.hint}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            onRate={(r) => void handleRate(r)}
            previewInterval={previewInterval}
            busy={busy}
          />
        </>
      )}
    </div>
  );
}
