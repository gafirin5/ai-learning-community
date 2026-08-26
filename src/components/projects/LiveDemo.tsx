"use client";

import { useState } from "react";

export function LiveDemo({ defaultUrl = "" }: { defaultUrl?: string }) {
  const [demoUrl, setDemoUrl] = useState(defaultUrl);
  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [isEditing, setIsEditing] = useState(!defaultUrl);

  const handleUpdate = () => {
    setDemoUrl(inputUrl);
    setIsEditing(false);
  };

  return (
    <div className="card mt-8 p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-content flex items-center gap-2">
          <span>🖥️</span> Live Demo
        </h2>
        {demoUrl && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-brand hover:underline"
          >
            Ubah URL Demo
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Masukkan URL Live Demo (misal: https://my-project.vercel.app)"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="input flex-1"
          />
          <button onClick={handleUpdate} className="btn-primary">
            Tampilkan
          </button>
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-surface bg-surface-hover">
          <iframe
            src={demoUrl}
            className="absolute inset-0 h-full w-full border-0"
            title="Live Demo"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}
