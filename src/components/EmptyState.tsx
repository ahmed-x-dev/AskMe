import { Plus } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="mx-auto w-full rounded-2xl bg-card p-6 text-center lg:max-w-3xl">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
        <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h2 className="mt-4 text-[16px] font-medium leading-6 text-fg">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-70 text-[16px] leading-6 text-muted">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 min-h-12 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    </section>
  );
}
