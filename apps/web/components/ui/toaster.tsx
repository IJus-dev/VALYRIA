"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--color-paper, #faf9f6)",
          border: "1px solid var(--color-line, #d4d0c8)",
          borderRadius: "0.75rem",
          color: "var(--color-ink, #1a1a1a)",
        },
      }}
    />
  );
}
