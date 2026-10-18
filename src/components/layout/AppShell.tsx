"use client";

import { useEffect, useState } from "react";

import { AppLayout, type Theme } from "@/components/layout/AppLayout";

const THEME_STORAGE_KEY = "askme-theme";
const LEGACY_PWA_CLEANUP_KEY = "askme-legacy-pwa-cleaned";
const LEGACY_SERVICE_WORKER_URL = "/sw.js";
const LEGACY_CACHE_NAME = "askme-next-v1";
let legacyPwaCleanup: Promise<void> | undefined;

function removeLegacyPwaSupport(): Promise<void> {
  legacyPwaCleanup ??= removeLegacyPwaSupportOnce();
  return legacyPwaCleanup;
}

async function removeLegacyPwaSupportOnce(): Promise<void> {
  if (window.localStorage.getItem(LEGACY_PWA_CLEANUP_KEY) === "true") {
    return;
  }

  let shouldReload = false;
  let cleanupComplete = true;

  if ("serviceWorker" in navigator) {
    const workerUrl = new URL(LEGACY_SERVICE_WORKER_URL, window.location.origin)
      .href;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistration = registrations.find((registration) =>
      [registration.active, registration.waiting, registration.installing].some(
        (worker) => worker?.scriptURL === workerUrl,
      ),
    );

    if (appRegistration) {
      shouldReload = await appRegistration.unregister();
      cleanupComplete = shouldReload;

      if (!shouldReload) {
        console.error(
          "Could not unregister the previous offline service worker.",
        );
      }
    }
  }

  if ("caches" in window) {
    await window.caches.delete(LEGACY_CACHE_NAME);
  }

  if (cleanupComplete) {
    window.localStorage.setItem(LEGACY_PWA_CLEANUP_KEY, "true");
  }

  if (shouldReload) {
    window.location.reload();
  }
}

function getPreferredTheme(): Theme {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    queueMicrotask(() => {
      if (!isCurrent) {
        return;
      }

      const preferredTheme = getPreferredTheme();
      setTheme(preferredTheme);
      document.documentElement.setAttribute("data-theme", preferredTheme);
      setIsThemeLoaded(true);
    });

    void removeLegacyPwaSupport().catch((error: unknown) => {
      console.error("Could not remove previous PWA support.", error);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    if (isThemeLoaded) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [isThemeLoaded, theme]);

  return (
    <AppLayout theme={theme} setTheme={setTheme}>
      {children}
    </AppLayout>
  );
}
