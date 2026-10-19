"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { buttonGhost, buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { formatElapsedTime } from "@/features/quiz";
import { recordAttempt, type QuizAnswer } from "@/lib/data";
import type { Question } from "@/types/study";
import { QuestionCard } from "./QuestionCard";

type QuizRunnerProps = {
  queue: Question[];
  exitHref: string;
  /** Called after the last question. Receives the answers in quiz order and the time taken. */
  onFinish: (
    answers: QuizAnswer[],
    elapsedSeconds: number,
    historyErrors: string[],
  ) => Promise<void>;
};

/** Runs a quiz: shows one question at a time and saves an attempt for every answer. */
export function QuizRunner({ queue, exitHref, onFinish }: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [historyErrors, setHistoryErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const answered = useRef(new Set<string>());
  const isSavingAnswerRef = useRef(false);
  const isFinishingRef = useRef(false);
  const startedAt = useRef(0);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (index > 0) questionHeadingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (result !== undefined && !isSavingAnswer) nextButtonRef.current?.focus();
  }, [result, isSavingAnswer]);

  const saveAnswer = async (correct: boolean) => {
    if (isSavingAnswerRef.current) return;
    isSavingAnswerRef.current = true;
    setIsSavingAnswer(true);
    setSaveError(null);

    try {
      await recordAttempt(question.id, correct);
      setHistoryErrors((current) => {
        const next = { ...current };
        delete next[question.id];
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this answer.";
      setHistoryErrors((current) => ({ ...current, [question.id]: message }));
      setSaveError(`This answer could not be saved to your review history. ${message}`);
    } finally {
      isSavingAnswerRef.current = false;
      setIsSavingAnswer(false);
    }
  };

  const handleAnswer = (correct: boolean) => {
    if (answered.current.has(question.id)) return;
    answered.current.add(question.id);
    setResults((current) => ({ ...current, [question.id]: correct }));
    void saveAnswer(correct);
  };

  const handleNext = async () => {
    if (isSavingAnswerRef.current || isFinishingRef.current) return;

    if (!isLast) {
      setSaveError(null);
      setIndex((current) => current + 1);
      return;
    }

    isFinishingRef.current = true;
    setIsFinishing(true);

    try {
      await onFinish(
        queue.map((entry) => ({ questionId: entry.id, correct: results[entry.id] === true })),
        Math.floor((Date.now() - startedAt.current) / 1000),
        Object.values(historyErrors),
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not finish the quiz.");
      isFinishingRef.current = false;
      setIsFinishing(false);
    }
  };

  return (
    <section className="mx-auto flex w-full flex-col gap-6">
      <div className="mx-auto flex w-full max-w-[80ch] flex-wrap items-center justify-between gap-2">
        <h1 aria-live="polite" className="text-[16px] font-medium leading-6 text-fg tabular-nums">
          Question {index + 1} of {queue.length}
        </h1>
        <span
          role="timer"
          aria-label={`Elapsed time ${formatElapsedTime(elapsedSeconds)}`}
          className="rounded-full bg-card px-2.5 py-0.5 text-[13px] font-medium leading-[18px] text-muted tabular-nums"
        >
          {formatElapsedTime(elapsedSeconds)}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[80ch] flex-col gap-2">
        <ProgressBar
          label={`Quiz progress: ${answeredCount} of ${queue.length} answered`}
          completed={answeredCount}
          total={queue.length}
        />
        <p className="text-[13px] leading-[18px] text-muted tabular-nums">
          {answeredCount} of {queue.length} answered
        </p>
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        result={result}
        onAnswer={handleAnswer}
        questionHeadingRef={questionHeadingRef}
      />

      {saveError ? (
        <div className="mx-auto w-full max-w-[80ch]">
          <ErrorMessage
            actionLabel={result === undefined ? undefined : "Retry saving"}
            actionDisabled={isSavingAnswer}
            onAction={result === undefined ? undefined : () => void saveAnswer(result)}
          >
            {saveError}
          </ErrorMessage>
        </div>
      ) : null}

      {result === undefined ? (
        <p className="mx-auto w-full max-w-[80ch] text-[13px] leading-[18px] text-muted">
          {question.type === "mcq" ? "Choose an option to continue." : "Reveal the reference, then mark your answer to continue."}
        </p>
      ) : null}

      <div className="mx-auto flex w-full max-w-[80ch] flex-wrap gap-3">
        {result !== undefined ? (
          <button
            ref={nextButtonRef}
            type="button"
            onClick={() => void handleNext()}
            disabled={isFinishing || isSavingAnswer}
            aria-busy={isSavingAnswer || isFinishing}
            className={`flex-1 ${buttonPrimary}`}
          >
            {isSavingAnswer
              ? "Saving answer…"
              : isFinishing
                ? "Finishing…"
                : saveError
                  ? isLast
                    ? "Finish without saving"
                    : "Continue without saving"
                  : isLast
                    ? "Finish"
                    : "Next"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setIsExitConfirmOpen(true)}
          disabled={isSavingAnswer || isFinishing}
          className={`flex-1 ${buttonSecondary}`}
        >
          Exit quiz
        </button>
      </div>

      {isExitConfirmOpen ? (
        <Modal titleId="exit-quiz-title" onClose={() => setIsExitConfirmOpen(false)}>
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div>
              <h2 id="exit-quiz-title" className="text-[22px] font-medium leading-7 text-fg">
                Exit this quiz?
              </h2>
              <p className="mt-2 text-[16px] leading-6 text-muted">
                Your quiz score will be lost. Answers already saved will remain in your review history.
                {Object.keys(historyErrors).length > 0
                  ? " Some answers could not be saved and will not appear there."
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExitConfirmOpen(false)}
                className={buttonGhost}
              >
                Keep practicing
              </button>
              <Link href={exitHref} className={buttonSecondary}>
                Exit quiz
              </Link>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
