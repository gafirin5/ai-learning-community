import type { StoreState } from "@/lib/types";

export type { StoreState };

export type StateSetter = (updater: (s: StoreState) => StoreState) => void;
