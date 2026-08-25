"use client";

import { useStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

export default function CertificatePage() {
  const { id } = useParams();
  const { state, currentUser } = useStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const certificate = state.certificates.find((c) => c.certificateId === id);
  const course = certificate ? state.courses.find((c) => c.id === certificate.courseId) : null;

  if (!certificate || !course) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="text-2xl font-bold text-content">Sertifikat tidak ditemukan</h1>
        <p className="mt-2 text-muted">Sertifikat ini mungkin tidak valid atau belum diterbitkan.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-6 btn-primary">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="container-app py-10 max-w-4xl">
      <div className="mb-6 flex items-center justify-between no-print">
        <Link href="/dashboard" className="text-brand hover:underline font-medium">
          &larr; Kembali
        </Link>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary">
            🖨️ Cetak PDF
          </button>
          <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Bagikan ke LinkedIn
          </a>
        </div>
      </div>

      <Reveal>
        <div className="border-8 border-brand/20 bg-surface p-12 text-center rounded-2xl shadow-xl certificate-container relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand/10 rounded-br-full" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand/10 rounded-tl-full" />

          <div className="relative z-10">
            <h2 className="text-xl font-bold tracking-widest text-muted uppercase mb-8">AI Learning Community</h2>

            <h1 className="text-5xl font-serif font-bold text-content mb-6">Sertifikat Penyelesaian</h1>

            <p className="text-lg text-muted mb-4">Diberikan dengan bangga kepada:</p>

            <p className="text-4xl font-bold text-brand mb-8 italic">{currentUser?.name ?? "Pengguna"}</p>

            <p className="text-lg text-muted mb-4">Atas keberhasilannya menyelesaikan kursus:</p>

            <p className="text-2xl font-bold text-content mb-12">{course.title}</p>

            <div className="flex justify-between items-end border-t-2 border-border pt-8 mt-12 text-left">
              <div>
                <p className="text-sm font-bold text-content">Tanggal Penerbitan</p>
                <p className="text-sm text-muted">
                  {new Date(certificate.issuedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-content">ID Sertifikat</p>
                <p className="text-sm text-muted font-mono">{certificate.certificateId}</p>
              </div>
            </div>

            {/* Fake QR code for "verification" */}
            <div className="mt-8 mx-auto w-24 h-24 bg-border/50 rounded flex items-center justify-center p-2">
              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTMgM2g2djZIM3pNMTUgM2g2djZIMTV6TTMgMTVoNnY2SDN6TTE1IDE1aDYuMHY2LjBIMTV6TTEwIDN2Nm0wIDZ2Nm00LTYwaG00LTR2Mm0wLTJ2MnoiLz48L3N2Zz4=')] bg-cover opacity-50" />
            </div>
          </div>
        </div>
      </Reveal>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .certificate-container, .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            box-shadow: none;
          }
        }
      `}} />
    </div>
  );
}
