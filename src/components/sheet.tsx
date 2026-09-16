"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFrozenWhileClosed, usePresence } from "@/features/shared/hooks/use-presence";

const BOTTOM_SHEET_EXIT_MS = 260;
const FULLSCREEN_SHEET_EXIT_MS = 320;

let stackedCount = 0;

// Pushes the app behind a fullscreen sheet back (see .app-shell in globals.css)
function useStackedBackground(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    stackedCount += 1;
    root.setAttribute("data-overlay-open", "");
    return () => {
      stackedCount -= 1;
      if (stackedCount === 0) root.removeAttribute("data-overlay-open");
    };
  }, [active]);
}

type SheetProps = {
  open: boolean;
  children: ReactNode;
};

export const FullscreenSheet = ({ open, children }: SheetProps) => {
  const { mounted, closing } = usePresence(open, FULLSCREEN_SHEET_EXIT_MS);
  const content = useFrozenWhileClosed(children, open);
  useStackedBackground(open);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-state={closing ? "closed" : "open"}
      className="page-sheet fixed inset-x-0 z-50 flex flex-col overflow-hidden rounded-t-[1.25rem] bg-theme-bg"
      style={{ top: "var(--sheet-top)", height: "calc(var(--vvh, 100dvh) - var(--sheet-top))" }}
      role="dialog"
      aria-modal
    >
      {content}
    </div>,
    document.body,
  );
};

type BottomSheetProps = SheetProps & {
  onClose: () => void;
};

export const BottomSheet = ({ open, onClose, children }: BottomSheetProps) => {
  const { mounted, closing } = usePresence(open, BOTTOM_SHEET_EXIT_MS);
  const content = useFrozenWhileClosed(children, open);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-state={closing ? "closed" : "open"}
      className="sheet-root fixed inset-x-0 top-0 z-50 flex flex-col justify-end"
      style={{ height: "var(--vvh, 100dvh)" }}
      role="dialog"
      aria-modal
    >
      <div className="sheet-backdrop absolute inset-0 bg-theme-bg/70 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-panel relative mx-auto flex max-h-[90%] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-t-3xl bg-theme-surface px-6 pt-3 shadow-2xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <div className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-theme-border" aria-hidden="true" />
        {content}
      </section>
    </div>,
    document.body,
  );
};
