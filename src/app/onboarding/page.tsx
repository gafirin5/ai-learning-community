"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { interests } from "@/lib/data";

export default function OnboardingPage() {
  const { setInterests } = useStore();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function finish() {
    setInterests(selected);
    router.push("/dashboard");
  }

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          {/* Step indicator */}
          <div className="mb-4 flex items-center justify-center gap-2" aria-hidden="true">
            <span className="flex h-2.5 w-8 rounded-full bg-brand" />
            <span className="flex h-2.5 w-8 rounded-full bg-surface-hover" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-content">
            Pilih minat belajar Anda
          </h1>
          <p className="text-muted">
            Ini membantu kami menyarankan learning path yang relevan. Bisa diubah kapan saja.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {interests.map((interest) => {
            const active = selected.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggle(interest.id)}
                aria-pressed={active}
                className={`card flex items-center gap-3 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
                  active ? "border-brand bg-brand-soft" : "hover:border-brand/50"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {interest.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-content">{interest.label}</p>
                  <p className="text-xs text-muted">
                    {interest.topics.map((t) => `#${t}`).join(" ")}
                  </p>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    active ? "border-brand bg-brand text-white" : "border-border"
                  }`}
                >
                  {active && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost">
            Lewati
          </button>
          <button onClick={finish} className="btn-primary">
            Lanjutkan ({selected.length} dipilih)
          </button>
        </div>
      </div>
    </div>
  );
}
