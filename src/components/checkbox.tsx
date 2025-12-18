import type { ChangeEvent, ComponentPropsWithoutRef } from "react";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "size"> & {
  visualSize?: "sm" | "md";
};

export const Checkbox = ({ visualSize = "sm", className = "", onChange, ...props }: CheckboxProps) => {
  const sizeClasses = "h-7 w-7";
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onChange?.(e);
  };
  
  return (
    <input
      type="checkbox"
      className={`relative cursor-pointer appearance-none rounded-md border-3 border-theme-primary bg-transparent transition duration-150 ease-out hover:border-theme-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary checked:border-theme-primary checked:bg-theme-primary before:pointer-events-none before:absolute before:content-[''] before:w-[0.45rem] before:h-[0.9rem] before:border-r-[2.5px] before:border-b-[2.5px] before:border-theme-bg before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-[60%] before:rotate-45 before:opacity-0 before:transition-all before:duration-150 checked:before:opacity-100 ${sizeClasses} ${className}`}
      onChange={handleChange}
      {...props}
    />
  );
}
