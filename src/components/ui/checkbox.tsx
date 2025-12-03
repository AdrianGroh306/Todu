import type { ComponentPropsWithoutRef } from "react";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "size"> & {
  visualSize?: "sm" | "md";
};

export function Checkbox({ visualSize = "md", className = "", ...props }: CheckboxProps) {
  const sizeClasses = visualSize === "sm" ? "h-5 w-5" : "h-6 w-6";
  
  return (
    <input
      type="checkbox"
      className={`cursor-pointer rounded-lg border border-theme-border bg-theme-surface transition duration-150 hover:border-theme-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary checked:border-theme-primary checked:bg-theme-primary ${sizeClasses} ${className}`}
      {...props}
    />
  );
}
