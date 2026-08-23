"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";

const NAV = [
  { href: "/courses", label: "Kursus" },
  { href: "/forum", label: "Forum" },
  { href: "/projects", label: "Proyek" },
];

export function SiteHeader() {
  const { currentUser, logout, nextLesson } = useStore();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const resume = nextLesson();

  // Close menus on route change.
  useEffect(() => {
    setNavOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close user menu on outside click / Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNavOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const navLinks = NAV.map((item) => {
    const active = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
          active ? "text-brand" : "text-muted hover:bg-surface-hover hover:text-content"
        }`}
      >
        {active && (
          <span className="absolute inset-0 -z-10 animate-pop-in rounded-lg bg-brand-soft" aria-hidden="true" />
        )}
        {item.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="btn-ghost h-9 w-9 rounded-lg !p-0 md:hidden"
            aria-label={navOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={navOpen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {navOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          <Link href="/" className="group flex items-center gap-2 font-bold text-content">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white transition-transform duration-200 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </span>
            <span className="hidden lg:inline">AI Learning Community</span>
            <span className="lg:hidden">AI LC</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {navLinks}
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
                  pathname.startsWith("/admin")
                    ? "text-brand"
                    : "text-muted hover:bg-surface-hover hover:text-content"
                }`}
              >
                {pathname.startsWith("/admin") && (
                  <span className="absolute inset-0 -z-10 animate-pop-in rounded-lg bg-brand-soft" aria-hidden="true" />
                )}
                🛡️ Panel Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <GlobalSearch />
          </div>
          <ThemeToggle />

          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm font-medium text-content transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar name={currentUser.name} size="sm" />
                <span className="hidden sm:inline">{currentUser.name}</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 animate-pop-in overflow-hidden rounded-xl border border-border bg-surface-raised shadow-xl"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-semibold text-content">{currentUser.name}</p>
                    <p className="truncate text-xs text-muted">{currentUser.email}</p>
                    <span className="badge mt-1.5 bg-brand-soft text-brand">{currentUser.role}</span>
                  </div>
                  <div className="p-1.5">
                    {resume && (
                      <Link
                        href={`/courses/${resume.courseSlug}/lessons/${resume.lessonId}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content hover:bg-surface-hover"
                        role="menuitem"
                      >
                        <span aria-hidden="true">▶</span> Lanjut Belajar
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content hover:bg-surface-hover"
                      role="menuitem"
                    >
                      <span aria-hidden="true">📊</span> Dashboard
                    </Link>
                    {currentUser && (
                      <Link
                        href={`/profile/${currentUser.id}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-content hover:bg-surface-hover"
                        role="menuitem"
                      >
                        <span aria-hidden="true">👤</span> Profil saya
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                      role="menuitem"
                    >
                      <span aria-hidden="true">⎋</span> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary">
                Daftar Gratis
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {navOpen && (
        <nav className="border-t border-border md:hidden" aria-label="Navigasi mobile">
          <div className="container-app flex flex-col gap-1 py-3">
            <div className="mb-2 sm:hidden">
              <GlobalSearch />
            </div>
            {navLinks}
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-content"
              >
                🛡️ Panel Admin
              </Link>
            )}
            {!currentUser && (
              <Link href="/login" className="btn-secondary mt-2">
                Masuk
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
