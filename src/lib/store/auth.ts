import { useCallback } from "react";
import type { Role, User } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { setInterestsRemote } from "@/lib/api-write";
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

        // Map ke store lokal: cari user seed dengan email sama, kalau tidak ada buat baru.
        setState((s) => {
          let user = s.users.find((u) => u.email.toLowerCase() === profileEmail);
          if (!user) {
            user = {
              id: Date.now(),
              name: metaName,
              email: profileEmail,
              role: metaRole === "guest" ? "learner" : metaRole,
              joinedAt: todayKey(),
            } as User;
            return { ...s, users: [...s.users, user], currentUserId: user.id };
          }
          // Sinkronkan role/name dari Supabase jika berubah.
          const synced = {
            ...user,
            name: metaName || user.name,
            role: metaRole === "guest" ? user.role : metaRole,
          };
          return {
            ...s,
            users: s.users.map((u) => (u.id === user.id ? synced : u)),
            currentUserId: user.id,
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
        const newUser: User = {
          id: Date.now(),
          name: payload.name.trim(),
          email,
          role: payload.role ?? "learner",
          joinedAt: todayKey(),
        };
        setState((s) => ({
          ...s,
          users: [...s.users, newUser],
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
    setState((s) => ({ ...s, currentUserId: null }));
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
