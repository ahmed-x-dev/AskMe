import { useRef, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'

import {
  createSet,
  importSetFromJson,
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
  const [isImporting, setIsImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{
    kind: 'error' | 'success'
    message: string
  } | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const refreshSets = async () => {
    const nextSets = await listSets()
    setSets(nextSets)
  }

  const handleCreateSet = async () => {
    const created = await createSet(`Set ${sets.length + 1}`)
    await refreshSets()
    navigate(`/set/${created.id}`)
  }

  const handleImportSet = async (file: File) => {
    setIsImporting(true)
    setImportFeedback(null)

    try {
      const importedSet = await importSetFromJson(await file.text())

      if (!importedSet) {
        throw new Error('The selected file did not contain an importable set.')
      }

      await refreshSets()
      setImportFeedback({
        kind: 'success',
        message: `Imported “${importedSet.title}”.`,
      })
    } catch (error) {
      setImportFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'The set could not be imported.',
      })
    } finally {
      setIsImporting(false)
    }
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
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] leading-[18px] text-muted">Library</p>
          <h2 className="mt-1 text-[22px] font-medium leading-[28px] text-fg">
            Your sets
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted">
            Pick a set and keep your progress moving.
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          {sets.length > 0 ? (
            <button
              type="button"
              onClick={() => void handleCreateSet()}
              className="min-h-12 min-w-0 flex-1 rounded-2xl bg-accent px-3 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98] sm:flex-none sm:px-4"
            >
              New set
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            className="min-h-12 min-w-0 flex-1 rounded-2xl bg-card px-3 text-[16px] font-medium text-fg transition duration-200 ease-out hover:bg-accent hover:text-on-accent active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 sm:flex-none sm:px-4"
          >
            Import set
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Choose a set JSON file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''

              if (file) {
                void handleImportSet(file)
              }
            }}
          />
        </div>
      </section>

      {importFeedback ? (
        <p
          role={importFeedback.kind === 'error' ? 'alert' : 'status'}
          className={`-mt-5 text-[13px] leading-[18px] ${
            importFeedback.kind === 'error' ? 'text-bad-fg' : 'text-accent-text'
          }`}
        >
          {importFeedback.message}
        </p>
      ) : null}

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
              <article key={set.id} className="relative flex flex-col rounded-2xl bg-card p-4">
                <Link
                  to={`/set/${set.id}`}
                  aria-label={`Open ${set.title}`}
                  className="absolute inset-0 z-10 rounded-2xl"
                />
                <div className="relative z-20 flex flex-col gap-3 pointer-events-none sm:flex-row sm:items-start sm:justify-between">
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
                      aria-label={`Rename ${set.title}`}
                      title="Rename set"
                      className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-fg transition-colors hover:bg-accent hover:text-on-accent"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                        <path
                          d="m14 5 5 5M4 20l4.5-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSet(set.id, set.title)}
                      aria-label={`Delete ${set.title}`}
                      title="Delete set"
                      className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-bad-fg transition-colors hover:bg-bad-bg"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                        <path
                          d="M4 7h16m-10 4v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="relative z-20 mt-4 flex items-center gap-2 pointer-events-none">
                  <span className="text-[13px] leading-[18px] text-muted">
                    Updated {new Date(set.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </>
  )
}
