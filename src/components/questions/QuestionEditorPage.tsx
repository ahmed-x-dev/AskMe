'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'

import { buttonPrimary } from '@/components/ui/styles'
import { getQuestionEditorData } from '@/lib/data'
import { QuestionEditorForm } from './QuestionEditorForm'

type QuestionEditorPageProps = {
  topicId: string
  /** The question to edit. Leave out to create a new one. */
  qid?: string
}

function NotFound({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 text-center">
      <h1 className="text-[22px] font-medium leading-7 text-fg">{title}</h1>
      <Link href={href} className={`mt-6 ${buttonPrimary}`}>
        {label}
      </Link>
    </section>
  )
}

export function QuestionEditorPage({ topicId, qid }: QuestionEditorPageProps) {
  const data = useLiveQuery(() => getQuestionEditorData(topicId, qid), [topicId, qid])

  if (data === undefined) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading question"
        className="mx-auto flex w-full flex-col gap-5 rounded-2xl bg-card p-4"
      >
        <div className="h-6 w-40 animate-pulse rounded-full bg-bg" />
        <div className="h-12 animate-pulse rounded-[14px] bg-bg" />
        <div className="h-32 animate-pulse rounded-[14px] bg-bg" />
        <div className="h-12 animate-pulse rounded-[14px] bg-bg" />
      </div>
    )
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
