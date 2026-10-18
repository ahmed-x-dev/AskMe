'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'

import {
  addQuestion,
  exportSetAsJson,
  importQuestionsFromJson,
  softDeleteQuestion,
} from '@/lib/repository'
import { describeError, generateQuestions } from '@/features/ai'
import { getAiProvider, hasAiApiKey } from '@/platform/secureStorage'
import type { Question } from '@/types/quiz'
import { useQuizSet } from '@/hooks/useQuizSet'

export function SetDetailPage({ setId }: { setId: string }) {
  const router = useRouter()
  const { set, setSet, isLoading, errorMessage } = useQuizSet(setId)
  const [importFeedback, setImportFeedback] = useState<{
    kind: 'error' | 'success'
    message: string
  } | null>(null)
  const [generationFeedback, setGenerationFeedback] = useState<{
    kind: 'error' | 'success'
    message: string
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationType, setGenerationType] = useState<'mcq' | 'essay'>('mcq')
  const [generationCount, setGenerationCount] = useState(2)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
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

  const handleGenerateQuestions = async () => {
    if (!set) {
      return
    }

    const activeProvider = getAiProvider()

    if (!hasAiApiKey(activeProvider)) {
      setGenerationFeedback({
        kind: 'error',
        message: `Add a ${activeProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key in Settings before generating questions.`,
      })
      return
    }

    setIsGenerating(true)
    setGenerationFeedback(null)

    try {
      const nextQuestions = await generateQuestions({
        type: generationType,
        count: generationCount,
        setTitle: set.title,
        prompt: generationPrompt.trim() || undefined,
        provider: activeProvider,
      })

      setGeneratedQuestions(nextQuestions)
      setGenerationFeedback({
        kind: 'success',
        message: `Generated ${nextQuestions.length} ${generationType === 'mcq' ? 'MCQ' : 'essay'} question${nextQuestions.length === 1 ? '' : 's'}.`,
      })
    } catch (error) {
      setGeneratedQuestions([])
      setGenerationFeedback({
        kind: 'error',
        message: describeError(error),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddGeneratedQuestion = async (question: Question) => {
    if (!set) {
      return
    }

    try {
      const updatedSet = await addQuestion(set.id, question)

      if (!updatedSet) {
        throw new Error('This set is no longer available.')
      }

      setSet(updatedSet)
      setGeneratedQuestions((current) => current.filter((entry) => entry.id !== question.id))
      setGenerationFeedback({
        kind: 'success',
        message: 'The generated question was added to the set.',
      })
    } catch (error) {
      setGenerationFeedback({
        kind: 'error',
        message: describeError(error),
      })
    }
  }

  if (!set) {
    if (isLoading) {
      return <p role="status" className="text-[16px] leading-6 text-muted">Loading set…</p>
    }

    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-card p-5">
        <h2 className="text-[18px] font-medium leading-7 text-fg">
          {errorMessage ? 'Could not load set' : 'Set not found'}
        </h2>
        <p role={errorMessage ? 'alert' : undefined} className="mt-2 text-[16px] leading-6 text-muted">
          {errorMessage ?? 'The set was removed or never existed.'}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent"
        >
          Back to sets
        </Link>
      </section>
    )
  }

  const questionCount = set.questions.filter((question) => !question.deleted).length

  return (
    <div className="grid gap-5 lg:grid-cols-2">
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
            onClick={() => router.push(`/set/${set.id}/quiz?mode=random`)}
            className="min-h-12 w-full rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Start quiz
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            className="min-h-12 flex-1 rounded-2xl bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card-hover"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            aria-busy={isImporting || undefined}
            className="min-h-12 flex-1 rounded-2xl bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card-hover disabled:cursor-wait disabled:opacity-70"
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
            <p className="text-[13px] leading-[18px] text-muted">AI helper</p>
            <h3 className="text-[16px] font-medium leading-6 text-fg">Generate revision questions</h3>
          </div>
          <Link
            href="/settings"
            aria-label="Open AI settings"
            title="Open AI settings"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-card text-muted transition-colors hover:bg-card-hover"
          >
            <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px]">
          <label className="block text-[13px] font-medium leading-[18px] text-muted">
            Question type
            <select
              value={generationType}
              onChange={(event) => setGenerationType(event.target.value as 'mcq' | 'essay')}
              className="mt-1 min-h-12 w-full rounded-[14px] bg-card px-3 text-[16px] text-fg"
            >
              <option value="mcq">MCQ</option>
              <option value="essay">Essay</option>
            </select>
          </label>

          <label className="block text-[13px] font-medium leading-[18px] text-muted">
            Count
            <input
              type="number"
              min={1}
              max={20}
              value={generationCount}
              onChange={(event) =>
                setGenerationCount(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
              }
              className="mt-1 min-h-12 w-full rounded-[14px] bg-card px-3 text-[16px] text-fg"
            />
          </label>
        </div>

        <label className="mt-3 block text-[13px] font-medium leading-[18px] text-muted">
          Extra prompt
          <textarea
            value={generationPrompt}
            onChange={(event) => setGenerationPrompt(event.target.value)}
            rows={3}
            placeholder="Focus on a topic, difficulty, or recall style."
            className="mt-1 min-h-[88px] w-full resize-y rounded-[14px] bg-card px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleGenerateQuestions()}
          disabled={isGenerating}
          aria-busy={isGenerating || undefined}
          className="mt-4 min-h-12 w-full rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          {isGenerating ? 'Generating…' : `Generate ${generationType === 'mcq' ? 'MCQ' : 'essay'} questions`}
        </button>

        {generationFeedback ? (
          <p
            role={generationFeedback.kind === 'error' ? 'alert' : 'status'}
            className={`mt-3 text-[13px] leading-[18px] ${
              generationFeedback.kind === 'error' ? 'text-bad-fg' : 'text-accent-text'
            }`}
          >
            {generationFeedback.message}
          </p>
        ) : null}

        {generatedQuestions.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {generatedQuestions.map((question) => (
              <div key={question.id} className="rounded-2xl bg-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium ${
                      question.type === 'mcq' ? 'bg-ok-bg text-ok-fg' : 'bg-essay-bg text-essay-fg'
                    }`}
                  >
                    {question.type === 'mcq' ? 'MCQ' : 'Essay'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleAddGeneratedQuestion(question)}
                    className="min-h-11 rounded-[14px] bg-accent px-3 text-[13px] font-medium text-on-accent"
                  >
                    Add to set
                  </button>
                </div>

                <p className="mt-3 break-words text-[16px] leading-6 text-fg">{question.text}</p>

                {question.type === 'mcq' ? (
                  <ul className="mt-3 grid gap-2 text-[15px] leading-5 text-fg">
                    {question.options.map((option, index) => (
                      <li key={`${question.id}-option-${index}`} className="rounded-xl bg-card px-3 py-2">
                        {String.fromCharCode(65 + index)}. {option}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-5 text-muted">
                    {question.referenceAnswer || 'Reference answer will be added when the AI provides one.'}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-4 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-medium leading-6 text-fg">Questions</h3>
            <p className="mt-1 text-[13px] leading-[18px] text-muted">
              Add or edit what you want to practice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/set/${set.id}/q/new`)}
            className="min-h-12 shrink-0 rounded-2xl bg-card px-4 text-[13px] font-medium text-accent-text transition-colors hover:bg-card-hover"
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
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-card px-2.5 py-1 text-[13px] font-medium text-muted">
                      Difficulty: {question.difficulty}
                    </span>
                    {question.tags.map((tag) => (
                      <span
                        key={`${question.id}-${tag}`}
                        className="rounded-full bg-card px-2.5 py-1 text-[13px] font-medium text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/set/${set.id}/q/${question.id}`)}
                      className="min-h-11 flex-1 rounded-[14px] bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card-hover"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteQuestion(question.id, question.text)}
                      className="min-h-11 flex-1 rounded-[14px] bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-bad-bg hover:text-bad-fg"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}
