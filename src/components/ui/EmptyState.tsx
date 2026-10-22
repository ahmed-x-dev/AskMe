import { Plus, type LucideIcon } from "lucide-react";
import { buttonPrimary, focusRing } from "./styles";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Plus,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  /** 24px outline icon shown above the title. Defaults to a plus. */
  icon?: LucideIcon;
}) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-2xl bg-card px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
        <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h2 className="mt-4 text-lg font-medium leading-6 text-fg">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-base leading-6 text-muted">
        {description}
      </p>
      <button type="button" onClick={onAction} className={`mt-6 ${buttonPrimary} ${focusRing}`}>
        {actionLabel}
      </button>
    </section>
  );
}
