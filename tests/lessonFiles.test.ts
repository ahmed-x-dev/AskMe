import { describe, expect, it } from "vitest";
import {
  isMarkdownLessonFile,
  prepareLessonFile,
  readLessonMarkdown,
} from "../src/lib/lessonFiles";

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

  it("detects and decodes saved Markdown lesson documents as UTF-8", () => {
    const content = "# Résumé";
    const bytes = new TextEncoder().encode(content);
    const binary = String.fromCharCode(...bytes);
    const resource = {
      id: "resource-id",
      title: "Study notes",
      kind: "docs" as const,
      source: "file" as const,
      fileName: "notes.markdown",
      mimeType: "text/plain",
      size: bytes.length,
      fileData: btoa(binary),
    };

    expect(isMarkdownLessonFile(resource)).toBe(true);
    expect(readLessonMarkdown(resource)).toBe(content);
  });
});
