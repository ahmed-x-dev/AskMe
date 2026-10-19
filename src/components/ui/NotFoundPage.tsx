import Link from 'next/link'

import { buttonPrimary } from './styles'

export function NotFoundPage() {
  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 text-center">
      <h2 className="text-[18px] font-medium leading-[26px] text-fg">Page not found</h2>
      <p className="mt-2 text-[16px] leading-6 text-muted">
        This route does not exist yet.
      </p>
      <Link href="/" className={`mt-6 ${buttonPrimary}`}>
        Back to roadmaps
      </Link>
    </section>
  )
}
