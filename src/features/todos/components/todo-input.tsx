import { Plus } from "lucide-react";

type TodoInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  isCreating: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

export const TodoInput = ({
  value,
  onChange,
  onSubmit,
  disabled,
  isCreating,
  inputRef,
}: TodoInputProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  // iOS keyboard fix: reset scroll when input is focused
  const handleFocus = () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  return (
    <form
      className="flex shrink-0 items-center gap-2 py-4"
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={disabled ? "Liste auswählen, um Todos anzulegen" : "Neues Todo hinzufügen"}
        className="flex-1 rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-base text-theme-text outline-none transition focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/40"
        autoFocus={!disabled}
        disabled={disabled}
      />
      <button
        type="submit"
        className="flex h-13 w-13 items-center justify-center rounded-xl bg-theme-primary text-theme-bg transition hover:bg-theme-primary-hover cursor-pointer"
        aria-label="Todo hinzufügen"
        disabled={disabled || !value.trim() || isCreating}
      >
        <Plus className=" h-6 w-6" />
      </button>
    </form>
  );
}
