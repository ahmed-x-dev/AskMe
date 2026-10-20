import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";

import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "AskMe",
  title: "AskMe",
  description: "Your revision space",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AskMe",
  },
};

export const viewport: Viewport = {
  themeColor: "#09785e",
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
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV !== "production"}
          reloadOnOnline={false}
        >
          <AppShell>{children}</AppShell>
        </SerwistProvider>
      </body>
    </html>
  );
}
