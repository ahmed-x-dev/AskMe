import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generateQuestions,
  planAutomaticCoverage,
  explainQuestionAnswer,
  gradeEssayAnswer,
  validateAnswerExplanation,
  validateEssayGradeResult,
  validateGeneratedQuestions,
  parseGeneratedQuestionsText,
  buildGenerationPrompt,
  buildAutomaticCoveragePrompt,
} from "../../src/features/ai";
import {
  saveAiApiKey,
  saveGeminiApiKey,
  setAiProvider,
} from "../../src/platform/secureStorage";

describe("AI schema validation", () => {
  it("accepts valid generated MCQ questions", () => {
    const result = validateGeneratedQuestions({
      questions: [
        {
          type: "mcq",
          text: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Mercury"],
          answerIndex: 1,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("mcq");
    if (result[0].type !== "mcq") {
      throw new Error(
        "Expected the generated question to be a multiple-choice question.",
      );
    }
    expect(result[0].options).toEqual(["Venus", "Mars", "Jupiter", "Mercury"]);
    expect(result[0].difficulty).toBe("medium");
    expect(result[0].tags).toEqual([]);
  });

  it("accepts true/false and fill-blank questions", () => {
    const result = validateGeneratedQuestions({
      questions: [
        { type: "true-false", text: "The moon orbits Earth.", answer: true },
        {
          type: "fill-blank",
          text: "The capital of France is _____.",
          answer: "Paris",
        },
      ],
    });

    expect(result).toEqual([
      {
        type: "true-false",
        text: "The moon orbits Earth.",
        difficulty: "medium",
        tags: [],
        answer: true,
      },
      {
        type: "fill-blank",
        text: "The capital of France is _____.",
        difficulty: "medium",
        tags: [],
        answer: "Paris",
      },
    ]);
  });

  it("skips unusable questions and keeps the good ones", () => {
    const result = validateGeneratedQuestions({
      questions: [
        {
          type: "mcq",
          text: "Repeated options?",
          options: ["a", "a", "b", "c"],
          answerIndex: 0,
        },
        {
          type: "mcq",
          text: "Bad answer index?",
          options: ["a", "b", "c", "d"],
          answerIndex: 7,
        },
        {
          type: "essay",
          text: "Explain it.",
          referenceAnswer: " Because. ",
          difficulty: "hard",
        },
      ],
    });

    expect(result).toEqual([
      {
        type: "essay",
        text: "Explain it.",
        referenceAnswer: "Because.",
        difficulty: "hard",
        tags: [],
      },
    ]);
  });

  it("throws the first problem when no question is usable", () => {
    expect(() =>
      validateGeneratedQuestions({
        questions: [
          {
            type: "mcq",
            text: "Only three?",
            options: ["a", "b", "c"],
            answerIndex: 0,
          },
        ],
      }),
    ).toThrow("must include four options");
    expect(() => validateGeneratedQuestions({ questions: [] })).toThrow(
      "did not include any questions",
    );
  });

  it("uses the requested difficulty unless the AI sets a valid one", () => {
    const [first, second] = validateGeneratedQuestions(
      {
        questions: [
          { type: "essay", text: "One?" },
          { type: "essay", text: "Two?", difficulty: "nonsense" },
        ],
      },
      "easy",
    );

    expect(first.difficulty).toBe("easy");
    expect(second.difficulty).toBe("easy");
  });

  it("parses fenced chatbot JSON and validates the questions", () => {
    const questions = parseGeneratedQuestionsText(
      '```json\n{"questions":[{"type":"essay","text":"Explain state."}]}\n```',
      "hard",
    );

    expect(questions).toHaveLength(1);
    expect(questions[0].difficulty).toBe("hard");
  });

  it("normalizes curly JSON quotes while preserving quoted text", () => {
    const questions = parseGeneratedQuestionsText(
      '{“questions”:[{“type”:”essay”,“text”:”Explain “markup, HTML” and tags.”},{“type”:”fill-blank”,“text”:”Created in ____.”,“answer”:”1991"}]}',
    );

    expect(questions).toEqual([
      {
        type: "essay",
        text: 'Explain "markup, HTML" and tags.',
        difficulty: "medium",
        tags: [],
        referenceAnswer: undefined,
      },
      {
        type: "fill-blank",
        text: "Created in ____.",
        difficulty: "medium",
        tags: [],
        answer: "1991",
      },
    ]);
  });

  it("rejects malformed or unusable chatbot responses", () => {
    expect(() => parseGeneratedQuestionsText("Not JSON")).toThrow(
      "must be valid JSON",
    );
    expect(() => parseGeneratedQuestionsText('{"questions":[]}')).toThrow(
      "did not include any questions",
    );
  });

  it("rejects malformed essay grading payloads", () => {
    expect(() =>
      validateEssayGradeResult({
        score: 11,
        feedback: "Nope",
        missingPoints: -1,
      }),
    ).toThrow("score between 0 and 10");
  });

  it("validates a non-empty answer explanation", () => {
    expect(
      validateAnswerExplanation({ explanation: "  Because it is correct.  " }),
    ).toEqual({
      explanation: "Because it is correct.",
    });
    expect(() => validateAnswerExplanation({ explanation: "" })).toThrow(
      /answer explanation/,
    );
  });
});

describe("generation prompt", () => {
  it("tells the AI about the topic, notes and existing questions", () => {
    const prompt = buildGenerationPrompt({
      type: "mcq",
      count: 5,
      topicTitle: "useEffect",
      groupTitle: "Hooks",
      roadmapTitle: "React",
      notes: "Runs after render.",
      existingQuestions: ["What is the dependency array?"],
      difficulty: "hard",
      prompt: "Focus on cleanup.",
    });

    expect(prompt).toContain("Create exactly 5 multiple-choice questions");
    expect(prompt).toContain("Topic: useEffect");
    expect(prompt).toContain("Part of the group: Hooks");
    expect(prompt).toContain("In the subject: React");
    expect(prompt).toContain("Runs after render.");
    expect(prompt).toContain("- What is the dependency array?");
    expect(prompt).toContain("Make every question hard difficulty.");
    expect(prompt).toContain("Extra guidance: Focus on cleanup.");
  });

  it("leaves out sections that have no content and trims very long notes", () => {
    const prompt = buildGenerationPrompt({
      type: "essay",
      count: 3,
      notes: "x".repeat(9000),
    });

    expect(prompt).not.toContain("Topic:");
    expect(prompt).not.toContain("already has these questions");
    expect(prompt.length).toBeLessThan(6000);
  });

  it("asks for full coverage without a fixed question count", () => {
    const prompt = buildAutomaticCoveragePrompt({
      topicTitle: "useEffect",
      notes: "Effects synchronize with external systems.",
      sourceMaterial: [
        {
          title: "Lifecycle",
          content: "Cleanup runs before the effect reruns.",
        },
      ],
      existingQuestions: ["What is an effect?"],
    });

    expect(prompt).toContain("every important, distinct, testable point");
    expect(prompt).toContain("Skip minor tangents, incidental trivia");
    expect(prompt).toContain("Do not refer to the source material");
    expect(prompt).toContain("standard ASCII double quotes");
    expect(prompt).toContain("Do not use curly quotes as JSON delimiters");
    expect(prompt).toContain(
      'Return exactly one top-level JSON object with a "questions" array',
    );
    expect(prompt).toContain(
      '{"type":"essay","text":"...","referenceAnswer":"..."}',
    );
    expect(prompt).toContain(
      '{"type":"true-false","text":"...","answer":true}',
    );
    expect(prompt).toContain(
      '{"type":"fill-blank","text":"...","answer":"..."}',
    );
    expect(prompt).toContain(
      '{"type":"flashcard","text":"...","answer":"..."}',
    );
    expect(prompt).not.toContain("Create exactly");
    expect(prompt).toContain("answerIndex (0-3)");
    expect(prompt).toContain("true-false has text and a boolean answer");
    expect(prompt).toContain(
      "fill-blank and flashcard each have text and a string answer",
    );
    expect(prompt).toContain(
      "Use essay for explanations, comparisons, lists, or multi-part conceptual questions",
    );
    expect(prompt).toContain(
      "Use fill-blank for a short, precise term or fact",
    );
    expect(prompt).toContain("Reserve flashcards for vocabulary");
    expect(prompt).toContain("Effects synchronize with external systems.");
    expect(prompt).toContain("Cleanup runs before the effect reruns.");
    expect(prompt).toContain("Do not repeat or rephrase any listed question");
  });
});

describe("AI calls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("generates questions using the Gemini API", async () => {
    saveGeminiApiKey("test-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    questions: [
                      {
                        type: "mcq",
                        text: "What is 2 + 2?",
                        options: ["3", "4", "5", "6"],
                        answerIndex: 1,
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await generateQuestions({
      type: "mcq",
      count: 1,
      topicTitle: "Math",
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("mcq");
    expect(result[0].text).toBe("What is 2 + 2?");
    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(requestUrl).not.toContain("test-key");
    expect(requestOptions.headers).toMatchObject({
      "x-goog-api-key": "test-key",
    });
  });

  it("supports generation counts up to 20 and caps larger requests at 20", async () => {
    saveGeminiApiKey("test-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    questions: [
                      {
                        type: "essay",
                        text: "Explain a concept.",
                        referenceAnswer: "An explanation.",
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateQuestions({ type: "essay", count: 20 });
    await generateQuestions({ type: "essay", count: 21 });

    for (const [, requestOptions] of fetchMock.mock.calls as [
      string,
      RequestInit,
    ][]) {
      const body = JSON.parse(String(requestOptions.body)) as {
        contents: { parts: { text: string }[] }[];
      };
      expect(body.contents[0].parts[0].text).toContain(
        "Create exactly 20 essay questions",
      );
    }
  });

  it("grades essay answers using the Gemini API", async () => {
    saveGeminiApiKey("test-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    score: 8,
                    feedback: "Strong answer with a few gaps.",
                    missingPoints: 2,
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await gradeEssayAnswer({
      questionText: "Explain photosynthesis.",
      userAnswer: "Plants use sunlight to make food.",
      referenceAnswer: "Plants convert light energy into chemical energy.",
    });

    expect(result.score).toBe(8);
    expect(result.feedback).toContain("Strong");
    expect(result.missingPoints).toBe(2);
    const [, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.stringify(requestOptions.body)).toContain(
      "Grade the learner answer against the question and optional reference answer.",
    );
  });

  it("plans automatic coverage using its configured instructions", async () => {
    saveGeminiApiKey("test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    coveragePoints: ["Understand the lifecycle."],
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      planAutomaticCoverage({
        topicTitle: "React effects",
        existingQuestions: ["What is an effect?"],
      }),
    ).resolves.toEqual(["Understand the lifecycle."]);

    const [, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.stringify(requestOptions.body)).toContain(
      "Plan a concise but thorough revision question set from the supplied study material.",
    );
    expect(JSON.stringify(requestOptions.body)).toContain(
      "Some existing questions from this topic are listed below. Do not plan points already covered by a listed question:",
    );
  });

  it("explains a question answer using the configured AI provider", async () => {
    saveGeminiApiKey("test-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    explanation: "Mars appears red because of iron oxide.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const explanation = await explainQuestionAnswer({
      question: {
        type: "mcq",
        text: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Mercury"],
        answerIndex: 1,
      },
      userAnswer: 0,
    });

    expect(explanation).toBe("Mars appears red because of iron oxide.");
    const [, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.stringify(requestOptions.body)).toContain(
      "Correct answer: Mars",
    );
    expect(JSON.stringify(requestOptions.body)).toContain(
      "Learner selected: Venus",
    );
    expect(JSON.stringify(requestOptions.body)).toContain(
      "Explain the answer to this revision question in clear, concise language.",
    );
  });

  it("uses the OpenAI provider when selected", async () => {
    setAiProvider("openai");
    saveAiApiKey("openai", "test-openai-key");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: "mcq",
                      text: "Which is a mammal?",
                      options: ["Eagle", "Dolphin", "Lizard", "Frog"],
                      answerIndex: 1,
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await generateQuestions({
      type: "mcq",
      count: 1,
      topicTitle: "Animals",
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("mcq");
    if (result[0].type !== "mcq") {
      throw new Error(
        "Expected the generated question to be a multiple-choice question.",
      );
    }
    expect(result[0].options[1]).toBe("Dolphin");
  });
});
