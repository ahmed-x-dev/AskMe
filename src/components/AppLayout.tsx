"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

export type ThemeSetter = (
  nextTheme: Theme | ((currentTheme: Theme) => Theme),
) => void;

export type AppLayoutProps = {
  theme: Theme;
  setTheme: ThemeSetter;
  children: ReactNode;
};

export function AppLayout({ theme, setTheme, children }: AppLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <main className="min-h-screen w-full bg-bg text-fg transition-colors duration-200">
      <div
        className={`mx-auto flex min-h-screen w-full flex-col gap-8 px-4 py-6 ${
          isHomePage ? "max-w-200" : "max-w-120"
        }`}
      >
        <header className="flex items-center justify-between gap-4">
          {isHomePage ? (
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 rounded-2xl"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-[18px] font-medium text-on-accent"
              >
                A
              </span>
              <span className="min-w-0">
                <span className="block text-[16px] font-medium leading-6 text-fg">
                  AskMe
                </span>
                <span className="block text-[13px] leading-4.5 text-muted">
                  Your revision space
                </span>
              </span>
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex min-h-12 min-w-12 items-center gap-2 rounded-2xl bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-accent hover:text-on-accent"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="m15 18-6-6 6-6M9 12h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to sets
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-card text-fg transition duration-200 ease-out hover:bg-accent hover:text-on-accent"
              aria-label="Open settings"
              title="Open settings"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M19.14 12.94a7.2 7.2 0 0 0 0-1.88l2.03-1.58-2-3.46-2.39.96a7.4 7.4 0 0 0-1.63-.94L14.8 3.5h-4l-.36 2.54a7.4 7.4 0 0 0-1.63.94l-2.39-.96-2 3.46 2.03 1.58a7.2 7.2 0 0 0 0 1.88l-2.03 1.58 2 3.46 2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54h4l.36-2.54c.58-.23 1.13-.55 1.63-.94l2.39.96 2-3.46-2.03-1.58Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === "light" ? "dark" : "light",
                )
              }
              className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-fg transition duration-200 ease-out hover:bg-accent hover:text-on-accent active:scale-[0.98]"
              aria-label="Toggle color theme"
              aria-pressed={theme === "dark"}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                >
                  <path
                    d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
