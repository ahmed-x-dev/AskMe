type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  /** Set when the control sits inside a `bg-card` panel, so the container takes the step below it. */
  onCard?: boolean;
};

/** A row of mutually exclusive choices, such as a question type or difficulty. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  onCard = false,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-medium leading-[18px] text-muted">{label}</legend>
      <div
        role="group"
        aria-label={label}
        className={`flex gap-1 rounded-[14px] p-[3px] ${onCard ? "bg-bg" : "bg-card"}`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`min-h-12 min-w-0 flex-1 rounded-[11px] px-2 text-[13px] font-medium leading-[18px] transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              onCard ? "focus-visible:ring-offset-bg" : "focus-visible:ring-offset-card"
            } ${
              value === option.value
                ? "bg-accent text-on-accent"
                : "text-muted hover:bg-card-hover hover:text-fg"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
