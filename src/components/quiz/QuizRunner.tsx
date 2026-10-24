"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { buttonGhost, buttonPrimary, buttonSecondary, iconButton } from "@/components/ui/styles";
import { formatElapsedTime } from "@/features/quiz";
import { deleteQuestion, recordAttempt, type QuizAnswer } from "@/lib/data";
import type { Question } from "@/types/study";
import { QuestionCard } from "./QuestionCard";

type QuizRunnerProps = {
  queue: Question[];
  exitHref: string;
  /** Enables permanent deletion during a quiz. Review sessions leave this disabled. */
  allowQuestionDeletion?: boolean;
  /** Called after the last question. Receives the answers in quiz order and the time taken. */
  onFinish: (
    answers: QuizAnswer[],
    elapsedSeconds: number,
    historyErrors: string[],
    remainingQueue: Question[],
  ) => Promise<void>;
};

/** Runs a quiz: shows one question at a time and saves an attempt for every answer. */
export function QuizRunner({ queue, exitHref, allowQuestionDeletion = false, onFinish }: QuizRunnerProps) {
  const [activeQueue, setActiveQueue] = useState(queue);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [historyErrors, setHistoryErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
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

  const question = activeQueue[index];
  const result = question ? results[question.id] : undefined;
  const isLast = index === activeQueue.length - 1;
  const answeredCount = Object.keys(results).length;

  useEffect(() => {
    if (index > 0) questionHeadingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (result !== undefined && !isSavingAnswer) nextButtonRef.current?.focus();
  }, [result, isSavingAnswer]);

  const saveAnswer = async (correct: boolean) => {
    if (isSavingAnswerRef.current || !question) return;
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
    if (!question) return;
    if (answered.current.has(question.id)) return;
    answered.current.add(question.id);
    setResults((current) => ({ ...current, [question.id]: correct }));
    void saveAnswer(correct);
  };

  const handleNext = async () => {
    if (isSavingAnswerRef.current || isFinishingRef.current || !question) return;

    if (!isLast) {
      setSaveError(null);
      setIndex((current) => current + 1);
      return;
    }

    isFinishingRef.current = true;
    setIsFinishing(true);

    try {
      await onFinish(
        activeQueue.map((entry) => ({ questionId: entry.id, correct: results[entry.id] === true })),
        Math.floor((Date.now() - startedAt.current) / 1000),
        Object.values(historyErrors),
        activeQueue,
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not finish the quiz.");
      isFinishingRef.current = false;
      setIsFinishing(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!question) return;

    const deletedId = question.id;
    await deleteQuestion(deletedId);
    const remainingQueue = activeQueue.filter((entry) => entry.id !== deletedId);
    setActiveQueue(remainingQueue);
    setResults((current) => {
      const next = { ...current };
      delete next[deletedId];
      return next;
    });
    setHistoryErrors((current) => {
      const next = { ...current };
      delete next[deletedId];
      return next;
    });
    answered.current.delete(deletedId);
    setSaveError(null);
    setIndex((current) => Math.min(current, Math.max(remainingQueue.length - 1, 0)));
  };

  if (!question) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center">
        <h1 className="text-lg font-medium leading-6.5 text-fg">No questions left in this quiz</h1>
        <p className="text-base leading-6 text-muted">
          The remaining questions were deleted. No quiz result was recorded.
        </p>
        <Link href={exitHref} className={buttonSecondary}>Return to questions</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full flex-col gap-6">
      <div className="mx-auto flex w-full max-w-[80ch] flex-wrap items-center justify-between gap-2">
        <h1 aria-live="polite" className="text-base font-medium leading-6 text-fg tabular-nums">
          Question {index + 1} of {activeQueue.length}
        </h1>
        <div className="flex items-center gap-2">
          {allowQuestionDeletion ? (
            <button
              type="button"
              aria-label="Delete this question"
              title="Delete this question"
              disabled={isSavingAnswer || isFinishing}
              onClick={() => setIsDeleteConfirmOpen(true)}
              className={`${iconButton} text-bad-fg hover:bg-bad-bg`}
            >
              <Trash2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            </button>
          ) : null}
          <span
            role="timer"
            aria-label={`Elapsed time ${formatElapsedTime(elapsedSeconds)}`}
            className="rounded-full bg-card px-2.5 py-0.5 text-[13px] font-medium leading-4.5 text-muted tabular-nums"
          >
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[80ch] flex-col gap-2">
        <ProgressBar
          label={`Quiz progress: ${answeredCount} of ${activeQueue.length} answered`}
          completed={answeredCount}
          total={activeQueue.length}
        />
        <p className="text-[13px] leading-4.5 text-muted tabular-nums">
          {answeredCount} of {activeQueue.length} answered
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
        <p className="mx-auto w-full max-w-[80ch] text-[13px] leading-4.5 text-muted">
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
              <p className="mt-2 text-base leading-6 text-muted">
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
      {isDeleteConfirmOpen ? (
        <ConfirmDialog
          title="Delete this question?"
          message="This permanently deletes the question from its topic and removes its saved attempts and review schedule. It will also be removed from this quiz. This cannot be undone."
          confirmLabel="Delete question"
          onConfirm={handleDeleteQuestion}
          onClose={() => setIsDeleteConfirmOpen(false)}
        />
      ) : null}
    </section>
  );
}
