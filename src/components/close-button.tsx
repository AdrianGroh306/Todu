import type { ButtonHTMLAttributes } from "react";
import { X } from "lucide-react";

type CloseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel?: string;
};

export const CloseButton = ({
  ariaLabel = "Schließen",
  className,
  ...props
}: CloseButtonProps) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-theme-surface text-theme-text transition hover:text-theme-primary before:absolute before:-inset-2 before:content-[''] ${className ?? ""}`}
      {...props}
    >
      <X className="h-5 w-5" />
    </button>
  );
};
