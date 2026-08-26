"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { LevelBadge, EmptyState } from "@/components/ui";
import { ProgressBar } from "@/features/courses/progress";
import { Reveal } from "@/components/reveal";
import type { Level } from "@/lib/types";

const FILTERS: Array<{ value: "semua" | Level; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "pemula", label: "Pemula" },
  { value: "menengah", label: "Menengah" },
  { value: "lanjutan", label: "Lanjutan" },
];

type SortMode = "terbaru" | "populer" | "az";

export default function CoursesPage() {
  const [filter, setFilter] = useState<"semua" | Level>("semua");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("terbaru");
  const { courseProgressPercent, state } = useStore();
  const courses = state.courses;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = courses.filter((c) => filter === "semua" || c.level === filter);
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.topics.some((t) => t.includes(q))
      );
    }
    const sorted = [...list];
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "populer") sorted.sort((a, b) => b.lessonIds.length - a.lessonIds.length);
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [filter, query, sort, courses]);

  return (
    <div className="container-app py-10">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-content">Kursus</h1>
        <p className="text-muted">
          Pilih learning path sesuai level keahlian Anda: Kursus → Pelajaran → Kuis.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`pill ${filter === f.value ? "pill-active" : "pill-idle"}`}
            >
              {f.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="course-sort" className="text-sm text-muted">
              Urutkan
            </label>
            <select
              id="course-sort"
              className="input w-auto py-1.5"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
            >
              <option value="terbaru">Terbaru</option>
              <option value="populer">Populer</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden="true">
            🔍
          </span>
          <input
            className="input pl-9"
            placeholder="Cari kursus berdasarkan judul, deskripsi, atau topik…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Tidak ada kursus yang cocok"
          description="Coba ubah kata kunci atau filter level."
          action={
            <button
              onClick={() => {
                setQuery("");
                setFilter("semua");
              }}
              className="btn-secondary"
            >
              Reset filter
            </button>
          }
        />
      ) : (
        <div key={`${filter}-${sort}-${query}`} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course, i) => {
            const pct = courseProgressPercent(course);
            return (
              <Reveal key={course.id} delay={Math.min(i, 5) * 60} className="h-full">
                <Link
                  href={`/courses/${course.slug}`}
                  className="card card-hover group flex h-full flex-col p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <LevelBadge level={course.level} />
                    <span className="text-xs text-subtle">{course.lessonIds.length} pelajaran</span>
                  </div>
                  <h2 className="mb-2 text-lg font-semibold text-content group-hover:text-brand">
                    {course.title}
                  </h2>
                  <p className="mb-4 flex-1 text-sm leading-6 text-muted">{course.description}</p>

                  <div className="mb-2 flex justify-between text-xs text-muted">
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />

                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.topics.map((t) => (
                      <span key={t} className="badge bg-surface-hover text-muted">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
