"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { LevelBadge } from "@/components/ui";
import { Reveal } from "@/components/reveal";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Tutor dalam Konteks",
    desc: "Tanya jawab langsung di samping materi. Tutor hanya menjawab sesuai pelajaran aktif dan menolak di luar topik.",
  },
  {
    icon: "📚",
    title: "Learning Path Terstruktur",
    desc: "Kursus → Pelajaran → Kuis dengan level Pemula, Menengah, dan Lanjutan. Progress terlacak otomatis.",
  },
  {
    icon: "💬",
    title: "Forum Diskusi",
    desc: "Thread dengan tags, komentar bersarang, voting, dan pencarian untuk belajar bersama komunitas.",
  },
  {
    icon: "🚀",
    title: "Showcase Proyek",
    desc: "Publikasikan proyek Anda, terima feedback, dan temukan inspirasi dari karya pembelajar lain.",
  },
];

export default function Home() {
  const { state } = useStore();
  const courses = state.courses;
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-soft/60 to-bg">
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--brand-soft),transparent_70%)]"
          aria-hidden="true"
        />
        <span className="pointer-events-none absolute -left-16 top-10 h-64 w-64 animate-float rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 animate-float rounded-full bg-brand/10 blur-3xl" style={{ animationDelay: "1.5s" }} aria-hidden="true" />
        <div className="container-app relative flex flex-col items-center gap-6 py-16 text-center sm:py-24">
          <span className="badge animate-fade-in bg-brand-soft text-brand">
            Platform komunitas belajar AI/ML
          </span>
          <h1 className="max-w-3xl animate-slide-up text-4xl font-bold tracking-tight text-content sm:text-5xl">
            Belajar AI &amp; Machine Learning{" "}
            <span className="text-gradient">bersama komunitas</span>
          </h1>
          <p className="max-w-2xl animate-slide-up text-lg text-muted" style={{ animationDelay: "80ms" }}>
            Learning path terstruktur, AI tutor yang fokus pada materi, forum
            diskusi, dan showcase proyek — semua dalam Bahasa Indonesia.
          </p>
          <div className="flex animate-slide-up flex-wrap items-center justify-center gap-3" style={{ animationDelay: "160ms" }}>
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Mulai Belajar Gratis
            </Link>
            <Link href="/courses" className="btn-secondary px-6 py-3 text-base">
              Jelajahi Kursus
            </Link>
          </div>
          <p className="animate-fade-in text-sm text-muted" style={{ animationDelay: "240ms" }}>
            Waktu dari daftar sampai belajar pertama &lt; 3 menit.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container-app py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} className="h-full">
              <div className="card card-hover h-full p-6">
                <div className="mb-3 text-3xl" aria-hidden="true">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-content">{f.title}</h3>
                <p className="text-sm leading-6 text-muted">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="border-t border-border bg-surface">
        <div className="container-app py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-content">Kursus Unggulan</h2>
              <p className="text-muted">Mulai dari jalur yang paling sesuai level Anda.</p>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-brand hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {courses.map((course, i) => (
              <Reveal key={course.id} delay={i * 100} className="h-full">
                <Link
                  href={`/courses/${course.slug}`}
                  className="card card-hover group flex h-full flex-col p-6"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <LevelBadge level={course.level} />
                    <span className="text-xs text-subtle">
                      {course.lessonIds.length} pelajaran
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-content group-hover:text-brand">
                    {course.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-6 text-muted">
                    {course.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {course.topics.map((t) => (
                      <span key={t} className="badge bg-surface-hover text-muted">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface">
        <div className="container-app flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-content sm:text-3xl">
            Siap memulai perjalanan belajar Anda?
          </h2>
          <p className="max-w-xl text-muted">
            Daftar gratis, pilih minat Anda, dan mulai pelajaran pertama dalam
            hitungan menit.
          </p>
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Buat Akun Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}
