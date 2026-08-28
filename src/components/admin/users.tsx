"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { Role } from "@/lib/types";

const ROLES: Array<{ value: Exclude<Role, "guest">; label: string }> = [
  { value: "learner", label: "Learner" },
  { value: "mentor", label: "Mentor" },
  { value: "admin", label: "Admin" },
];

export function Users() {
  const { state, currentUser, addUser, setUserRole, deleteUser } = useStore();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "guest">>("learner");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await addUser({ name, email, role });
    if (!res.ok) {
      toast(res.error ?? "Gagal menambah pengguna", "error");
      return;
    }
    toast(
      res.generatedPassword
        ? `Pengguna ditambahkan. Sandi: ${res.generatedPassword}`
        : "Pengguna ditambahkan"
    );
    setName("");
    setEmail("");
    setRole("learner");
  }

  function handleRole(userId: number, nextRole: Exclude<Role, "guest">) {
    void setUserRole(userId, nextRole).then(() => toast("Peran diperbarui"));
  }

  function handleDelete(userId: number, name: string) {
    if (!window.confirm(`Hapus pengguna "${name}" beserta seluruh kontennya?`)) return;
    void deleteUser(userId).then(() => toast("Pengguna dihapus"));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="card p-5">
        <h2 className="mb-4 font-semibold text-content">Tambah Pengguna</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Nama</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@example.com"
            />
          </div>
          <div>
            <label className="label">Peran</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, "guest">)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              Tambah
            </button>
          </div>
        </div>
      </form>

      {state.users.length === 0 ? (
        <EmptyState icon="👥" title="Tidak ada pengguna" />
      ) : (
        <div className="card divide-y divide-border">
          {state.users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4">
              <Avatar name={user.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-content">
                  {user.name}
                  {user.id === currentUser?.id && (
                    <span className="ml-2 text-xs text-subtle">(Anda)</span>
                  )}
                </p>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
              <span className="badge bg-surface-hover text-muted">{user.joinedAt}</span>
              <select
                className="input w-auto"
                value={user.role}
                onChange={(e) => handleRole(user.id, e.target.value as Exclude<Role, "guest">)}
                disabled={user.id === currentUser?.id}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleDelete(user.id, user.name)}
                disabled={user.id === currentUser?.id}
                className="btn-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
