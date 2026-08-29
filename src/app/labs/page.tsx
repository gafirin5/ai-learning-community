"use client";

// 🧪 Lab — halaman eksperimental: fitur baru bisa diaktifkan/nonaktifkan di sini
// sebelum dipromosikan ke navigasi utama. Lihat src/lib/flags.ts.
import Link from "next/link";
import { LAB_FEATURES, useLabFlag, type LabFeatureMeta } from "@/lib/flags";

const STATUS_BADGE: Record<LabFeatureMeta["status"], string> = {
  beta: "bg-brand-soft text-brand",
  eksperimental: "bg-warning-soft text-warning",
};

function FeatureCard({ meta }: { meta: LabFeatureMeta }) {
  const [enabled, setEnabled, ready] = useLabFlag(meta.id);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-content">
              <span aria-hidden="true">{meta.emoji}</span> {meta.title}
            </h3>
            <span className={`badge shrink-0 ${STATUS_BADGE[meta.status]}`}>{meta.status}</span>
          </div>
          <p className="mt-2 text-sm text-muted">{meta.description}</p>
        </div>

        {/* Switch toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Nonaktifkan" : "Aktifkan"} fitur ${meta.title}`}
          onClick={() => setEnabled(!enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-brand" : "bg-surface-hover"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {meta.href && (
        <div className="mt-4">
          {enabled ? (
            <Link href={meta.href} className="btn-secondary text-sm">
              Buka {meta.title} →
            </Link>
          ) : (
            <p className="text-xs text-muted">
              {ready ? "Nonaktif — aktifkan lewat sakelar di atas untuk mencoba." : "Memuat…"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function LabsPage() {
  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-content">🧪 Lab</h1>
        <p className="max-w-2xl text-muted">
          Fitur eksperimental yang sedang kami uji. Aktifkan untuk mencoba lebih awal — catatan:
          fitur di sini bisa berubah bentuk atau hilang kapan saja tanpa pemberitahuan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {LAB_FEATURES.map((meta) => (
          <FeatureCard key={meta.id} meta={meta} />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Punya masukan tentang fitur Lab? Bagikan di{" "}
        <Link href="/forum" className="font-medium text-brand underline-offset-2 hover:underline">
          forum diskusi
        </Link>
        .
      </p>
    </div>
  );
}
