type EssayFieldsProps = {
  referenceAnswer: string
  onChange: (value: string) => void
}

/** The optional model answer of an essay question. */
export function EssayFields({ referenceAnswer, onChange }: EssayFieldsProps) {
  return (
    <div className="mt-4">
      <label htmlFor="reference-answer" className="block text-[13px] font-medium leading-[18px] text-muted">
        Reference answer (optional)
      </label>
      <textarea
        id="reference-answer"
        value={referenceAnswer}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Add a model answer…"
        className="mt-2 min-h-[96px] w-full resize-y rounded-[14px] bg-card px-3 py-3 text-[16px] leading-6 text-fg placeholder:text-muted"
      />
    </div>
  )
}
