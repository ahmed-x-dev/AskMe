import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TopicRow } from "../src/components/roadmaps/TopicRow";
import type { Topic } from "../src/types/study";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("topic row", () => {
  it("makes the full row a topic link without nesting row controls inside it", () => {
    const topic: Topic = {
      id: "topic-1",
      roadmapId: "roadmap-1",
      title: "React state",
      order: 0,
      status: "todo",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    act(() =>
      root.render(
        <TopicRow
          topic={topic}
          number={1}
          questionCount={2}
          actions={{
            onStatusChange: vi.fn(),
            onRename: vi.fn(),
            onMove: vi.fn(),
            onDelete: vi.fn(),
          }}
        />,
      ),
    );

    const row = container.querySelector("li");
    const link = row?.querySelector('a[href="/topic/topic-1"]');
    expect(link?.getAttribute("aria-label")).toBe("Open React state");
    expect(link?.className).toContain("absolute inset-0");
    expect(row?.className).toContain("relative");
    expect(link?.contains(row?.querySelector("button") ?? null)).toBe(false);
    expect(link?.contains(row?.querySelector("select") ?? null)).toBe(false);
  });
});
