"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { buttonGhost, buttonPrimary, fieldClassName } from "@/components/ui/styles";
import { describeError, generateQuestions, type GeneratedQuestion } from "@/features/ai";
import { addQuestions } from "@/lib/data";
import { plural } from "@/lib/format";
import { getAiApiKey, getAiProvider } from "@/platform/secureStorage";
import type { QuestionDifficulty, QuestionType } from "@/types/study";

export type GenerationContext = {
  topicId: string;
  topicTitle: string;
  roadmapTitle: string;
  groupTitle?: string;
  notes?: string;
  /** Texts of the questions the topic already has. */
  existingQuestions: string[];
};

type GenerateQuestionsDialogProps = {
  context: GenerationContext;
  onClose: () => void;
};

type Step = "form" | "generating" | "preview";
type DifficultyChoice = QuestionDifficulty | "any";

const COUNTS = [3, 5, 10, 15, 20];
const DIFFICULTY_CHOICES: { value: DifficultyChoice; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const inputClassName = `${fieldClassName} font-normal`;

/** Generates questions for one topic with AI, lets the learner pick which to keep, then saves them. */
export function GenerateQuestionsDialog({ context, onClose }: GenerateQuestionsDialogProps) {
  const [hasKey] = useState(() => Boolean(getAiApiKey(getAiProvider())));
  const [step, setStep] = useState<Step>("form");
  const [type, setType] = useState<QuestionType>("mcq");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyChoice>("any");
  const [instructions, setInstructions] = useState("");
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isGeneratingRef = useRef(false);
  const isSavingRef = useRef(false);

  const isBusy = step === "generating" || isSaving;

  const handleGenerate = async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setStep("generating");
    setError(null);

    try {
      const questions = await generateQuestions({
        type,
        count,
        topicTitle: context.topicTitle,
        roadmapTitle: context.roadmapTitle,
        groupTitle: context.groupTitle,
        notes: context.notes,
        existingQuestions: context.existingQuestions,
        difficulty: difficulty === "any" ? undefined : difficulty,
        prompt: instructions,
      });

      setGenerated(questions);
      setSelected(new Set(questions.map((_, index) => index)));
      setStep("preview");
    } catch (generateError) {
      setError(describeError(generateError));
      setStep("form");
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const toggle = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(index)) next.delete(index);
      else next.add(index);

      return next;
    });
  };

  const handleSave = async () => {
    if (isSavingRef.current || selected.size === 0) return;
    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      await addQuestions(
        context.topicId,
        generated.filter((_, index) => selected.has(index)),
      );
      onClose();
    } catch (saveError) {
      setError(describeError(saveError));
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal titleId="generate-dialog-title" isBusy={isBusy} onClose={onClose}>
      <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-6">
        <div>
          <h2 id="generate-dialog-title" className="text-[22px] font-medium leading-7 text-fg">
            Generate with AI
          </h2>
          <p className="mt-1 wrap-break-word text-[16px] leading-6 text-muted">{context.topicTitle}</p>
        </div>

        {!hasKey ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-[16px] leading-6 text-muted">
              Add an AI key in Settings first. It stays in this browser.
            </p>
            <Link
              href="/settings"
              className={buttonPrimary}
            >
              Open settings
            </Link>
          </div>
        ) : step === "preview" ? (
          <>
            <p className="text-[16px] leading-6 text-muted tabular-nums">
              {selected.size} of {plural(generated.length, "question")} selected
            </p>

            <ul className="flex flex-col gap-2">
              {generated.map((question, index) => (
                <li key={index} className="rounded-2xl bg-card">
                  <label className="flex cursor-pointer items-start gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={() => toggle(index)}
                      className="mt-1 h-5 w-5 shrink-0 accent-(--accent)"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block wrap-break-word text-[16px] font-medium leading-6 text-fg">
                        {question.text}
                      </span>
                      {question.type === "mcq" ? (
                        <span className="mt-2 flex flex-col gap-1">
                          {question.options.map((option, optionIndex) => (
                            <span
                              key={optionIndex}
                              className={`flex items-start gap-2 text-[13px] leading-[18px] ${
                                optionIndex === question.answerIndex ? "text-ok-fg" : "text-muted"
                              }`}
                            >
                              {optionIndex === question.answerIndex ? (
                                <Check aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                              ) : (
                                <span aria-hidden="true" className="h-4 w-4 shrink-0" />
                              )}
                              <span className="wrap-break-word">
                                {optionIndex === question.answerIndex ? <span className="sr-only">Correct: </span> : null}
                                {option}
                              </span>
                            </span>
                          ))}
                        </span>
                      ) : question.referenceAnswer ? (
                        <span className="mt-2 block wrap-break-word text-[13px] leading-[18px] text-muted">
                          {question.referenceAnswer}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div role="group" aria-label="Question type" className="flex gap-1 rounded-[14px] bg-card p-[3px]">
              {(["mcq", "essay"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  disabled={isBusy}
                  aria-pressed={type === value}
                  className={`min-h-12 flex-1 rounded-[11px] px-3 text-[13px] font-medium leading-[18px] transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                    type === value ? "bg-accent text-on-accent" : "text-muted hover:bg-card-hover hover:text-fg"
                  }`}
                >
                  {value === "mcq" ? "MCQ" : "Essay"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
                How many
                <select
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                  disabled={isBusy}
                  className={inputClassName}
                >
                  {COUNTS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
                Difficulty
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as DifficultyChoice)}
                  disabled={isBusy}
                  className={inputClassName}
                >
                  {DIFFICULTY_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2 text-[13px] font-medium leading-[18px]">
              Extra instructions (optional)
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                disabled={isBusy}
                maxLength={500}
                rows={3}
                placeholder="Focus on common mistakes, use code examples…"
                aria-describedby="generate-instructions-help"
                className={`resize-y py-3 ${inputClassName}`}
              />
              <span id="generate-instructions-help" className="font-normal text-muted">
                Up to 500 characters. Your topic notes are also included as reference when available.
              </span>
            </label>
          </>
        )}

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={step === "preview" ? () => setStep("form") : onClose}
            disabled={isBusy}
            className={buttonGhost}
          >
            {step === "preview" ? "Back" : "Cancel"}
          </button>

          {!hasKey ? null : step === "preview" ? (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || selected.size === 0}
              aria-busy={isSaving}
              className={buttonPrimary}
            >
              {isSaving ? "Adding…" : `Add ${plural(selected.size, "question")}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isBusy}
              aria-busy={step === "generating"}
              className={buttonPrimary}
            >
              <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              {step === "generating" ? "Generating…" : "Generate"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
