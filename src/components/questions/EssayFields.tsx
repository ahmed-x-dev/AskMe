import { fieldOnCardClassName } from '@/components/ui/styles'

type EssayFieldsProps = {
  referenceAnswer: string
  onChange: (value: string) => void
}

/** The optional model answer of an essay question. */
export function EssayFields({ referenceAnswer, onChange }: EssayFieldsProps) {
  return (
    <div>
      <label htmlFor="reference-answer" className="block text-[13px] font-medium leading-4.5 text-muted">
        Reference answer (optional)
      </label>
      <textarea
        id="reference-answer"
        value={referenceAnswer}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Add a model answer…"
        className={`mt-2 min-h-24 resize-y py-3 ${fieldOnCardClassName}`}
      />
    </div>
  )
}
