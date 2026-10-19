'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  buttonDestructive,
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  fieldOnCardClassName,
} from '@/components/ui/styles'
import { addQuestion, deleteQuestion, updateQuestion, type QuestionInput } from '@/lib/data'
import type { Question, QuestionDifficulty, QuestionType, Topic } from '@/types/study'
import { EssayFields } from './EssayFields'
import { McqFields, type McqOptions } from './McqFields'

const EMPTY_OPTIONS: McqOptions = ['', '', '', '']
const DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard']

/** Segmented-control styling for the MCQ/Essay and difficulty toggles on the editor card. */
const segmentContainer = 'flex gap-1 rounded-[14px] bg-bg p-[3px]'
const segmentBase =
  'min-h-12 flex-1 rounded-[11px] px-3 text-[13px] font-medium leading-[18px] transition-colors duration-150'
const segmentActive = 'bg-accent text-on-accent'
const segmentInactive = 'text-muted hover:bg-card-hover hover:text-fg'

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
    <section className="mx-auto flex w-full flex-col gap-5 rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] leading-[18px] text-muted">
            {existingQuestion ? 'Edit question' : 'New question'}
          </p>
          <h2 className="mt-1 break-words text-[18px] font-medium leading-[26px] text-fg">{topic.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => router.push(topicUrl)}
          disabled={isSaving}
          className={`shrink-0 ${buttonGhost}`}
        >
          Cancel
        </button>
      </div>

      <div className={segmentContainer}>
        {(['mcq', 'essay'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            aria-pressed={activeType === type}
            className={`${segmentBase} ${activeType === type ? segmentActive : segmentInactive}`}
          >
            {type === 'mcq' ? 'MCQ' : 'Essay'}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="question-text" className="block text-[13px] font-medium leading-[18px] text-muted">
          Question
        </label>
        <textarea
          id="question-text"
          value={text}
          aria-invalid={invalidField === 'text' || undefined}
          aria-describedby={invalidField === 'text' ? 'question-editor-error' : undefined}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type the question here…"
          className={`mt-2 min-h-[120px] resize-y py-3 ${fieldOnCardClassName}`}
        />
      </div>

      <fieldset>
        <legend className="text-[13px] font-medium leading-[18px] text-muted">Difficulty</legend>
        <div className={`mt-2 ${segmentContainer}`}>
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              aria-pressed={difficulty === level}
              className={`${segmentBase} px-2 ${difficulty === level ? segmentActive : segmentInactive}`}
            >
              {level[0].toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="question-tags" className="block text-[13px] font-medium leading-[18px] text-muted">
          Tags (one per line)
        </label>
        <textarea
          id="question-tags"
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder={'deprecated\nhtml'}
          rows={2}
          className={`mt-2 min-h-[88px] resize-y py-3 ${fieldOnCardClassName}`}
        />
        <p className="mt-1 text-[13px] leading-[18px] text-muted">
          Use “deprecated” to label outdated information. Tags do not change quiz behavior.
        </p>
      </div>

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
        <ErrorMessage variant="inline" id="question-editor-error">
          {errorMessage}
        </ErrorMessage>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          aria-busy={isSaving}
          className={`flex-1 ${buttonPrimary}`}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => router.push(topicUrl)}
          disabled={isSaving}
          className={`flex-1 ${buttonSecondary}`}
        >
          Back
        </button>
      </div>

      {existingQuestion ? (
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={isSaving}
          className={buttonDestructive}
        >
          Delete question
        </button>
      ) : null}
    </section>
  )
}
