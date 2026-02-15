"use client";

import type { ReactNode } from "react";
import { CloseButton } from "@/components/close-button";
import { useVisualViewport } from "@/features/shared/hooks/use-visual-viewport";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  titleActions?: ReactNode;
  fullscreen?: boolean;
};

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  titleActions,
  fullscreen = false,
}: ModalProps) => {
  useVisualViewport();

  if (!open) return null;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-x-0 top-0 z-50 bg-theme-bg pt-safe"
          : "fixed inset-0 z-50 flex items-center justify-center bg-theme-bg/80 p-4 backdrop-blur"
      }
      style={fullscreen ? { height: "var(--vvh, 100dvh)" } : undefined}
      role="dialog"
      aria-modal
      onClick={fullscreen ? undefined : onClose}
    >
      <section
        className={
          fullscreen
            ? "flex h-full w-full flex-col gap-4 px-4 pb-8 safe-top safe-bottom"
            : "flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-theme-surface px-6 py-8 shadow-2xl max-h-full"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold text-theme-text">{title}</h2>
            {titleActions}
          </div>
          <CloseButton onClick={onClose} ariaLabel="Profil schließen"/>
        </div>

        {children}

        {footer}
      </section>
    </div>
  );
};
