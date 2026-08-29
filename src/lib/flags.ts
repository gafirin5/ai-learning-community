"use client";

// Learning Lab — feature flag eksperimental. Tersimpan di localStorage terpisah
// (aic-lab-flags-v1) agar tidak menyentuh store/slice milik lane lain.
import { useCallback, useEffect, useState } from "react";

export type LabFeatureId = "learning-paths" | "flashcards";

export interface LabFeatureMeta {
  id: LabFeatureId;
  emoji: string;
  title: string;
  description: string;
  status: "beta" | "eksperimental";
  defaultOn: boolean;
  href?: string;
}

export const LAB_FEATURES: LabFeatureMeta[] = [
  {
    id: "learning-paths",
    emoji: "🗺️",
    title: "Jalur Belajar",
    description:
      "Rangkaian kursus terkurasi dengan mastery gate: kursus berikutnya terbuka setelah kursus sebelumnya selesai ≥80%. Progres dihitung otomatis dari pelajaran yang sudah kamu selesaikan.",
    status: "beta",
    defaultOn: true,
    href: "/paths",
  },
  {
    id: "flashcards",
    emoji: "🃏",
    title: "Kartu Hafalan (SRS)",
    description:
      "Flashcard dengan algoritma spaced repetition SM-2 — ulangi materi tepat sebelum lupa. Fitur baru: aktifkan dari Lab lalu buka halaman Kartu Hafalan.",
    status: "eksperimental",
    defaultOn: false,
    href: "/flashcards",
  },
];

const STORAGE_KEY = "aic-lab-flags-v1";
const CHANGE_EVENT = "aic-lab-flags-change";

function defaults(): Record<LabFeatureId, boolean> {
  return Object.fromEntries(LAB_FEATURES.map((f) => [f.id, f.defaultOn])) as Record<
    LabFeatureId,
    boolean
  >;
}

export function readLabFlags(): Record<LabFeatureId, boolean> {
  const flags = defaults();
  if (typeof window === "undefined") return flags;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return flags;
    const parsed = JSON.parse(raw) as Partial<Record<LabFeatureId, unknown>>;
    for (const f of LAB_FEATURES) {
      if (typeof parsed[f.id] === "boolean") flags[f.id] = parsed[f.id] as boolean;
    }
    return flags;
  } catch {
    return flags;
  }
}

export function setLabFlag(id: LabFeatureId, enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const flags = readLabFlags();
    flags[id] = enabled;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // localStorage penuh/diblokir — flag tetap efektif di sesi memori via state hook.
  }
}

// Mode bebas jalur (bypass mastery gate) — disimpan per slug, model hybrid
// hasil riset desain learning path (gate ketat bikin fast-learner frustrasi).
const BYPASS_KEY = "aic-path-bypass-v1";
const BYPASS_EVENT = "aic-path-bypass-change";

export function readPathBypasses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(BYPASS_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

export function setPathBypass(slug: string, on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const set = new Set(readPathBypasses());
    if (on) set.add(slug);
    else set.delete(slug);
    window.localStorage.setItem(BYPASS_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent(BYPASS_EVENT));
  } catch {
    // abaikan — mode bebas tetap efektif di sesi memori via state hook.
  }
}

export function usePathBypass(slug: string): [boolean, (on: boolean) => void, boolean] {
  const [on, setOnState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOnState(readPathBypasses().includes(slug));
    setReady(true);
    const onChange = () => setOnState(readPathBypasses().includes(slug));
    window.addEventListener(BYPASS_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(BYPASS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [slug]);

  const setOn = useCallback(
    (next: boolean) => {
      setPathBypass(slug, next);
      setOnState(next);
    },
    [slug]
  );

  return [on, setOn, ready];
}

/**
 * Hook client: baca flag setelah mount (aman hydration), subscribe perubahan
 * lintas komponen/tab. `ready` false saat SSR & frame pertama — pakai untuk
 * menghindari kedip UI sebelum flag terbaca.
 */
export function useLabFlag(id: LabFeatureId): [boolean, (on: boolean) => void, boolean] {
  const [enabled, setEnabledState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnabledState(readLabFlags()[id]);
    setReady(true);
    const onChange = () => setEnabledState(readLabFlags()[id]);
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [id]);

  const setEnabled = useCallback(
    (on: boolean) => {
      setLabFlag(id, on);
      setEnabledState(on);
    },
    [id]
  );

  return [enabled, setEnabled, ready];
}
