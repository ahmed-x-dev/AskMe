import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AskMe",
  description: "Your revision space",
  icons: {
    icon: "/icon.svg",
  },
};

/**
 * Applies the saved theme before paint so the first frame is never the wrong
 * theme. This runs before React hydrates, so `<html>` opts out of hydration
 * warnings for the `data-theme` attribute it sets.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem('askme-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
