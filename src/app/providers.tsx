"use client";

import { StoreProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        <ToastProvider>{children}</ToastProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
