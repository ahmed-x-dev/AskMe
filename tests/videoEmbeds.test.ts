import { describe, expect, it } from "vitest";
import { videoEmbedUrl } from "../src/components/topics/resourceKinds";

describe("video embed URLs", () => {
  it("normalizes supported YouTube and Vimeo links", () => {
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://vimeo.com/123456?share=copy"))
      .toBe("https://player.vimeo.com/video/123456");
  });

  it("does not embed malformed or lookalike hosts", () => {
    expect(videoEmbedUrl("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(videoEmbedUrl("https://youtu.be/not-a-valid-id")).toBeNull();
    expect(videoEmbedUrl("javascript:alert(1)")).toBeNull();
  });
});