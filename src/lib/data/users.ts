import type { User } from "../types";

export const seedUsers: User[] = [
  { id: 1, name: "Budi Santoso", email: "budi@example.com", role: "mentor", joinedAt: "2026-01-10" },
  { id: 2, name: "Sari Wijaya", email: "sari@example.com", role: "mentor", joinedAt: "2026-02-03" },
  { id: 3, name: "Rina Putri", email: "rina@example.com", role: "learner", joinedAt: "2026-05-14" },
  { id: 4, name: "Andi Saputra", email: "andi@example.com", role: "learner", joinedAt: "2026-06-01" },
  { id: 5, name: "Dewi Lestari", email: "dewi@example.com", role: "learner", joinedAt: "2026-07-19" },
  { id: 6, name: "Admin Pusat", email: "admin@example.com", role: "admin", joinedAt: "2026-01-01" },
];

export const userById = new Map(seedUsers.map((u) => [u.id, u]));
