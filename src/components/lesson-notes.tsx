"use client";

// Catatan Pribadi per Pelajaran (Lane C) — panel collapsible di halaman
// pelajaran. Privat per user (RLS owner-only, tabel lesson_notes), autosave
// dengan debounce + simpan saat blur. Butuh Supabase aktif + login (sama
// seperti fitur personal lain di app ini, mis. progress/bookmark).
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchLessonNote, saveLessonNote } from "@/lib/store/notes-remote";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 900;

export function LessonNotes({ lessonId }: { lessonId: number }) {
  const { state } = useStore();
  const isLoggedIn = state.currentUserId != null;
  const remoteOn = isSupabaseConfigured();

  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedContentRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn || !remoteOn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchLessonNote(lessonId)
      .then((note) => {
        if (cancelled) return;
        const initial = note?.content ?? "";
        setContent(initial);
        savedContentRef.current = initial;
        setSaveState("idle");
      })
      .catch(() => {
        if (!cancelled) setErrorMsg("Gagal memuat catatan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lessonId, isLoggedIn, remoteOn]);

  const persist = useCallback(
    (value: string) => {
      if (value === savedContentRef.current) return;
      setSaveState("saving");
      saveLessonNote(lessonId, value)
        .then(() => {
          savedContentRef.current = value;
          setSaveState("saved");
          setErrorMsg(null);
        })
        .catch((e) => {
          setSaveState("error");
          setErrorMsg(e instanceof Error ? e.message : "Gagal menyimpan catatan.");
        });
    },
    [lessonId]
  );

  function handleChange(value: string) {
    setContent(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(value), AUTOSAVE_DELAY_MS);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    persist(content);
  }

  // Fitur butuh backend nyata (lintas-device) — sembunyikan diam-diam bila
  // Supabase belum dikonfigurasi, daripada menampilkan fitur yang tidak jalan.
  if (!remoteOn) return null;

  return (
    <section className="card mt-8 p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-semibold text-content">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 17.5V6a2 2 0 012-2h9l5 5v8.5a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
            <path d="M14 4v5h5M8 13h8M8 16.5h5" />
          </svg>
          Catatan Saya
          {!loading && content.trim() && (
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" title="Ada catatan" />
          )}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 010-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="mt-3">
          {!isLoggedIn ? (
            <p className="text-sm text-muted">
              Catatan pribadi tersimpan otomatis dan hanya bisa dilihat olehmu.{" "}
              <a href="/login" className="font-medium text-brand hover:underline">
                Masuk
              </a>{" "}
              untuk mulai menulis.
            </p>
          ) : loading ? (
            <div className="h-28 animate-pulse rounded-lg bg-surface-hover" />
          ) : (
            <>
              <textarea
                className="input min-h-[7rem] text-sm"
                placeholder="Tulis catatan pribadimu tentang pelajaran ini — hanya kamu yang bisa melihatnya…"
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
              />
              <div className="mt-1.5 flex items-center justify-end text-xs">
                <span
                  className={
                    saveState === "error"
                      ? "text-danger"
                      : saveState === "saving"
                        ? "text-muted"
                        : "text-success"
                  }
                >
                  {saveState === "error"
                    ? errorMsg ?? "Gagal menyimpan"
                    : saveState === "saving"
                      ? "Menyimpan…"
                      : saveState === "saved"
                        ? "Tersimpan otomatis"
                        : "\u00A0"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
