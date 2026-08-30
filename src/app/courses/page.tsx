"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { LevelBadge, EmptyState } from "@/components/ui";
import { ProgressBar } from "@/components/progress";
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
      <div className="kop mb-8 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-subtle">
          Buku Induk · AI Learning Community
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-content">
          Pilih mata pelajaranmu.
        </h1>
        <p className="mt-1 text-muted">
          Kursus → Pelajaran → Kuis. Progres tiap pelajaran tercatat di rapormu.
        </p>
      </div>

      {state.interests.length > 0 && (
        <p className="mb-4 text-sm text-muted">
          Minatmu: <span className="font-semibold text-content">{state.interests.join(", ")}</span>
        </p>
      )}

      {/* Kontrol */}
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
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
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
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M5 5h10l4 4v10a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z" />
              <path d="M9 13h6M9 17h4" />
            </svg>
          }
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
        <div key={`${filter}-${sort}-${query}`} className="card overflow-hidden">
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
              {filtered.map((course, i) => {
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
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {course.topics.slice(0, 3).map((t) => (
                          <span key={t} className="badge text-muted">
                            #{t}
                          </span>
                        ))}
                      </div>
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
        </div>
      )}
    </div>
  );
}
