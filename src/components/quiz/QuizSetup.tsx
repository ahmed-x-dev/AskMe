"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { buildQuizQueue, filterQuestions, type QuizQuestionType } from "@/features/quiz";
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

const DIFFICULTY_OPTIONS: readonly { value: QuestionDifficulty | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const LIMIT_CHOICES = [5, 10, 20, 30];

/** Lets the learner choose which questions to practice before a quiz starts. */
export function QuizSetup({ source, onStart }: QuizSetupProps) {
  const [questionType, setQuestionType] = useState<QuizQuestionType>("all");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "all">("all");
  const [limit, setLimit] = useState<number | "all">("all");
  const [mistakesOnly, setMistakesOnly] = useState(false);

  const mistakeIds = useMemo(() => new Set(source.mistakeIds), [source.mistakeIds]);
  const filters = {
    questionType,
    difficulty,
    onlyIds: mistakesOnly ? mistakeIds : undefined,
  };
  const matching = filterQuestions(source.questions, filters).length;
  const limitChoices = LIMIT_CHOICES.filter((choice) => choice < matching);
  const effectiveLimit = limit !== "all" && limit < matching ? limit : matching;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <Link
          href={source.backHref}
          className="inline-flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-card px-4 text-[13px] font-medium leading-[18px] text-fg transition-colors hover:bg-card-hover"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5 shrink-0 rtl:rotate-180" strokeWidth={1.5} />
          {source.backLabel}
        </Link>
        <div className="min-w-0">
          <h1 className="wrap-break-word text-[22px] font-medium leading-7 text-fg">{source.title}</h1>
          <p className="mt-1 wrap-break-word text-[16px] leading-6 text-muted">
            {source.subtitle} · {plural(source.questions.length, "question")}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6 rounded-2xl bg-card p-4">
        <h2 className="text-[18px] font-medium leading-7 text-fg">Set up your quiz</h2>

        <SegmentedControl label="Question type" value={questionType} options={TYPE_OPTIONS} onChange={setQuestionType} />
        <SegmentedControl label="Difficulty" value={difficulty} options={DIFFICULTY_OPTIONS} onChange={setDifficulty} />

        {source.mistakeIds.length > 0 ? (
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[14px] bg-bg px-3 text-[16px] leading-6 text-fg">
            <input
              type="checkbox"
              checked={mistakesOnly}
              onChange={(event) => setMistakesOnly(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-(--accent)"
            />
            <span>
              Only questions I got wrong last time{" "}
              <span className="text-muted tabular-nums">({source.mistakeIds.length})</span>
            </span>
          </label>
        ) : (
          <p className="text-[13px] leading-[18px] text-muted">
            Questions you get wrong will appear here for a mistakes-only quiz.
          </p>
        )}

        <label className="flex flex-col gap-2 text-[13px] font-medium leading-[18px] text-muted">
          Number of questions
          <select
            value={limit === "all" ? "all" : String(limit)}
            onChange={(event) => setLimit(event.target.value === "all" ? "all" : Number(event.target.value))}
            className="min-h-12 w-full rounded-[14px] bg-bg px-3 text-[16px] font-normal text-fg"
          >
            <option value="all">All matching ({matching})</option>
            {limitChoices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </label>

        <p role="status" className="text-[13px] leading-[18px] text-muted">
          {matching === 0
            ? "No questions match these choices. Pick another type or difficulty."
            : `This quiz will ask ${plural(effectiveLimit, "question")}.`}
        </p>

        <button
          type="button"
          disabled={matching === 0}
          onClick={() => onStart(buildQuizQueue(source.questions, { ...filters, limit: effectiveLimit }))}
          className="min-h-12 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start quiz
        </button>
      </div>
    </section>
  );
}
