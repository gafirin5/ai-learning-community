"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { recommendCourses } from "@/lib/recommendations";
import { LevelBadge } from "@/components/ui";

export function RecommendedCourses() {
  const { state } = useStore();
  const rec = useMemo(() => recommendCourses(state.courses, state.interests, 3), [state.courses, state.interests]);
  if (rec.length === 0) return null;
  const hasInterests = state.interests.length > 0;
  return (
    <section className="card p-6">
      <h2 className="mb-1 font-semibold text-content">{hasInterests ? "Untuk kamu" : "Mulai belajar"}</h2>
      <p className="mb-4 text-sm text-muted">
        {hasInterests ? "Rekomendasi berdasarkan minat yang kamu pilih di onboarding." : "Pilih minat di onboarding untuk rekomendasi personal."}
      </p>
      <ul className="space-y-3">
        {rec.map((c) => (
          <li key={c.id}>
            <Link href={`/courses/${c.slug}`} className="block rounded-lg border border-border p-3 hover:bg-surface-hover">
              <span className="font-medium text-content">{c.title}</span>
              <span className="ml-2"><LevelBadge level={c.level} /></span>
              <p className="mt-1 text-xs text-muted line-clamp-2">{c.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      {!hasInterests && <Link href="/onboarding" className="btn-secondary mt-4 w-full">Atur minat</Link>}
    </section>
  );
}
