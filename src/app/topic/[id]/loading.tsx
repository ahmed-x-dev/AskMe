export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading topic"
      className="mx-auto flex w-full flex-col gap-4"
    >
      <div className="h-12 w-40 animate-pulse rounded-2xl bg-card" />
      <div className="h-20 animate-pulse rounded-2xl bg-card" />
      <div className="h-32 animate-pulse rounded-2xl bg-card" />
      <div className="h-40 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}