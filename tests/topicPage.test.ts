import { beforeEach, describe, expect, it } from "vitest";
import {
  addLesson,
  addLessonResource,
  addQuestion,
  allTables,
  createGroup,
  createRoadmap,
  createTopic,
  db,
  deleteLesson,
  deleteLessonResource,
  getQuestionEditorData,
  getTopicPage,
  recordAttempt,
  reorderLessons,
  setLessonDone,
  getTopicLessonResource,
  updateLesson,
  updateLessonResource,
  updateTopic,
} from "../src/lib/data";
import { withHttps } from "../src/lib/format";

const mcq = {
  type: "mcq" as const,
  text: "Q?",
  options: ["a", "b", "c", "d"] as [string, string, string, string],
  answerIndex: 0,
};

beforeEach(async () => {
  await db.transaction("rw", allTables(), async () => {
    for (const t of allTables()) await t.clear();
  });
});

describe("getTopicPage", () => {
  it("returns the topic with roadmap, group, ordered lessons and questions", async () => {
    const r = await createRoadmap({ title: "React" });
    const g = await createGroup(r.id, "Basics");
    const t = await createTopic({
      roadmapId: r.id,
      groupId: g.id,
      title: "JSX",
    });
    const lesson = await addLesson(t.id, "Study links");
    await addLessonResource(lesson.id, {
      source: "link",
      url: "https://a.dev",
      title: "A",
      kind: "docs",
    });
    await addLessonResource(lesson.id, {
      source: "link",
      url: "https://b.dev",
      title: "B",
      kind: "video",
    });
    await addLesson(t.id, "More study");
    const q1 = await addQuestion(t.id, mcq);
    await new Promise((x) => setTimeout(x, 5));
    const q2 = await addQuestion(t.id, { type: "essay", text: "Essay" });
    const page = await getTopicPage(t.id);
    expect(page!.roadmap.id).toBe(r.id);
    expect(page!.group!.title).toBe("Basics");
    expect(page!.lessons.map((x) => x.title)).toEqual([
      "Study links",
      "More study",
    ]);
    expect(page!.lessons[0].resources.map((x) => x.title)).toEqual(["A", "B"]);
    expect(page!.lessons[1].resources).toEqual([]);
    expect(page!.questions.map((q) => q.id)).toEqual([q1.id, q2.id]);
  });
  it("has no group for ungrouped topics and null for a missing topic", async () => {
    const r = await createRoadmap({ title: "R" });
    const t = await createTopic({ roadmapId: r.id, title: "T" });
    expect((await getTopicPage(t.id))!.group).toBeUndefined();
    expect(await getTopicPage("missing")).toBeNull();
  });

  it("deleting a lesson removes its questions and their review history only", async () => {
    const roadmap = await createRoadmap({ title: "React" });
    const topic = await createTopic({ roadmapId: roadmap.id, title: "Hooks" });
    const lesson = await addLesson(topic.id, "Effects");
    const topicQuestion = await addQuestion(topic.id, mcq);
    const lessonQuestion = await addQuestion(topic.id, mcq, {
      lessonId: lesson.id,
    });
    await recordAttempt(lessonQuestion.id, false);

    await deleteLesson(lesson.id);

    expect(
      (await getTopicPage(topic.id))!.questions.map((question) => question.id),
    ).toEqual([topicQuestion.id]);
    expect(await db.questions.get(lessonQuestion.id)).toBeUndefined();
    expect(
      await db.attempts.where("questionId").equals(lessonQuestion.id).count(),
    ).toBe(0);
    expect(await db.reviews.get(lessonQuestion.id)).toBeUndefined();
  });
});

describe("getQuestionEditorData", () => {
  it("handles new, existing, wrong-topic and missing cases", async () => {
    const r = await createRoadmap({ title: "R" });
    const t1 = await createTopic({ roadmapId: r.id, title: "T1" });
    const t2 = await createTopic({ roadmapId: r.id, title: "T2" });
    const q = await addQuestion(t1.id, mcq);
    expect((await getQuestionEditorData(t1.id))!.question).toBeNull();
    expect((await getQuestionEditorData(t1.id, q.id))!.question!.id).toBe(q.id);
    expect((await getQuestionEditorData(t2.id, q.id))!.question).toBeNull();
    expect((await getQuestionEditorData(t1.id, "nope"))!.question).toBeNull();
    expect(await getQuestionEditorData("missing")).toBeNull();
  });
});

