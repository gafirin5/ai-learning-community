"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { learningPaths, LEVEL_BADGE, LEVEL_LABEL } from "@/lib/data";
import { useLeaderboardBoard } from "@/lib/use-leaderboard";
import { LevelBadge } from "@/components/ui";
import { ProgressBar } from "@/components/progress";

/* -- Garis tinta menerus: jalur digambar satu tarikan mengikuti scroll. -- */
function InkLine() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [height, setHeight] = useState(0);

  // Ukur tinggi bingkai + posisi stasiun (titik) dari DOM sungguhan.
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    setHeight(wrap.offsetHeight);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    const path = pathRef.current;
    const wrap = wrapRef.current;
    if (!path || !wrap || !height) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh * 0.9 - rect.top) / (rect.height || 1)));
      path.style.strokeDashoffset = String(len * (1 - progress));
    };
    if (reduce) {
      path.style.strokeDashoffset = "0";
      return;
    }
    let raf = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(update, 150);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const io = new IntersectionObserver(update, { threshold: [0, 0.5, 1] });
    io.observe(wrap);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
      clearTimeout(settleTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [height]);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-y-2 left-5 hidden w-10 md:block" aria-hidden="true">
      {height > 0 && (
        <svg width="40" height={height} viewBox={`0 0 40 ${height}`} className="overflow-visible">
          <path
            ref={pathRef}
            d={`M20 8 C 34 ${height * 0.18}, 6 ${height * 0.3}, 20 ${height * 0.42} S 36 ${height * 0.68}, 20 ${height * 0.8} S 10 ${height * 0.94}, 20 ${height - 8}`}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}

/* -- Ikon register: panah suara & jempol, satu set dengan ikon header. -- */
function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5m0 0l-6 6m6-6l6 6" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.7 4.5 6.9 4.5c2 0 3.7 1.1 5.1 3 1.4-1.9 3.1-3 5.1-3 3.2 0 5.4 3.1 4.2 6.3C19.5 15.4 12 20 12 20z" />
    </svg>
  );
}

