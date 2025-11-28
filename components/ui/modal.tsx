import type { ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <section className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            className="rounded-full border border-slate-600 p-1 text-slate-400 hover:text-slate-100"
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
