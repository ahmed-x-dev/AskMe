"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, BookOpen, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { StatusSelect } from "@/components/roadmaps/TopicRow";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { NameDialog } from "@/components/ui/NameDialog";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { buttonPrimary, buttonSecondary, buttonSecondaryCompact } from "@/components/ui/styles";
import { plural } from "@/lib/format";
import { deleteTopic, getTopicPage, setTopicStatus, updateTopic } from "@/lib/data";
import type { TopicStatus } from "@/types/study";
import { NotesSection } from "./NotesSection";
import { QuestionsSection } from "./QuestionsSection";
import { ResourcesSection } from "./ResourcesSection";

export function TopicPage() {
  const params = useParams<{ id: string }>();
  const topicId = typeof params.id === "string" ? params.id : "";
  const page = useLiveQuery(() => getTopicPage(topicId), [topicId]);
  const router = useRouter();

  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (page === undefined) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading topic" className="mx-auto flex w-full flex-col gap-4">
        <div className="h-12 w-40 animate-pulse rounded-2xl bg-card" />
        <div className="h-20 animate-pulse rounded-2xl bg-card" />
        <div className="h-32 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (page === null) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 text-center">
        <h1 className="text-[22px] font-medium leading-7">Topic not found</h1>
        <p className="mt-2 text-[16px] leading-6 text-muted">It may have been deleted.</p>
        <Link
          href="/"
          className={`mt-6 ${buttonPrimary}`}
        >
          Back to roadmaps
        </Link>
      </section>
    );
  }

  const { topic, roadmap, group, resources, questions } = page;
  const completedResources = resources.filter((resource) => resource.done).length;

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const deleteMessage = `“${topic.title}” will be deleted${
    questions.length > 0 || resources.length > 0
      ? `, together with its ${plural(questions.length, "question")} and ${plural(resources.length, "link")}`
      : ""
  }. This cannot be undone.`;

  return (
    <section className="mx-auto flex w-full flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px] text-muted">
          <Link href={`/roadmap/${roadmap.id}`} className={buttonSecondaryCompact}>
            <ArrowLeft aria-hidden="true" className="h-5 w-5 shrink-0 rtl:rotate-180" strokeWidth={1.5} />
            <span className="max-w-[min(60vw,24rem)] truncate">{roadmap.title}</span>
          </Link>
          {group ? (
            <>
              <span aria-hidden="true">/</span>
              <span className="min-w-0 wrap-break-word">{group.title}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="wrap-break-word text-[22px] font-medium leading-7 text-fg">
              {topic.title}
            </h1>
            <p className="mt-1 max-w-[72ch] text-[16px] leading-6 text-muted">
              Learn the key ideas with your notes and resources, then use practice questions to check your understanding.
            </p>
          </div>

          <ActionMenu
            label={`Actions for ${topic.title}`}
            items={[
              { label: "Rename", icon: Pencil, onSelect: () => setIsRenaming(true) },
              { label: "Delete", icon: Trash2, danger: true, onSelect: () => setIsConfirmingDelete(true) },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {questions.length > 0 ? (
            <Link href={`/topic/${topic.id}/quiz`} className={buttonPrimary}>
              <Play aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              Start quiz
              <span>· {plural(questions.length, "question")}</span>
            </Link>
          ) : (
            <Link href={`/topic/${topic.id}/q/new`} className={buttonPrimary}>
              <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              Add your first question
            </Link>
          )}
          {questions.length > 0 ? (
            <Link href={`/topic/${topic.id}/q/new`} className={buttonSecondary}>
              <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              Add question
            </Link>
          ) : null}
        </div>

        <section aria-label="Topic progress" className="flex flex-col gap-4 rounded-2xl bg-card p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[16px] font-medium leading-6 text-fg">Learning progress</h2>
              <span className="text-[13px] leading-[18px] text-muted tabular-nums">
                {questions.length > 0
                  ? plural(questions.length, "question")
                  : "No practice questions yet"}
              </span>
            </div>
            {resources.length > 0 ? (
              <>
                <ProgressBar
                  label="Learning resources completed"
                  completed={completedResources}
                  total={resources.length}
                  onCard
                />
                <p className="mt-2 text-[13px] leading-[18px] text-muted tabular-nums">
                  {completedResources} of {plural(resources.length, "resource")} completed
                </p>
              </>
            ) : (
              <p className="mt-1 text-[13px] leading-[18px] text-muted">
                <BookOpen aria-hidden="true" className="me-1 inline h-4 w-4" strokeWidth={1.5} />
                Add a learning link to track what you have read or watched.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <span className="text-[13px] font-medium leading-[18px] text-muted">Topic status</span>
            <StatusSelect
              topic={topic}
              onChange={(status: TopicStatus) => void run(() => setTopicStatus(topic.id, status))}
            />
          </div>
        </section>
      </header>

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      <NotesSection key={`notes-${topic.id}`} topicId={topic.id} notes={topic.notes} />
      <ResourcesSection key={`resources-${topic.id}`} topicId={topic.id} resources={resources} />
      <QuestionsSection
        topicId={topic.id}
        questions={questions}
        topicContext={{
          topicTitle: topic.title,
          roadmapTitle: roadmap.title,
          groupTitle: group?.title,
          notes: topic.notes,
        }}
      />

      {isConfirmingDelete ? (
        <ConfirmDialog
          title="Delete topic?"
          message={deleteMessage}
          confirmLabel="Delete topic"
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={async () => {
            await deleteTopic(topic.id);
            router.replace(`/roadmap/${roadmap.id}`);
          }}
        />
      ) : null}

      {isRenaming ? (
        <NameDialog
          title="Rename topic"
          label="Topic name"
          initialValue={topic.title}
          submitLabel="Save"
          onClose={() => setIsRenaming(false)}
          onSubmit={async (name) => {
            await updateTopic(topic.id, { title: name });
            setIsRenaming(false);
          }}
        />
      ) : null}
    </section>
  );
}
