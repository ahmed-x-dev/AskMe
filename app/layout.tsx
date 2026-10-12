import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AppShell } from '../src/components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'AskMe',
  description: 'Your revision space',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
