"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { buttonSecondary } from "@/components/ui/styles";
import { describeError, explainQuestionAnswer, gradeEssayAnswer } from "@/features/ai";
import { getAiProvider, hasAiApiKey } from "@/platform/secureStorage";
import type { Question } from "@/types/study";

type QuestionAiHelpProps = {
  question: Question;
  /** The learner's choice (MCQ) or written answer (essay). */
  answer: string | number | undefined;
  isAnswered: boolean;
};

type Grade = { score: number; missingPoints: number; feedback: string; forAnswer: string };

const secondaryButtonClassName = `w-full ${buttonSecondary}`;

/**
 * Optional AI help for one question: grading a written essay answer and explaining the answer.
 * It is rendered with `key={question.id}`, so its state starts fresh for every question.
 */
export function QuestionAiHelp({ question, answer, isAnswered }: QuestionAiHelpProps) {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const isMounted = useRef(true);
  const isGradingRef = useRef(false);
  const isExplainingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  /** Returns the active AI provider, or sets `onMissing` to a message that points to Settings. */
  const getReadyProvider = (action: string, onMissing: (message: string) => void) => {
    const provider = getAiProvider();

    if (hasAiApiKey(provider)) return provider;

    onMissing(`Add a ${provider === "openai" ? "OpenAI" : "Gemini"} API key in Settings before ${action}.`);

    return null;
  };

  const handleGrade = async () => {
    if (isGradingRef.current) return;
    const answerText = typeof answer === "string" ? answer.trim() : "";

    if (question.type !== "essay") return;

    if (!answerText) {
      setGradeError("Write an answer before asking the AI to grade it.");
      return;
    }

    const provider = getReadyProvider("grading essays", setGradeError);

    if (!provider) return;

    isGradingRef.current = true;
    setIsGrading(true);
    setGradeError(null);

    try {
      const result = await gradeEssayAnswer({
        questionText: question.text,
        userAnswer: answerText,
        referenceAnswer: question.referenceAnswer,
        provider,
      });

      if (isMounted.current) setGrade({ ...result, forAnswer: answerText });
    } catch (error) {
      if (isMounted.current) setGradeError(describeError(error));
    } finally {
      isGradingRef.current = false;
      if (isMounted.current) setIsGrading(false);
    }
  };

  const handleExplain = async () => {
    if (isExplainingRef.current) return;
    const provider = getReadyProvider("requesting an explanation", setExplainError);

    if (!provider) return;

    isExplainingRef.current = true;
    setIsExplaining(true);
    setExplainError(null);

    try {
      const text = await explainQuestionAnswer({ question, userAnswer: answer, provider });

      if (isMounted.current) setExplanation(text);
    } catch (error) {
      if (isMounted.current) setExplainError(describeError(error));
    } finally {
      isExplainingRef.current = false;
      if (isMounted.current) setIsExplaining(false);
    }
  };

  const currentText = typeof answer === "string" ? answer.trim() : "";

  return (
    <div className="flex flex-col gap-3">
      {question.type === "essay" && !isAnswered ? (
        <>
          <button
            type="button"
            onClick={() => void handleGrade()}
            disabled={isGrading || currentText === ""}
            aria-busy={isGrading}
            className={secondaryButtonClassName}
          >
            {isGrading ? "Grading…" : "Grade with AI"}
          </button>
          {gradeError ? <ErrorMessage variant="inline">{gradeError}</ErrorMessage> : null}
          {grade && grade.forAnswer === currentText ? (
            <div className="rounded-[14px] bg-card p-3" aria-live="polite">
              <p className="text-[13px] font-medium leading-[18px] text-muted">AI grading</p>
              <p className="mt-1 text-[16px] font-medium leading-6 text-fg tabular-nums">
                {grade.score}/10 · missing points: {grade.missingPoints}
              </p>
              <p className="mt-1 whitespace-pre-wrap wrap-break-word text-[16px] leading-6 text-muted">{grade.feedback}</p>
            </div>
          ) : null}
        </>
      ) : null}

      {isAnswered ? (
        <>
          <button
            type="button"
            onClick={() => void handleExplain()}
            disabled={isExplaining}
            aria-busy={isExplaining}
            className={secondaryButtonClassName}
          >
            {isExplaining ? "Explaining…" : "Explain answer with AI"}
          </button>
          {explainError ? <ErrorMessage variant="inline">{explainError}</ErrorMessage> : null}
          {explanation ? (
            <div className="rounded-[14px] bg-card p-3" aria-live="polite">
              <p className="text-[13px] font-medium leading-[18px] text-muted">AI explanation</p>
              <p className="mt-1 whitespace-pre-wrap wrap-break-word text-[16px] leading-6 text-fg">{explanation}</p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
