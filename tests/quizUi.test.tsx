import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QuizResults } from '../src/components/quiz/QuizResults'
import { QuizRunner } from '../src/components/quiz/QuizRunner'
import { QuizSetup } from '../src/components/quiz/QuizSetup'
import { addQuestion, allTables, createRoadmap, createTopic, db, getQuizSource, type QuizSource } from '../src/lib/data'
import type { Question } from '../src/types/study'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mcq = (text: string) => ({
  type: 'mcq' as const, text, options: ['right', 'wrong 1', 'wrong 2', 'wrong 3'] as [string, string, string, string], answerIndex: 0,
})

let container: HTMLDivElement
let root: Root
const showModalDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const closeDialogDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => { for (const t of allTables()) await t.clear() })
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = true },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = false },
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  if (showModalDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModalDescriptor)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (closeDialogDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDialogDescriptor)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  vi.restoreAllMocks()
})

async function seed(count = 2) {
  const roadmap = await createRoadmap({ title: 'R' })
  const topic = await createTopic({ roadmapId: roadmap.id, title: 'T' })
  const questions: Question[] = []
  for (let i = 0; i < count; i += 1) questions.push(await addQuestion(topic.id, mcq(`Question ${i + 1}`)))
  return { topic, questions }
}

const button = (label: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label)) as HTMLButtonElement | undefined

async function click(el: Element | undefined) {
  if (!el) throw new Error('Element not found')
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
}

describe('QuizRunner', () => {
  it('saves an attempt for every answer and reports them when finished', async () => {
    const { questions } = await seed(2)
    const onFinish = vi.fn().mockResolvedValue(undefined)
    await act(async () => { root.render(<QuizRunner queue={questions} exitHref="/x" onFinish={onFinish} />) })

    expect(container.textContent).toContain('Question 1 of 2')
    expect(container.textContent).toContain('0 of 2 answered')
    expect(container.querySelector('[aria-label="Quiz progress: 0 of 2 answered"]')).not.toBeNull()
    expect(button('Next')).toBeUndefined()

    const rightAnswer = button('right')!
    rightAnswer.focus()
    expect(document.activeElement).toBe(rightAnswer)
    expect(rightAnswer.className).toContain('focus-visible:ring-2')
    await click(button('right'))
    expect(await db.attempts.toArray()).toHaveLength(1)
    expect((await db.attempts.toArray())[0]).toMatchObject({ questionId: questions[0].id, correct: true })
    expect(button('right')?.disabled).toBe(true)
    expect(container.textContent).toContain('1 of 2 answered')
    expect(document.activeElement).toBe(button('Next'))

    await click(button('Next'))
    expect(container.textContent).toContain('Question 2 of 2')
    expect(document.activeElement).toBe(container.querySelector('h2[tabindex="-1"]'))
    await click(button('wrong 1'))
    expect(container.textContent).toContain('Correct answer')

    await click(button('Finish'))
    expect(await db.attempts.count()).toBe(2)
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish.mock.calls[0][0]).toEqual([
      { questionId: questions[0].id, correct: true },
      { questionId: questions[1].id, correct: false },
    ])
  })

  it('does not record a second attempt when an answered option is clicked again', async () => {
    const { questions } = await seed(1)
    await act(async () => { root.render(<QuizRunner queue={questions} exitHref="/x" onFinish={async () => {}} />) })

    await click(button('wrong 2'))
    await click(button('right'))
    await click(button('wrong 3'))

    const attempts = await db.attempts.toArray()
    expect(attempts).toHaveLength(1)
    expect(attempts[0].correct).toBe(false)
  })

  it('keeps the score path available and reports an attempt that could not be saved', async () => {
    const { questions } = await seed(1)
    await db.questions.delete(questions[0].id)
    const onFinish = vi.fn().mockResolvedValue(undefined)
    await act(async () => { root.render(<QuizRunner queue={questions} exitHref="/x" onFinish={onFinish} />) })

    await click(button('right'))

    expect(container.textContent).toContain('could not be saved')
    expect(button('Retry saving')).toBeDefined()
    expect(button('Finish without saving')).toBeDefined()
    await click(button('Exit quiz'))
    expect(container.textContent).toContain('Some answers could not be saved and will not appear there.')
    await click(button('Keep practicing'))
    await click(button('Finish without saving'))
    expect(onFinish.mock.calls[0][2]).toHaveLength(1)
  })

  it('asks before leaving and explains what happens to the current session', async () => {
    const { questions } = await seed(1)
    await act(async () => { root.render(<QuizRunner queue={questions} exitHref="/back" onFinish={async () => {}} />) })

    await click(button('Exit quiz'))

    expect(container.textContent).toContain('Your quiz score will be lost');
    expect(container.textContent).toContain('Answers already saved will remain in your review history.');
    expect(container.querySelector('a[href="/back"]')?.textContent).toBe('Exit quiz');
  })
})

