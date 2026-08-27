"use client";
// Backward-compat shim — new code should import from "@/lib/store/*" slices.
// Re-exports the composed StoreProvider + useStore so all existing
// `from "@/lib/store"` imports keep working until they migrate.

export { StoreProvider, useStore } from "./store/index";
export type { StoreContextValue, AuthPayloadType } from "./store/context";
export type { ProgressStatus } from "./types";
export { STORAGE_KEY } from "./store/persistence";
