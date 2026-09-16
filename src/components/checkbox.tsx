import type { ChangeEvent, ComponentPropsWithoutRef } from "react";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "size"> & {
  visualSize?: "sm" | "md";
};

export const Checkbox = ({ visualSize = "sm", className = "", onChange, ...props }: CheckboxProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onChange?.(e);
  };

  return (
    <span className="inline-grid h-7 w-7 shrink-0 place-items-center" data-size={visualSize}>
      <input
        type="checkbox"
        className={`checkbox-input col-start-1 row-start-1 h-7 w-7 cursor-pointer appearance-none rounded-md border-3 border-theme-primary bg-transparent transition duration-150 ease-out hover:border-theme-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary checked:border-theme-primary checked:bg-theme-primary ${className}`}
        onChange={handleChange}
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="checkbox-mark pointer-events-none col-start-1 row-start-1 h-4 w-4"
      >
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </span>
  );
}
