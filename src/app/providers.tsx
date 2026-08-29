"use client";

import { StoreProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/toast";
import { RealtimeNotificationsBridge } from "@/features/realtime/lib/realtime-notifications-bridge";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        <ToastProvider>
          {/* Realtime notifications — butuh akses Store (addNotification) dan Toast */}
          <RealtimeNotificationsBridge />
          {children}
        </ToastProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
