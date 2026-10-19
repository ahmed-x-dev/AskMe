import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "../src/components/ui/Markdown";

const html = (md: string) => renderToStaticMarkup(<Markdown>{md}</Markdown>);

describe("Markdown notes", () => {
  it("renders basic markdown", () => {
    const out = html("# Hi\n\n**bold** and `code`\n\n- one\n- two");
    expect(out).toContain("<h3");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<li>one</li>");
  });
  it("does not render raw html or scripts", () => {
    const out = html("<script>alert(1)</script><img src=x onerror=alert(1)>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;script&gt;");
  });
  it("drops javascript: links and opens real links safely", () => {
    expect(html("[x](javascript:alert(1))")).not.toContain("javascript:");
    const out = html("[docs](https://react.dev)");
    expect(out).toContain('href="https://react.dev"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });
  it("never loads remote images", () => {
    const out = html("![pic](https://evil.example/p.png)");
    expect(out).not.toContain("<img");
    expect(out).toContain("[image: pic]");
  });
});
