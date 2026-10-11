import { useRef, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'

import {
  exportSetAsJson,
  importQuestionsFromJson,
  softDeleteQuestion,
} from '../data/repository'
import type { QuizSet } from '../types/quiz'

export function SetDetailPage() {
  const navigate = useNavigate()
  const initialSet = useLoaderData() as QuizSet | null
  const [set, setSet] = useState<QuizSet | null>(initialSet)
  const [importFeedback, setImportFeedback] = useState<{
    kind: 'error' | 'success'
    message: string
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    if (!set) {
      return
    }

    const json = await exportSetAsJson(set.id)
    if (!json) {
      return
    }

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `${set.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'set'}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    if (!set) {
      return
    }

    setIsImporting(true)
    setImportFeedback(null)

    try {
      const updatedSet = await importQuestionsFromJson(set.id, await file.text())

      if (!updatedSet) {
        throw new Error('This set is no longer available.')
      }

      setSet(updatedSet)
      const importedCount = updatedSet.questions.length - set.questions.length
      setImportFeedback({
        kind: 'success',
        message: `Imported ${importedCount} question${importedCount === 1 ? '' : 's'}.`,
      })
    } catch (error) {
      setImportFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'The questions could not be imported.',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string, questionText: string) => {
    if (!set) {
      return
    }

    const confirmed = window.confirm(`Delete “${questionText}”? This hides the question from the set.`)
    if (!confirmed) {
      return
    }

    const updatedSet = await softDeleteQuestion(set.id, questionId)
    if (updatedSet) {
      setSet(updatedSet)
    }
  }

  if (!set) {
    return (
      <section className="rounded-2xl bg-card p-5">
        <h2 className="text-[18px] font-medium leading-7 text-fg">Set not found</h2>
        <p className="mt-2 text-[16px] leading-6 text-muted">
          The set was removed or never existed.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Back to sets
        </Link>
      </section>
    )
  }

  const questionCount = set.questions.filter((question) => !question.deleted).length

  return (
    <>
      <section className="rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] leading-[18px] text-muted">Set overview</p>
          <span className="rounded-full bg-bg px-3 py-1 text-[13px] leading-[18px] text-muted tabular-nums">
            {questionCount} question{questionCount === 1 ? '' : 's'}
          </span>
        </div>
        <h2 className="mt-3 break-words text-[22px] font-medium leading-[28px] text-fg">
          {set.title}
        </h2>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => navigate(`/set/${set.id}/quiz?mode=random`)}
            className="min-h-12 w-full rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Start quiz
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            className="min-h-12 flex-1 rounded-2xl bg-bg px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            className="min-h-12 flex-1 rounded-2xl bg-bg px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card disabled:cursor-wait disabled:opacity-70"
          >
            Import questions
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Choose a questions JSON file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''

              if (file) {
                void handleImport(file)
              }
            }}
          />
        </div>
        {importFeedback ? (
          <p
            role={importFeedback.kind === 'error' ? 'alert' : 'status'}
            className={`mt-3 text-[13px] leading-[18px] ${
              importFeedback.kind === 'error' ? 'text-bad-fg' : 'text-accent-text'
            }`}
          >
            {importFeedback.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-medium leading-6 text-fg">Questions</h3>
            <p className="mt-1 text-[13px] leading-[18px] text-muted">
              Add or edit what you want to practice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/set/${set.id}/q/new`)}
            className="min-h-12 shrink-0 rounded-2xl bg-bg px-4 text-[13px] font-medium text-accent-text transition-colors hover:bg-accent hover:text-on-accent"
          >
            Add question
          </button>
        </div>

        {questionCount === 0 ? (
          <div className="mt-4 rounded-2xl bg-bg p-4 text-center">
            <p className="text-[16px] leading-6 text-muted">
              No questions yet. Add one to build your first quiz.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {set.questions
              .filter((question) => !question.deleted)
              .map((question) => (
                <li key={question.id} className="rounded-2xl bg-bg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium ${
                        question.type === 'mcq' ? 'bg-ok-bg text-ok-fg' : 'bg-essay-bg text-essay-fg'
                      }`}
                    >
                      {question.type === 'mcq' ? 'MCQ' : 'Essay'}
                    </span>
                    <span className="text-[13px] leading-[18px] text-muted">
                      {question.type === 'mcq' ? `${question.options.length} choices` : 'Text answer'}
                    </span>
                  </div>
                  <p className="mt-3 break-words text-[16px] leading-6 text-fg">{question.text}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/set/${set.id}/q/${question.id}`)}
                      className="min-h-11 flex-1 rounded-[14px] bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-accent hover:text-on-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteQuestion(question.id, question.text)}
                      className="min-h-11 flex-1 rounded-[14px] bg-card px-3 text-[13px] font-medium text-bad-fg transition-colors hover:bg-bad-bg"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </>
  )
}
