"use client";

// Detail Jalur Belajar (fitur Lab) — stepper vertikal ala roadmap.sh dengan
// mastery gate antar kursus. Progres dihitung dari progress pelajaran existing.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { learningPathBySlug, LEVEL_BADGE, LEVEL_LABEL } from "@/lib/data";
import {
  coursePercent,
  nextPathLesson,
  PATH_MASTERY_THRESHOLD,
  pathCourseStatuses,
  pathIsComplete,
  pathLessonIds,
  pathProgressPercent,
  resolvePathCourses,
} from "@/lib/learning-path";
import { useLabFlag, usePathBypass } from "@/lib/flags";
import { ProgressBar } from "@/components/progress";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/components/toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  claimPathBonusRemote,
  enrollPathRemote,
  fetchMyEnrollments,
  markPathCourseDoneRemote,
  PATH_BONUS_POINTS,
  unenrollPathRemote,
  type PathEnrollmentRow,
} from "@/lib/store/paths-remote";

export default function PathDetailPage() {
  const params = useParams<{ slug: string }>();
  const { state, awardPoints, syncBadges } = useStore();
  const { toast } = useToast();
  const [enabled, , flagReady] = useLabFlag("learning-paths");
  const [bypass, setBypass] = usePathBypass(params.slug);

  const isLoggedIn = state.currentUserId != null;
  const remoteOn = isSupabaseConfigured();
  const path = learningPathBySlug(params.slug);

  // Enrollment (persist Supabase) — semua hook sebelum early-return agar
  // tidak melanggar Rules of Hooks.
  const [enrollment, setEnrollment] = useState<PathEnrollmentRow | null>(null);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);

  const loadEnrollment = useCallback(async () => {
    if (!remoteOn || !isLoggedIn) {
      setEnrollment(null);
      return;
    }
    try {
      const rows = await fetchMyEnrollments();
      setEnrollment(rows.find((r) => r.pathSlug === params.slug) ?? null);
    } catch (e) {
      console.warn("[paths] gagal memuat enrollment:", e);
    }
  }, [remoteOn, isLoggedIn, params.slug]);

  useEffect(() => {
    void loadEnrollment();
  }, [loadEnrollment]);

  // Sinkron kursus yang 100% selesai ke enrollment (idempoten di sisi DB).
  const doneSlugs = path
    ? resolvePathCourses(path, state.courses)
        .filter((c) => coursePercent(c, state.progress) === 100)
        .map((c) => c.slug)
        .join(",")
    : "";

  useEffect(() => {
    if (!path || !enrollment) return;
    const missing = doneSlugs
      .split(",")
      .filter(Boolean)
      .filter((s) => !enrollment.completedCourses.includes(s));
    if (missing.length === 0) return;
    let cancelled = false;
    void (async () => {
      for (const slug of missing) {
        try {
          await markPathCourseDoneRemote(path.slug, slug);
        } catch (e) {
          console.warn("[paths] gagal menandai kursus jalur:", e);
          return;
        }
      }
      if (!cancelled) await loadEnrollment();
    })();
    return () => {
      cancelled = true;
    };
  }, [path, enrollment, doneSlugs, loadEnrollment]);

  if (!path) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Jalur tidak ditemukan</h1>
        <Link href="/paths" className="btn-primary mt-4">
          Kembali ke daftar jalur
        </Link>
      </div>
    );
  }

  if (flagReady && !enabled) {
    return (
      <div className="container-app py-16 text-center">
        <p className="mb-3 text-4xl" aria-hidden="true">🧪</p>
        <h1 className="text-2xl font-bold text-content">Jalur Belajar sedang di Lab</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Fitur ini nonaktif di perangkatmu. Aktifkan dari halaman Lab untuk mencobanya.
        </p>
        <Link href="/labs" className="btn-primary mt-5">
          Buka Lab
        </Link>
      </div>
    );
  }

  const statuses = pathCourseStatuses(path, state.courses, state.progress, bypass);
  const pct = pathProgressPercent(path, state.courses, state.progress);
  const complete = pathIsComplete(path, state.courses, state.progress);
  const lessonCount = pathLessonIds(path, state.courses).length;
  const next = nextPathLesson(path, state.courses, state.progress, bypass);
  const missingCourses = path.courseIds.length - statuses.length;

  async function handleEnroll() {
    setEnrollBusy(true);
    try {
      await enrollPathRemote(path!.slug, path!.title);
      toast(`Kamu mengikuti jalur "${path!.title}"!`, "success");
      await loadEnrollment();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal mengikuti jalur.", "error");
    } finally {
      setEnrollBusy(false);
    }
  }

  async function handleUnenroll() {
    setEnrollBusy(true);
    try {
      await unenrollPathRemote(path!.slug);
      toast("Jalur ditinggalkan.", "info");
      setEnrollment(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal meninggalkan jalur.", "error");
    } finally {
      setEnrollBusy(false);
    }
  }

  async function handleClaimBonus() {
    setClaimBusy(true);
    try {
      const pts = await claimPathBonusRemote(path!.slug, statuses.length);
      if (pts > 0) {
        awardPoints(pts);
        toast(`Bonus kelulusan jalur +${pts} poin!`, "success");
        const newBadges = await syncBadges();
        if (newBadges.includes("path-graduate")) {
          toast("Badge baru: 🏆 Lulus Jalur!", "success");
        }
      } else {
        toast("Bonus jalur ini sudah pernah diklaim.", "info");
      }
      await loadEnrollment();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal klaim bonus.", "error");
    } finally {
      setClaimBusy(false);
    }
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs items={[{ label: "Jalur", href: "/paths" }, { label: path.title }]} />

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{path.emoji}</span>
          <h1 className="text-3xl font-bold text-content">{path.title}</h1>
          <span className={`badge ${LEVEL_BADGE[path.level] ?? "bg-surface-hover text-muted"}`}>
            {LEVEL_LABEL[path.level] ?? path.level}
          </span>
          <span className="badge bg-brand-soft text-brand">Beta</span>
        </div>
        <p className="max-w-3xl text-muted">{path.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span>📚 {statuses.length} kursus</span>
          <span>📝 {lessonCount} pelajaran</span>
          <span>⏱ ±{path.estimatedHours} jam</span>
          {path.tags.map((t) => (
            <span key={t} className="text-xs">#{t}</span>
          ))}
        </div>
        {missingCourses > 0 && (
          <p className="mt-2 text-xs text-warning">
            ⚠️ {missingCourses} kursus dalam jalur ini belum tersedia di katalog.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Progress agregat */}
          <div className="card p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-content">Progress jalur</span>
              <span className="text-sm font-semibold text-brand">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="h-3" />
            {complete ? (
              <div className="mt-4 rounded-lg bg-success-soft p-4 text-sm text-success">
                🎉 Selamat, kamu menyelesaikan jalur ini! Klaim sertifikat di tiap halaman kursus
                bila belum.
              </div>
            ) : next ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  Lanjutkan: <span className="font-medium text-content">{next.course.title}</span>
                </p>
                <Link
                  href={`/courses/${next.course.slug}/lessons/${next.lessonId}`}
                  className="btn-primary"
                >
                  ▶ Lanjutkan belajar
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Belum ada pelajaran yang bisa dilanjutkan — kursus dalam jalur ini belum tersedia.
              </p>
            )}
          </div>

          {/* Enrollment (persist Supabase) */}
          {remoteOn ? (
            isLoggedIn ? (
              <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-content">
                    {enrollment ? "✅ Kamu mengikuti jalur ini" : "Ikuti jalur ini"}
                  </p>
                  <p className="text-xs text-muted">
                    {enrollment
                      ? `${enrollment.completedCourses.length}/${statuses.length} kursus tercatat selesai${enrollment.bonusAwarded ? " · bonus sudah diklaim" : ""}.`
                      : "Catat progres per kursus & klaim bonus +50 poin saat seluruh kursus selesai."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {enrollment && complete && !enrollment.bonusAwarded && (
                    <button
                      type="button"
                      onClick={() => void handleClaimBonus()}
                      disabled={claimBusy}
                      className="btn-primary"
                    >
                      {claimBusy ? "Memproses…" : `🎁 Klaim bonus +${PATH_BONUS_POINTS} poin`}
                    </button>
                  )}
                  {enrollment ? (
                    <button
                      type="button"
                      onClick={() => void handleUnenroll()}
                      disabled={enrollBusy}
                      className="btn-secondary text-sm"
                    >
                      Tinggalkan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleEnroll()}
                      disabled={enrollBusy}
                      className="btn-primary"
                    >
                      {enrollBusy ? "Memproses…" : "🗺️ Ikuti Jalur"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
                <p className="text-sm text-muted">
                  Masuk untuk mengikuti jalur, mencatat progres per kursus, dan mengumpulkan bonus
                  kelulusan.
                </p>
                <Link href={`/login?redirect=/paths/${path.slug}`} className="btn-primary shrink-0">
                  Masuk untuk ikuti jalur
                </Link>
              </div>
            )
          ) : (
            <div className="card p-5 text-sm text-muted">
              Mode offline — pendaftaran jalur tersedia saat backend aktif.
            </div>
          )}

          {/* Mode bebas (bypass mastery gate) */}
          {!complete && (
            <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold text-content">Mode bebas</p>
                <p className="text-xs text-muted">
                  Lewati mastery gate — buka semua kursus tanpa harus menyelesaikan 80% kursus
                  sebelumnya.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={bypass}
                aria-label={bypass ? "Nonaktifkan mode bebas" : "Aktifkan mode bebas"}
                onClick={() => setBypass(!bypass)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  bypass ? "bg-brand" : "bg-surface-hover"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    bypass ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Stepper kursus (ala roadmap.sh) */}
          <h2 className="text-xl font-bold text-content">Rute belajar</h2>
          <ol className="space-y-0">
            {statuses.map((st, i) => {
              const isLast = i === statuses.length - 1;
              const active = st.unlocked && !st.done && next?.course.id === st.course.id;
              return (
                <li key={st.course.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Garis penghubung */}
                  {!isLast && (
                    <span
                      className="absolute left-[17px] top-9 h-full w-0.5 bg-border"
                      aria-hidden="true"
                    />
                  )}
                  {/* Marker node */}
                  <span
                    className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                      st.done
                        ? "border-success bg-success text-white"
                        : active
                          ? "border-brand bg-brand text-white"
                          : st.unlocked
                            ? "border-border bg-surface text-muted"
                            : "border-border bg-surface-hover text-subtle"
                    }`}
                    aria-hidden="true"
                  >
                    {st.done ? "✓" : st.unlocked ? st.index + 1 : "🔒"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`card p-5 ${active ? "ring-2 ring-brand-ring" : ""} ${!st.unlocked ? "opacity-70" : ""}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-content">{st.course.title}</h3>
                          <p className="line-clamp-2 text-sm text-muted">{st.course.description}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {st.done ? (
                            <span className="badge bg-success-soft text-success">Selesai</span>
                          ) : st.unlocked ? null : (
                            <span className="badge bg-surface-hover text-subtle">Terkunci</span>
                          )}
                          {st.unlocked && (
                            <Link href={`/courses/${st.course.slug}`} className="btn-secondary px-3 py-1.5 text-sm">
                              Buka kursus
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={st.percent} className="h-1.5 flex-1" />
                        <span className="shrink-0 text-xs font-semibold text-muted">{st.percent}%</span>
                      </div>

                      {!st.unlocked && (
                        <p className="mt-2 text-xs text-subtle">
                          🔒 Selesaikan minimal {Math.round(PATH_MASTERY_THRESHOLD * 100)}% kursus
                          sebelumnya untuk membuka — atau aktifkan mode bebas.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Side: outcomes */}
        <aside className="lg:col-span-1">
          <div className="card sticky top-20 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-subtle">
              Yang akan kamu kuasai
            </h3>
            <ul className="space-y-3">
              {path.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm text-content">
                  <span className="mt-0.5 text-success" aria-hidden="true">✓</span>
                  {o}
                </li>
              ))}
            </ul>
            {!state.currentUserId && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 text-xs text-muted">
                  Masuk untuk mencatat progres dan membuka sertifikat di akhir jalur.
                </p>
                <Link href={`/login?redirect=/paths/${path.slug}`} className="btn-primary w-full text-center text-sm">
                  Masuk untuk mulai
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
