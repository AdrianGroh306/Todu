"use client";

import { Download } from "lucide-react";
import { useServiceWorkerUpdate } from "@/features/shared/hooks/use-service-worker-update";

export function UpdateToast() {
  const { hasUpdate, isUpdating, applyUpdate } = useServiceWorkerUpdate();

  if (!hasUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl bg-theme-surface px-4 py-3 shadow-lg ring-1 ring-theme-border">
        <Download className="h-5 w-5 shrink-0 text-theme-primary" />
        <p className="flex-1 text-sm font-medium text-theme-text">
          Neue Version verfügbar
        </p>
        <button
          onClick={applyUpdate}
          disabled={isUpdating}
          className="shrink-0 cursor-pointer rounded-xl bg-theme-primary px-4 py-2 text-sm font-semibold text-theme-bg transition hover:bg-theme-primary-hover disabled:opacity-60"
        >
          {isUpdating ? "Lädt..." : "Aktualisieren"}
        </button>
      </div>
    </div>
  );
}
