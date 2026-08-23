"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="mb-2 text-6xl">⚠️</p>
      <h1 className="mb-2 text-2xl font-bold text-content">Terjadi kesalahan</h1>
      <p className="mb-6 max-w-md text-muted">
        Sesuatu tidak berjalan semestinya. Coba muat ulang halaman.
      </p>
      <button onClick={reset} className="btn-primary">
        Coba lagi
      </button>
    </div>
  );
}