describe("lessons and lesson resources", () => {
  it("creates, completes, edits, reorders, and deletes nested lesson resources", async () => {
    const r = await createRoadmap({ title: "R" });
    const t = await createTopic({ roadmapId: r.id, title: "T" });
    const first = await addLesson(t.id, "First lesson");
    const second = await addLesson(t.id, "Second lesson");
    await addLessonResource(first.id, {
      source: "link",
      url: withHttps("react.dev/learn"),
      title: "React docs",
      kind: "docs",
    });
    const video = await addLessonResource(first.id, {
      source: "link",
      url: "https://youtu.be/x",
      title: "Video",
      kind: "video",
    });
    const document = await addLessonResource(first.id, {
      source: "file",
      title: "Study notes",
      fileName: "notes.md",
      mimeType: "text/markdown",
      size: 2,
      fileData: "aGk=",
    });
    await expect(
      addLessonResource(first.id, {
        source: "link",
        url: "javascript:alert(1)",
        title: "Unsafe",
        kind: "other",
      }),
    ).rejects.toThrow();
    await setLessonDone(first.id, true);
    await updateLessonResource(first.id, video.id, {
      source: "link",
      url: "https://youtu.be/x",
      title: "Renamed",
      kind: "other",
    });
    await updateLessonResource(first.id, document.id, {
      source: "file",
      title: "Edited notes",
      fileName: "notes.md",
      mimeType: "text/markdown",
      size: 2,
      fileData: "aGk=",
    });
    await updateLesson(second.id, "Renamed second lesson");
    await reorderLessons([second.id, first.id]);
    const list = await getTopicPage(t.id);
    expect(list!.lessons.map((lesson) => [lesson.title, lesson.done])).toEqual([
      ["Renamed second lesson", false],
      ["First lesson", true],
    ]);
    expect(
      list!.lessons[1].resources.map((resource) => [
        resource.title,
        resource.kind,
      ]),
    ).toEqual([
      ["React docs", "docs"],
      ["Renamed", "other"],
      ["Edited notes", "docs"],
    ]);
    expect((await getTopicLessonResource(t.id, document.id))?.lesson.id).toBe(
      first.id,
    );
    expect(
      await getTopicLessonResource("missing-topic", document.id),
    ).toBeNull();
    await expect(
      addLessonResource(first.id, {
        source: "file",
        title: "Too large",
        fileName: "large.pdf",
        mimeType: "application/pdf",
        size: 20 * 1024 * 1024 + 1,
        fileData: "aGk=",
      }),
    ).rejects.toThrow("no larger than 20 MB");
    await deleteLessonResource(first.id, video.id);
    expect((await getTopicPage(t.id))!.lessons[1].resources).toHaveLength(2);
    await deleteLesson(second.id);
    expect(
      (await getTopicPage(t.id))!.lessons.map((lesson) => lesson.title),
    ).toEqual(["First lesson"]);
  });
  it("withHttps only adds a scheme when missing", () => {
    expect(withHttps("  react.dev ")).toBe("https://react.dev");
    expect(withHttps("http://x.dev")).toBe("http://x.dev");
    expect(withHttps("")).toBe("");
  });
});

describe("notes", () => {
  it("keeps markdown as written and clears blank notes", async () => {
    const r = await createRoadmap({ title: "R" });
    const t = await createTopic({ roadmapId: r.id, title: "T" });
    await updateTopic(t.id, { notes: "# Title\n\n- a\n- b" });
    expect((await getTopicPage(t.id))!.topic.notes).toBe("# Title\n\n- a\n- b");
    await updateTopic(t.id, { notes: "   " });
    expect((await getTopicPage(t.id))!.topic.notes).toBeUndefined();
  });
});