describe('QuizSetup', () => {
  it('offers a mistakes-only quiz and starts with the chosen questions', async () => {
    const { topic, questions } = await seed(3)
    await db.attempts.add({ id: 'a1', questionId: questions[1].id, topicId: topic.id, roadmapId: topic.roadmapId, correct: false, at: '2026-10-19T10:00:00.000Z' })
    const source = (await getQuizSource({ kind: 'topic', topicId: topic.id }))!
    const onStart = vi.fn()
    await act(async () => { root.render(<QuizSetup source={source} onStart={onStart} />) })

    expect(container.textContent).toContain('3 questions selected for this quiz.')
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    await click(checkbox)
    expect(container.textContent).toContain('1 question selected for this quiz.')

    await click(button('Start quiz'))
    expect(onStart).toHaveBeenCalledTimes(1)
    expect((onStart.mock.calls[0][0] as Question[]).map((q) => q.id)).toEqual([questions[1].id])
  })

  it('explains an empty selection instead of starting', async () => {
    const { topic } = await seed(1)
    const source = { ...(await getQuizSource({ kind: 'topic', topicId: topic.id }))! }
    await act(async () => { root.render(<QuizSetup source={source} onStart={() => {}} />) })

    await click(button('Essay'))
    expect(container.textContent).toContain('No questions match')
    expect(button('Start quiz')!.disabled).toBe(true)
  })

  it('hides the mistakes option when there are no mistakes', async () => {
    const { topic } = await seed(1)
    const source: QuizSource = (await getQuizSource({ kind: 'topic', topicId: topic.id }))!
    const html = renderToStaticMarkup(<QuizSetup source={source} onStart={() => {}} />)
    expect(html).not.toContain('type="checkbox"')
    expect(html).toContain('will appear here')
  })

  it('keeps a selected count visible and clamps the visible limit to matching questions', async () => {
    const { topic } = await seed(5)
    const source = (await getQuizSource({ kind: 'topic', topicId: topic.id }))!
    await act(async () => { root.render(<QuizSetup source={source} onStart={() => {}} />) })

    const limit = container.querySelector('select') as HTMLSelectElement
    expect([...limit.options].map((option) => option.value)).toContain('5')
    expect(limit.value).toBe('all')
    expect(button('Start quiz · 5')).toBeDefined()
  })
})

describe('QuizResults', () => {
  it('shows the score, missed questions and topics marked done', async () => {
    const { topic, questions } = await seed(2)
    const html = renderToStaticMarkup(
      <QuizResults
        queue={questions}
        answers={[{ questionId: questions[0].id, correct: true }, { questionId: questions[1].id, correct: false }]}
        elapsedSeconds={65}
        markedDone={[topic]}
        backHref="/topic/x" backLabel="Back to topic" onRestart={() => {}} onRetryMistakes={() => {}}
      />,
    )
    expect(html).toContain('1 / 2')
    expect(html).toContain('50% correct')
    expect(html).toContain('01:05')
    expect(html).toContain('Review your missed 1 question')
    expect(html).toContain('Question 2')
    expect(html).toContain('Marked as done: T')
    expect(html).toContain('Retry 1 mistake')
  })

  it('surfaces failed history/completion updates without hiding the score', async () => {
    const { topic, questions } = await seed(1)
    const html = renderToStaticMarkup(
      <QuizResults
        queue={questions}
        answers={[{ questionId: questions[0].id, correct: true }]}
        elapsedSeconds={3}
        markedDone={[]}
        historyErrors={['IndexedDB unavailable']}
        completionError="Topic could not be updated."
        backHref="/"
        backLabel="Back"
        onRetryMistakes={() => {}}
      />,
    )

    expect(html).toContain('1 / 1')
    expect(html).toContain('IndexedDB unavailable')
    expect(html).toContain('Topic could not be updated.')
    expect(html).toContain('Back')
    expect(topic.title).toBe('T')
  })

  it('celebrates a perfect run and hides the retry button', async () => {
    const { questions } = await seed(1)
    const html = renderToStaticMarkup(
      <QuizResults
        queue={questions} answers={[{ questionId: questions[0].id, correct: true }]} elapsedSeconds={3} markedDone={[]}
        backHref="/x" backLabel="Back" onRestart={() => {}} onRetryMistakes={() => {}}
      />,
    )
    expect(html).toContain('No mistakes')
    expect(html).not.toContain('Retry')
    expect(html).toContain('at least 80%')
  })

  it('scores only the questions in the quiz queue', async () => {
    const { questions } = await seed(2)
    const html = renderToStaticMarkup(
      <QuizResults
        queue={questions}
        answers={[
          { questionId: questions[0].id, correct: true },
          { questionId: questions[1].id, correct: false },
          { questionId: 'not-in-queue', correct: true },
        ]}
        elapsedSeconds={0}
        backHref="/"
        backLabel="Back"
        onRetryMistakes={() => {}}
      />,
    )
    expect(html).toContain('1 / 2')
    expect(html).toContain('50% correct')
  })

  it('makes Back the primary action after a perfect quiz', async () => {
    const { questions } = await seed(1)
    const html = renderToStaticMarkup(
      <QuizResults
        queue={questions}
        answers={[{ questionId: questions[0].id, correct: true }]}
        elapsedSeconds={0}
        backHref="/"
        backLabel="Back to roadmaps"
        onRestart={() => {}}
        onRetryMistakes={() => {}}
      />,
    )

    expect(html).toMatch(/<a[^>]*class="[^"]*bg-accent[^"]*"[^>]*>Back to roadmaps<\/a>/)
  })
})
