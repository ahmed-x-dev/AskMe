import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "askme-theme";

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
    <main className="min-h-screen bg-(--bg) text-(--text) transition-colors duration-200">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-6">
        <header className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-(--muted)">
              AskMe
            </p>
            <h1 className="mt-1 text-2xl font-bold">Revision Quiz</h1>
          </div>

          <button
            type="button"
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "light" ? "dark" : "light",
              )
            }
            className="rounded-full border border-(--border) bg-(--surface-strong) px-3 py-2 text-sm font-medium text-(--text) shadow-sm transition hover:opacity-90"
            aria-label="Toggle color theme"
            aria-pressed={theme === "dark"}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </header>

        <section className="rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--muted)">
            Study session
          </p>
          <h2 className="mt-3 text-xl font-semibold">Biology Ch. 3</h2>
          <p className="mt-2 text-sm leading-6 text-(--muted)">
            Make a short revision session, flip between MCQ and essay questions,
            and keep your progress intact even when you reload the page.
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl bg-(--accent) px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              Start quiz
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border border-(--border) bg-(--surface-strong) px-4 py-3 text-sm font-semibold text-(--text)"
            >
              View sets
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--muted)">
              MCQ
            </p>
            <p className="mt-2 text-2xl font-bold">12</p>
          </div>
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--muted)">
              Essay
            </p>
            <p className="mt-2 text-2xl font-bold">4</p>
          </div>
        </section>
      </div>
    </main>
  );
}
