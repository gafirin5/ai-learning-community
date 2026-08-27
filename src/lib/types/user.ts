import type { Role } from "./common";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Exclude<Role, "guest">;
  joinedAt: string;
}
