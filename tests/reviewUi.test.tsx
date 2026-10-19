import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ReviewPage } from '../src/components/review/ReviewPage'
import { addQuestion, allTables, createRoadmap, createTopic, db } from '../src/lib/data'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mcq = (text: string) => ({
  type: 'mcq' as const, text, options: ['right', 'wrong 1', 'wrong 2', 'wrong 3'] as [string, string, string, string], answerIndex: 0,
})

let container: HTMLDivElement
let root: Root

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => { for (const t of allTables()) await t.clear() })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const wait = (ms = 60) => act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)) })
const button = (label: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label)) as HTMLButtonElement | undefined
async function click(el: Element | undefined) {
  if (!el) throw new Error('Element not found')
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
  await wait(40)
}

describe('ReviewPage', () => {
  it('shows an empty state when nothing is due', async () => {
    await act(async () => { root.render(<ReviewPage />) })
    await wait()
    expect(container.textContent).toContain('Nothing to review today')
    expect(button('Start review')).toBeUndefined()
  })

  it('runs a session over the due cards and reschedules them', async () => {
    const roadmap = await createRoadmap({ title: 'React' })
    const topic = await createTopic({ roadmapId: roadmap.id, title: 'Hooks' })
    const q1 = await addQuestion(topic.id, mcq('Question one'))
    const q2 = await addQuestion(topic.id, mcq('Question two'))
    const past = '2020-01-01T00:00:00.000Z'
    await db.reviews.bulkAdd([q1, q2].map((q) => ({ questionId: q.id, topicId: topic.id, ease: 2.5, interval: 1, due: past, lapses: 0 })))

    await act(async () => { root.render(<ReviewPage />) })
    await wait()
    expect(container.textContent).toContain('2 questions due today')
    expect(container.textContent).toContain('Your session includes every question due today.')
    expect(container.textContent).toContain('Due by roadmap')
    expect(container.textContent).toContain('2 questions')
    expect(container.textContent).toContain('React')

    await click(button('Start review (2)'))
    expect(container.textContent).toContain('Question 1 of 2')
    await click(button('right'))
    await click(button('Next'))
    await click(button('wrong 1'))
    await click(button('Finish'))

    expect(container.textContent).toContain('Quiz complete')
    expect(container.textContent).not.toContain('marked done') // reviews never mark topics
    expect(await db.attempts.count()).toBe(2)

    const reviews = await db.reviews.toArray()
    const missed = reviews.filter((review) => review.lapses === 1)
    expect(missed).toHaveLength(1) // the wrong answer lapsed
    expect(reviews.every((review) => review.due > new Date().toISOString())).toBe(true) // none is due any more
    expect(button('Review more')).toBeUndefined()
    expect(button('Retry 1 mistake')).toBeDefined()
  })

  it('explains when the session is capped below the due backlog', async () => {
    const roadmap = await createRoadmap({ title: 'History' })
    const topic = await createTopic({ roadmapId: roadmap.id, title: 'Ancient Rome' })
    const questions = []
    for (let index = 0; index < 21; index += 1) {
      questions.push(await addQuestion(topic.id, mcq(`Question ${index + 1}`)))
    }
    await db.reviews.bulkAdd(
      questions.map((question, index) => ({
        questionId: question.id,
        topicId: topic.id,
        ease: 2.5,
        interval: 1,
        due: `2020-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
        lapses: 0,
      })),
    )

    await act(async () => { root.render(<ReviewPage />) })
    await wait()

    expect(container.textContent).toContain('21 questions due today')
    expect(container.textContent).toContain('This session covers 20 questions')
    await click(button('Start review (20)'))
    expect(container.textContent).toContain('Question 1 of 20')
  })
})
