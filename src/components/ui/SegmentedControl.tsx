type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

/** A row of mutually exclusive choices, such as a question type or difficulty. */
export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-medium leading-[18px] text-muted">{label}</legend>
      <div role="group" aria-label={label} className="flex gap-1 rounded-[14px] bg-card p-[3px]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-12 flex-1 rounded-[11px] px-3 text-[13px] font-medium leading-[18px] transition-colors duration-150 ${
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
