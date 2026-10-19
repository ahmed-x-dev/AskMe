"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { formatElapsedTime } from "@/features/quiz";
import { recordAttempt, type QuizAnswer } from "@/lib/data";
import type { Question } from "@/types/study";
import { QuestionCard } from "./QuestionCard";

type QuizRunnerProps = {
  queue: Question[];
  exitHref: string;
  /** Called after the last question. Receives the answers in quiz order and the time taken. */
  onFinish: (answers: QuizAnswer[], elapsedSeconds: number) => Promise<void>;
};

/** Runs a quiz: shows one question at a time and saves an attempt for every answer. */
export function QuizRunner({ queue, exitHref, onFinish }: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const question = queue[index];
  const result = results[question.id];
  const isLast = index === queue.length - 1;
  const answeredCount = Object.keys(results).length;

  const handleAnswer = async (correct: boolean) => {
    setResults((current) => ({ ...current, [question.id]: correct }));

    try {
      await recordAttempt(question.id, correct);
      setSaveError(null);
    } catch (error) {
      setSaveError(
        `This answer could not be saved to your history. ${error instanceof Error ? error.message : ""}`.trim(),
      );
    }
  };

  const handleNext = async () => {
    if (!isLast) {
      setIndex((current) => current + 1);
      return;
    }

    setIsFinishing(true);

    try {
      await onFinish(
        queue.map((entry) => ({ questionId: entry.id, correct: results[entry.id] === true })),
        Math.floor((Date.now() - startedAt.current) / 1000),
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not finish the quiz.");
      setIsFinishing(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[16px] font-medium leading-6 text-fg tabular-nums">
          Question {index + 1} of {queue.length}
        </p>
        <span
          role="timer"
          aria-label={`Elapsed time ${formatElapsedTime(elapsedSeconds)}`}
          className="rounded-full bg-card px-2.5 py-0.5 text-[13px] font-medium leading-[18px] text-muted tabular-nums"
        >
          {formatElapsedTime(elapsedSeconds)}
        </span>
      </div>

      <ProgressBar label="Quiz progress" completed={answeredCount} total={queue.length} />

      <QuestionCard key={question.id} question={question} result={result} onAnswer={(correct) => void handleAnswer(correct)} />

      {saveError ? <ErrorMessage>{saveError}</ErrorMessage> : null}

      {result === undefined ? (
        <p className="text-[13px] leading-[18px] text-muted">
          {question.type === "mcq" ? "Choose an option to continue." : "Reveal the reference, then mark your answer to continue."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {result !== undefined ? (
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={isFinishing}
            aria-busy={isFinishing}
            className={`flex-1 ${buttonPrimary}`}
          >
            {isFinishing ? "Finishing…" : isLast ? "Finish" : "Next"}
          </button>
        ) : null}
        <Link
          href={exitHref}
          className={`flex-1 ${buttonSecondary}`}
        >
          Exit quiz
        </Link>
      </div>
    </section>
  );
}
