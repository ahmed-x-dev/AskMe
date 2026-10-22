"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { buttonPrimary, fieldOnCardClassName } from "@/components/ui/styles";
import {
  buildQuizQueue,
  filterQuestions,
  type QuizQuestionType,
} from "@/features/quiz";
import type { QuizSource } from "@/lib/data";
import { plural } from "@/lib/format";
import type { Question, QuestionDifficulty } from "@/types/study";

type QuizSetupProps = {
  source: QuizSource;
  onStart: (queue: Question[]) => void;
};

const TYPE_OPTIONS: readonly { value: QuizQuestionType; label: string }[] = [
  { value: "all", label: "MCQ + essay" },
  { value: "mcq", label: "MCQ" },
  { value: "essay", label: "Essay" },
];

const DIFFICULTY_OPTIONS: readonly {
  value: QuestionDifficulty | "all";
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const LIMIT_CHOICES = [5, 10, 20, 30];

/** Lets the learner choose which questions to practice before a quiz starts. */
export function QuizSetup({ source, onStart }: QuizSetupProps) {
  const [questionType, setQuestionType] = useState<QuizQuestionType>("all");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "all">(
    "all",
  );
  const [limit, setLimit] = useState<number | "all">("all");
  const [mistakesOnly, setMistakesOnly] = useState(false);

  const mistakeIds = useMemo(
    () => new Set(source.mistakeIds),
    [source.mistakeIds],
  );
  const filters = {
    questionType,
    difficulty,
    onlyIds: mistakesOnly ? mistakeIds : undefined,
  };
  const matching = filterQuestions(source.questions, filters).length;
  const limitChoices = LIMIT_CHOICES.filter((choice) => choice <= matching);
  const effectiveLimit = limit !== "all" && limit < matching ? limit : matching;
  const selectedLimit =
    limit !== "all" && limit < matching ? String(limit) : "all";

  return (
    <section className="mx-auto flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-[22px] font-medium leading-7 text-fg">
            {source.title}
          </h1>
          <p className="mt-1 wrap-break-word text-base leading-6 text-muted">
            {source.subtitle} · {plural(source.questions.length, "question")}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6 rounded-2xl bg-card p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-medium leading-6.5 text-fg">
            Set up your quiz
          </h2>
          <p className="mt-1 text-[13px] leading-4.5 text-muted">
            Choose what to practice. You can change these settings next time.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="quiz-question-selection"
            className="flex min-w-0 flex-col gap-5"
          >
            <h3
              id="quiz-question-selection"
              className="text-base font-medium leading-6 text-fg"
            >
              Question selection
            </h3>
            <SegmentedControl
              label="Question type"
              value={questionType}
              options={TYPE_OPTIONS}
              onChange={setQuestionType}
              onCard
            />
            <SegmentedControl
              label="Difficulty"
              value={difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={setDifficulty}
              onCard
            />
          </section>

          <section
            aria-labelledby="quiz-practice-scope"
            className="flex min-w-0 flex-col gap-4"
          >
            <h3
              id="quiz-practice-scope"
              className="text-base font-medium leading-6 text-fg"
            >
              Practice scope
            </h3>
            {source.mistakeIds.length > 0 ? (
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[14px] border border-control-line bg-bg px-3 text-base leading-6 text-fg">
                <input
                  type="checkbox"
                  checked={mistakesOnly}
                  onChange={(event) => setMistakesOnly(event.target.checked)}
                  className="h-5 w-5 shrink-0 accent-accent"
                />
                <span>
                  Only questions I got wrong last time{" "}
                  <span className="text-muted tabular-nums">
                    ({source.mistakeIds.length})
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-[13px] leading-4.5 text-muted">
                Questions you get wrong will appear here for a mistakes-only
                quiz.
              </p>
            )}

            <label className="flex flex-col gap-2 text-[13px] font-medium leading-4.5 text-muted">
              Number of questions
              <select
                value={selectedLimit}
                onChange={(event) =>
                  setLimit(
                    event.target.value === "all"
                      ? "all"
                      : Number(event.target.value),
                  )
                }
                className={`font-normal ${fieldOnCardClassName}`}
              >
                <option value="all">All matching ({matching})</option>
                {limitChoices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-[13px] leading-4.5 text-muted">
            {matching === 0
              ? "No questions match these choices. Pick another type or difficulty."
              : `${plural(effectiveLimit, "question")} selected for this quiz.`}
          </p>
          <button
            type="button"
            disabled={matching === 0}
            onClick={() =>
              onStart(
                buildQuizQueue(source.questions, {
                  ...filters,
                  limit: effectiveLimit,
                }),
              )
            }
            className={`${buttonPrimary} w-full sm:w-auto`}
          >
            Start quiz
            {matching > 0 ? ` · ${effectiveLimit}` : ""}
          </button>
        </div>
      </div>
    </section>
  );
}
