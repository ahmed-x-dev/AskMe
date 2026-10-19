"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, CalendarCheck, Flame, TrendingDown } from "lucide-react";
import { getProgressSummary } from "@/lib/data";
import { plural } from "@/lib/format";
import { focusRing } from "@/components/ui/styles";

/** The "Today" block on the home page: reviews due, study streak and the topics that need work. */
export function TodayCard() {
  const summary = useLiveQuery(() => getProgressSummary(), []);

  if (summary === undefined) {
    return <div aria-busy="true" aria-label="Loading progress" className="h-28 animate-pulse rounded-2xl bg-card" />;
  }

  const { dueCount, streak, answeredToday, weakTopics } = summary;

  return (
    <section aria-label="Today" className="flex flex-col gap-4">
      <div className={`grid gap-4 sm:grid-cols-2 ${weakTopics.length > 0 ? "xl:grid-cols-3" : ""}`}>
        <Link
          href="/review"
          className={`flex items-center gap-4 rounded-2xl bg-card p-4 transition-all duration-150 hover:bg-card-hover active:scale-[0.99] ${focusRing}`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg text-accent-text">
            <CalendarCheck aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[22px] font-medium leading-7 text-fg tabular-nums">
              {dueCount === 0 ? "All caught up" : `${plural(dueCount, "question")} due`}
            </span>
            <span className="block text-[13px] leading-[18px] text-muted">
              {dueCount === 0 ? "Nothing to review today" : "Start today's review"}
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-muted rtl:rotate-180" strokeWidth={1.5} />
        </Link>

        <div className="flex items-center gap-4 rounded-2xl bg-card p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg text-accent-text">
            <Flame aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <span className="min-w-0">
            <span className="block text-[22px] font-medium leading-7 text-fg tabular-nums">
              {plural(streak.current, "day")} streak
            </span>
            <span className="block text-[13px] leading-[18px] text-muted tabular-nums">
              {streak.studiedToday
                ? `${plural(answeredToday, "answer")} today`
                : streak.current > 0
                  ? "Answer a question today to keep it"
                  : "Answer a question to start one"}
              {streak.longest > streak.current ? ` · best ${streak.longest}` : ""}
            </span>
          </span>
        </div>

        {weakTopics.length > 0 ? (
          <div className="rounded-2xl bg-card p-4 sm:col-span-2 xl:col-span-1">
            <h2 className="flex items-center gap-2 text-[16px] font-medium leading-6 text-fg">
              <TrendingDown aria-hidden="true" className="h-5 w-5 text-muted" strokeWidth={1.5} />
              Needs more practice
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {weakTopics.map(({ topic, roadmap, accuracy, attempts }) => (
                <li key={topic.id}>
                  <Link
                    href={`/topic/${topic.id}`}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-[14px] bg-bg px-3 py-2 transition-all duration-150 hover:bg-card-hover active:scale-[0.99] ${focusRing}`}
                  >
                    <span className="min-w-0">
                      <span className="block wrap-break-word text-[16px] leading-6 text-fg">{topic.title}</span>
                      <span className="block wrap-break-word text-[13px] leading-[18px] text-muted">{roadmap.title}</span>
                    </span>
                    <span className="shrink-0 text-[13px] font-medium leading-[18px] text-bad-fg tabular-nums">
                      {Math.round(accuracy * 100)}% of {attempts}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
