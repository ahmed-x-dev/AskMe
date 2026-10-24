export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading roadmap"
      className="flex w-full flex-col gap-4"
    >
      <div className="h-24 animate-pulse rounded-2xl bg-card" />
      <div className="h-16 animate-pulse rounded-2xl bg-card" />
      <div className="h-16 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
