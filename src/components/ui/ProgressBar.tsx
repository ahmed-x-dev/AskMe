type ProgressBarProps = {
  label: string;
  completed: number;
  total: number;
  /** Fill color, for example a roadmap's hex color. Defaults to the theme accent. */
  color?: string;
  /** Set when the bar sits on a `bg-card` surface, so the track stays visible. */
  onCard?: boolean;
};

/** An accessible progress indicator that keeps its value within the declared range. */
export function ProgressBar({ label, completed, total, color, onCard = false }: ProgressBarProps) {
  const max = Math.max(0, total);
  const value = Math.max(0, Math.min(completed, max));
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`h-1.5 w-full overflow-hidden rounded-full ${onCard ? "bg-bg" : "bg-card-hover"}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-200 ease-out"
        style={{ width: `${percent}%`, backgroundColor: color || "var(--accent)" }}
      />
    </div>
  );
}
