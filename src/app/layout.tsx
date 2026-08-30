import type { Metadata } from "next";
import { Archivo, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Learning Community — Belajar AI/ML bersama",
  description:
    "Platform komunitas belajar AI/ML: kursus terstruktur, AI tutor, forum diskusi, dan showcase proyek.",
};

// Set the theme class before React hydrates to avoid a flash of the wrong theme.
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("aic-theme") || "system";
    var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

// Kontrak arah dirender sebagai komentar HTML asli (bukan komentar JSX)
// agar tidak dihapus saat build dan bisa diaudit di output produksi.
const designContractHtml = `<!--
  DESIGN CONTRACT — seed 94273073 — dunia "Rapor & Register" (assigned)
  THESIS: Platform belajar sebagai rapor digital yang hidup — setiap progres
  tercatat tinta, distempel, dipamerkan. Menolak hero gradien + kartu emoji SaaS.
  OWN-WORLD: kertas HVS dingin + tinta pulpen biru-hitam; indigo #4f46e5
  (terkunci) sebagai tinta aksi; stempel karet merah/hijau; garis buku besar;
  angka tabular. Type: Archivo (formulir resmi) + Spline Sans Mono (entri).
  Dark mode = salinan karbon biru, setara dengan terang.
  STORY: pengunjung memahami "progresmu tercatat resmi" dalam sekelep, lalu
  mengisi rapornya sendiri (daftar, belajar, kuis, naik peringkat).
  FIRST VIEWPORT: satu lembar rapor terbuka — kop platform berstempel GRATIS,
  perintah besar "Isi rapormu.", tabel nilai kursus nyata, CTA di kaki lembar.
  FORM: kandidat #6 dari daftar grounded; roll menugaskan; seed 94273073.
  SIGNATURE: garis tinta menerus yang menggambar Jalur Belajar mengikuti
  scroll + stempel yang menghentak (stamp-in) saat muncul.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying
  its provenance.
-->`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${archivo.variable} ${splineMono.variable} antialiased`}>
        <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: designContractHtml }} />
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[110] focus:rounded-[5px] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Lewati ke konten
          </a>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <footer className="border-t-2 border-content bg-surface">
              <div className="container-app flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted sm:flex-row">
                <span className="text-xs font-bold uppercase tracking-[0.09em] text-content">
                  AI Learning Community — Rapor Belajar Digital
                </span>
                <span className="num-tabular text-xs">
                  © {new Date().getFullYear()} · Dibangun dengan Next.js
                </span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
