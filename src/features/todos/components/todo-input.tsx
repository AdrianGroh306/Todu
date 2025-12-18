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

  return (
    <form
      className="sticky bottom-0 flex items-center gap-1 pt-3 backdrop-blur"
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={disabled ? "Liste auswählen, um Todos anzulegen" : "Neues Todo hinzufügen"}
        className="flex-1 rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-base text-theme-text outline-none transition focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/40"
        autoFocus={!disabled}
        disabled={disabled}
      />
      <button
        type="submit"
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme-primary text-theme-bg transition hover:bg-theme-primary-hover"
        aria-label="Todo hinzufügen"
        disabled={disabled || !value.trim() || isCreating}
      >
        <Plus className=" h-5 w-5" />
      </button>
    </form>
  );
}
