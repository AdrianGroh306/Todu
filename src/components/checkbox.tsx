import type { ChangeEvent, ComponentPropsWithoutRef } from "react";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "size"> & {
  visualSize?: "sm" | "md";
};

export const Checkbox = ({ visualSize = "sm", className = "", onChange, ...props }: CheckboxProps) => {
  const sizeClasses = "h-6 w-6";
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onChange?.(e);
  };
  
  return (
    <input
      type="checkbox"
      className={`cursor-pointer rounded-lg border border-theme-border bg-theme-surface transition duration-150 hover:border-theme-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary checked:border-theme-primary checked:bg-theme-primary ${sizeClasses} ${className}`}
      onChange={handleChange}
      {...props}
    />
  );
}
