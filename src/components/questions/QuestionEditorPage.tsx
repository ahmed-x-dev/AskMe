'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'

import { getQuestionEditorData } from '@/lib/data'
import { QuestionEditorForm } from './QuestionEditorForm'

type QuestionEditorPageProps = {
  topicId: string
  /** The question to edit. Leave out to create a new one. */
  qid?: string
}

function NotFound({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl bg-card p-4">
      <h2 className="text-[18px] font-medium leading-7 text-fg">{title}</h2>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
      >
        {label}
      </Link>
    </section>
  )
}

export function QuestionEditorPage({ topicId, qid }: QuestionEditorPageProps) {
  const data = useLiveQuery(() => getQuestionEditorData(topicId, qid), [topicId, qid])

  if (data === undefined) {
    return <p role="status" className="text-[16px] leading-6 text-muted">Loading question…</p>
  }

  if (data === null) {
    return <NotFound title="Topic not found" href="/" label="Back to roadmaps" />
  }

  if (qid && !data.question) {
    return <NotFound title="Question not found" href={`/topic/${topicId}`} label="Back to topic" />
  }

  return (
    <QuestionEditorForm
      key={data.question?.id ?? 'new'}
      topic={data.topic}
      existingQuestion={data.question ?? undefined}
    />
  )
}
