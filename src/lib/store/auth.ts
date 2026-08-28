import { useCallback } from "react";
import type { Role, User } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { setInterestsRemote } from "@/lib/api-write";
import { uuidToNumber } from "@/lib/uuid";
import type { StateSetter, StoreState } from "./context";

interface AuthPayload {
  name: string;
  email: string;
  password: string;
  role?: Exclude<Role, "guest">;
}

export function useAuthActions(state: StoreState, setState: StateSetter) {
  const login = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();

      // Backend Supabase aktif → auth jadi sumber kebenaran.
      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });
        if (error) {
          const msg =
            error.message === "Invalid login credentials"
              ? "Email atau kata sandi salah."
              : error.message;
          return { ok: false, error: msg };
        }
        const supabaseUser = data.user;
        const profileEmail = (supabaseUser?.email ?? normalized).toLowerCase();
        const meta = (supabaseUser?.user_metadata ?? {}) as Record<string, unknown>;
        const metaRole = typeof meta.role === "string" ? (meta.role as Role) : "learner";
        const metaName = typeof meta.name === "string" ? meta.name : profileEmail.split("@")[0];

        // currentUserId harus sama dengan mapping uuidToNumber() yang dipakai
        // fetchRemoteState, agar perbandingan kepemilikan (thread.userId ===
        // currentUserId) konsisten. Upsert berdasarkan email, buang duplikat lama.
        const mappedId = uuidToNumber(supabaseUser!.id);
        setState((s) => {
          const existing = s.users.find((u) => u.email.toLowerCase() === profileEmail);
          const user: User = {
            id: mappedId,
            name: metaName || existing?.name || profileEmail.split("@")[0],
            email: profileEmail,
            role: metaRole === "guest" ? (existing?.role ?? "learner") : metaRole,
            joinedAt: existing?.joinedAt ?? todayKey(),
          };
          return {
            ...s,
            users: [...s.users.filter((u) => u.email.toLowerCase() !== profileEmail), user],
            currentUserId: mappedId,
          };
        });
        return { ok: true };
      }

      // Fallback localStorage (Supabase belum dikonfigurasi).
      const user = state.users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) return { ok: false, error: "Email tidak ditemukan." };
      if (!password) return { ok: false, error: "Kata sandi wajib diisi." };
      setState((s) => ({ ...s, currentUserId: user.id }));
      return { ok: true };
    },
    [state.users, setState]
  );

  const register = useCallback(
    async (payload: AuthPayload) => {
      const email = payload.email.trim().toLowerCase();
      if (!payload.name.trim()) return { ok: false, error: "Nama wajib diisi." };
      if (!email || !payload.password) return { ok: false, error: "Email dan kata sandi wajib diisi." };

      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signUp({
          email,
          password: payload.password,
          options: {
            data: { name: payload.name.trim(), role: payload.role ?? "learner" },
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) {
          const msg = error.message === "User already registered"
            ? "Email sudah terdaftar."
            : error.message;
          return { ok: false, error: msg };
        }
        const supabaseUser = data.user;
        // Konsisten dengan mapping fetchRemoteState: id = uuidToNumber(uid Supabase).
        const mappedId = uuidToNumber(supabaseUser!.id);
        const newUser: User = {
          id: mappedId,
          name: payload.name.trim(),
          email,
          role: payload.role ?? "learner",
          joinedAt: todayKey(),
        };
        setState((s) => ({
          ...s,
          users: [...s.users.filter((u) => u.email.toLowerCase() !== email), newUser],
          currentUserId: newUser.id,
        }));
        return { ok: true, needsConfirmation: !supabaseUser?.confirmed_at };
      }

      // Fallback localStorage.
      if (state.users.some((u) => u.email.toLowerCase() === email))
        return { ok: false, error: "Email sudah terdaftar." };
      const newUser: User = {
        id: Date.now(),
        name: payload.name.trim(),
        email,
        role: payload.role ?? "learner",
        joinedAt: todayKey(),
      };
      setState((s) => ({ ...s, users: [...s.users, newUser], currentUserId: newUser.id }));
      return { ok: true };
    },
    [state.users, setState]
  );

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        await getSupabase().auth.signOut();
      } catch {
        /* abaikan error signOut, tetap clear lokal */
      }
    }
    // Reset state per-user agar user berikutnya tidak mewarisi data user lama.
    setState((s) => ({
      ...s,
      currentUserId: null,
      progress: {},
      bookmarks: [],
      interests: [],
      savedThreadIds: [],
      votes: { threads: {}, comments: {}, projects: {} },
      myReactions: { threads: {}, comments: {} },
      certificates: [],
      notifications: [],
      reports: [],
      points: 0,
      badges: [],
      recentlyViewed: [],
      activity: { streak: 0, lastActiveDate: "" },
      chat: {},
      chatQuota: { date: "", used: 0 },
    }));
  }, [setState]);

  const setInterests = useCallback(
    async (ids: string[]) => {
      if (isSupabaseConfigured()) {
        await setInterestsRemote(ids);
      }
      setState((s) => ({ ...s, interests: ids }));
    },
    [setState]
  );

  return { login, register, logout, setInterests };
}
