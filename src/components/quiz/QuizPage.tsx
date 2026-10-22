"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useHeaderBackLink } from "@/components/layout/AppLayout";
import { shuffle } from "@/features/quiz";
import { buttonPrimary } from "@/components/ui/styles";
import { completeTopicsFromQuiz, getQuizSource, type QuizAnswer, type QuizScope } from "@/lib/data";
import type { Question, Topic } from "@/types/study";
import { QuizResults } from "./QuizResults";
import { QuizRunner } from "./QuizRunner";
import { QuizSetup } from "./QuizSetup";

type Phase =
  | { name: "setup" }
  | { name: "running"; queue: Question[]; runId: number }
  | {
      name: "results";
      queue: Question[];
      answers: QuizAnswer[];
      elapsedSeconds: number;
      markedDone: Topic[];
      historyErrors: string[];
      completionError?: string;
    };

/** A quiz for one topic, a whole roadmap, or one group of a roadmap. */
export function QuizPage({ scope }: { scope: QuizScope }) {
  const kind = scope.kind;
  const topicId = scope.kind === "topic" ? scope.topicId : undefined;
  const roadmapId = scope.kind === "roadmap" ? scope.roadmapId : undefined;
  const groupId = scope.kind === "roadmap" ? scope.groupId : undefined;
  const source = useLiveQuery(
    () =>
      getQuizSource(
        kind === "topic" ? { kind, topicId: topicId ?? "" } : { kind, roadmapId: roadmapId ?? "", groupId },
      ),
    [kind, topicId, roadmapId, groupId],
  );
  useHeaderBackLink(
    source ? { href: source.backHref, label: source.backLabel } : null,
  );
  const [phase, setPhase] = useState<Phase>({ name: "setup" });

  if (source === undefined) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading quiz" className="mx-auto flex w-full flex-col gap-4">
        <div className="h-12 w-40 animate-pulse rounded-2xl bg-card" />
        <div className="h-48 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (source === null) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 text-center">
        <h1 className="text-[22px] font-medium leading-7">Quiz not found</h1>
        <p className="mt-2 text-base leading-6 text-muted">What you wanted to practice may have been deleted.</p>
        <Link href="/" className={`mt-6 ${buttonPrimary}`}>
          Back to roadmaps
        </Link>
      </section>
    );
  }

  if (source.questions.length === 0) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 text-center">
        <h1 className="text-[22px] font-medium leading-7">No questions yet</h1>
        <p className="mt-2 text-base leading-6 text-muted">
          Add questions to {source.title} before starting a quiz.
        </p>
        <Link href={source.backHref} className={`mt-6 ${buttonPrimary}`}>
          {source.backLabel}
        </Link>
      </section>
    );
  }

  const start = (queue: Question[]) => setPhase({ name: "running", queue, runId: Date.now() });

  const handleFinish = async (
    queue: Question[],
    answers: QuizAnswer[],
    elapsedSeconds: number,
    historyErrors: string[],
  ) => {
    let markedDone: Topic[] = [];
    let completionError: string | undefined;

    try {
      markedDone = await completeTopicsFromQuiz(answers);
    } catch (error) {
      completionError =
        error instanceof Error ? error.message : "Try again later from the topic page.";
    }

    setPhase({ name: "results", queue, answers, elapsedSeconds, markedDone, historyErrors, completionError });
  };

  if (phase.name === "running") {
    return (
      <QuizRunner
        key={phase.runId}
        queue={phase.queue}
        exitHref={source.backHref}
        onFinish={(answers, elapsedSeconds, historyErrors) =>
          handleFinish(phase.queue, answers, elapsedSeconds, historyErrors)
        }
      />
    );
  }

  if (phase.name === "results") {
    const missedIds = new Set(phase.answers.filter((answer) => !answer.correct).map((answer) => answer.questionId));

    return (
      <QuizResults
        queue={phase.queue}
        answers={phase.answers}
        elapsedSeconds={phase.elapsedSeconds}
        markedDone={phase.markedDone}
        historyErrors={phase.historyErrors}
        completionError={phase.completionError}
        backHref={source.backHref}
        backLabel={source.backLabel}
        onRestart={() => start(shuffle(phase.queue))}
        onRetryMistakes={() => start(shuffle(phase.queue.filter((question) => missedIds.has(question.id))))}
      />
    );
  }

  return <QuizSetup source={source} onStart={start} />;
}

/** The quiz for `/topic/[id]/quiz`. */
export function TopicQuizPage() {
  const params = useParams<{ id: string }>();

  return <QuizPage scope={{ kind: "topic", topicId: typeof params.id === "string" ? params.id : "" }} />;
}

function RoadmapQuizContent() {
  const params = useParams<{ id: string }>();
  const group = useSearchParams().get("group");

  return (
    <QuizPage
      scope={{
        kind: "roadmap",
        roadmapId: typeof params.id === "string" ? params.id : "",
        groupId: group || undefined,
      }}
    />
  );
}

/** The quiz for `/roadmap/[id]/quiz`, or one group of it with `?group=<id>`. */
export function RoadmapQuizPage() {
  return (
    <Suspense fallback={<div role="status" aria-busy="true" aria-label="Loading quiz" className="h-48 animate-pulse rounded-2xl bg-card" />}>
      <RoadmapQuizContent />
    </Suspense>
  );
}