/* -- Entri register: format tanggal singkat. -- */
function tgl(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function Home() {
  const { state, courseProgressPercent } = useStore();
  const { board: boardAll, loading: boardLoading } = useLeaderboardBoard("all");
  const courses = state.courses.slice(0, 4);
  const totalLessons = state.courses.reduce((a, c) => a + c.lessonIds.length, 0);
  const threads = [...state.threads]
    .filter((t) => !t.hidden)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const projects = [...state.projects]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const top3 = boardAll.slice(0, 3);

  return (
    <div>
      {/* ================= HERO — satu lembar rapor terbuka ================= */}
      <section className="border-b border-border">
        <div className="container-app py-10 sm:py-14">
          <div className="mx-auto max-w-4xl animate-fade-in rounded-[6px] border border-border bg-surface shadow-lg">
            <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-10">
              <div>
                <p className="text-xl font-extrabold uppercase leading-tight tracking-[0.09em] text-content sm:text-2xl">
                  AI Learning Community
                </p>
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  Komunitas belajar AI/ML · Rapor Belajar · Tahun Ajaran 2026/2027
                </p>
              </div>
              <span className="stamp mt-1 hidden animate-stamp-in text-danger sm:inline-block" style={{ animationDelay: "0.5s" }}>
                Gratis
              </span>
            </div>
            <div className="kop mx-6 sm:mx-10" />

            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.04] tracking-tight text-content sm:text-5xl">
                Isi rapormu.{" "}
                <span className="text-brand">Belajar AI/ML, tercatat resmi.</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
                Kursus terstruktur, AI tutor dalam konteks materi, forum, dan
                showcase proyek — setiap langkah tercatat, distempel, dan bisa
                kamu pamerkan.
              </p>
            </div>

            {/* Tabel Nilai — kursus nyata */}
            <div className="border-t border-border">
              <table className="table-ledger">
                <thead>
                  <tr>
                    <th className="w-12">No.</th>
                    <th>Mata Pelajaran</th>
                    <th className="hidden sm:table-cell">Level</th>
                    <th className="hidden text-right md:table-cell">Pelajaran</th>
                    <th className="w-32 sm:w-44">Progres</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, i) => {
                    const pct = courseProgressPercent(course);
                    return (
                      <tr key={course.id}>
                        <td className="num-tabular align-top text-subtle">{String(i + 1).padStart(2, "0")}</td>
                        <td className="align-top">
                          <Link
                            href={`/courses/${course.slug}`}
                            className="font-semibold text-content hover:text-brand hover:underline"
                          >
                            {course.title}
                          </Link>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{course.description}</p>
                        </td>
                        <td className="hidden align-top sm:table-cell">
                          <LevelBadge level={course.level} />
                        </td>
                        <td className="num-tabular hidden text-right align-top md:table-cell">
                          {course.lessonIds.length}
                        </td>
                        <td className="align-top">
                          <ProgressBar value={pct} />
                          <span className="num-tabular mt-1 block text-xs text-subtle">{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-4 pb-4 pt-2 text-xs text-subtle sm:px-4">
                Progres terisi otomatis saat kamu menyelesaikan pelajaran.{" "}
                <Link href="/courses" className="font-semibold text-brand hover:underline">
                  Lihat semua kursus →
                </Link>
              </p>
            </div>

            {/* Kaki lembar: tanda tangan pengunjung — aksi utama di sini. */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-content px-6 py-5 sm:px-10">
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/register" className="btn-primary px-6 py-3 text-base">
                  Mulai — Isi Rapormu
                </Link>
                <Link href="/courses" className="btn-secondary px-6 py-3 text-base">
                  Jelajahi Kursus
                </Link>
              </div>
              <p className="num-tabular text-xs text-subtle">
                Daftar → pelajaran pertama &lt; 3 menit · {totalLessons} pelajaran aktif
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= REGISTER KELAS — aktivitas nyata ================= */}
      <section className="border-b border-border bg-surface">
        <div className="container-app py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">
            Lihat kelas yang sedang belajar.
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Register kelas hari ini — diskusi dan proyek dari sesama pembelajar.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="kop px-5 pb-3 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.09em] text-muted">
                  Register Diskusi
                </p>
              </div>
              <ul>
                {threads.map((t) => (
                  <li key={t.id} className="border-b border-border/70 last:border-b-0">
                    <Link href={`/forum/${t.id}`} className="group flex items-baseline gap-3 px-5 py-3.5 hover:bg-surface-hover">
                      <span className="num-tabular shrink-0 text-xs text-subtle">{tgl(t.createdAt)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-content group-hover:text-brand">
                        {t.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                        <span className="num-tabular">{t.voteCount}</span>
                        <ArrowUpIcon className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="kop px-5 pb-3 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.09em] text-muted">
                  Register Proyek
                </p>
              </div>
              <ul>
                {projects.map((p) => (
                  <li key={p.id} className="border-b border-border/70 last:border-b-0">
                    <Link href="/projects" className="group flex items-baseline gap-3 px-5 py-3.5 hover:bg-surface-hover">
                      <span className="num-tabular shrink-0 text-xs text-subtle">{tgl(p.createdAt)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-content group-hover:text-brand">
                        {p.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                        <span className="num-tabular">{p.likeCount}</span>
                        <HeartIcon className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= JALUR — garis tinta menerus ================= */}
      <section className="border-b border-border">
        <div className="container-app py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">
            Ikuti garisnya.
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Jalur belajar terkurasi: selesaikan 80% satu kursus, kursus
            berikutnya terbuka — satu garis tinta dari pemula sampai mahir.
          </p>
          <div className="relative mt-10 md:pl-16">
            <InkLine />
            <ul className="space-y-6">
              {learningPaths.map((path) => {
                const courseCount = path.courseIds.filter((id) =>
                  state.courses.some((c) => c.id === id)
                ).length;
                return (
                  <li key={path.id} className="relative md:pl-2">
                    <span
                      className="absolute -left-[42px] top-1.5 hidden h-3.5 w-3.5 rounded-full border-2 border-brand bg-surface md:block"
                      aria-hidden="true"
                    />
                    <div className="card card-hover flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-content">{path.title}</h3>
                          <span className={`badge shrink-0 ${LEVEL_BADGE[path.level] ?? "text-muted"}`}>
                            {LEVEL_LABEL[path.level] ?? path.level}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-muted">{path.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="num-tabular hidden text-xs text-subtle sm:block">
                          {courseCount} kursus · ±{path.estimatedHours} jam
                        </span>
                        <Link href={`/paths/${path.slug}`} className="btn-secondary">
                          Ikuti jalur
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= PERANGKAT KELAS — buku induk ================= */}
      <section className="border-b border-border bg-surface">
        <div className="container-app py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">
            Gunakan perangkat kelasnya.
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Empat perangkat yang membuat rapormu terisi lebih cepat.
          </p>
          <ul className="mt-8">
            {[
              {
                no: "01",
                title: "AI Tutor dalam Konteks",
                desc: "Tanya jawab di samping materi — hanya menjawab sesuai pelajaran aktif, menolak di luar topik.",
                href: "/courses",
                cta: "Coba di pelajaran",
              },
              {
                no: "02",
                title: "Forum Diskusi",
                desc: "Thread bertags, komentar bersarang, voting — belajar bersama satu komunitas.",
                href: "/forum",
                cta: "Buka forum",
              },
              {
                no: "03",
                title: "Showcase Proyek",
                desc: "Publikasikan karyamu, terima feedback, dan kumpulkan jempol dari pembelajar lain.",
                href: "/projects",
                cta: "Lihat proyek",
              },
              {
                no: "04",
                title: "Mentor & Jadwal",
                desc: "Booking sesi mentor, review kode, dan percakapan karier yang benar-benar terjadi.",
                href: "/mentor",
                cta: "Temui mentor",
              },
            ].map((row) => (
              <li key={row.no} className="border-b border-border last:border-b-0">
                <Link
                  href={row.href}
                  className="group flex flex-col gap-2 py-5 transition-colors sm:flex-row sm:items-center sm:gap-6"
                >
                  <span className="num-tabular text-sm text-subtle">{row.no}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-content group-hover:text-brand">{row.title}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-muted">{row.desc}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-brand">
                    {row.cta} <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= PAPAN PERINGKAT ================= */}
      <section className="border-b border-border">
        <div className="container-app py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">
                Kalahkan papan peringkat.
              </h2>
              <p className="mt-2 max-w-2xl text-muted">
                Poin dari belajar dan kontribusi. Naik peringkat dengan menyelesaikan pelajaran dan membantu kelas.
              </p>
            </div>
            <Link href="/leaderboard" className="text-sm font-semibold text-brand hover:underline">
              Papan penuh →
            </Link>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {boardLoading
              ? [0, 1, 2].map((i) => (
                  <li key={i}>
                    <div className="card flex items-center gap-4 p-5" aria-busy="true">
                      <span className="skeleton h-9 w-8" />
                      <span className="min-w-0 flex-1 space-y-2">
                        <span className="skeleton block h-4 w-28" />
                        <span className="skeleton block h-3 w-20" />
                      </span>
                    </div>
                  </li>
                ))
              : top3.map((r, i) => (
                  <li key={r.user.id}>
                    <Link
                      href={`/profile/${r.user.id}`}
                      className="card card-hover flex items-center gap-4 p-5"
                    >
                      <span className={`num-tabular text-4xl font-extrabold ${i === 0 ? "text-brand" : "text-content"}`}>
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-content">{r.user.name}</span>
                        <span className="num-tabular block text-sm text-muted">{r.points} poin</span>
                      </span>
                      {r.isYou && <span className="badge ml-auto shrink-0 text-brand">Kamu</span>}
                    </Link>
                  </li>
                ))}
          </ol>
        </div>
      </section>

      {/* ================= PENDAFTARAN ================= */}
      <section className="bg-surface">
        <div className="container-app py-16">
          <div className="mx-auto max-w-2xl rounded-[6px] border-2 border-content p-8 text-center sm:p-10">
            <p className="num-tabular text-xs uppercase tracking-[0.14em] text-muted">
              Formulir Pendaftaran · No. 0001
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-content sm:text-4xl">
              Daftarkan dirimu.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Gratis selamanya. Pilih minatmu, masuk ke pelajaran pertama, dan
              biarkan rapormu terisi.
            </p>
            <Link href="/register" className="btn-primary mt-7 px-8 py-3 text-base">
              Buat Akun Sekarang
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
