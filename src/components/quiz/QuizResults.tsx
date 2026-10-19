"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { formatElapsedTime, PASS_MARK } from "@/features/quiz";
import type { QuizAnswer } from "@/lib/data";
import { plural } from "@/lib/format";
import type { Question, Topic } from "@/types/study";

type QuizResultsProps = {
  /** The questions that were asked, in quiz order. */
  queue: Question[];
  answers: QuizAnswer[];
  elapsedSeconds: number;
  /** Topics that were marked done because of this quiz. Leave it out for a review session, which never marks topics. */
  markedDone?: Topic[];
  /** Failed attempt writes that could not be recovered during the quiz. */
  historyErrors?: string[];
  /** A quiz score can still be shown if updating topic completion failed. */
  completionError?: string;
  backHref: string;
  backLabel: string;
  /** Leave it out to hide the restart button. */
  onRestart?: () => void;
  restartLabel?: string;
  onRetryMistakes: () => void;
};

/** Shows the score, the topics that reached the pass mark, and the questions that were missed. */
export function QuizResults({
  queue,
  answers,
  elapsedSeconds,
  markedDone,
  historyErrors = [],
  completionError,
  backHref,
  backLabel,
  onRestart,
  restartLabel = "Restart",
  onRetryMistakes,
}: QuizResultsProps) {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.correct]));
  const correct = queue.filter((question) => answerByQuestion.get(question.id) === true).length;
  const percent = queue.length === 0 ? 0 : Math.round((correct / queue.length) * 100);
  const missed = queue.filter((question) => answerByQuestion.get(question.id) !== true);

  return (
    <section className="mx-auto flex w-full flex-col gap-6">
      {completionError ? (
        <ErrorMessage>
          Your score is ready, but topic completion could not be updated. {completionError}
        </ErrorMessage>
      ) : null}
      {historyErrors.length > 0 ? (
        <ErrorMessage>
          {plural(historyErrors.length, "answer")} could not be saved to review history. You can still review the score below.{" "}
          {historyErrors.join(" ")}
        </ErrorMessage>
      ) : null}

      <div className="rounded-2xl bg-card p-6 text-center">
        <p className="text-[13px] leading-[18px] text-muted">Quiz complete</p>
        <p aria-label={`${correct} of ${queue.length} correct`} className="mt-2 text-[40px] font-medium leading-[44px] text-accent-text tabular-nums">
          {correct} / {queue.length}
        </p>
        <p className="mt-2 text-[16px] leading-6 text-muted tabular-nums">
          {percent}% correct · {formatElapsedTime(elapsedSeconds)}
        </p>
      </div>

      {markedDone === undefined ? null : markedDone.length > 0 ? (
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
          <h2 className="text-[18px] font-medium leading-[26px] text-fg">
            Review your missed {plural(missed.length, "question")}
          </h2>
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
        {missed.length > 0 ? (
          <button
            type="button"
            onClick={onRetryMistakes}
            className={`flex-1 ${buttonPrimary}`}
          >
            Retry {plural(missed.length, "mistake")}
          </button>
        ) : null}
        {onRestart ? (
          <button
            type="button"
            onClick={onRestart}
            className={`flex-1 ${buttonSecondary}`}
          >
            {restartLabel}
          </button>
        ) : null}
        <Link
          href={backHref}
          className={`flex-1 ${missed.length === 0 ? buttonPrimary : buttonSecondary}`}
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
