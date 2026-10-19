import type { McqQuestion } from '@/types/study'

export type McqOptions = McqQuestion['options']

type McqFieldsProps = {
  options: McqOptions
  answerIndex: number
  isInvalid: boolean
  onOptionChange: (index: number, value: string) => void
  onAnswerChange: (index: number) => void
}

/** The four option inputs of a multiple-choice question, with a button to mark the correct one. */
export function McqFields({
  options,
  answerIndex,
  isInvalid,
  onOptionChange,
  onAnswerChange,
}: McqFieldsProps) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-[13px] leading-[18px] text-muted">
        Select the correct answer from the options.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {['A', 'B', 'C', 'D'].map((letter, index) => (
          <div
            key={letter}
            className="flex min-h-12 items-center gap-3 rounded-[14px] border border-line bg-bg px-3 py-2"
          >
            <button
              type="button"
              onClick={() => onAnswerChange(index)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-[13px] font-medium transition-colors duration-150 ${
                answerIndex === index
                  ? 'border-transparent bg-accent text-on-accent'
                  : 'border-line bg-card text-muted hover:bg-card-hover hover:text-fg'
              }`}
              aria-label={`Mark option ${index + 1} as correct answer`}
              aria-pressed={answerIndex === index}
            >
              {letter}
            </button>
            <input
              type="text"
              aria-label={`Option ${index + 1}`}
              aria-invalid={isInvalid || undefined}
              aria-describedby={isInvalid ? 'question-editor-error' : undefined}
              value={options[index]}
              onChange={(event) => onOptionChange(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
              className="w-full bg-transparent text-[16px] text-fg placeholder:text-muted"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
