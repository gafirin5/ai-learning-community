'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SessionVideoProps {
  sessionId: string;
  isActive?: boolean;
  onEnded?: () => void;
}

type MediaStatus = 'idle' | 'meminta-izin' | 'siap' | 'ditolak' | 'tidak-didukung';

/**
 * Ruang sesi mentoring — pratinjau kamera/mic lokal sungguhan (getUserMedia),
 * bukan lagi placeholder statis.
 *
 * Yang SUDAH nyata: preview kamera diri sendiri, toggle mic/kamera yang
 * benar-benar menyalakan/mematikan track, dan pembersihan stream saat sesi
 * berakhir/komponen unmount.
 *
 * Yang BELUM ada (butuh layanan pihak ketiga + biaya/API key, di luar scope
 * frontend-only): koneksi video peer-to-peer sungguhan antara mentor & learner.
 * Titik ekstensinya ditandai di bawah — tinggal sambungkan provider (WebRTC
 * self-hosted, Daily.co, Agora, Twilio Video, atau tautan Zoom/Meet manual).
 */
export function SessionVideo({ sessionId, isActive = false, onEnded }: SessionVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<MediaStatus>('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startPreview() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('tidak-didukung');
        return;
      }
      setStatus('meminta-izin');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setMicOn(true);
        setCamOn(true);
        setStatus('siap');
      } catch {
        if (!cancelled) setStatus('ditolak');
      }
    }

    void startPreview();

    return () => {
      cancelled = true;
      stopStream();
    };
    // sessionId sengaja jadi dependency: sesi baru = minta ulang stream baru.
  }, [sessionId, stopStream]);

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function toggleCam() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }

  function handleEnd() {
    stopStream();
    onEnded?.();
  }

  return (
    <div className="overflow-hidden rounded-lg bg-neutral-900">
      <div className="relative flex aspect-video items-center justify-center bg-black">
        {/* Video preview diri sendiri — selalu dicoba, terlepas dari status isActive,
            supaya learner/mentor bisa cek kamera & mic sebelum sesi mulai (ala "lobby"). */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${status === 'siap' && camOn ? '' : 'hidden'}`}
        />

        {status !== 'siap' && (
          <div className="p-6 text-center text-white">
            <svg className="mx-auto mb-4 h-14 w-14 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {status === 'idle' || status === 'meminta-izin' ? (
              <p className="text-sm text-neutral-300">Menyiapkan kamera & mikrofon…</p>
            ) : status === 'ditolak' ? (
              <div>
                <p className="mb-1 text-sm font-semibold">Izin kamera/mikrofon ditolak</p>
                <p className="text-xs text-neutral-400">
                  Aktifkan izin kamera & mikrofon di browser untuk melihat pratinjau, lalu muat ulang halaman.
                </p>
              </div>
            ) : status === 'tidak-didukung' ? (
              <p className="text-sm text-neutral-300">Perangkat/browser ini tidak mendukung akses kamera.</p>
            ) : null}
            {isActive && (
              <p className="mt-3 text-xs text-neutral-400">Mentor akan bergabung setelah pratinjau siap.</p>
            )}
          </div>
        )}

        {status === 'siap' && !camOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-sm text-neutral-400">
            Kamera dimatikan
          </div>
        )}

        {/* Kontrol overlay */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-black/60 px-4 py-2">
          <button
            onClick={toggleMic}
            disabled={status !== 'siap'}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            aria-label={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
            title={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
          >
            {micOn ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18M12 5a3 3 0 013 3v3m-.4 3.6A3 3 0 019 11V8m3 8v4m0 0H8m4 0h4m-4-4a7 7 0 01-6.9-6" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleCam}
            disabled={status !== 'siap'}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            aria-label={camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
            title={camOn ? 'Matikan kamera' : 'Nyalakan kamera'}
          >
            {camOn ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-.724.874M5 5.5A2 2 0 005 6v10a2 2 0 002 2h8" />
              </svg>
            )}
          </button>
          <button
            onClick={handleEnd}
            className="rounded-full p-2 text-danger transition-colors hover:bg-white/10"
            aria-label="Akhiri sesi"
            title="Akhiri sesi"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info sesi + catatan transparansi (konsisten dengan gaya proyek: jujur soal apa yang mock). */}
      <div className="space-y-1 bg-neutral-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Sesi #{sessionId}</h4>
            <p className="text-sm text-neutral-400">{isActive ? 'Berlangsung' : 'Terjadwal'}</p>
          </div>
          {onEnded && (
            <button onClick={handleEnd} className="btn-primary text-sm">
              Selesaikan Sesi
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          Pratinjau kamera/mic ini lokal di perangkatmu. Koneksi video langsung
          antar mentor-learner belum tersambung — butuh integrasi penyedia video
          call (WebRTC/Daily.co/Zoom).
        </p>
      </div>
    </div>
  );
}
