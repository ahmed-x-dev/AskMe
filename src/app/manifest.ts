import type { MetadataRoute } from "next";

/** Returns install metadata for the browser's Add to Home Screen flow. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AskMe",
    short_name: "AskMe",
    description: "Your revision space",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfcfb",
    theme_color: "#09785e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
