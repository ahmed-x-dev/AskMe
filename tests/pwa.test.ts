import { describe, expect, it } from "vitest";

import manifest from "../src/app/manifest";

describe("PWA manifest", () => {
  it("provides install metadata, scalable icons, and a standalone start page", () => {
    const result = manifest();

    expect(result).toMatchObject({
      name: "AskMe",
      short_name: "AskMe",
      start_url: "/",
      display: "standalone",
    });
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icon-512.png", sizes: "512x512", purpose: "maskable" }),
        expect.objectContaining({ src: "/icon.svg", sizes: "any" }),
      ]),
    );
  });
});
