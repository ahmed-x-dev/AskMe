import {
  getAiApiKey,
  getAiProvider,
  type AiProvider,
} from "@/platform/secureStorage";
import type { QuestionInput } from "@/lib/data";
import type { QuestionDifficulty, QuestionType } from "@/types/study";
import { AI_PROMPTS } from "./prompts";

const GEMINI_MODEL = "gemini-3.8-flash";
const OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 30_000;

/** A generated question: the content of a question, without ids. `addQuestions` assigns those. */
export type GeneratedQuestion = QuestionInput;

/** The part of a stored question that the explain prompt needs. */
export type ExplainableQuestion =
  | { type: "mcq"; text: string; options: readonly string[]; answerIndex: number }
  | { type: "essay"; text: string; referenceAnswer?: string }
  | { type: "true-false"; text: string; answer: boolean }
  | { type: "fill-blank" | "flashcard"; text: string; answer: string };

const DIFFICULTIES: readonly QuestionDifficulty[] = ["easy", "medium", "hard"];
const MAX_NOTES_CHARS = 4000;
const MAX_EXISTING_QUESTIONS = 30;
const MAX_EXISTING_QUESTION_CHARS = 200;
const MAX_SOURCE_MATERIAL_CHARS = 24_000;

export type GeneratedQuestionPayload = {
  questions: GeneratedQuestion[];
};

export type EssayGradeResult = {
  score: number;
  feedback: string;
  missingPoints: number;
};

export type AnswerExplanation = {
  explanation: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeJsonText(rawText: string): string {
  return rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function ensureValidText(value: unknown, fieldLabel: string): string {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new Error(`The AI response is missing a valid ${fieldLabel}.`);
  }

  return text;
}

function getGeminiJsonTextFromResponse(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error("The Gemini response format was unexpected.");
  }

  const candidates = Array.isArray(data.candidates) ? data.candidates : [];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      continue;
    }

    const content = isRecord(candidate.content) ? candidate.content : null;
    const parts = Array.isArray(content?.parts) ? content.parts : [];

    for (const part of parts) {
      if (isRecord(part) && typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  const text = typeof data.text === "string" ? data.text.trim() : "";

  if (!text) {
    throw new Error("The Gemini response did not include any usable content.");
  }

  return text;
}

function getOpenAiJsonTextFromResponse(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error("The OpenAI response format was unexpected.");
  }

  const choices = Array.isArray(data.choices) ? data.choices : [];

  for (const choice of choices) {
    if (!isRecord(choice)) {
      continue;
    }

    const message = isRecord(choice.message) ? choice.message : null;
    const content = typeof message?.content === "string" ? message.content : "";
    if (content.trim()) {
      return content.trim();
    }
  }

  throw new Error("The OpenAI response did not include any usable content.");
}

function getJsonTextFromResponse(data: unknown, provider: AiProvider): string {
  return provider === "openai"
    ? getOpenAiJsonTextFromResponse(data)
    : getGeminiJsonTextFromResponse(data);
}

function isDifficulty(value: unknown): value is QuestionDifficulty {
  return DIFFICULTIES.includes(value as QuestionDifficulty);
}

function normalizeQuestionType(rawType: unknown): QuestionType {
  const value = typeof rawType === "string" ? rawType.trim().toLowerCase() : "";

  switch (value) {
    case "multiple-choice":
    case "multiple choice":
      return "mcq";
    case "true/false":
    case "true_false":
    case "truefalse":
      return "true-false";
    case "fill in the blank":
    case "fill-in-the-blank":
    case "fill_in_blank":
    case "fillblank":
      return "fill-blank";
    default:
      return value as QuestionType;
  }
}

