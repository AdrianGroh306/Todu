type ProgressBarProps = {
  value: number;
  max: number;
  label?: string;
};

export const ProgressBar = ({ value, max, label = "Fortschritt" }: ProgressBarProps) => {
  const ratio = max === 0 ? 0 : value / max;
  const percent = Math.round(ratio * 100);

  return (
    <div className="h-2 w-full rounded-full bg-theme-surface">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${value} von ${max} erledigt`}
        style={{ width: `${percent}%` }}
        className="h-full rounded-full bg-theme-primary transition-[width] duration-300 ease-out"
      />
    </div>
  );
}
