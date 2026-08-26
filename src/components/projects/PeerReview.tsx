"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";

interface ReviewScore {
  codeQuality: number;
  ux: number;
  documentation: number;
  comment: string;
}

interface PeerReviewData extends ReviewScore {
  id: number;
  reviewerName: string;
  date: string;
}

const StarInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center justify-between py-2 border-b border-surface">
    <span className="text-sm font-medium text-content">{label}</span>
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          className={`text-2xl transition-transform hover:scale-110 ${i < value ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`}
        >
          ★
        </button>
      ))}
    </div>
  </div>
);

export function PeerReview() {
  const [reviews, setReviews] = useState<PeerReviewData[]>([
    {
      id: 1,
      reviewerName: "Mentor A",
      date: "2023-11-20",
      codeQuality: 4,
      ux: 5,
      documentation: 3,
      comment: "Desain UI sangat bagus, tapi dokumentasi bisa diperjelas lagi.",
    },
  ]);

  const [form, setForm] = useState<ReviewScore>({
    codeQuality: 0,
    ux: 0,
    documentation: 0,
    comment: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (form.codeQuality === 0 || form.ux === 0 || form.documentation === 0 || !form.comment.trim()) {
      alert("Harap isi semua skor dan komentar!");
      return;
    }

    setIsSubmitting(true);

    // Mock API call delay
    setTimeout(() => {
      setReviews([
        {
          id: Date.now(),
          reviewerName: "Pengguna (Anda)",
          date: new Date().toISOString().split("T")[0],
          ...form,
        },
        ...reviews,
      ]);
      setForm({
        codeQuality: 0,
        ux: 0,
        documentation: 0,
        comment: "",
      });
      setIsSubmitting(false);
    }, 500);
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-lg ${i < score ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold text-content flex items-center gap-2">
        <span>⭐</span> Peer Review (Rubrik)
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Review */}
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-bold text-content">Berikan Penilaian</h3>

          <div className="space-y-2 mb-6">
            <StarInput
              label="Kualitas Kode"
              value={form.codeQuality}
              onChange={(v) => setForm({ ...form, codeQuality: v })}
            />
            <StarInput
              label="Pengalaman Pengguna (UX)"
              value={form.ux}
              onChange={(v) => setForm({ ...form, ux: v })}
            />
            <StarInput
              label="Dokumentasi"
              value={form.documentation}
              onChange={(v) => setForm({ ...form, documentation: v })}
            />
          </div>

          <textarea
            className="input min-h-[100px] resize-y mb-4"
            placeholder="Komentar tambahan mengenai penilaian di atas..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Review"}
          </button>
        </div>

        {/* Daftar Review */}
        <div className="space-y-4">
          <h3 className="mb-2 text-lg font-bold text-content">Riwayat Review ({reviews.length})</h3>

          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={r.reviewerName} size="sm" />
                <div>
                  <p className="font-medium text-content text-sm">{r.reviewerName}</p>
                  <p className="text-xs text-muted">{r.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 bg-surface-hover p-3 rounded-lg text-center">
                <div>
                  <p className="text-xs text-muted mb-1">Kode</p>
                  <div className="flex justify-center">{renderStars(r.codeQuality)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">UX</p>
                  <div className="flex justify-center">{renderStars(r.ux)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Dokumentasi</p>
                  <div className="flex justify-center">{renderStars(r.documentation)}</div>
                </div>
              </div>

              <p className="text-sm text-content whitespace-pre-wrap">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
