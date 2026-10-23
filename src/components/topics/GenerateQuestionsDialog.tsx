"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { buttonGhost, buttonPrimary, fieldClassName } from "@/components/ui/styles";
import {
  describeError,
  generateQuestions,
  planAutomaticCoverage,
  type GeneratedQuestion,
} from "@/features/ai";
import { addQuestions } from "@/lib/data";
import { readResponseTextUpToByteLimit } from "@/lib/readResponseText";
import type {
  LessonResource,
  QuestionDifficulty,
  QuestionType,
} from "@/types/study";
import { plural } from "@/lib/format";
import { getAiApiKey, getAiProvider } from "@/platform/secureStorage";

export type GenerationContext = {
  topicId: string;
  lessonId?: string;
  topicTitle: string;
  lessonTitle?: string;
  roadmapTitle: string;
  groupTitle?: string;
  notes?: string;
  resources?: { resource: LessonResource; lessonTitle?: string }[];
  /** Texts of the questions the topic already has. */
  existingQuestions: string[];
};

type GenerateQuestionsDialogProps = {
  context: GenerationContext;
  onClose: () => void;
};

type Step = "form" | "planning" | "confirm" | "generating" | "preview";
type DifficultyChoice = QuestionDifficulty | "any";
type GenerationMode = "manual" | "automatic";
type ResourceCheck = {
  resource: LessonResource;
  lessonTitle?: string;
  included: boolean;
  status: "checking" | "reachable" | "unreachable" | "not-checked";
  content: string;
  details: string;
};

const COUNTS = [3, 5, 10, 15, 20];
const MAX_RESOURCE_BYTES = 2 * 1024 * 1024;
const MAX_RESOURCE_TEXT_CHARS = 6000;
const DIFFICULTY_CHOICES: { value: DifficultyChoice; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const inputClassName = `${fieldClassName} font-normal`;

function resourceLabel(resource: ResourceCheck): string {
  return resource.lessonTitle
    ? `${resource.lessonTitle} · ${resource.resource.title}`
    : resource.resource.title;
}

function decodeTextFile(fileData: string): string {
  const binary = atob(fileData);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes).trim();
}

function isSafeToFetchResource(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase().replace(/\.+$/, "");
  const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  return (
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    host.includes(".") &&
    !host.endsWith(".local") &&
    !host.endsWith(".localhost") &&
    host !== "localhost" &&
    !host.includes(":") &&
    !isIpv4
  );
}

