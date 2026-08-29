"use client";

/**
 * Bridge Realtime → Store + Toast.
 *
 * Mendengarkan INSERT tabel `notifications` via Supabase Realtime, lalu:
 * - menambahkan notifikasi ke store (prepend via addNotification)
 * - menampilkan toast ringan
 *
 * Harus dirender di dalam StoreProvider DAN ToastProvider
 * (dipasang di src/app/providers.tsx).
 *
 * Owner: Lane C/I (Notifikasi + Chat Persistence)
 */

import { useCallback } from "react";
import { useStore } from "@/lib/store/context";
import { useToast } from "@/components/toast";
import { useRealtimeNotifications } from "./useRealtimeNotifications";
import type { AppNotification } from "@/lib/types";

export function RealtimeNotificationsBridge() {
  const { state, addNotification } = useStore();
  const { toast } = useToast();

  const handleInsert = useCallback(
    (notification: AppNotification) => {
      // addNotification melakukan prepend + cap 50 item (pola store).
      // Catatan: id lokal dibuat store (bukan id bigint server); state akan
      // tersinkron kembali dengan server pada fetchUserState berikutnya.
      addNotification({
        type: notification.type,
        title: notification.title,
        body: notification.body,
        href: notification.href,
        userId: notification.userId,
      });
      toast(notification.title, "info");
    },
    [addNotification, toast]
  );

  useRealtimeNotifications(
    Boolean(state.currentUserId),
    state.currentUserId ?? null,
    handleInsert
  );

  return null;
}
