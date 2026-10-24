export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading question"
      className="mx-auto flex w-full flex-col gap-5 rounded-2xl bg-card p-4"
    >
      <div className="h-6 w-40 animate-pulse rounded-full bg-bg" />
      <div className="h-12 animate-pulse rounded-[14px] bg-bg" />
      <div className="h-32 animate-pulse rounded-[14px] bg-bg" />
      <div className="h-12 animate-pulse rounded-[14px] bg-bg" />
    </div>
  );
}
