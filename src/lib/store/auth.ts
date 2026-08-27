import { useCallback } from "react";
import type { Role, User } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import type { StateSetter, StoreState } from "./context";

interface AuthPayload {
  name: string;
  email: string;
  password: string;
  role?: Exclude<Role, "guest">;
}

export function useAuthActions(state: StoreState, setState: StateSetter) {
  const login = useCallback(
    (email: string, password: string) => {
      const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user) return { ok: false, error: "Email tidak ditemukan." };
      if (!password) return { ok: false, error: "Kata sandi wajib diisi." };
      setState((s) => ({ ...s, currentUserId: user.id }));
      return { ok: true };
    },
    [state.users, setState]
  );

  const register = useCallback(
    (payload: AuthPayload) => {
      const email = payload.email.trim().toLowerCase();
      if (!payload.name.trim()) return { ok: false, error: "Nama wajib diisi." };
      if (!email || !payload.password) return { ok: false, error: "Email dan kata sandi wajib diisi." };
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

  const logout = useCallback(() => {
    setState((s) => ({ ...s, currentUserId: null }));
  }, [setState]);

  const setInterests = useCallback(
    (ids: string[]) => {
      setState((s) => ({ ...s, interests: ids }));
    },
    [setState]
  );

  return { login, register, logout, setInterests };
}
