"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, CalendarCheck, Map, Moon, Settings, Sun, type LucideIcon } from "lucide-react";
import { countDue } from "@/lib/data";
import { iconButton, pageContainer } from "@/components/ui/styles";

export type Theme = "light" | "dark";

export type ThemeSetter = (
  nextTheme: Theme | ((currentTheme: Theme) => Theme),
) => void;

type AppTheme = { theme: Theme; setTheme: ThemeSetter };

const AppThemeContext = createContext<AppTheme | null>(null);

/** Reads the active theme and setter provided by the shared application shell. */
export function useAppTheme(): AppTheme {
  const value = useContext(AppThemeContext);

  if (!value) {
    throw new Error("useAppTheme must be used inside AppLayout.");
  }

  return value;
}

export type AppLayoutProps = {
  theme: Theme;
  setTheme: ThemeSetter;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Roadmaps", icon: Map },
  { href: "/review", label: "Review", icon: CalendarCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** The shared frame: a sticky top bar with primary navigation, the page content, and a
 *  bottom navigation bar on small screens. */
export function AppLayout({ theme, setTheme, children }: AppLayoutProps) {
  const pathname = usePathname();
  const dueCount = useLiveQuery(() => countDue(), []) ?? 0;
  const isHomePage = pathname === "/";
  /** Pages that carry their own back link do not need the generic one. */
  const hasOwnBackLink =
    pathname.startsWith("/topic/") || /^\/roadmap\/[^/]+\/quiz/.test(pathname);

  const isActive = (href: string) => {
    if (href === "/") {
      return (
        pathname === "/" ||
        pathname.startsWith("/roadmap/") ||
        pathname.startsWith("/topic/")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const currentNavigation = (href: string) =>
    pathname === href ? "page" : isActive(href) ? "location" : undefined;

  const toggleTheme = () =>
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));

  return (
    <div className="min-h-screen w-full bg-bg text-fg transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-line bg-bg">
        <div className={`${pageContainer} flex items-center gap-2 py-3 md:gap-4`}>
          {!isHomePage && !hasOwnBackLink ? (
            <Link
              href="/"
              aria-label="Back to roadmaps"
              className={`${iconButton} text-muted`}
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          ) : null}

          <Link href="/" className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-[16px] font-medium text-on-accent"
            >
              A
            </span>
            <span className="min-w-0 text-[16px] font-medium leading-6 text-fg">
              AskMe
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="ms-2 hidden items-center gap-1 md:flex"
          >
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={currentNavigation(href)}
                className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-3 text-[16px] font-medium leading-6 transition-colors duration-150 ${
                  isActive(href)
                    ? "bg-card text-fg"
                    : "text-muted hover:bg-card hover:text-fg"
                }`}
              >
                {label}
                {href === "/review" && dueCount > 0 ? (
                  <span
                    aria-label={`${dueCount} due`}
                    className="rounded-full bg-accent px-2 py-0.5 text-[13px] font-medium leading-[18px] text-on-accent tabular-nums"
                  >
                    {dueCount}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`${iconButton} text-muted`}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              aria-pressed={theme === "dark"}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? (
                <Moon aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Sun aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </header>

      <AppThemeContext value={{ theme, setTheme }}>
        <main className={`${pageContainer} flex flex-col gap-6 pb-28 pt-6 md:pb-12`}>
          {children}
        </main>
      </AppThemeContext>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={currentNavigation(href)}
              className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[13px] font-medium leading-[18px] transition-colors duration-150 ${
                isActive(href)
                  ? "bg-card text-accent-text"
                  : "text-muted hover:bg-card"
              }`}
            >
              <span className="relative">
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                {href === "/review" && dueCount > 0 ? (
                  <span
                    aria-label={`${dueCount} due`}
                    className="absolute -end-2 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[11px] font-medium leading-4 text-on-accent tabular-nums"
                  >
                    {dueCount}
                  </span>
                ) : null}
              </span>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
