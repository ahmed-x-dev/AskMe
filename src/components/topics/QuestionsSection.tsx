"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CircleHelp, Plus, Sparkles } from "lucide-react";
import { buttonSecondary } from "@/components/ui/styles";
import { plural } from "@/lib/format";
import type { Lesson, Question } from "@/types/study";
import {
  GenerateQuestionsDialog,
  type GenerationContext,
} from "./GenerateQuestionsDialog";

const TYPE_BADGE: Record<
  Question["type"],
  { label: string; className: string }
> = {
  mcq: { label: "MCQ", className: "bg-ok-bg text-ok-fg" },
  essay: { label: "Essay", className: "bg-essay-bg text-essay-fg" },
  "true-false": { label: "True/False", className: "bg-ok-bg text-ok-fg" },
  "fill-blank": { label: "Fill blank", className: "bg-card text-fg" },
  flashcard: { label: "Flashcard", className: "bg-card text-fg" },
};

type QuestionsSectionProps = {
  topicId: string;
  questions: Question[];
  lessons: Lesson[];
  /** What the AI is told about the topic. `topicId` and `existingQuestions` are filled in here. */
  topicContext: Pick<
    GenerationContext,
    "topicTitle" | "roadmapTitle" | "groupTitle" | "notes"
  >;
};

/** The questions of one topic, each linking to the editor, plus the "Add question" button. */
export function QuestionsSection({
  topicId,
  questions,
  lessons,
  topicContext,
}: QuestionsSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const typeCounts = questions.reduce(
    (counts, question) => {
      counts[question.type] += 1;
      return counts;
    },
    { mcq: 0, essay: 0, "true-false": 0, "fill-blank": 0, flashcard: 0 },
  );
  const hasLessonQuestions = questions.some((question) => question.lessonId);
  const lessonTitles = new Map(lessons.map((lesson) => [lesson.id, lesson.title]));

  return (
    <section
      id="questions-section"
      aria-labelledby="questions-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="questions-heading"
            className="text-lg font-medium leading-6.5 text-fg"
          >
            Questions
          </h2>
          <p className="text-[13px] leading-4.5 text-muted tabular-nums">
            {questions.length === 0
              ? "Add practice questions to check what you have learned."
              : `${plural(questions.length, "question")} · ${plural(typeCounts.mcq, "MCQ")} · ${plural(typeCounts.essay, "essay")}${hasLessonQuestions ? " · includes lesson questions" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/topic/${topicId}/q/new`} className={buttonSecondary}>
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            Add question
          </Link>

          <button
            type="button"
            onClick={() => setIsGenerating(true)}
            className={buttonSecondary}
          >
            <Sparkles
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.5}
            />
            Generate with AI
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
            <CircleHelp
              aria-hidden="true"
              className="h-6 w-6"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="mt-4 text-base font-medium leading-6 text-fg">
            No questions yet
          </h3>
          <p className="mx-auto mt-2 max-w-[40ch] text-base leading-6 text-muted">
            Write your own question or ask AI to draft a few from your notes.
            You can review every suggestion before adding it.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {questions.map((question) => {
            const badge = TYPE_BADGE[question.type];

            return (
              <li key={question.id}>
                <Link
                  href={`/topic/${topicId}/q/${question.id}`}
                  className="flex min-w-0 items-start gap-3 rounded-2xl bg-card p-3 transition-colors duration-150 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 wrap-break-word text-base leading-6 text-fg">
                      {question.text}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-4.5 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="rounded-full bg-bg px-2.5 py-0.5 text-[13px] leading-4.5 text-muted">
                        {question.difficulty}
                      </span>
                      {question.lessonId ? (
                        <span className="rounded-full bg-bg px-2.5 py-0.5 text-[13px] leading-4.5 text-muted">
                          {lessonTitles.get(question.lessonId) ?? "Lesson"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted rtl:rotate-180"
                    strokeWidth={1.5}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {isGenerating ? (
        <GenerateQuestionsDialog
          context={{
            ...topicContext,
            topicId,
            existingQuestions: questions.map((question) => question.text),
          }}
          onClose={() => setIsGenerating(false)}
        />
      ) : null}
    </section>
  );
}
