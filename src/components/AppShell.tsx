'use client'

import { useEffect, useState } from 'react'

import { AppLayout, type Theme } from './AppLayout'

const THEME_STORAGE_KEY = 'askme-theme'

function getPreferredTheme(): Theme {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isThemeLoaded, setIsThemeLoaded] = useState(false)

  useEffect(() => {
    let isCurrent = true

    queueMicrotask(() => {
      if (!isCurrent) {
        return
      }

      const preferredTheme = getPreferredTheme()
      setTheme(preferredTheme)
      document.documentElement.setAttribute('data-theme', preferredTheme)
      setIsThemeLoaded(true)
    })

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Could not register the offline service worker.', error)
      })
    }

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    if (isThemeLoaded) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [isThemeLoaded, theme])

  return (
    <AppLayout theme={theme} setTheme={setTheme}>
      {children}
    </AppLayout>
  )
}
