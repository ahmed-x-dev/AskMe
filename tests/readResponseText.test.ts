import { describe, expect, it } from "vitest";

import { readResponseTextUpToByteLimit } from "../src/lib/readResponseText";

describe("readResponseTextUpToByteLimit", () => {
  it("reads UTF-8 response text within the byte limit", async () => {
    const response = new Response("Résumé");

    await expect(readResponseTextUpToByteLimit(response, 20)).resolves.toBe("Résumé");
  });

  it("stops reading when the response exceeds the byte limit", async () => {
    const response = new Response("12345");

    await expect(readResponseTextUpToByteLimit(response, 4)).resolves.toBeNull();
  });
});
