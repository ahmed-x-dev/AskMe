import Link from 'next/link'

import { buttonPrimary } from './styles'

export function NotFoundPage() {
  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 text-center">
      <h1 className="text-[22px] font-medium leading-7 text-fg">Page not found</h1>
      <p className="mt-2 text-[16px] leading-6 text-muted">
        This route does not exist yet.
      </p>
      <Link href="/" className={`mt-6 ${buttonPrimary}`}>
        Back to roadmaps
      </Link>
    </section>
  )
}
