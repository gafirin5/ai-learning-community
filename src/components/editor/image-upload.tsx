"use client";

import { useRef, useState } from "react";

/**
 * Client-side image handling for forum content. Images are downscaled to a
 * JPEG data URL so they stay small enough for localStorage persistence.
 */

const MAX_DIM = 1280;
const QUALITY = 0.82;

function downscaleImage(file: File, maxDim = MAX_DIM, quality = QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas tidak didukung."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar."));
    };
    img.src = url;
  });
}

function Thumb({ src, onRemove }: { src: string; onRemove?: () => void }) {
  return (
    <div className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Hapus gambar"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity hover:bg-black/80 focus:opacity-100 group-hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function ImageGallery({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {images.map((src, i) => (
        <Thumb key={i} src={src} />
      ))}
    </div>
  );
}

export function ImageUpload({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const next: string[] = [];
    for (const file of Array.from(files)) {
      try {
        next.push(await downscaleImage(file));
      } catch {
        setError("Gagal memproses salah satu gambar.");
      }
    }
    setBusy(false);
    if (next.length > 0) onChange([...images, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <Thumb
              key={i}
              src={src}
              onRemove={() => onChange(images.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-secondary"
        >
          {busy ? "Memproses…" : "🖼️ Tambahkan gambar"}
        </button>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    </div>
  );
}
