"use client";

import type { ReactNode } from "react";
import { CloseButton } from "@/components/close-button";
import { BottomSheet, FullscreenSheet } from "@/components/sheet";
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
  useVisualViewport(open);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <h2 className="text-lg font-bold text-theme-text">{title}</h2>
        {titleActions}
      </div>
      <CloseButton onClick={onClose} ariaLabel="Schließen" />
    </div>
  );

  if (fullscreen) {
    return (
      <FullscreenSheet open={open}>
        <section className="flex h-full w-full flex-col gap-4 px-4 pb-8 safe-top safe-bottom">
          {header}
          {children}
          {footer}
        </section>
      </FullscreenSheet>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {header}
      {children}
      {footer}
    </BottomSheet>
  );
};
