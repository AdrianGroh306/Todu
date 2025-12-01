import type { ComponentPropsWithoutRef } from "react";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "size"> & {
  visualSize?: "sm" | "md";
};

export function Checkbox({ visualSize = "md", className = "", ...props }: CheckboxProps) {
  const sizeClasses = visualSize === "sm" ? "h-5 w-5" : "h-6 w-6";
  
  return (
    <input
      type="checkbox"
      className={`cursor-pointer rounded-lg border border-slate-600 bg-slate-900 transition duration-150 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 checked:border-slate-100 checked:bg-slate-100 ${sizeClasses} ${className}`}
      {...props}
    />
  );
}
