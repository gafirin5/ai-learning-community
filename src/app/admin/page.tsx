"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Overview } from "@/components/admin/overview";
import { Users } from "@/components/admin/users";
import { Courses } from "@/components/admin/courses";
import { Forum } from "@/components/admin/forum";
import { Projects } from "@/components/admin/projects";
import { Reports } from "@/components/admin/reports";
import { StudentProgress } from "@/components/admin/progress";

type Tab = "overview" | "progress" | "users" | "courses" | "forum" | "projects" | "reports";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Ringkasan" },
  { id: "progress", label: "Progres Murid" },
  { id: "users", label: "Pengguna" },
  { id: "courses", label: "Kursus & Kuis" },
  { id: "forum", label: "Forum" },
  { id: "projects", label: "Proyek" },
  { id: "reports", label: "Laporan" },
];

export default function AdminPage() {
  const { currentUser } = useStore();
  const [tab, setTab] = useState<Tab>("overview");

  if (currentUser?.role !== "admin" && currentUser?.role !== "mentor") {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-2xl font-bold text-content">Akses terbatas</h1>
        <p className="mt-2 text-sm text-muted">
          Panel ini hanya dapat diakses oleh admin dan mentor.
        </p>
        <Link href="/" className="btn-primary mt-4">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <Breadcrumbs items={[{ label: "Admin & Mentor" }]} />
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold text-content">Panel Admin & Mentor</h1>
        <p className="text-muted">
          Kelola pengguna, konten belajar, forum, proyek, dan laporan.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Bagian admin">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? "pill pill-active" : "pill pill-idle"}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview onNavigate={setTab} />}
      {tab === "progress" && <StudentProgress />}
      {tab === "users" && <Users />}
      {tab === "courses" && <Courses />}
      {tab === "forum" && <Forum />}
      {tab === "projects" && <Projects />}
      {tab === "reports" && <Reports />}
    </div>
  );
}
