export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading quiz"
      className="mx-auto flex w-full flex-col gap-4"
    >
      <div className="h-12 w-40 animate-pulse rounded-2xl bg-card" />
      <div className="h-48 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
