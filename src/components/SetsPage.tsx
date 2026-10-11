import { useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'

import {
  createSet,
  listSets,
  softDeleteSet,
  updateSetTitle,
} from '../data/repository'
import type { QuizSet } from '../types/quiz'

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <section className="rounded-2xl bg-card p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-medium leading-6 text-fg">{title}</h2>
      <p className="mx-auto mt-2 max-w-[280px] text-[16px] leading-6 text-muted">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 min-h-12 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    </section>
  )
}

export function SetsPage() {
  const navigate = useNavigate()
  const initialSets = useLoaderData() as QuizSet[]
  const [sets, setSets] = useState<QuizSet[]>(initialSets)

  const refreshSets = async () => {
    const nextSets = await listSets()
    setSets(nextSets)
  }

  const handleCreateSet = async () => {
    const created = await createSet(`Set ${sets.length + 1}`)
    await refreshSets()
    navigate(`/set/${created.id}`)
  }

  const handleRenameSet = async (setId: string, currentTitle: string) => {
    const nextTitle = window.prompt('Rename set', currentTitle)

    if (nextTitle === null) {
      return
    }

    const trimmedTitle = nextTitle.trim()

    if (!trimmedTitle) {
      return
    }

    const updated = await updateSetTitle(setId, trimmedTitle)

    if (updated) {
      await refreshSets()
    }
  }

  const handleDeleteSet = async (setId: string, title: string) => {
    const confirmed = window.confirm(`Delete “${title}”? This hides it from the app.`)

    if (!confirmed) {
      return
    }

    const deleted = await softDeleteSet(setId)

    if (deleted) {
      await refreshSets()
    }
  }

  return (
    <>
      <section className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] leading-[18px] text-muted">Library</p>
          <h2 className="mt-1 text-[22px] font-medium leading-[28px] text-fg">
            Your sets
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted">
            Pick a set and keep your progress moving.
          </p>
        </div>

        {sets.length > 0 ? (
          <button
            type="button"
            onClick={() => void handleCreateSet()}
            className="min-h-12 shrink-0 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            New set
          </button>
        ) : null}
      </section>

      {sets.length === 0 ? (
        <EmptyState
          title="No sets yet"
          description="Create your first set and start building a habit of revision."
          actionLabel="Create set"
          onAction={() => void handleCreateSet()}
        />
      ) : (
        <section className="grid gap-3 md:grid-cols-2">
          {sets.map((set) => {
            const activeQuestionCount = set.questions.filter((question) => !question.deleted).length

            return (
              <article key={set.id} className="flex flex-col rounded-2xl bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-bg px-3 py-1 text-[13px] leading-[18px] text-muted tabular-nums">
                      {activeQuestionCount} question{activeQuestionCount === 1 ? '' : 's'}
                    </span>
                    <h3 className="mt-3 break-words text-[16px] font-medium leading-6 text-fg">
                      {set.title}
                    </h3>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRenameSet(set.id, set.title)}
                      className="min-h-11 rounded-[14px] bg-bg px-3 text-[13px] font-medium text-fg transition-colors hover:bg-accent hover:text-on-accent"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSet(set.id, set.title)}
                      className="min-h-11 rounded-[14px] bg-bg px-3 text-[13px] font-medium text-bad-fg transition-colors hover:bg-bad-bg"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-[13px] leading-[18px] text-muted">
                    Updated {new Date(set.updatedAt).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/set/${set.id}`}
                    className="inline-flex min-h-12 items-center rounded-2xl bg-bg px-4 text-[16px] font-medium text-accent-text transition-colors hover:bg-accent hover:text-on-accent"
                  >
                    Open
                  </Link>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </>
  )
}