async function readResourceContent(
  resource: LessonResource,
): Promise<{ status: ResourceCheck["status"]; content: string; details: string }> {
  if (resource.source === "file") {
    const isText =
      resource.mimeType === "text/plain" ||
      resource.mimeType === "text/markdown" ||
      /\.(txt|md|markdown)$/i.test(resource.fileName);

    if (!isText) {
      return {
        status: "reachable",
        content: "",
        details: "Saved file, but this format cannot be read for question generation.",
      };
    }

    const content = decodeTextFile(resource.fileData);
    if (!content) {
      return { status: "reachable", content: "", details: "The text file is empty." };
    }

    return {
      status: "reachable",
      content: content.slice(0, MAX_RESOURCE_TEXT_CHARS),
      details:
        content.length > MAX_RESOURCE_TEXT_CHARS
          ? `First ${MAX_RESOURCE_TEXT_CHARS.toLocaleString()} characters will be included.`
          : "Text content will be included.",
    };
  }

  if (!isSafeToFetchResource(resource.url)) {
    return {
      status: "not-checked",
      content: "",
      details: "Link was not checked for local/private-host safety.",
    };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(resource.url, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      headers: { Accept: "text/html, text/plain, text/markdown" },
    });

    if (!response.ok) {
      return {
        status: "reachable",
        content: "",
        details: `Website responded with HTTP ${response.status}, but content is unavailable.`,
      };
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_RESOURCE_BYTES) {
      return {
        status: "reachable",
        content: "",
        details: "Website content is larger than the 2 MB reading limit.",
      };
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("text/markdown") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return {
        status: "reachable",
        content: "",
        details: "Website responded, but did not provide readable text or HTML.",
      };
    }

    let content = await readResponseTextUpToByteLimit(response, MAX_RESOURCE_BYTES);
    if (content === null) {
      return {
        status: "reachable",
        content: "",
        details: "Website content is larger than the 2 MB reading limit.",
      };
    }

    if (contentType.includes("text/html") || contentType.includes("application/xhtml+xml")) {
      const document = new DOMParser().parseFromString(content, "text/html");
      document
        .querySelectorAll("script, style, noscript, svg, nav, footer, header, form, iframe")
        .forEach((element) => element.remove());
      content = document.body.textContent ?? "";
    }

    content = content.replace(/\s+/g, " ").trim();
    if (content.length < 20) {
      return {
        status: "reachable",
        content: "",
        details: "Website responded, but did not expose enough readable text.",
      };
    }

    return {
      status: "reachable",
      content: content.slice(0, MAX_RESOURCE_TEXT_CHARS),
      details:
        content.length > MAX_RESOURCE_TEXT_CHARS
          ? `First ${MAX_RESOURCE_TEXT_CHARS.toLocaleString()} characters will be included.`
          : "Text content will be included.",
    };
  } catch (error) {
    return {
      status: "unreachable",
      content: "",
      details:
        error instanceof DOMException && error.name === "AbortError"
          ? "Website check timed out."
          : "Website blocked browser access or could not be reached.",
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/** Generates questions for a topic or lesson with AI, then saves the learner's selections. */
export function GenerateQuestionsDialog({ context, onClose }: GenerateQuestionsDialogProps) {
  const [hasKey] = useState(() => Boolean(getAiApiKey(getAiProvider())));
  const [step, setStep] = useState<Step>("form");
  const [mode, setMode] = useState<GenerationMode>("manual");
  const [type, setType] = useState<QuestionType>("mcq");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyChoice>("any");
  const [instructions, setInstructions] = useState("");
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [resourceChecks, setResourceChecks] = useState<ResourceCheck[]>([]);
  const [coveragePoints, setCoveragePoints] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isCheckingResources, setIsCheckingResources] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isGeneratingRef = useRef(false);
  const isSavingRef = useRef(false);
  const hasCheckedResourcesRef = useRef(false);

  const isBusy = step === "planning" || step === "generating" || isSaving;

  const checkResources = async () => {
    if (hasCheckedResourcesRef.current) return;
    hasCheckedResourcesRef.current = true;
    setIsCheckingResources(true);
    setError(null);

    const pending = (context.resources ?? []).map(({ resource, lessonTitle }) => ({
      resource,
      lessonTitle,
      included: true,
      status: "checking" as const,
      content: "",
      details: "Checking resource…",
    }));
    setResourceChecks(pending);

    const checked = await Promise.all(
      pending.map(async (item): Promise<ResourceCheck> => {
        try {
          const result = await readResourceContent(item.resource);
          return {
            ...item,
            status: result.status,
            content: result.content,
            details: result.details,
          };
        } catch (resourceError) {
          return {
            ...item,
            status: item.resource.source === "file" ? "reachable" : "unreachable",
            content: "",
            details:
              resourceError instanceof Error
                ? resourceError.message
                : "Resource content could not be read.",
          };
        }
      }),
    );

    setResourceChecks(checked);
    setIsCheckingResources(false);
  };

  const handleModeChange = (nextMode: GenerationMode) => {
    setMode(nextMode);
    setError(null);
    if (nextMode === "automatic") void checkResources();
  };

  const selectedSourceMaterial = () =>
    resourceChecks
      .filter((check) => check.included)
      .map((check) => ({
        title: [
          check.lessonTitle,
          check.resource.title,
          check.resource.source === "file" ? check.resource.fileName : check.resource.url,
        ]
          .filter(Boolean)
          .join(" · "),
        content:
          check.content ||
          "The resource content could not be read. Only its title and source are known; do not infer or invent its contents.",
      }));

  const generateAutomaticPlan = async (points: string[]) => {
    setStep("generating");
    setGenerationProgress(0);
    const allQuestions: GeneratedQuestion[] = [];
    const knownQuestions = new Set(
      context.existingQuestions.map((question) =>
        question.trim().replace(/\s+/g, " ").toLocaleLowerCase(),
      ),
    );
    const sources = selectedSourceMaterial();

    for (let offset = 0; offset < points.length; offset += 20) {
      const batch = points.slice(offset, offset + 20);
      const questions = await generateQuestions({
        type: "automatic",
        count: batch.length,
        topicTitle: context.topicTitle,
        lessonTitle: context.lessonTitle,
        roadmapTitle: context.roadmapTitle,
        groupTitle: context.groupTitle,
        notes: context.notes,
        sourceMaterial: sources,
        coveragePoints: batch,
        existingQuestions: [
          ...allQuestions.map((question) => question.text).reverse(),
          ...context.existingQuestions,
        ],
        difficulty: difficulty === "any" ? undefined : difficulty,
        prompt: instructions,
      });

      if (questions.length !== batch.length) {
        throw new Error(
          `The AI returned ${questions.length} of ${batch.length} questions for one coverage batch. Try again.`,
        );
      }

      for (const question of questions) {
        const key = question.text.trim().replace(/\s+/g, " ").toLocaleLowerCase();
        if (knownQuestions.has(key)) {
          throw new Error("The AI repeated an existing or generated question. Try again.");
        }
        knownQuestions.add(key);
      }

      allQuestions.push(...questions);
      setGenerationProgress(allQuestions.length);
    }

    setGenerated(allQuestions);
    setSelected(new Set(allQuestions.map((_, index) => index)));
    setStep("preview");
  };

  const handleGenerate = async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setError(null);

    try {
      if (mode === "automatic") {
        if (isCheckingResources) {
          throw new Error("Wait for the resource checks to finish before generating.");
        }

        setStep("planning");
        const points = await planAutomaticCoverage({
          topicTitle: context.topicTitle,
          lessonTitle: context.lessonTitle,
          roadmapTitle: context.roadmapTitle,
          groupTitle: context.groupTitle,
          notes: context.notes,
          sourceMaterial: selectedSourceMaterial(),
          existingQuestions: context.existingQuestions,
          prompt: instructions,
        });
        setCoveragePoints(points);

        if (points.length > 20) {
          setStep("confirm");
        } else {
          await generateAutomaticPlan(points);
        }
      } else {
        setStep("generating");
        const questions = await generateQuestions({
          type,
          count,
          topicTitle: context.topicTitle,
          lessonTitle: context.lessonTitle,
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
      }
    } catch (generateError) {
      setError(describeError(generateError));
      setStep("form");
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const handleConfirmAutomatic = async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setError(null);

    try {
      await generateAutomaticPlan(coveragePoints);
    } catch (generateError) {
      setError(describeError(generateError));
      setStep("confirm");
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
        context.lessonId ? { lessonId: context.lessonId } : undefined,
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
          <p className="mt-1 wrap-break-word text-base leading-6 text-muted">
            {context.lessonTitle
              ? `${context.topicTitle} · ${context.lessonTitle}`
              : context.topicTitle}
          </p>
        </div>

        {!hasKey ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-base leading-6 text-muted">
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
            <p className="text-base leading-6 text-muted tabular-nums">
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
                      <span className="block wrap-break-word text-base font-medium leading-6 text-fg">
                        {question.text}
                      </span>
                      <span className="mt-1 inline-flex rounded-full bg-bg px-2.5 py-0.5 text-[13px] leading-4.5 text-muted">
                        {question.type === "mcq"
                          ? "MCQ"
                          : question.type === "true-false"
                            ? "True/False"
                            : question.type === "fill-blank"
                              ? "Fill blank"
                              : question.type === "flashcard"
                                ? "Flashcard"
                                : "Essay"}
                      </span>
                      {question.type === "mcq" ? (
                        <span className="mt-2 flex flex-col gap-1">
                          {question.options.map((option, optionIndex) => (
                            <span
                              key={optionIndex}
                              className={`flex items-start gap-2 text-[13px] leading-4.5 ${
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
                      ) : question.type === "true-false" ? (
                        <span className="mt-2 block wrap-break-word text-[13px] leading-4.5 text-muted">
                          Correct answer: {question.answer ? "True" : "False"}
                        </span>
                      ) : question.type === "fill-blank" || question.type === "flashcard" ? (
                        <span className="mt-2 block wrap-break-word text-[13px] leading-4.5 text-muted">
                          Answer: {question.answer}
                        </span>
                      ) : question.referenceAnswer ? (
                        <span className="mt-2 block wrap-break-word text-[13px] leading-4.5 text-muted">
                          {question.referenceAnswer}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : step === "confirm" ? (
          <div className="flex flex-col gap-4">
            <p className="text-base leading-6 text-fg">
              Automatic coverage identified {plural(coveragePoints.length, "question")}.
              This is more than 20, so generation will use{" "}
              {plural(Math.ceil(coveragePoints.length / 20), "AI request")}. Confirm to continue.
            </p>
            <ol className="max-h-56 list-decimal space-y-1 overflow-y-auto rounded-2xl bg-card p-4 ps-9 text-[13px] leading-4.5 text-muted">
              {coveragePoints.map((point, index) => (
                <li key={`${index}-${point}`} className="wrap-break-word">
                  {point}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <>
            <div role="group" aria-label="Generation mode" className="flex gap-1 rounded-[14px] bg-card p-0.75">
              {(["manual", "automatic"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleModeChange(value)}
                  disabled={isBusy}
                  aria-pressed={mode === value}
                  className={`min-h-12 flex-1 rounded-[11px] px-3 text-[13px] font-medium leading-4.5 transition-colors duration-150 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                    mode === value ? "bg-accent text-on-accent" : "text-muted hover:bg-card-hover hover:text-fg"
                  }`}
                >
                  {value === "manual" ? "Choose question type" : "Automatic coverage"}
                </button>
              ))}
            </div>

            {mode === "manual" ? (
              <div role="group" aria-label="Question type" className="flex flex-wrap gap-1 rounded-[14px] bg-card p-0.75">
                {(["mcq", "true-false", "fill-blank", "flashcard", "essay"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    disabled={isBusy}
                    aria-pressed={type === value}
                    className={`min-h-12 flex-1 rounded-[11px] px-3 text-[13px] font-medium leading-4.5 transition-colors duration-150 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                      type === value ? "bg-accent text-on-accent" : "text-muted hover:bg-card-hover hover:text-fg"
                    }`}
                  >
                    {value === "mcq" ? "MCQ" : value === "true-false" ? "True/False" : value === "fill-blank" ? "Fill blank" : value === "flashcard" ? "Flashcard" : "Essay"}
                  </button>
                ))}
              </div>
            ) : (
              <section aria-label="Topic resources" className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base font-medium leading-6 text-fg">Study material</h3>
                  <p className="text-[13px] leading-4.5 text-muted">
                    {context.lessonTitle
                      ? "This lesson’s title and resources are used."
                      : "The topic title, notes, and resources from all its lessons are used."}{" "}
                    Choose which resources to include. Readable contents and your topic notes are sent to your configured AI provider.
                    Websites can block access; PDF and Word files are currently included by title only.
                    Up to 6,000 characters per resource and 24,000 total are sent; later content over the limit is omitted.
                  </p>
                </div>
                {isCheckingResources ? (
                  <p role="status" className="text-[13px] leading-4.5 text-muted">
                    Checking resource access…
                  </p>
                ) : null}
                {resourceChecks.length === 0 && !isCheckingResources ? (
                  <p className="rounded-2xl bg-card p-3 text-[13px] leading-4.5 text-muted">
                    No attached resources. Automatic coverage will use the title and topic notes.
                  </p>
                ) : (
                  <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto">
                    {resourceChecks.map((check) => (
                      <li key={check.resource.id} className="rounded-2xl bg-card">
                        <label className="flex cursor-pointer items-start gap-3 p-3">
                          <input
                            type="checkbox"
                            checked={check.included}
                            disabled={isCheckingResources || isBusy}
                            onChange={(event) =>
                              setResourceChecks((current) =>
                                current.map((item) =>
                                  item.resource.id === check.resource.id
                                    ? { ...item, included: event.target.checked }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 h-5 w-5 shrink-0 accent-(--accent)"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block wrap-break-word text-[13px] font-medium leading-4.5 text-fg">
                              {resourceLabel(check)}
                            </span>
                            <span className={`mt-1 block text-[13px] leading-4.5 ${
                              check.status === "reachable" && check.content ? "text-ok-fg" : "text-muted"
                            }`}>
                              {check.status === "checking"
                                ? "Checking access…"
                                : check.status === "reachable"
                                  ? `Reachable${check.content ? " and readable" : ", but content is unavailable"} · ${check.details}`
                                  : check.status === "not-checked"
                                    ? `Not checked · ${check.details}`
                                    : `Not reachable · ${check.details}`}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <div className={`grid gap-4 ${mode === "manual" ? "grid-cols-2" : "grid-cols-1"}`}>
              {mode === "manual" ? (
                <label className="flex flex-col gap-2 text-base font-medium leading-6">
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
              ) : null}
              <label className="flex flex-col gap-2 text-base font-medium leading-6">
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

            <label className="flex flex-col gap-2 text-[13px] font-medium leading-4.5">
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
                Up to 500 characters. Your topic notes are included as reference when available.
              </span>
            </label>
            {mode === "automatic" && step === "planning" ? (
              <p role="status" className="text-[13px] leading-4.5 text-muted">
                Analyzing the selected material to plan question coverage…
              </p>
            ) : mode === "automatic" && step === "generating" ? (
              <p role="status" className="text-[13px] leading-4.5 text-muted">
                Generating question {generationProgress + 1} of {coveragePoints.length}…
              </p>
            ) : null}
          </>
        )}

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={
              step === "preview" || step === "confirm"
                ? () => setStep("form")
                : onClose
            }
            disabled={isBusy}
            className={buttonGhost}
          >
            {step === "preview" ? "Back" : step === "confirm" ? "Adjust" : "Cancel"}
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
          ) : step === "confirm" ? (
            <button
              type="button"
              onClick={() => void handleConfirmAutomatic()}
              disabled={isBusy}
              className={buttonPrimary}
            >
              Generate {plural(coveragePoints.length, "question")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isBusy || (mode === "automatic" && isCheckingResources)}
              aria-busy={step === "generating" || step === "planning"}
              className={buttonPrimary}
            >
              <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              {step === "planning"
                ? "Planning…"
                : step === "generating"
                  ? mode === "automatic"
                    ? `Generating ${generationProgress}/${coveragePoints.length}…`
                    : "Generating…"
                  : mode === "automatic"
                    ? "Plan & generate"
                    : "Generate"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
