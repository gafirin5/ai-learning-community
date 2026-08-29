import type { Role } from "./common";

export interface User {
  id: number;
  /** uuid asli profiles.id di Supabase (fallback lokal: pseudo-uuid). */
  uuid: string;
  name: string;
  email: string;
  role: Exclude<Role, "guest">;
  joinedAt: string;
  /** Keahlian mentor (text[] di profiles). Learner biasanya kosong. */
  expertise: string[];
  bio: string;
  avatarUrl: string;
  maxSessionsPerWeek: number;
}
