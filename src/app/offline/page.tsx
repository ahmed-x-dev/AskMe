export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-120 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-[22px] font-medium leading-[28px] text-fg">You’re offline</h1>
      <p className="text-[16px] leading-6 text-muted">
        This page has not been saved on this device yet. Reconnect and try again.
      </p>
      <a
        href="/"
        className="mt-2 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
      >
        Back to sets
      </a>
    </main>
  )
}
