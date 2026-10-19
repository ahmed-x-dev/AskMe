import Link from "next/link";
import { ChevronRight, CircleHelp, Plus } from "lucide-react";
import { plural } from "@/lib/format";
import type { Question } from "@/types/study";

const TYPE_BADGE: Record<Question["type"], { label: string; className: string }> = {
  mcq: { label: "MCQ", className: "bg-ok-bg text-ok-fg" },
  essay: { label: "Essay", className: "bg-essay-bg text-essay-fg" },
};

type QuestionsSectionProps = {
  topicId: string;
  questions: Question[];
};

/** The questions of one topic, each linking to the editor, plus the "Add question" button. */
export function QuestionsSection({ topicId, questions }: QuestionsSectionProps) {
  return (
    <section aria-labelledby="questions-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="questions-heading" className="text-[22px] font-medium leading-7 text-fg">
            Questions
          </h2>
          <p className="text-[13px] leading-[18px] text-muted tabular-nums">
            {plural(questions.length, "question")}
          </p>
        </div>

        {questions.length > 0 ? (
          <Link
            href={`/topic/${topicId}/q/new`}
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            Add question
          </Link>
        ) : null}
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
            <CircleHelp aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 text-[16px] font-medium leading-6 text-fg">No questions yet</h3>
          <p className="mx-auto mt-2 max-w-70 text-[16px] leading-6 text-muted">
            Add a question to start testing yourself on this topic.
          </p>
          <Link
            href={`/topic/${topicId}/q/new`}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            Add question
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {questions.map((question) => {
            const badge = TYPE_BADGE[question.type];

            return (
              <li key={question.id}>
                <Link
                  href={`/topic/${topicId}/q/${question.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 transition-colors hover:bg-card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 wrap-break-word text-[16px] leading-6 text-fg">
                      {question.text}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-[18px] ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[13px] capitalize leading-[18px] text-muted">
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted rtl:rotate-180"
                    strokeWidth={1.5}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
