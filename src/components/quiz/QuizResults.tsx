"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { formatElapsedTime, PASS_MARK } from "@/features/quiz";
import type { QuizAnswer } from "@/lib/data";
import { plural } from "@/lib/format";
import type { Question, Topic } from "@/types/study";

type QuizResultsProps = {
  /** The questions that were asked, in quiz order. */
  queue: Question[];
  answers: QuizAnswer[];
  elapsedSeconds: number;
  /** Topics that were marked done because of this quiz. */
  markedDone: Topic[];
  backHref: string;
  backLabel: string;
  onRestart: () => void;
  onRetryMistakes: () => void;
};

/** Shows the score, the topics that reached the pass mark, and the questions that were missed. */
export function QuizResults({
  queue,
  answers,
  elapsedSeconds,
  markedDone,
  backHref,
  backLabel,
  onRestart,
  onRetryMistakes,
}: QuizResultsProps) {
  const correct = answers.filter((answer) => answer.correct).length;
  const percent = queue.length === 0 ? 0 : Math.round((correct / queue.length) * 100);
  const missedIds = new Set(answers.filter((answer) => !answer.correct).map((answer) => answer.questionId));
  const missed = queue.filter((question) => missedIds.has(question.id));

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-2xl bg-card p-6 text-center">
        <p className="text-[13px] leading-[18px] text-muted">Quiz complete</p>
        <p className="mt-2 text-[40px] font-medium leading-[44px] text-accent-text tabular-nums">
          {correct} / {queue.length}
        </p>
        <p className="mt-2 text-[16px] leading-6 text-muted tabular-nums">
          {percent}% correct · {formatElapsedTime(elapsedSeconds)}
        </p>
      </div>

      {markedDone.length > 0 ? (
        <p role="status" className="flex items-start gap-3 rounded-2xl bg-ok-bg px-4 py-3 text-[16px] leading-6 text-ok-fg">
          <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 wrap-break-word">
            Marked as done: {markedDone.map((topic) => topic.title).join(", ")}
          </span>
        </p>
      ) : (
        <p className="text-[13px] leading-[18px] text-muted">
          A topic is marked done when a quiz asks all of its questions and you get at least {Math.round(PASS_MARK * 100)}% right.
        </p>
      )}

      {missed.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-[18px] font-medium leading-7 text-fg">Missed ({missed.length})</h2>
          <ul className="flex flex-col gap-2">
            {missed.map((question) => (
              <li key={question.id} className="flex items-start gap-3 rounded-2xl bg-card p-3 text-[16px] leading-6 text-fg">
                <X aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-bad-fg" strokeWidth={1.5} />
                <span className="min-w-0 wrap-break-word">{question.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[16px] leading-6 text-ok-fg">
          <Check aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          No mistakes. Well done.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          Restart
        </button>
        {missed.length > 0 ? (
          <button
            type="button"
            onClick={onRetryMistakes}
            className="min-h-12 flex-1 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
          >
            Retry {plural(missed.length, "mistake")}
          </button>
        ) : null}
        <Link
          href={backHref}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
