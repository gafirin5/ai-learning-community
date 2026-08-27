import { useCallback } from "react";
import type { NotificationType } from "@/lib/types";
import type { StateSetter } from "./context";

export function useNotificationActions(setState: StateSetter) {
  const addNotification = useCallback(
    (data: { type: NotificationType; title: string; body: string; href?: string; userId: number }) => {
      setState((s) => ({
        ...s,
        notifications: [
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            userId: data.userId,
            type: data.type,
            title: data.title,
            body: data.body,
            href: data.href,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...s.notifications,
        ].slice(0, 50),
      }));
    },
    [setState]
  );

  const markNotificationRead = useCallback(
    (id: number, read = true) => {
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read } : n)),
      }));
    },
    [setState]
  );

  const markAllRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, [setState]);

  const deleteNotification = useCallback(
    (id: number) => {
      setState((s) => ({
        ...s,
        notifications: s.notifications.filter((n) => n.id !== id),
      }));
    },
    [setState]
  );

  const clearRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.filter((n) => !n.read),
    }));
  }, [setState]);

  return { addNotification, markNotificationRead, markAllRead, deleteNotification, clearRead };
}
