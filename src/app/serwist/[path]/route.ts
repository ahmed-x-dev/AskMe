import { createSerwistRoute } from "@serwist/turbopack";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const offlinePageRevision = createHash("sha256")
  .update(readFileSync(new URL("../../offline/page.tsx", import.meta.url)))
  .digest("hex");

export const {
  dynamic,
  dynamicParams,
  revalidate,
  generateStaticParams,
  GET,
} = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/offline", revision: offlinePageRevision }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
