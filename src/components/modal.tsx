import type { ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  titleActions?: ReactNode;
};

export const Modal = ({ open, onClose, title, children, footer, titleActions }: ModalProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-theme-bg/80 p-4 backdrop-blur"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <section
        className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-theme-border bg-theme-surface px-6 py-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-semibold text-theme-text">{title}</h2>
            {titleActions}
          </div>
          <button
            className="rounded-full border cursor-pointer border-theme-border p-1 text-theme-text-muted hover:text-theme-text"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}

        {footer}
      </section>
    </div>
  );
}
