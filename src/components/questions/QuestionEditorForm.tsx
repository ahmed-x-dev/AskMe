'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { addQuestion, deleteQuestion, updateQuestion, type QuestionInput } from '@/lib/data'
import type { Question, QuestionDifficulty, QuestionType, Topic } from '@/types/study'
import { EssayFields } from './EssayFields'
import { McqFields, type McqOptions } from './McqFields'

const EMPTY_OPTIONS: McqOptions = ['', '', '', '']
const DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard']

type QuestionEditorFormProps = {
  topic: Topic
  /** Set when editing; leave out to create a new question. */
  existingQuestion?: Question
}

/** Which field the error message is about, so it can be highlighted. */
function invalidFieldOf(message: string): 'text' | 'options' | null {
  if (message.startsWith('Question text')) return 'text'
  if (/option/i.test(message)) return 'options'
  return null
}

export function QuestionEditorForm({ topic, existingQuestion }: QuestionEditorFormProps) {
  const router = useRouter()
  const topicUrl = `/topic/${topic.id}`

  const [activeType, setActiveType] = useState<QuestionType>(existingQuestion?.type ?? 'mcq')
  const [text, setText] = useState(existingQuestion?.text ?? '')
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(
    existingQuestion?.difficulty ?? 'medium',
  )
  const [tagsText, setTagsText] = useState(existingQuestion?.tags.join('\n') ?? '')
  const [options, setOptions] = useState<McqOptions>(
    existingQuestion?.type === 'mcq' ? existingQuestion.options : EMPTY_OPTIONS,
  )
  const [answerIndex, setAnswerIndex] = useState(
    existingQuestion?.type === 'mcq' ? existingQuestion.answerIndex : 0,
  )
  const [referenceAnswer, setReferenceAnswer] = useState(
    existingQuestion?.type === 'essay' ? (existingQuestion.referenceAnswer ?? '') : '',
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const invalidField = invalidFieldOf(errorMessage)

  const handleOptionChange = (index: number, value: string) => {
    setOptions((current) => {
      const next: McqOptions = [...current]
      next[index] = value
      return next
    })
  }

  /** Builds what the data layer expects. `addQuestion` / `updateQuestion` trim and validate it. */
  const buildInput = (): QuestionInput => {
    const base = { text, difficulty, tags: tagsText.split(/\r?\n/) }

    return activeType === 'mcq'
      ? { ...base, type: 'mcq', options, answerIndex }
      : { ...base, type: 'essay', referenceAnswer }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const input = buildInput()

      if (existingQuestion) {
        await updateQuestion(existingQuestion.id, input)
      } else {
        await addQuestion(topic.id, input)
      }

      router.push(topicUrl)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save the question.')
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingQuestion) return

    if (!window.confirm(`Delete “${existingQuestion.text}”? Its quiz history is deleted too.`)) return

    setIsSaving(true)

    try {
      await deleteQuestion(existingQuestion.id)
      router.push(topicUrl)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not delete the question.')
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] leading-[18px] text-muted">
            {existingQuestion ? 'Edit question' : 'New question'}
          </p>
          <h2 className="mt-1 break-words text-[18px] font-medium leading-7 text-fg">{topic.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => router.push(topicUrl)}
          disabled={isSaving}
          className="min-h-12 shrink-0 rounded-2xl bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card-hover"
        >
          Cancel
        </button>
      </div>

      <div className="mt-5 flex rounded-[14px] bg-bg p-1">
        {(['mcq', 'essay'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            aria-pressed={activeType === type}
            className={`min-h-12 flex-1 rounded-[14px] px-3 text-[16px] font-medium transition-colors ${
              activeType === type ? 'bg-accent text-on-accent' : 'text-muted'
            }`}
          >
            {type === 'mcq' ? 'MCQ' : 'Essay'}
          </button>
        ))}
      </div>

      <label htmlFor="question-text" className="mt-5 block text-[13px] font-medium leading-[18px] text-muted">
        Question
      </label>
      <textarea
        id="question-text"
        value={text}
        aria-invalid={invalidField === 'text' || undefined}
        aria-describedby={invalidField === 'text' ? 'question-editor-error' : undefined}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type the question here…"
        className="mt-2 min-h-[120px] w-full resize-y rounded-[14px] bg-card px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
      />

      <fieldset className="mt-5">
        <legend className="text-[13px] font-medium leading-[18px] text-muted">Difficulty</legend>
        <div className="mt-2 flex rounded-[14px] bg-bg p-1">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              aria-pressed={difficulty === level}
              className={`min-h-12 flex-1 rounded-[14px] px-2 text-[13px] font-medium transition-colors ${
                difficulty === level ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              {level[0].toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>

      <label htmlFor="question-tags" className="mt-5 block text-[13px] font-medium leading-[18px] text-muted">
        Tags (one per line)
      </label>
      <textarea
        id="question-tags"
        value={tagsText}
        onChange={(event) => setTagsText(event.target.value)}
        placeholder={'deprecated\nhtml'}
        rows={2}
        className="mt-2 min-h-[88px] w-full resize-y rounded-[14px] bg-card px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
      />
      <p className="mt-1 text-[13px] leading-[18px] text-muted">
        Use “deprecated” to label outdated information. Tags do not change quiz behavior.
      </p>

      {activeType === 'mcq' ? (
        <McqFields
          options={options}
          answerIndex={answerIndex}
          isInvalid={invalidField === 'options'}
          onOptionChange={handleOptionChange}
          onAnswerChange={setAnswerIndex}
        />
      ) : (
        <EssayFields referenceAnswer={referenceAnswer} onChange={setReferenceAnswer} />
      )}

      {errorMessage ? (
        <p id="question-editor-error" role="alert" className="mt-4 flex items-start gap-2 text-[13px] leading-[18px] text-bad-fg">
          <span aria-hidden="true" className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-bad-bg font-medium">
            !
          </span>
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          aria-busy={isSaving}
          className="min-h-12 flex-1 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => router.push(topicUrl)}
          disabled={isSaving}
          className="min-h-12 flex-1 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
        >
          Back
        </button>
      </div>

      {existingQuestion ? (
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={isSaving}
          className="mt-4 min-h-12 w-full rounded-2xl bg-bg px-4 text-[16px] font-medium text-bad-fg transition-colors hover:bg-bad-bg"
        >
          Delete question
        </button>
      ) : null}
    </section>
  )
}
