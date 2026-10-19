"use client";

import { useState, type Ref } from "react";
import { Check, X } from "lucide-react";
import { buttonPrimary, fieldClassName } from "@/components/ui/styles";
import type { Question } from "@/types/study";
import { QuestionAiHelp } from "./QuestionAiHelp";

type QuestionCardProps = {
  question: Question;
  /** `undefined` until the learner has answered, then whether the answer was correct. */
  result: boolean | undefined;
  onAnswer: (correct: boolean) => void;
  questionHeadingRef?: Ref<HTMLHeadingElement>;
};

const chipClassName = "rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-[18px]";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * One question of a quiz. MCQ answers are checked as soon as an option is chosen. Essay answers
 * are written, compared with the reference answer, then marked right or wrong by the learner.
 * Render it with `key={question.id}` so its state starts fresh for each question.
 */
export function QuestionCard({ question, result, onAnswer, questionHeadingRef }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [essayText, setEssayText] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const isAnswered = result !== undefined;

  return (
    <div className="mx-auto flex w-full max-w-[80ch] flex-col gap-4">
      <div className="rounded-2xl bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <span
            className={`${chipClassName} ${question.type === "mcq" ? "bg-ok-bg text-ok-fg" : "bg-essay-bg text-essay-fg"}`}
          >
            {question.type === "mcq" ? "MCQ" : "Essay"}
          </span>
          <span className={`${chipClassName} bg-bg text-muted`}>{capitalize(question.difficulty)}</span>
          {question.tags.map((tag) => (
            <span key={tag} className={`min-w-0 max-w-full wrap-break-word ${chipClassName} bg-bg text-muted`}>
              {tag}
            </span>
          ))}
        </div>
        <h2
          ref={questionHeadingRef}
          tabIndex={-1}
          className="mt-3 whitespace-pre-wrap wrap-break-word text-[18px] font-medium leading-7 text-fg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-card"
        >
          {question.text}
        </h2>
      </div>

      {question.type === "mcq" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => {
            const isChosen = selected === optionIndex;
            const isRight = isAnswered && optionIndex === question.answerIndex;
            const isWrong = isAnswered && isChosen && optionIndex !== question.answerIndex;

            return (
              <button
                key={optionIndex}
                type="button"
                aria-pressed={isChosen}
                disabled={isAnswered}
                onClick={() => {
                  if (isAnswered) return;

                  setSelected(optionIndex);
                  onAnswer(optionIndex === question.answerIndex);
                }}
                className={`flex min-h-12 w-full items-start gap-3 rounded-[14px] border border-control-line px-3 py-3 text-start text-[16px] leading-6 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-100 ${
                  isRight
                    ? "bg-ok-bg text-ok-fg"
                    : isWrong
                      ? "bg-bad-bg text-bad-fg"
                      : isAnswered
                        ? "bg-card text-muted"
                        : "bg-card text-fg hover:bg-card-hover"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg text-[13px] font-medium text-muted"
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap wrap-break-word">{option}</span>
                {isRight ? (
                  <>
                    <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span className="sr-only">Correct answer</span>
                  </>
                ) : null}
                {isWrong ? (
                  <>
                    <X aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span className="sr-only">Your answer, wrong</span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <textarea
            value={essayText}
            onChange={(event) => setEssayText(event.target.value)}
            disabled={isRevealed}
            rows={5}
            aria-label="Your answer"
            placeholder="Write your answer here, or think it through…"
            className={`min-h-30 resize-y py-3 ${fieldClassName}`}
          />

          {!isRevealed ? (
            <>
              <QuestionAiHelp question={question} answer={essayText} isAnswered={false} />
              <button
                type="button"
                onClick={() => setIsRevealed(true)}
                className={buttonPrimary}
              >
                Reveal reference answer
              </button>
            </>
          ) : (
            <>
              <div className="rounded-[14px] bg-card p-4" aria-live="polite">
                <p className="text-[13px] font-medium leading-[18px] text-muted">Reference answer</p>
                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-[16px] leading-6 text-fg">
                  {question.referenceAnswer?.trim() || "No reference answer was added for this question."}
                </p>
              </div>

              {!isAnswered ? (
                <>
                  <p className="text-[13px] leading-[18px] text-muted">Compare your answer, then mark yourself.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onAnswer(true)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-ok-bg px-3 text-[16px] font-medium text-ok-fg transition-colors duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      <Check aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />I got it right
                    </button>
                    <button
                      type="button"
                      onClick={() => onAnswer(false)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-bad-bg px-3 text-[16px] font-medium text-bad-fg transition-colors duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />I got it wrong
                    </button>
                  </div>
                </>
              ) : (
                <p
                  role="status"
                  className={`inline-flex items-center gap-2 text-[16px] font-medium leading-6 ${result ? "text-ok-fg" : "text-bad-fg"}`}
                >
                  {result ? (
                    <Check aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                  )}
                  {result ? "Marked right" : "Marked wrong"}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {isAnswered && question.type === "mcq" ? (
        <p role="status" className="sr-only">
          {result
            ? "Correct."
            : `Incorrect. The correct answer is ${question.options[question.answerIndex]}.`}
        </p>
      ) : null}

      {isAnswered ? (
        <QuestionAiHelp question={question} answer={question.type === "mcq" ? (selected ?? undefined) : essayText} isAnswered />
      ) : null}
    </div>
  );
}
