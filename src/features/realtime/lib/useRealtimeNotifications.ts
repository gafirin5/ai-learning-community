/**
 * Realtime Notifications — hook subscribe Supabase Realtime.
 *
 * Subscribe ke channel `notifications:<uuid>` untuk event INSERT pada tabel
 * `notifications` milik user yang sedang login. Uuid asli diambil dari session
 * Supabase (bukan hash numerik store). Setiap row baru dipetakan ke
 * AppNotification lalu diteruskan ke callback `onInsert` — akses setState
 * dimiliki pemanggil (bridge), hook ini tidak menyentuh store.
 *
 * Owner: Lane C/I (Notifikasi + Chat Persistence)
 */

import { useEffect, useRef } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { uuidToNumber } from "@/lib/uuid";
import type { AppNotification, NotificationType } from "@/lib/types";

function mapRow(row: Record<string, unknown>): AppNotification | null {
  const id = Number(row.id);
  const userId = typeof row.user_id === "string" ? row.user_id : "";
  if (!Number.isFinite(id) || id <= 0 || !userId) return null;
  return {
    id,
    userId: uuidToNumber(userId),
    type: (typeof row.type === "string" ? row.type : "system") as NotificationType,
    title: typeof row.title === "string" ? row.title : "",
    body: typeof row.body === "string" ? row.body : "",
    href: typeof row.href === "string" ? row.href : undefined,
    read: Boolean(row.read),
    createdAt:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function useRealtimeNotifications(
  enabled: boolean,
  userIdNumber: number | null,
  onInsert: (notification: AppNotification) => void
): void {
  // Callback disimpan di ref agar channel tidak re-subscribe setiap render
  // (pemanggil biasanya mengirim closure baru tiap render).
  const onInsertRef = useRef(onInsert);
  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    if (!enabled || !userIdNumber) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let supabase: SupabaseClient;
    try {
      supabase = getSupabase();
    } catch (e) {
      // Supabase belum dikonfigurasi — notifikasi realtime dilewati.
      console.warn("[realtime] notifications tidak aktif:", e);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getSession();
      const uuid = data.session?.user?.id;
      if (!uuid || cancelled) return;

      channel = supabase
        .channel("notifications:" + uuid)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: "user_id=eq." + uuid,
          },
          (payload) => {
            const mapped = mapRow((payload.new ?? {}) as Record<string, unknown>);
            if (mapped) onInsertRef.current(mapped);
          }
        )
        .subscribe();
    })().catch((e) => {
      console.warn("[realtime] subscribe notifications gagal:", e);
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [enabled, userIdNumber]);
}
