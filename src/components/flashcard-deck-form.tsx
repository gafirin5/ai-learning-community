"use client";

// Form buat/edit deck kartu hafalan — dipakai oleh halaman "Buat Deck Baru"
// dan mode edit di halaman detail deck. Kartu punya key lokal (bukan id DB)
// supaya baris bisa ditambah/dihapus dengan bebas sebelum disimpan.
import { useState, type FormEvent } from "react";

export interface DeckFormCardInput {
  front: string;
  back: string;
  hint?: string;
}

export interface DeckFormValues {
  title: string;
  description: string;
  isPublic: boolean;
  cards: DeckFormCardInput[];
}

interface DeckFormCard extends DeckFormCardInput {
  key: string;
  hint: string;
}

let keySeq = 0;
function newKey(): string {
  keySeq += 1;
  return `card-${keySeq}`;
}

export function FlashcardDeckForm({
  initialTitle = "",
  initialDescription = "",
  initialIsPublic = false,
  initialCards,
  submitLabel,
  busy = false,
  onSubmit,
  onCancel,
}: {
  initialTitle?: string;
  initialDescription?: string;
  initialIsPublic?: boolean;
  initialCards?: DeckFormCardInput[];
  submitLabel: string;
  busy?: boolean;
  onSubmit: (values: DeckFormValues) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [cards, setCards] = useState<DeckFormCard[]>(() => {
    const base = initialCards && initialCards.length > 0 ? initialCards : [{ front: "", back: "", hint: "" }];
    return base.map((c) => ({ key: newKey(), front: c.front, back: c.back, hint: c.hint ?? "" }));
  });
  const [error, setError] = useState<string | null>(null);

  function updateCard(key: string, field: "front" | "back" | "hint", value: string) {
    setCards((cs) => cs.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  }

  function addCard() {
    setCards((cs) => [...cs, { key: newKey(), front: "", back: "", hint: "" }]);
  }

  function removeCard(key: string) {
    setCards((cs) => (cs.length <= 1 ? cs : cs.filter((c) => c.key !== key)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const validCards = cards
      .map((c) => ({ front: c.front.trim(), back: c.back.trim(), hint: c.hint.trim() || undefined }))
      .filter((c) => c.front && c.back);

    if (!trimmedTitle) {
      setError("Judul deck wajib diisi.");
      return;
    }
    if (validCards.length === 0) {
      setError("Tambahkan minimal 1 kartu (depan & belakang wajib diisi).");
      return;
    }
    setError(null);
    onSubmit({ title: trimmedTitle, description: description.trim(), isPublic, cards: validCards });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content" htmlFor="deck-title">
            Judul deck
          </label>
          <input
            id="deck-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Istilah Dasar Machine Learning"
            maxLength={120}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content" htmlFor="deck-description">
            Deskripsi (opsional)
          </label>
          <textarea
            id="deck-description"
            className="input min-h-[4rem] text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ceritakan singkat isi deck ini…"
            maxLength={280}
          />
        </div>
        <label className="flex items-start gap-2.5 text-sm text-content">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>
            <span className="font-medium">Bagikan ke komunitas</span>
            <span className="block text-xs text-muted">
              Deck publik bisa dipelajari dan diduplikat (dijadikan template) oleh pembelajar lain. Hanya kamu
              yang tetap bisa mengeditnya.
            </span>
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-content">Kartu ({cards.length})</h2>
          <button type="button" onClick={addCard} className="btn-secondary text-sm">
            + Tambah kartu
          </button>
        </div>

        {cards.map((c, i) => (
          <div key={c.key} className="card space-y-2.5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Kartu {i + 1}</span>
              {cards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCard(c.key)}
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Hapus
                </button>
              )}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Depan (pertanyaan)</label>
                <textarea
                  className="input min-h-[4.5rem] text-sm"
                  value={c.front}
                  onChange={(e) => updateCard(c.key, "front", e.target.value)}
                  placeholder="mis. Apa itu overfitting?"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Belakang (jawaban)</label>
                <textarea
                  className="input min-h-[4.5rem] text-sm"
                  value={c.back}
                  onChange={(e) => updateCard(c.key, "back", e.target.value)}
                  placeholder="mis. Model menghafal data latih, gagal menggeneralisasi."
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Hint (opsional)</label>
              <input
                className="input text-sm"
                value={c.hint}
                onChange={(e) => updateCard(c.key, "hint", e.target.value)}
                placeholder="Petunjuk singkat yang tampil di kartu depan"
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Menyimpan…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={busy}>
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
