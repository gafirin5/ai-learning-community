import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="mb-2 text-6xl font-bold text-brand">404</p>
      <h1 className="mb-2 text-2xl font-bold text-content">Halaman tidak ditemukan</h1>
      <p className="mb-6 max-w-md text-muted">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link href="/" className="btn-primary">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
