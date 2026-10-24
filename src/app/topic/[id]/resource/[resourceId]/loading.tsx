export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading resource"
      className="mx-auto w-full max-w-5xl"
    >
      <div className="h-12 w-48 animate-pulse rounded-2xl bg-card" />
      <div className="mt-6 aspect-video animate-pulse rounded-2xl bg-card" />
    </div>
  );
}