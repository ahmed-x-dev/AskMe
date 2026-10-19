"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarCheck } from "lucide-react";
import { QuizResults } from "@/components/quiz/QuizResults";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { shuffle } from "@/features/quiz";
import { getDueSummary, REVIEW_SESSION_SIZE, type DueSummary, type QuizAnswer } from "@/lib/data";
import { plural } from "@/lib/format";
import type { Question } from "@/types/study";

type Phase =
  | { name: "setup" }
  | { name: "running"; queue: Question[]; runId: number }
  | { name: "results"; queue: Question[]; answers: QuizAnswer[]; elapsedSeconds: number };

/** Builds one session from the due cards (oldest first), mixed up so topics do not come in blocks. */
function buildSession(summary: DueSummary): Question[] {
  return shuffle(summary.cards.slice(0, REVIEW_SESSION_SIZE).map((card) => card.question));
}

/** The daily review: the questions whose spaced-repetition date has come. Answers reschedule them. */
export function ReviewPage() {
  const summary = useLiveQuery(() => getDueSummary(), []);
  const [phase, setPhase] = useState<Phase>({ name: "setup" });

  const start = (queue: Question[]) => setPhase({ name: "running", queue, runId: Date.now() });

  if (phase.name === "running") {
    return (
      <QuizRunner
        key={phase.runId}
        queue={phase.queue}
        exitHref="/"
        onFinish={async (answers, elapsedSeconds) =>
          setPhase({ name: "results", queue: phase.queue, answers, elapsedSeconds })
        }
      />
    );
  }

  if (phase.name === "results") {
    const missedIds = new Set(
      phase.answers.filter((answer) => !answer.correct).map((answer) => answer.questionId),
    );
    const remaining = summary?.total ?? 0;

    return (
      <QuizResults
        queue={phase.queue}
        answers={phase.answers}
        elapsedSeconds={phase.elapsedSeconds}
        backHref="/"
        backLabel="Back to roadmaps"
        onRestart={
          summary && remaining > 0
            ? () => start(buildSession(summary))
            : undefined
        }
        restartLabel={`Review more (${remaining} due)`}
        onRetryMistakes={() =>
          start(shuffle(phase.queue.filter((question) => missedIds.has(question.id))))
        }
      />
    );
  }

  if (summary === undefined) {
    return (
      <div aria-busy="true" aria-label="Loading review" className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-card" />
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  const sessionSize = Math.min(summary.total, REVIEW_SESSION_SIZE);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="min-w-0">
        <h1 className="text-[28px] font-medium leading-9 text-fg">Review</h1>
        <p className="mt-1 text-[16px] leading-6 text-muted">
          Questions come back on a schedule. Answer right and they return later; miss one and it returns tomorrow.
        </p>
      </header>

      {summary.total === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
            <CalendarCheck aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-[16px] font-medium leading-6 text-fg">Nothing to review today</h2>
          <p className="mx-auto mt-2 max-w-sm text-[16px] leading-6 text-muted">
            Questions join your review the first time you answer them in a quiz.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
          >
            Back to roadmaps
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 rounded-2xl bg-card p-4">
          <div>
            <p className="text-[40px] font-medium leading-[44px] text-accent-text tabular-nums">{summary.total}</p>
            <p className="text-[16px] leading-6 text-muted">{plural(summary.total, "question")} due today</p>
          </div>

          <ul className="flex flex-col gap-2">
            {summary.byRoadmap.map(({ roadmap, count }) => (
              <li
                key={roadmap.id}
                className="flex items-center justify-between gap-3 rounded-[14px] bg-bg px-3 py-3 text-[16px] leading-6 text-fg"
              >
                <span className="min-w-0 wrap-break-word">{roadmap.title}</span>
                <span className="shrink-0 text-muted tabular-nums">{count}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => start(buildSession(summary))}
            className="min-h-12 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Start review ({sessionSize})
          </button>
        </div>
      )}
    </section>
  );
}
