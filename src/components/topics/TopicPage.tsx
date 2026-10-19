"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { StatusSelect } from "@/components/roadmaps/TopicRow";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { NameDialog } from "@/components/ui/NameDialog";
import { buttonPrimary, buttonSecondaryCompact } from "@/components/ui/styles";
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
      <div aria-busy="true" aria-label="Loading topic" className="mx-auto flex w-full flex-col gap-4">
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
        <Link
          href={`/roadmap/${roadmap.id}`}
          className={buttonSecondaryCompact}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5 shrink-0 rtl:rotate-180" strokeWidth={1.5} />
          <span className="truncate">{roadmap.title}</span>
        </Link>

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="wrap-break-word text-[22px] font-medium leading-7 text-fg">
              {topic.title}
            </h1>
            <p className="text-[16px] leading-6 text-muted">
              {group ? `${group.title} · ` : ""}
              {plural(questions.length, "question")}
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

        <div>
          <StatusSelect
            topic={topic}
            onChange={(status: TopicStatus) => void run(() => setTopicStatus(topic.id, status))}
          />
        </div>
      </header>

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      <ResourcesSection key={`resources-${topic.id}`} topicId={topic.id} resources={resources} />
      <NotesSection key={`notes-${topic.id}`} topicId={topic.id} notes={topic.notes} />
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
