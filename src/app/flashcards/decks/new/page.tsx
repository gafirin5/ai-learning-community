"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLabFlag } from "@/lib/flags";
import { useToast } from "@/components/toast";
import { FlashcardDeckForm, type DeckFormValues } from "@/components/flashcard-deck-form";
import { saveFlashcardDeck } from "@/lib/store/flashcards-remote";

export default function NewFlashcardDeckPage() {
  const { state } = useStore();
  const router = useRouter();
  const { toast } = useToast();
  const [enabled, , flagReady] = useLabFlag("flashcards");
  const isLoggedIn = state.currentUserId != null;
  const [busy, setBusy] = useState(false);

  async function handleSubmit(values: DeckFormValues) {
    setBusy(true);
    try {
      const id = await saveFlashcardDeck({ title: values.title, description: values.description, isPublic: values.isPublic, cards: values.cards });
      toast("Deck berhasil dibuat", "success");
      router.push(`/flashcards/decks/${id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal membuat deck.", "error");
      setBusy(false);
    }
  }

  if (flagReady && !enabled) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🧪</p>
        <h1 className="text-2xl font-bold text-content">Deck Kartu Hafalan sedang di Lab</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Aktifkan fitur ini dari halaman Lab untuk mencobanya.
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
        <h1 className="text-2xl font-bold text-content">Masuk untuk membuat deck</h1>
        <Link href="/login?redirect=/flashcards/decks/new" className="btn-primary mt-5">
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app max-w-3xl py-10">
      <Link href="/flashcards/decks" className="mb-4 inline-block text-sm text-muted hover:text-brand">
        ← Kembali ke daftar deck
      </Link>
      <h1 className="mb-1 text-3xl font-bold text-content">Buat Deck Baru</h1>
      <p className="mb-6 text-muted">
        Kumpulkan kartu pertanyaan &amp; jawaban seputar materi yang ingin kamu hafal dengan spaced repetition.
      </p>
      <FlashcardDeckForm submitLabel="Buat Deck" busy={busy} onSubmit={(v) => void handleSubmit(v)} />
    </div>
  );
}