/** Validates one generated question. Throws a readable error when it cannot be used. */
function validateGeneratedQuestion(
  rawQuestion: unknown,
  questionIndex: number,
  fallbackDifficulty: QuestionDifficulty,
): GeneratedQuestion {
  if (!isRecord(rawQuestion)) {
    throw new Error(`Generated question ${questionIndex + 1} is not an object.`);
  }

  const difficulty = isDifficulty(rawQuestion.difficulty)
    ? rawQuestion.difficulty
    : fallbackDifficulty;
  const type = normalizeQuestionType(rawQuestion.type);

  if (type === "mcq") {
    const text = ensureValidText(rawQuestion.text, "question text");
    const options = Array.isArray(rawQuestion.options) ? rawQuestion.options : [];
    const answerIndex = Number(rawQuestion.answerIndex);

    if (options.length !== 4) {
      throw new Error(`MCQ question ${questionIndex + 1} must include four options.`);
    }

    const cleanOptions = options.map((option) => String(option ?? "").trim());

    if (cleanOptions.some((option) => !option)) {
      throw new Error(`MCQ question ${questionIndex + 1} contains an empty option.`);
    }

    if (new Set(cleanOptions).size !== 4) {
      throw new Error(`MCQ question ${questionIndex + 1} has repeated options.`);
    }

    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
      throw new Error(`MCQ question ${questionIndex + 1} has an invalid answerIndex.`);
    }

    return {
      type: "mcq",
      text,
      difficulty,
      tags: [],
      options: [cleanOptions[0], cleanOptions[1], cleanOptions[2], cleanOptions[3]],
      answerIndex,
    };
  }

  if (type === "essay") {
    const text = ensureValidText(rawQuestion.text, "essay prompt");
    const referenceAnswer =
      typeof rawQuestion.referenceAnswer === "string" ? rawQuestion.referenceAnswer.trim() : "";

    return {
      type: "essay",
      text,
      difficulty,
      tags: [],
      referenceAnswer: referenceAnswer || undefined,
    };
  }

  if (type === "true-false") {
    const text = ensureValidText(rawQuestion.text, "question text");
    const candidate = rawQuestion.answer;

    if (typeof candidate === "boolean") {
      return { type: "true-false", text, difficulty, tags: [], answer: candidate };
    }

    if (typeof candidate === "string") {
      const normalized = candidate.trim().toLowerCase();
      if (normalized === "true" || normalized === "yes" || normalized === "y" || normalized === "1") {
        return { type: "true-false", text, difficulty, tags: [], answer: true };
      }
      if (normalized === "false" || normalized === "no" || normalized === "n" || normalized === "0") {
        return { type: "true-false", text, difficulty, tags: [], answer: false };
      }
    }

    throw new Error(`Question ${questionIndex + 1} has an invalid true/false answer.`);
  }

  if (type === "fill-blank" || type === "flashcard") {
    const text = ensureValidText(rawQuestion.text, "question text");
    const answerValue =
      typeof rawQuestion.answer === "string"
        ? rawQuestion.answer.trim()
        : typeof rawQuestion.answer === "number"
          ? String(rawQuestion.answer)
          : "";

    if (!answerValue) {
      throw new Error(`Question ${questionIndex + 1} needs a valid answer.`);
    }

    return {
      type,
      text,
      difficulty,
      tags: [],
      answer: answerValue,
    };
  }

  throw new Error(`Question ${questionIndex + 1} has an unsupported type.`);
}

/**
 * Validates the AI response. Questions that cannot be used are skipped, so one bad question
 * does not throw away the others. It throws only when no question is usable.
 */
export function validateGeneratedQuestions(
  payload: unknown,
  fallbackDifficulty: QuestionDifficulty = "medium",
): GeneratedQuestion[] {
  const source = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.questions)
      ? payload.questions
      : [];

  if (source.length === 0) {
    throw new Error("The AI response did not include any questions.");
  }

  const questions: GeneratedQuestion[] = [];
  let firstError: Error | null = null;

  source.forEach((rawQuestion, questionIndex) => {
    try {
      questions.push(validateGeneratedQuestion(rawQuestion, questionIndex, fallbackDifficulty));
    } catch (error) {
      firstError ??= error instanceof Error ? error : new Error("A generated question was invalid.");
    }
  });

  if (questions.length === 0) {
    throw firstError ?? new Error("The AI response did not include any usable questions.");
  }

  return questions;
}

export function validateEssayGradeResult(payload: unknown): EssayGradeResult {
  if (!isRecord(payload)) {
    throw new Error("The AI grader returned malformed JSON.");
  }

  const score = Number(payload.score);
  const missingPoints = Number(payload.missingPoints);
  const feedback =
    typeof payload.feedback === "string" ? payload.feedback.trim() : "";

  if (!Number.isFinite(score) || score < 0 || score > 10) {
    throw new Error(
      "The AI grading result must include a score between 0 and 10.",
    );
  }

  if (
    !Number.isFinite(missingPoints) ||
    missingPoints < 0 ||
    missingPoints > 10
  ) {
    throw new Error(
      "The AI grading result must include a valid missingPoints value.",
    );
  }

  if (!feedback) {
    throw new Error("The AI grading result is missing feedback.");
  }

  return {
    score,
    feedback,
    missingPoints,
  };
}

