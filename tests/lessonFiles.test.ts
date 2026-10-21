import { describe, expect, it } from "vitest";
import { prepareLessonFile } from "../src/lib/lessonFiles";

describe("lesson document files", () => {
  it("encodes a device file with its name and document type", async () => {
    const file = new File(["# Local notes"], "notes.md", { type: "text/markdown" });
    const resource = await prepareLessonFile(file, "My notes");

    expect(resource).toMatchObject({
      source: "file",
      title: "My notes",
      fileName: "notes.md",
      mimeType: "text/markdown",
      size: 13,
    });
    expect(resource.source === "file" && atob(resource.fileData)).toBe("# Local notes");
  });

  it("rejects file types that are not supported", async () => {
    const file = new File(["script"], "notes.exe");
    await expect(prepareLessonFile(file, "Notes")).rejects.toThrow(
      "Choose a PDF, TXT, Markdown, or Word document.",
    );
  });
});
