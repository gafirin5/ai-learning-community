"use client";

import { useToast } from "@/components/toast";

interface Props {
  courseTitle: string;
  userName: string;
  issuedAt: string;
  courseSlug?: string;
}

export function CertificateCard({ courseTitle, userName, issuedAt }: Props) {
  const { toast } = useToast();

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    // Lightweight: trigger print dialog which allows Save as PDF (no extra dep).
    toast("Gunakan 'Save as PDF' di dialog cetak untuk mengunduh sertifikat.", "success");
    window.print();
  }

  return (
    <div className="card overflow-hidden print:shadow-none print:border print:border-border">
      <div className="border-b border-border bg-brand-soft/50 px-6 py-3 flex items-center justify-between print:bg-white">
        <span className="text-sm font-semibold text-content">🎓 Sertifikat Penyelesaian</span>
        <span className="text-xs text-muted">{new Date(issuedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
      </div>
      <div className="p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-subtle">Diberikan kepada</p>
        <p className="mt-2 text-2xl font-bold text-content">{userName}</p>
        <p className="mt-6 text-sm text-muted">telah menyelesaikan kursus</p>
        <p className="mt-2 text-xl font-semibold text-brand">{courseTitle}</p>
        <p className="mt-6 text-xs text-subtle">AI Learning Community — {new Date(issuedAt).getFullYear()}</p>
        <div className="mt-6 flex justify-center gap-2 print:hidden">
          <button onClick={handlePrint} className="btn-secondary">Cetak</button>
          <button onClick={handleDownload} className="btn-primary">Unduh PDF</button>
        </div>
      </div>
    </div>
  );
}
