import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesSection } from "../src/components/topics/NotesSection";
import { TopicPage } from "../src/components/topics/TopicPage";
import { QuestionEditorForm } from "../src/components/questions/QuestionEditorForm";
import {
  addQuestion,
  addResource,
  allTables,
  createGroup,
  createRoadmap,
  createTopic,
  db,
  setResourceDone,
} from "../src/lib/data";

const route = vi.hoisted(() => ({ topicId: "" }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: route.topicId }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(async () => {
  await db.transaction("rw", allTables(), async () => {
    for (const table of allTables()) await table.clear();
  });
  route.topicId = "";
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const wait = (ms = 80) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

const getButton = (label: string) =>
  [...container.querySelectorAll("button")].find((element) =>
    element.textContent?.includes(label),
  ) as HTMLButtonElement | undefined;

async function click(button: HTMLButtonElement | undefined) {
  if (!button) throw new Error("Button not found");
  await act(async () => {
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

describe("topic learning page", () => {
  it("gives the question editor a page heading and keeps the topic as context", async () => {
    const roadmap = await createRoadmap({ title: "Frontend development" });
    const topic = await createTopic({
      roadmapId: roadmap.id,
      title: "Understanding component state",
    });

    act(() => root.render(<QuestionEditorForm topic={topic} />));

    expect(container.querySelector("h1")?.textContent).toBe("New question");
    expect(container.querySelector("h1 + p")?.textContent).toBe(topic.title);
  });

  it("summarizes existing topic data and puts practice actions before the learning sections", async () => {
    const roadmap = await createRoadmap({ title: "Frontend development" });
    const group = await createGroup(roadmap.id, "React basics");
    const topic = await createTopic({
      roadmapId: roadmap.id,
      groupId: group.id,
      title: "Understanding component state",
    });
    const resource = await addResource({
      topicId: topic.id,
      title: "State guide with a very long unbroken name: componentstateguidecomponentstateguide",
      url: "https://react.dev/learn/state",
      kind: "docs",
    });
    await setResourceDone(resource.id, true);
    await addQuestion(topic.id, {
      type: "mcq",
      text: "What does state represent?",
      options: ["A", "B", "C", "D"],
      answerIndex: 0,
    });
    route.topicId = topic.id;

    act(() => root.render(<TopicPage />));
    await wait();

    expect(container.querySelector("h1")?.textContent).toBe(topic.title);
    expect(container.textContent).toContain(roadmap.title);
    expect(container.textContent).toContain(group.title);
    expect(container.textContent).toContain("1 of 1 resource completed");
    expect(container.textContent).toContain("Start quiz");
    expect(container.textContent).toContain("Add question");
    expect(container.textContent).toContain("Learning resources");
    expect(container.textContent).toContain("Generate with AI");
    expect(container.querySelector("#resources-heading + p")?.textContent).toBe("1 resource");
    expect(
      [...container.querySelectorAll("a")].filter((link) =>
        link.textContent?.includes("Add question"),
      ),
    ).toHaveLength(1);
    expect(container.querySelector(`a[href="/topic/${topic.id}/quiz"]`)).not.toBeNull();
    const resourceTitle = [...container.querySelectorAll("a span")].find(
      (element) => element.textContent === resource.title,
    );
    expect(resourceTitle?.className).toContain("wrap-break-word");
    expect(container.querySelector(".break-all")?.textContent).toBe("react.dev");
    expect(
      container.querySelector(
        `input[aria-label="Mark “${resource.title}” as not done"]`,
      ),
    ).not.toBeNull();
  });

  it("offers a first-question action when a topic has no practice questions", async () => {
    const roadmap = await createRoadmap({ title: "Biology" });
    const topic = await createTopic({ roadmapId: roadmap.id, title: "Cell structure" });
    route.topicId = topic.id;

    act(() => root.render(<TopicPage />));
    await wait();

    expect(container.textContent).toContain("Add your first question");
    expect(container.querySelector(`a[href="/topic/${topic.id}/q/new"]`)).not.toBeNull();
    expect(container.querySelector(`a[href="/topic/${topic.id}/quiz"]`)).toBeNull();
    expect(container.textContent).not.toContain("Add question");
    expect(container.textContent).toContain("Add a learning link to track");
  });

  it("keeps note editing readable and saves changes on blur", async () => {
    const roadmap = await createRoadmap({ title: "React" });
    const topic = await createTopic({
      roadmapId: roadmap.id,
      title: "Hooks",
    });

    act(() => root.render(<NotesSection topicId={topic.id} notes={undefined} />));
    const textarea = container.querySelector("textarea")!;
    expect(textarea.className).toContain("max-w-[72ch]");
    expect(textarea.placeholder).toContain("Write notes in Markdown");

    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      setter?.call(textarea, "# A useful note\n\n- First idea");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click(getButton("Preview"));
    expect(container.querySelector("h3")?.textContent).toBe("A useful note");

    await click(getButton("Edit"));
    const editedTextarea = container.querySelector("textarea")!;
    await act(async () => {
      setter?.call(editedTextarea, "# Updated note");
      editedTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      editedTextarea.focus();
      editedTextarea.blur();
    });
    await wait(50);
    expect((await db.topics.get(topic.id))?.notes).toBe("# Updated note");
  });
});
