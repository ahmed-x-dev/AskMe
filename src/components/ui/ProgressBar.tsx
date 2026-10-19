type ProgressBarProps = {
  label: string;
  completed: number;
  total: number;
  /** Fill color, for example a roadmap's hex color. Defaults to the theme accent. */
  color?: string;
};

export function ProgressBar({ label, completed, total, color }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      className="h-2 w-full overflow-hidden rounded-full bg-bg"
    >
      <div
        className="h-full rounded-full transition-[width] duration-200"
        style={{ width: `${percent}%`, backgroundColor: color || "var(--accent)" }}
      />
    </div>
  );
}
