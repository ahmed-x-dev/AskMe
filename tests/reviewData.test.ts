import { beforeEach, describe, expect, it } from 'vitest'

import {
  addQuestion, allTables, countDue, createRoadmap, createTopic, db, deleteQuestion, getDueSummary,
  getProgressSummary, getRoadmapOverviews, recordAttempt, setTopicStatus,
} from '../src/lib/data'
import { startOfDay } from '../src/lib/srs'

const mcq = (text: string) => ({
  type: 'mcq' as const, text, options: ['a', 'b', 'c', 'd'] as [string, string, string, string], answerIndex: 0,
})

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => { for (const t of allTables()) await t.clear() })
})

async function seed() {
  const roadmap = await createRoadmap({ title: 'React' })
  const topic = await createTopic({ roadmapId: roadmap.id, title: 'Hooks' })
  const q1 = await addQuestion(topic.id, mcq('q1'))
  const q2 = await addQuestion(topic.id, mcq('q2'))
  return { roadmap, topic, q1, q2 }
}

describe('recordAttempt and the review schedule', () => {
  it('creates a review the first time a question is answered', async () => {
    const { q1 } = await seed()
    expect(await db.reviews.count()).toBe(0)
    await recordAttempt(q1.id, true)
    const review = (await db.reviews.get(q1.id))!
    expect(review).toMatchObject({ questionId: q1.id, interval: 1, lapses: 0 })
    expect(review.due > new Date().toISOString()).toBe(true)
  })

  it('a right answer the same day does not push the date further', async () => {
    const { q1 } = await seed()
    await recordAttempt(q1.id, true)
    const first = (await db.reviews.get(q1.id))!
    await recordAttempt(q1.id, true)
    await recordAttempt(q1.id, true)
    expect(await db.reviews.get(q1.id)).toEqual(first)
    expect(await db.attempts.count()).toBe(3)
  })

  it('a wrong answer adds a lapse', async () => {
    const { q1 } = await seed()
    await recordAttempt(q1.id, false)
    expect(await db.reviews.get(q1.id)).toMatchObject({ interval: 1, lapses: 1 })
  })

  it('deleting a question removes its review', async () => {
    const { q1 } = await seed()
    await recordAttempt(q1.id, true)
    await deleteQuestion(q1.id)
    expect(await db.reviews.count()).toBe(0)
  })
})

describe('due cards', () => {
  it('lists only cards that are due, oldest first, with their roadmap', async () => {
    const { roadmap, topic, q1, q2 } = await seed()
    const other = await createRoadmap({ title: 'English' })
    const otherTopic = await createTopic({ roadmapId: other.id, title: 'Tenses' })
    const q3 = await addQuestion(otherTopic.id, mcq('q3'))
    const today = startOfDay(new Date())
    const day = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset).toISOString()
    const review = (questionId: string, topicId: string, due: string) => ({ questionId, topicId, ease: 2.5, interval: 1, due, lapses: 0 })

    await db.reviews.bulkAdd([review(q1.id, topic.id, day(0)), review(q2.id, topic.id, day(-2)), review(q3.id, otherTopic.id, day(3))])

    expect(await countDue()).toBe(2)
    const summary = await getDueSummary()
    expect(summary.total).toBe(2)
    expect(summary.cards.map((card) => card.question.text)).toEqual(['q2', 'q1'])
    expect(summary.byRoadmap.map((entry) => [entry.roadmap.title, entry.count])).toEqual([['React', 2]])

    const overviews = await getRoadmapOverviews()
    expect(overviews.find((o) => o.roadmap.id === roadmap.id)!.dueCount).toBe(2)
    expect(overviews.find((o) => o.roadmap.id === other.id)!.dueCount).toBe(0)
  })

  it('skips a review whose question is gone', async () => {
    const { topic } = await seed()
    await db.reviews.add({ questionId: 'ghost', topicId: topic.id, ease: 2.5, interval: 1, due: '2020-01-01T00:00:00.000Z', lapses: 0 })
    expect((await getDueSummary()).total).toBe(0)
  })
})

describe('overview status counts and progress summary', () => {
  it('counts topics by status', async () => {
    const { roadmap, topic } = await seed()
    const second = await createTopic({ roadmapId: roadmap.id, title: 'Context' })
    await createTopic({ roadmapId: roadmap.id, title: 'Refs' })
    await setTopicStatus(topic.id, 'done')
    await setTopicStatus(second.id, 'active')
    const [overview] = await getRoadmapOverviews()
    expect(overview.statusCounts).toEqual({ todo: 1, active: 1, done: 1, known: 0 })
  })

  it('reports streak, answers today, due count and weak topics', async () => {
    const { topic, q1, q2 } = await seed()
    for (let i = 0; i < 5; i += 1) await recordAttempt(i < 4 ? q1.id : q2.id, false)
    await recordAttempt(q2.id, true)
    const summary = await getProgressSummary()
    expect(summary.streak).toMatchObject({ current: 1, studiedToday: true })
    expect(summary.answeredToday).toBe(6)
    expect(summary.weakTopics).toHaveLength(1)
    expect(summary.weakTopics[0]).toMatchObject({ attempts: 6 })
    expect(summary.weakTopics[0].topic.id).toBe(topic.id)
    expect(summary.dueCount).toBe(0) // everything is scheduled for tomorrow
  })

  it('ignores answers older than the weak-topic window', async () => {
    const { topic, q1 } = await seed()
    const old = new Date(Date.now() - 60 * 86_400_000).toISOString()
    await db.attempts.bulkAdd(Array.from({ length: 6 }, (_, i) => ({
      id: `old${i}`, questionId: q1.id, topicId: topic.id, roadmapId: topic.roadmapId, correct: false, at: old,
    })))
    expect((await getProgressSummary()).weakTopics).toEqual([])
  })
})
