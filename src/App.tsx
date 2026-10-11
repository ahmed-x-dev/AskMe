import { useEffect, useState } from "react";

import AppRoutes from "./routes";
import type { Theme } from "./components/AppLayout";

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

  return <AppRoutes theme={theme} setTheme={setTheme} />;
}
