import { useCallback } from "react";
import type { ChatMessage } from "@/lib/types";
import { generateTutorReply } from "@/lib/ai/tutor";
import { DAILY_QUOTA, withTodayQuota as _wq } from "@/lib/ai/quota";
import { todayKey } from "@/lib/utils/date";
import type { StateSetter, StoreState } from "./context";

export function useChatActions(state: StoreState, setState: StateSetter) {
  const getChat = useCallback(
    (lessonId: number) => state.chat[lessonId] ?? [],
    [state.chat]
  );

  const clearChat = useCallback(
    (lessonId: number) => {
      setState((s) => ({ ...s, chat: { ...s.chat, [lessonId]: [] } }));
    },
    [setState]
  );

  const sendChat = useCallback(
    (lessonId: number, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return { ok: false, error: "Pesan tidak boleh kosong." };

      const stateWithQuota = _wq(state);
      if (stateWithQuota.chatQuota.used >= DAILY_QUOTA) {
        const quotaMsg: ChatMessage = {
          id: Date.now(),
          lessonId,
          sender: "assistant",
          kind: "quota",
          createdAt: new Date().toISOString(),
          content: `Kuota harian Anda (${DAILY_QUOTA} pesan/hari) telah habis. Silakan kembali besok untuk bertanya lagi ke AI tutor.`,
        };
        setState((s) => ({
          ..._wq(s),
          chat: {
            ...s.chat,
            [lessonId]: [...(s.chat[lessonId] ?? []), quotaMsg],
          },
        }));
        return { ok: false, error: "Kuota harian habis." };
      }

      const userMsg: ChatMessage = {
        id: Date.now(),
        lessonId,
        sender: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const reply = generateTutorReply(lessonId, trimmed, state.lessons, state.courses);

      setState((s) => {
        const scoped = _wq(s);
        return {
          ...scoped,
          chatQuota: { date: todayKey(), used: scoped.chatQuota.used + 1 },
          chat: {
            ...s.chat,
            [lessonId]: [...(s.chat[lessonId] ?? []), userMsg, reply],
          },
        };
      });
      return { ok: true, reply };
    },
    [state, setState]
  );

  return { getChat, clearChat, sendChat };
}
