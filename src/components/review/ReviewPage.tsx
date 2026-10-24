"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarCheck } from "lucide-react";
import { QuizResults } from "@/components/quiz/QuizResults";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { buttonPrimary } from "@/components/ui/styles";
import { shuffle } from "@/features/quiz";
import {
  getDueSummary,
  REVIEW_SESSION_SIZE,
  type DueSummary,
  type QuizAnswer,
} from "@/lib/data";
import { plural } from "@/lib/format";
import type { Question } from "@/types/study";

type Phase =
  | { name: "setup" }
  | { name: "running"; queue: Question[]; runId: number }
  | {
      name: "results";
      queue: Question[];
      answers: QuizAnswer[];
      elapsedSeconds: number;
      historyErrors: string[];
    };

/** Builds one session from the due cards (oldest first), mixed up so topics do not come in blocks. */
function buildSession(summary: DueSummary): Question[] {
  return shuffle(
    summary.cards.slice(0, REVIEW_SESSION_SIZE).map((card) => card.question),
  );
}

/** The daily review: the questions whose spaced-repetition date has come. Answers reschedule them. */
export function ReviewPage() {
  const summary = useLiveQuery(() => getDueSummary(), []);
  const [phase, setPhase] = useState<Phase>({ name: "setup" });

  const start = (queue: Question[]) =>
    setPhase({ name: "running", queue, runId: Date.now() });

  if (phase.name === "running") {
    return (
      <QuizRunner
        key={phase.runId}
        queue={phase.queue}
        exitHref="/"
        onFinish={async (
          answers,
          elapsedSeconds,
          historyErrors,
          remainingQueue,
        ) =>
          setPhase({
            name: "results",
            queue: remainingQueue,
            answers,
            elapsedSeconds,
            historyErrors,
          })
        }
      />
    );
  }

  if (phase.name === "results") {
    const missedIds = new Set(
      phase.answers
        .filter((answer) => !answer.correct)
        .map((answer) => answer.questionId),
    );
    const remaining = summary?.total ?? 0;

    return (
      <QuizResults
        queue={phase.queue}
        answers={phase.answers}
        elapsedSeconds={phase.elapsedSeconds}
        historyErrors={phase.historyErrors}
        backHref="/"
        backLabel="Back to roadmaps"
        onRestart={
          summary && remaining > 0
            ? () => start(buildSession(summary))
            : undefined
        }
        restartLabel={`Review more (${remaining} due)`}
        onRetryMistakes={() =>
          start(
            shuffle(
              phase.queue.filter((question) => missedIds.has(question.id)),
            ),
          )
        }
      />
    );
  }

  if (summary === undefined) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading review"
        className="mx-auto flex w-full flex-col gap-4"
      >
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-card" />
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  const sessionSize = Math.min(summary.total, REVIEW_SESSION_SIZE);

  return (
    <section className="mx-auto flex w-full flex-col gap-6">
      <header className="min-w-0">
        <h1 className="text-[22px] font-medium leading-7 text-fg">Review</h1>
        <p className="mt-1 text-base leading-6 text-muted">
          Questions come back on a schedule. Answer right and they return later;
          miss one and it returns tomorrow.
        </p>
      </header>

      {summary.total === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
            <CalendarCheck
              aria-hidden="true"
              className="h-6 w-6"
              strokeWidth={1.5}
            />
          </div>
          <h2 className="mt-4 text-base font-medium leading-6 text-fg">
            Nothing to review today
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-base leading-6 text-muted">
            Questions join your review the first time you answer them in a quiz.
          </p>
          <Link href="/" className={`mt-6 ${buttonPrimary}`}>
            Back to roadmaps
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 rounded-2xl bg-card p-4">
          <div>
            <p className="text-[40px] font-medium leading-11 text-accent-text tabular-nums">
              {summary.total}
            </p>
            <p className="text-base leading-6 text-muted">
              {plural(summary.total, "question")} due today
            </p>
            <p className="mt-1 text-[13px] leading-4.5 text-muted">
              {sessionSize < summary.total
                ? `This session covers ${sessionSize} questions, starting with the ones due longest.`
                : "Your session includes every question due today."}
            </p>
          </div>

          <h2 className="text-base font-medium leading-6 text-fg">
            Due by roadmap
          </h2>
          <ul className="flex flex-col gap-2">
            {summary.byRoadmap.map(({ roadmap, count }) => (
              <li
                key={roadmap.id}
                className="flex items-center justify-between gap-3 rounded-[14px] bg-bg px-3 py-3 text-base leading-6 text-fg"
              >
                <span className="min-w-0 wrap-break-word">{roadmap.title}</span>
                <span className="shrink-0 text-muted tabular-nums">
                  {plural(count, "question")}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => start(buildSession(summary))}
            className={buttonPrimary}
          >
            Start review ({sessionSize})
          </button>
        </div>
      )}
    </section>
  );
}
