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
import type { Lesson, Question, QuestionDifficulty, QuestionType, Topic } from '@/types/study'
import { EssayFields } from './EssayFields'
import { McqFields, type McqOptions } from './McqFields'

const EMPTY_OPTIONS: McqOptions = ['', '', '', '']
const DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard']

/** Segmented-control styling for the MCQ/Essay and difficulty toggles on the editor card. */
const segmentContainer = 'flex gap-1 rounded-[14px] bg-bg p-0.75'
const segmentBase =
  'min-h-12 flex-1 rounded-[11px] px-3 text-[13px] font-medium leading-4.5 transition-colors duration-150'
const segmentActive = 'bg-accent text-on-accent'
const segmentInactive = 'text-muted hover:bg-card-hover hover:text-fg'

type QuestionEditorFormProps = {
  topic: Topic
  lesson?: Lesson
  /** Set when editing; leave out to create a new question. */
  existingQuestion?: Question
}

/** Which field the error message is about, so it can be highlighted. */
function invalidFieldOf(message: string): 'text' | 'options' | null {
  if (message.startsWith('Question text')) return 'text'
  if (/option/i.test(message)) return 'options'
  return null
}

export function QuestionEditorForm({
  topic,
  lesson,
  existingQuestion,
}: QuestionEditorFormProps) {
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
  const [booleanAnswer, setBooleanAnswer] = useState(
    existingQuestion?.type === 'true-false' ? existingQuestion.answer : true,
  )
  const [shortAnswer, setShortAnswer] = useState(
    existingQuestion?.type === 'fill-blank' || existingQuestion?.type === 'flashcard'
      ? existingQuestion.answer
      : '',
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

    if (activeType === 'mcq') {
      return { ...base, type: 'mcq', options, answerIndex }
    }

    if (activeType === 'essay') {
      return { ...base, type: 'essay', referenceAnswer }
    }

    if (activeType === 'true-false') {
      return { ...base, type: 'true-false', answer: booleanAnswer }
    }

    return { ...base, type: activeType, answer: shortAnswer }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const input = buildInput()

      if (existingQuestion) {
        await updateQuestion(existingQuestion.id, input)
      } else {
        await addQuestion(topic.id, input, { lessonId: lesson?.id })
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
          <h1 className="text-[22px] font-medium leading-7 text-fg">
            {existingQuestion ? 'Edit question' : 'New question'}
          </h1>
          <p className="mt-1 break-words text-base leading-6 text-muted">
            {topic.title}
            {lesson ? ` · ${lesson.title}` : ""}
          </p>
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

      <div className={`${segmentContainer} flex-wrap`}>
        {(['mcq', 'true-false', 'fill-blank', 'flashcard', 'essay'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            aria-pressed={activeType === type}
            className={`${segmentBase} ${activeType === type ? segmentActive : segmentInactive}`}
          >
            {type === 'mcq' ? 'MCQ' : type === 'true-false' ? 'True/False' : type === 'fill-blank' ? 'Fill blank' : type === 'flashcard' ? 'Flashcard' : 'Essay'}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="question-text" className="block text-[13px] font-medium leading-4.5 text-muted">
          Question
        </label>
        <textarea
          id="question-text"
          value={text}
          aria-invalid={invalidField === 'text' || undefined}
          aria-describedby={invalidField === 'text' ? 'question-editor-error' : undefined}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type the question here…"
          className={`mt-2 min-h-30 resize-y py-3 ${fieldOnCardClassName}`}
        />
      </div>

      <fieldset>
        <legend className="text-[13px] font-medium leading-4.5 text-muted">Difficulty</legend>
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
        <label htmlFor="question-tags" className="block text-[13px] font-medium leading-4.5 text-muted">
          Tags (one per line)
        </label>
        <textarea
          id="question-tags"
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder={'deprecated\nhtml'}
          rows={2}
          className={`mt-2 min-h-22 resize-y py-3 ${fieldOnCardClassName}`}
        />
        <p className="mt-1 text-[13px] leading-4.5 text-muted">
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
      ) : activeType === 'true-false' ? (
        <fieldset>
          <legend className="text-[13px] font-medium leading-4.5 text-muted">Correct answer</legend>
          <div className={`mt-2 ${segmentContainer}`}>
            {([true, false] as const).map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setBooleanAnswer(value)}
                aria-pressed={booleanAnswer === value}
                className={`${segmentBase} ${booleanAnswer === value ? segmentActive : segmentInactive}`}
              >
                {value ? 'True' : 'False'}
              </button>
            ))}
          </div>
        </fieldset>
      ) : activeType === 'fill-blank' || activeType === 'flashcard' ? (
        <div>
          <label htmlFor="question-answer" className="block text-[13px] font-medium leading-4.5 text-muted">
            {activeType === 'fill-blank' ? 'Expected answer' : 'Flashcard answer'}
          </label>
          <input
            id="question-answer"
            value={shortAnswer}
            onChange={(event) => setShortAnswer(event.target.value)}
            placeholder={activeType === 'fill-blank' ? 'The capital of France.' : 'Paris'}
            className={`mt-2 ${fieldOnCardClassName}`}
          />
        </div>
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
