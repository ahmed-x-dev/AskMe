"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";

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
  /** Topic pages show their own back link to the roadmap, so the generic one is hidden there. */
  const hasOwnBackLink = pathname.startsWith("/topic/");

  return (
    <main className="min-h-screen w-full bg-bg text-fg transition-colors duration-200">
      <div
        className="mx-auto flex min-h-screen w-full max-w-200 flex-col gap-8 px-4 py-6 lg:max-w-7xl 2xl:max-w-screen-2xl"
      >
        <header className={`flex items-center justify-between gap-4 ${isHomePage ? "border-b border-card-hover pb-5" : ""}`}>
          {isHomePage ? (
            <div className="flex min-w-0 items-center gap-4">
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
                <span className="min-w-0 text-[16px] font-medium leading-6 text-fg">
                  AskMe
                </span>
              </Link>
              <nav aria-label="Primary navigation" className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/"
                  aria-current="page"
                  className="min-h-12 rounded-2xl bg-card px-4 py-3 text-[16px] font-medium leading-6 text-fg"
                >
                  Roadmaps
                </Link>
                <Link
                  href="/settings"
                  className="min-h-12 rounded-2xl px-3 py-3 text-[16px] leading-6 text-muted transition-colors hover:bg-card hover:text-fg"
                >
                  Settings
                </Link>
              </nav>
            </div>
          ) : hasOwnBackLink ? null : (
            <Link
              href="/"
              className="inline-flex min-h-12 min-w-12 items-center gap-2 rounded-2xl bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card-hover"
            >
              <ArrowLeft
                aria-hidden="true"
                className="h-5 w-5"
                strokeWidth={1.5}
              />
              Back to roadmaps
            </Link>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === "light" ? "dark" : "light",
                )
              }
              className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-fg transition duration-200 ease-out hover:bg-card-hover active:scale-[0.98]"
              aria-label="Toggle color theme"
              aria-pressed={theme === "dark"}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? (
                <Moon
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={1.5}
                />
              ) : (
                <Sun
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={1.5}
                />
              )}
            </button>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
