"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { NotificationsBell } from "@/components/notifications-bell";

const NAV = [
  { href: "/courses", label: "Kursus" },
  { href: "/paths", label: "Jalur" },
  { href: "/forum", label: "Forum" },
  { href: "/projects", label: "Proyek" },
  { href: "/mentor", label: "Mentor" },
  { href: "/challenges", label: "Challenge" },
  { href: "/leaderboard", label: "Peringkat" },
];

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.6" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10.2 9.2l4.6 2.8-4.6 2.8V9.2z" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.2 3.9-5 7-5s5.8 1.8 7 5" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 5H7a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 007 19h7" />
      <path d="M10.5 12h8m0 0l-2.8-2.8M18.5 12l-2.8 2.8" />
    </svg>
  );
}

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
        className={`relative whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring xl:px-3 ${
          active ? "text-content" : "text-muted hover:text-content"
        }`}
      >
        {item.label}
        <span
          className={`absolute inset-x-2.5 bottom-0.5 h-[2.5px] rounded-full bg-brand transition-all duration-200 xl:inset-x-3 ${
            active ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      {/* Pita kop: tinta indigo membuka setiap dokumen. */}
      <div className="h-1 w-full bg-brand" aria-hidden="true" />
      <div className="container-app flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="btn-ghost h-9 w-9 !p-0 md:hidden"
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

          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-brand text-sm font-extrabold tracking-tight text-white shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.35)] transition-transform duration-200 group-hover:-rotate-3">
              AIC
            </span>
            <span className="hidden font-extrabold uppercase leading-tight tracking-[0.09em] text-content xl:inline">
              AI Learning
              <br />
              Community
            </span>
            <span className="text-sm font-extrabold uppercase tracking-[0.09em] text-content xl:hidden">
              AIC
            </span>
          </Link>

          <nav className="ml-1 hidden items-center gap-0.5 md:flex xl:ml-2 xl:gap-1" aria-label="Navigasi utama">
            {navLinks}
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
                  pathname.startsWith("/admin")
                    ? "text-content"
                    : "text-muted hover:text-content"
                }`}
              >
                <ShieldIcon className="h-4 w-4" />
                Panel Admin
                <span
                  className={`absolute inset-x-3 bottom-0.5 h-[2.5px] rounded-full bg-brand transition-opacity ${
                    pathname.startsWith("/admin") ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />
              </Link>
            )}
          </nav>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <GlobalSearch />
          </div>
          {currentUser && (
            <Link
              href="/bookmarks"
              className={`hidden items-center gap-1.5 px-2 py-1.5 text-sm font-medium transition-colors sm:inline-flex ${
                pathname.startsWith("/bookmarks")
                  ? "text-content"
                  : "text-muted hover:text-content"
              }`}
              aria-label="Tersimpan"
            >
              <BookmarkIcon className="h-4 w-4" />
              <span className="hidden lg:inline">Tersimpan</span>
            </Link>
          )}
          {currentUser && <NotificationsBell />}
          <ThemeToggle />

          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-[5px] border border-border bg-surface px-2 py-1.5 text-sm font-medium text-content transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar name={currentUser.name} size="sm" />
                <span className="hidden sm:inline">{currentUser.name}</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 animate-pop-in overflow-hidden rounded-[6px] border border-border bg-surface-raised shadow-xl"
                >
                  <div className="kop px-4 py-3">
                    <p className="truncate text-sm font-semibold text-content">{currentUser.name}</p>
                    <p className="truncate font-mono text-xs text-muted">{currentUser.email}</p>
                    <span className="badge mt-1.5 text-brand">{currentUser.role}</span>
                  </div>
                  <div className="p-1.5">
                    {resume && (
                      <Link
                        href={`/courses/${resume.courseSlug}/lessons/${resume.lessonId}`}
                        className="flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm text-content hover:bg-surface-hover"
                        role="menuitem"
                      >
                        <PlayIcon className="h-4 w-4 text-brand" /> Lanjut Belajar
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm text-content hover:bg-surface-hover"
                      role="menuitem"
                    >
                      <GridIcon className="h-4 w-4 text-brand" /> Dashboard
                    </Link>
                    {currentUser && (
                      <Link
                        href={`/profile/${currentUser.id}`}
                        className="flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm text-content hover:bg-surface-hover"
                        role="menuitem"
                      >
                        <UserIcon className="h-4 w-4 text-brand" /> Profil saya
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        void logout();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-[4px] px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                      role="menuitem"
                    >
                      <LogoutIcon className="h-4 w-4" /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden whitespace-nowrap sm:inline-flex">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary whitespace-nowrap">
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
                className="flex items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-content"
              >
                <ShieldIcon className="h-4 w-4" /> Panel Admin
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
