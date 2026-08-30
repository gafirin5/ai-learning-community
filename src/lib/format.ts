// Format tanggal register: 28 Agu 2026 — dipakai daftar forum, detail thread,
// dan profil. Fallback ke string mentah bila tanggal tidak valid.
export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
