import Link from 'next/link'

export function NotFoundPage() {
  return (
    <section className="rounded-2xl bg-card p-5 text-center">
      <h2 className="text-[18px] font-medium leading-7 text-fg">Page not found</h2>
      <p className="mt-2 text-[16px] leading-6 text-muted">
        This route does not exist yet.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
      >
        Back to sets
      </Link>
    </section>
  )
}
