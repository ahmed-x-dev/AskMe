"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { shuffle } from "@/features/quiz";
import { completeTopicsFromQuiz, getQuizSource, type QuizAnswer, type QuizScope } from "@/lib/data";
import type { Question, Topic } from "@/types/study";
import { QuizResults } from "./QuizResults";
import { QuizRunner } from "./QuizRunner";
import { QuizSetup } from "./QuizSetup";

type Phase =
  | { name: "setup" }
  | { name: "running"; queue: Question[]; runId: number }
  | { name: "results"; queue: Question[]; answers: QuizAnswer[]; elapsedSeconds: number; markedDone: Topic[] };

const cardLinkClassName =
  "mt-6 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent";

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
  const [phase, setPhase] = useState<Phase>({ name: "setup" });

  if (source === undefined) {
    return (
      <div aria-busy="true" aria-label="Loading quiz" className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="h-12 w-40 animate-pulse rounded-2xl bg-card" />
        <div className="h-48 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (source === null) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-card p-6 text-center">
        <h1 className="text-[22px] font-medium leading-7">Quiz not found</h1>
        <p className="mt-2 text-[16px] leading-6 text-muted">What you wanted to practice may have been deleted.</p>
        <Link href="/" className={cardLinkClassName}>
          Back to roadmaps
        </Link>
      </section>
    );
  }

  if (source.questions.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-card p-6 text-center">
        <h1 className="text-[22px] font-medium leading-7">No questions yet</h1>
        <p className="mt-2 text-[16px] leading-6 text-muted">
          Add questions to {source.title} before starting a quiz.
        </p>
        <Link href={source.backHref} className={cardLinkClassName}>
          {source.backLabel}
        </Link>
      </section>
    );
  }

  const start = (queue: Question[]) => setPhase({ name: "running", queue, runId: Date.now() });

  const handleFinish = async (queue: Question[], answers: QuizAnswer[], elapsedSeconds: number) => {
    let markedDone: Topic[] = [];

    try {
      markedDone = await completeTopicsFromQuiz(answers);
    } catch {
      // The answers are already saved. Failing to mark topics done should not hide the score.
    }

    setPhase({ name: "results", queue, answers, elapsedSeconds, markedDone });
  };

  if (phase.name === "running") {
    return (
      <QuizRunner
        key={phase.runId}
        queue={phase.queue}
        exitHref={source.backHref}
        onFinish={(answers, elapsedSeconds) => handleFinish(phase.queue, answers, elapsedSeconds)}
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
    <Suspense fallback={<div aria-busy="true" aria-label="Loading quiz" className="h-48 animate-pulse rounded-2xl bg-card" />}>
      <RoadmapQuizContent />
    </Suspense>
  );
}