export function validateAnswerExplanation(payload: unknown): AnswerExplanation {
  if (!isRecord(payload)) {
    throw new Error("The AI explanation was malformed.");
  }

  return {
    explanation: ensureValidText(payload.explanation, "answer explanation"),
  };
}

async function callAi<T>(
  provider: AiProvider,
  prompt: string,
  validator: (value: unknown) => T,
): Promise<T> {
  const apiKey = getAiApiKey(provider);
  const providerName = provider === "openai" ? "OpenAI" : "Gemini";

  if (!apiKey) {
    throw new Error(
      `Add a ${providerName} API key in Settings before requesting AI help.`,
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    DEFAULT_TIMEOUT_MS,
  );

  try {
    let response: Response;

    if (provider === "openai") {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
    } else {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              responseMimeType: "application/json",
            },
          }),
        },
      );
    }

    if (!response.ok) {
      let message = "The AI request failed.";

      try {
        const payload = (await response.json()) as Record<string, unknown>;
        const errorPayload = isRecord(payload.error) ? payload.error : null;
        const details =
          typeof errorPayload?.message === "string"
            ? errorPayload.message
            : typeof payload.message === "string"
              ? payload.message
              : null;
        message = details ?? message;
      } catch {
        // Intentionally ignore JSON parse failures and keep the generic API message.
      }

      if (response.status === 429) {
        throw new Error(
          `${providerName} is rate-limited right now. Please try again in a moment.`,
        );
      }

      if (response.status >= 500) {
        throw new Error(
          `${providerName} is temporarily unavailable. Please try again later.`,
        );
      }

      throw new Error(message);
    }

    const payload = await response.json();
    const rawText = getJsonTextFromResponse(payload, provider);
    const parsed = JSON.parse(normalizeJsonText(rawText)) as unknown;
    return validator(parsed);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `${providerName} timed out. Please try a smaller request.`,
        { cause: error },
      );
    }

    const message =
      error instanceof Error ? error.message : "The AI request failed.";

    if (message.includes("Unexpected token") || message.includes("malformed")) {
      throw new Error(
        "The AI returned malformed JSON. Please try again with a simpler prompt.",
        {
          cause: error,
        },
      );
    }

    throw new Error(message, { cause: error });
  } finally {
    window.clearTimeout(timeout);
  }
}

export type GenerateQuestionsOptions = {
  type: QuestionType | "automatic";
  /** Capped to 1–20. */
  count: number;
  /** What the questions are about. */
  topicTitle?: string;
  /** The lesson the questions should focus on, when generating for a lesson. */
  lessonTitle?: string;
  /** The roadmap the topic belongs to, for extra context. */
  roadmapTitle?: string;
  /** The group the topic belongs to, for extra context. */
  groupTitle?: string;
  /** The learner's own notes on the topic, used as reference material. */
  notes?: string;
  /** Readable contents of resources selected for generation. */
  sourceMaterial?: { title: string; content: string }[];
  /** Concepts identified by the automatic coverage planner. */
  coveragePoints?: string[];
  /** Texts of questions the topic already has, so the AI does not repeat them. */
  existingQuestions?: string[];
  difficulty?: QuestionDifficulty;
  /** Extra instructions typed by the learner. */
  prompt?: string;
  provider?: AiProvider;
};

function limitText(value: string, maxChars: number): string {
  const text = value.trim();

  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

function formatPrompt(template: string, values: Record<string, string> = {}): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => {
    const value = values[key];
    if (value === undefined) {
      throw new Error(`Missing value for AI prompt placeholder: ${placeholder}`);
    }

    return value;
  });
}

function formatSourceMaterial(
  sourceMaterial: GenerateQuestionsOptions["sourceMaterial"] = [],
): string[] {
  let remaining = MAX_SOURCE_MATERIAL_CHARS;

  return sourceMaterial.flatMap(({ title, content }) => {
    const safeContent = content.trim();
    const resourceTitle = formatPrompt(AI_PROMPTS.sourceMaterial.title, {
      title: limitText(title, 200),
    });
    if (!safeContent) {
      return [`${resourceTitle}\n${AI_PROMPTS.sourceMaterial.empty}`];
    }
    if (remaining <= 0) {
      return [
        `${resourceTitle}\n${AI_PROMPTS.sourceMaterial.limitReached}`,
      ];
    }

    const included = limitText(safeContent, remaining);
    remaining = Math.max(0, remaining - included.length);
    return [
      `${resourceTitle}\n${included}${
        safeContent.length > included.length
          ? `\n${AI_PROMPTS.sourceMaterial.truncated}`
          : ""
      }`,
    ];
  });
}

