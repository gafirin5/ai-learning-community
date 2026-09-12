"use client";

// Kartu flip 3D + tombol rating SM-2 — komponen presentasional murni,
// dipakai oleh halaman belajar deck (src/app/flashcards/decks/[id]/page.tsx).
// Markup identik dengan src/app/flashcards/page.tsx supaya pengalaman
// belajar konsisten di kedua tempat.
import type { SrsRating } from "@/lib/srs/sm2";

const RATING_META: { rating: SrsRating; label: string; className: string }[] = [
  { rating: "again", label: "Ulangi", className: "border-danger/40 text-danger hover:bg-danger-soft" },
  { rating: "hard", label: "Sulit", className: "border-warning/40 text-warning hover:bg-warning-soft" },
  { rating: "good", label: "Baik", className: "border-success/40 text-success hover:bg-success-soft" },
  { rating: "easy", label: "Mudah", className: "border-brand/40 text-brand hover:bg-brand-soft" },
];

export function FlashcardFlipCard({
  front,
  back,
  hint,
  flipped,
  onFlip,
  onRate,
  previewInterval,
  busy = false,
}: {
  front: string;
  back: string;
  hint?: string;
  flipped: boolean;
  onFlip: () => void;
  onRate: (rating: SrsRating) => void;
  previewInterval: (rating: SrsRating) => string;
  busy?: boolean;
}) {
  return (
    <div>
      <div className="[perspective:1200px]">
        <button
          type="button"
          onClick={onFlip}
          aria-label={flipped ? "Lihat pertanyaan" : "Tampilkan jawaban"}
          className="relative block h-72 w-full text-left transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div className="card absolute inset-0 flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
            <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
              Pertanyaan
            </span>
            <p className="text-center text-lg font-semibold text-content">{front}</p>
            {hint && <p className="mt-4 text-center text-xs text-muted">💡 {hint}</p>}
            <span className="mt-8 text-xs text-muted">Klik kartu untuk melihat jawaban</span>
          </div>
          <div
            className="card absolute inset-0 flex flex-col items-center justify-center border-brand/30 bg-brand-soft p-8 [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">
              Jawaban
            </span>
            <p className="text-center text-base font-medium text-content">{back}</p>
            <span className="mt-8 text-xs text-muted">Seberapa mudah mengingatnya?</span>
          </div>
        </button>
      </div>

      {flipped ? (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATING_META.map(({ rating, label, className }) => (
            <button
              key={rating}
              type="button"
              disabled={busy}
              onClick={() => onRate(rating)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${className}`}
              title={`Interval berikutnya: ${previewInterval(rating)}`}
            >
              {label}
              <span className="block text-[11px] font-normal opacity-75">
                {previewInterval(rating)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-center text-xs text-muted">
          Ingat jawabannya dulu, lalu buka kartu untuk menilai dirimu.
        </p>
      )}
    </div>
  );
}
