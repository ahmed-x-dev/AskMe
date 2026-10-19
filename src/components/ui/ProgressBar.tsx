type ProgressBarProps = {
  label: string;
  completed: number;
  total: number;
  /** Fill color, for example a roadmap's hex color. Defaults to the theme accent. */
  color?: string;
  /** Set when the bar sits on a `bg-card` surface, so the track stays visible. */
  onCard?: boolean;
};

export function ProgressBar({ label, completed, total, color, onCard = false }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      className={`h-1.5 w-full overflow-hidden rounded-full ${onCard ? "bg-bg" : "bg-card-hover"}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-200 ease-out"
        style={{ width: `${percent}%`, backgroundColor: color || "var(--accent)" }}
      />
    </div>
  );
}