/** Builds the generation prompt. Exported so tests can check what the AI is told. */
export function buildGenerationPrompt({
  type,
  count,
  topicTitle,
  lessonTitle,
  roadmapTitle,
  groupTitle,
  notes,
  sourceMaterial,
  coveragePoints = [],
  existingQuestions = [],
  difficulty,
  prompt,
}: GenerateQuestionsOptions): string {
  const safeCount = Math.max(1, Math.min(20, Number.isFinite(count) ? Math.round(count) : 1));
  const typeLabel =
    type === "automatic"
      ? AI_PROMPTS.generation.typeLabels.automatic
      : type === "mcq"
      ? AI_PROMPTS.generation.typeLabels.mcq
      : type === "true-false"
        ? AI_PROMPTS.generation.typeLabels.trueFalse
        : type === "fill-blank"
          ? AI_PROMPTS.generation.typeLabels.fillBlank
          : type === "flashcard"
            ? AI_PROMPTS.generation.typeLabels.flashcard
            : AI_PROMPTS.generation.typeLabels.essay;
  const context = [
    topicTitle?.trim()
      ? formatPrompt(AI_PROMPTS.generation.topic, { title: topicTitle.trim() })
      : "",
    lessonTitle?.trim()
      ? formatPrompt(AI_PROMPTS.generation.lesson, { title: lessonTitle.trim() })
      : "",
    groupTitle?.trim()
      ? formatPrompt(AI_PROMPTS.generation.group, { title: groupTitle.trim() })
      : "",
    roadmapTitle?.trim()
      ? formatPrompt(AI_PROMPTS.generation.subject, { title: roadmapTitle.trim() })
      : "",
  ].filter(Boolean);
  const safeNotes = notes?.trim() ? limitText(notes, MAX_NOTES_CHARS) : "";
  const safeSourceMaterial = formatSourceMaterial(sourceMaterial);
  const known = existingQuestions
    .map((text) => text.trim())
    .filter(Boolean)
    .slice(0, MAX_EXISTING_QUESTIONS)
    .map((text) =>
      formatPrompt(AI_PROMPTS.generation.existingQuestionBullet, {
        question: limitText(text, MAX_EXISTING_QUESTION_CHARS),
      }),
    );

  const exampleShape =
    type === "automatic"
      ? AI_PROMPTS.generation.examples.automatic
      : type === "mcq"
      ? AI_PROMPTS.generation.examples.mcq
      : type === "true-false"
        ? AI_PROMPTS.generation.examples.trueFalse
        : type === "fill-blank"
          ? AI_PROMPTS.generation.examples.fillBlank
          : type === "flashcard"
            ? AI_PROMPTS.generation.examples.flashcard
            : AI_PROMPTS.generation.examples.essay;

  return [
    AI_PROMPTS.generation.jsonOnly,
    formatPrompt(AI_PROMPTS.generation.questionCount, {
      count: String(safeCount),
      type: typeLabel,
    }),
    context.length > 0
      ? lessonTitle?.trim()
        ? AI_PROMPTS.generation.lessonAudience
        : AI_PROMPTS.generation.topicAudience
      : AI_PROMPTS.generation.revisionAudience,
    ...context,
    safeNotes
      ? formatPrompt(AI_PROMPTS.generation.notes, { notes: safeNotes })
      : "",
    safeSourceMaterial.length > 0
      ? formatPrompt(AI_PROMPTS.generation.resources, {
          resources: safeSourceMaterial.join("\n\n"),
        })
      : "",
    coveragePoints.length > 0
      ? formatPrompt(AI_PROMPTS.generation.coveragePoints, {
          points: coveragePoints
            .map((point, index) =>
              formatPrompt(AI_PROMPTS.generation.coveragePoint, {
                number: String(index + 1),
                point: limitText(point, 300),
              }),
            )
            .join("\n"),
        })
      : "",
    known.length > 0
      ? formatPrompt(AI_PROMPTS.generation.existingQuestions, {
          questions: known.join("\n"),
        })
      : "",
    difficulty
      ? formatPrompt(AI_PROMPTS.generation.difficulty, { difficulty })
      : "",
    AI_PROMPTS.generation.language,
    AI_PROMPTS.generation.questionShape,
    exampleShape,
    type === "automatic"
      ? AI_PROMPTS.generation.typeInstructions.automatic
      : type === "mcq"
      ? AI_PROMPTS.generation.typeInstructions.mcq
      : type === "true-false"
        ? AI_PROMPTS.generation.typeInstructions.trueFalse
        : type === "fill-blank" || type === "flashcard"
          ? AI_PROMPTS.generation.typeInstructions.shortAnswer
          : "",
    AI_PROMPTS.generation.concise,
    prompt?.trim()
      ? formatPrompt(AI_PROMPTS.generation.extraGuidance, {
          guidance: limitText(prompt, 500),
        })
      : "",
    AI_PROMPTS.generation.responseShape,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateQuestions(
  options: GenerateQuestionsOptions,
): Promise<GeneratedQuestion[]> {
  const { provider = getAiProvider(), difficulty } = options;

  return callAi<GeneratedQuestion[]>(provider, buildGenerationPrompt(options), (value) =>
    validateGeneratedQuestions(value, difficulty ?? "medium"),
  );
}

/** Plans one distinct question per uncovered, testable point in the selected material. */
export async function planAutomaticCoverage(
  options: Pick<
    GenerateQuestionsOptions,
    | "topicTitle"
    | "lessonTitle"
    | "roadmapTitle"
    | "groupTitle"
    | "notes"
    | "sourceMaterial"
    | "existingQuestions"
    | "prompt"
    | "provider"
  >,
): Promise<string[]> {
  const sourceMaterial = formatSourceMaterial(options.sourceMaterial);
  const context = [
    options.topicTitle?.trim()
      ? formatPrompt(AI_PROMPTS.coveragePlanning.topic, { title: options.topicTitle.trim() })
      : "",
    options.lessonTitle?.trim()
      ? formatPrompt(AI_PROMPTS.coveragePlanning.lesson, { title: options.lessonTitle.trim() })
      : "",
    options.groupTitle?.trim()
      ? formatPrompt(AI_PROMPTS.coveragePlanning.group, { title: options.groupTitle.trim() })
      : "",
    options.roadmapTitle?.trim()
      ? formatPrompt(AI_PROMPTS.coveragePlanning.subject, { title: options.roadmapTitle.trim() })
      : "",
  ].filter(Boolean);
  const known = (options.existingQuestions ?? [])
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, MAX_EXISTING_QUESTIONS)
    .map((question) =>
      formatPrompt(AI_PROMPTS.coveragePlanning.existingQuestionBullet, {
        question: limitText(question, MAX_EXISTING_QUESTION_CHARS),
      }),
    );
  const prompt = [
    AI_PROMPTS.coveragePlanning.jsonOnly,
    AI_PROMPTS.coveragePlanning.purpose,
    AI_PROMPTS.coveragePlanning.scope,
    ...context,
    options.notes?.trim()
      ? formatPrompt(AI_PROMPTS.coveragePlanning.notes, {
          notes: limitText(options.notes, MAX_NOTES_CHARS),
        })
      : "",
    sourceMaterial.length > 0
      ? formatPrompt(AI_PROMPTS.coveragePlanning.resources, {
          resources: sourceMaterial.join("\n\n"),
        })
      : "",
    known.length > 0
      ? formatPrompt(AI_PROMPTS.coveragePlanning.existingQuestions, {
          questions: known.join("\n"),
        })
      : "",
    options.prompt?.trim()
      ? formatPrompt(AI_PROMPTS.coveragePlanning.extraGuidance, {
          guidance: limitText(options.prompt, 500),
        })
      : "",
    AI_PROMPTS.coveragePlanning.responseShape,
    AI_PROMPTS.coveragePlanning.coverageLimit,
  ]
    .filter(Boolean)
    .join("\n");

  return callAi(options.provider ?? getAiProvider(), prompt, (value) => {
    if (!isRecord(value) || !Array.isArray(value.coveragePoints)) {
      throw new Error("The AI coverage plan did not include a coveragePoints array.");
    }

    const points = value.coveragePoints.map((point) =>
      typeof point === "string" ? point.trim() : "",
    );
    if (points.some((point) => !point)) {
      throw new Error("The AI coverage plan contains an empty learning point.");
    }

    const uniquePoints = [...new Map(points.map((point) => [point.toLocaleLowerCase(), point])).values()];
    if (uniquePoints.length === 0) {
      throw new Error("The AI could not find any study points to cover.");
    }

    return uniquePoints;
  });
}

export async function gradeEssayAnswer({
  questionText,
  userAnswer,
  referenceAnswer,
  provider = getAiProvider(),
}: {
  questionText: string;
  userAnswer: string;
  referenceAnswer?: string;
  provider?: AiProvider;
}): Promise<EssayGradeResult> {
  const safeQuestion = ensureValidText(questionText, "question text");
  const safeAnswer = ensureValidText(userAnswer, "user answer");

  const prompt = [
    AI_PROMPTS.essayGrading.jsonOnly,
    AI_PROMPTS.essayGrading.purpose,
    formatPrompt(AI_PROMPTS.essayGrading.question, { question: safeQuestion }),
    formatPrompt(AI_PROMPTS.essayGrading.referenceAnswer, {
      answer: referenceAnswer?.trim() || AI_PROMPTS.answerExplanation.noReferenceAnswer,
    }),
    formatPrompt(AI_PROMPTS.essayGrading.learnerAnswer, { answer: safeAnswer }),
    AI_PROMPTS.essayGrading.assess,
    AI_PROMPTS.essayGrading.responseShape,
    AI_PROMPTS.essayGrading.scoreRange,
  ].join("\n");

  return callAi<EssayGradeResult>(provider, prompt, (value) =>
    validateEssayGradeResult(value),
  );
}

export async function explainQuestionAnswer({
  question,
  userAnswer,
  provider = getAiProvider(),
}: {
  question: ExplainableQuestion;
  userAnswer?: string | number | boolean;
  provider?: AiProvider;
}): Promise<string> {
  const questionDetails =
    question.type === "mcq"
      ? [
          formatPrompt(AI_PROMPTS.answerExplanation.options, {
            options: question.options.map((option, index) => `${index + 1}. ${option}`).join(" | "),
          }),
          formatPrompt(AI_PROMPTS.answerExplanation.correctAnswer, {
            answer: question.options[question.answerIndex],
          }),
          formatPrompt(AI_PROMPTS.answerExplanation.learnerSelected, {
            answer:
              typeof userAnswer === "number"
                ? question.options[userAnswer] ?? AI_PROMPTS.answerExplanation.noAnswerSelected
                : AI_PROMPTS.answerExplanation.noAnswerSelected,
          }),
        ]
      : question.type === "true-false"
        ? [
            formatPrompt(AI_PROMPTS.answerExplanation.correctAnswer, {
              answer: question.answer ? "True" : "False",
            }),
            formatPrompt(AI_PROMPTS.answerExplanation.learnerSelected, {
              answer:
                typeof userAnswer === "boolean"
                  ? userAnswer
                    ? "True"
                    : "False"
                  : AI_PROMPTS.answerExplanation.noAnswerSelected,
            }),
          ]
        : question.type === "fill-blank" || question.type === "flashcard"
          ? [
              formatPrompt(AI_PROMPTS.answerExplanation.correctAnswer, {
                answer: question.answer,
              }),
              formatPrompt(AI_PROMPTS.answerExplanation.learnerAnswer, {
                answer:
                  typeof userAnswer === "string" && userAnswer.trim()
                    ? userAnswer.trim()
                    : AI_PROMPTS.answerExplanation.noAnswerSupplied,
              }),
            ]
          : (() => {
              const essayQuestion = question as { type: "essay"; referenceAnswer?: string };

              return [
                formatPrompt(AI_PROMPTS.answerExplanation.referenceAnswer, {
                  answer:
                    essayQuestion.referenceAnswer?.trim() ||
                    AI_PROMPTS.answerExplanation.noReferenceAnswer,
                }),
                formatPrompt(AI_PROMPTS.answerExplanation.learnerAnswer, {
                  answer:
                    typeof userAnswer === "string" && userAnswer.trim()
                      ? userAnswer.trim()
                      : AI_PROMPTS.answerExplanation.noAnswerSupplied,
                }),
              ];
            })();

  const prompt = [
    AI_PROMPTS.answerExplanation.jsonOnly,
    AI_PROMPTS.answerExplanation.purpose,
    AI_PROMPTS.answerExplanation.mcq,
    AI_PROMPTS.answerExplanation.trueFalse,
    AI_PROMPTS.answerExplanation.shortAnswer,
    formatPrompt(AI_PROMPTS.answerExplanation.question, { question: question.text }),
    ...questionDetails,
    AI_PROMPTS.answerExplanation.responseShape,
  ].join("\n");

  const result = await callAi<AnswerExplanation>(provider, prompt, (value) =>
    validateAnswerExplanation(value),
  );

  return result.explanation;
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while using AI.";
}
