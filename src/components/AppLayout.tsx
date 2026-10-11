import { Link, Outlet, useLocation } from 'react-router'

export type Theme = 'light' | 'dark'

export type ThemeSetter = (
  nextTheme: Theme | ((currentTheme: Theme) => Theme),
) => void

export type AppLayoutProps = {
  theme: Theme
  setTheme: ThemeSetter
}

export function AppLayout({ theme, setTheme }: AppLayoutProps) {
  const isSetsPage = useLocation().pathname === '/'

  return (
    <main className="min-h-screen bg-bg text-fg transition-colors duration-200">
      <div
        className={`mx-auto flex min-h-screen w-full flex-col gap-8 px-4 py-6 ${
          isSetsPage ? 'max-w-[800px]' : 'max-w-[480px]'
        }`}
      >
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 rounded-2xl">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-[18px] font-medium text-on-accent"
            >
              A
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] font-medium leading-6 text-fg">AskMe</span>
              <span className="block text-[13px] leading-[18px] text-muted">
                Your revision space
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === 'light' ? 'dark' : 'light',
              )
            }
            className="min-h-12 shrink-0 rounded-2xl bg-card px-4 text-[13px] font-medium text-fg transition duration-200 ease-out hover:bg-accent hover:text-on-accent active:scale-[0.98]"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'light' ? 'Dark theme' : 'Light theme'}
          </button>
        </header>

        <Outlet />
      </div>
    </main>
  )
}
