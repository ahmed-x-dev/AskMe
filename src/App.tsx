import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "askme-theme";

/** Uses the saved theme when valid, otherwise follows the system preference. */
function getPreferredTheme(): Theme {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <main className="min-h-screen bg-bg text-fg transition-colors duration-200">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col gap-6 px-4 py-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] leading-[18px] text-muted">AskMe</p>
            <h1 className="mt-1 text-[22px] font-medium leading-[28px]">
              Revision quiz
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "light" ? "dark" : "light",
              )
            }
            className="min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out active:scale-[0.98]"
            aria-label="Toggle color theme"
            aria-pressed={theme === "dark"}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </header>

        <section className="rounded-2xl bg-card p-4">
          <p className="text-[13px] leading-[18px] text-muted">Study session</p>
          <h2 className="mt-3 text-[16px] font-medium leading-6">
            Biology Ch. 3
          </h2>
          <p className="mt-2 text-[16px] leading-6 text-muted">
            Make a short revision session, flip between MCQ and essay questions,
            and keep your progress intact even when you reload the page.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out active:scale-[0.98]"
            >
              Start quiz
            </button>
            <button
              type="button"
              className="min-h-12 flex-1 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out active:scale-[0.98]"
            >
              View sets
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-card p-4">
            <p className="text-[13px] leading-[18px] text-muted">
              Multiple choice
            </p>
            <p className="mt-2 text-[22px] font-medium leading-7 tabular-nums">
              12
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4">
            <p className="text-[13px] leading-[18px] text-muted">Essay</p>
            <p className="mt-2 text-[22px] font-medium leading-7 tabular-nums">
              4
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
