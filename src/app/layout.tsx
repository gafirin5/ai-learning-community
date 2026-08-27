import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";

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
      <body className="antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Lewati ke konten
          </a>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <footer className="border-t border-border bg-surface">
              <div className="container-app flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted sm:flex-row">
                <span>© {new Date().getFullYear()} AI Learning Community</span>
                <span>Dibangun dengan Next.js — demo frontend MVP</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
