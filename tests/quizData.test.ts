import { beforeEach, describe, expect, it } from 'vitest'
import {
  addQuestion, addQuestions, allTables, completeTopicsFromQuiz, createGroup, createRoadmap, createTopic, db,
  getQuizSource, setTopicStatus,
} from '../src/lib/data'

const mcq = (text: string) => ({
  type: 'mcq' as const, text, options: ['a', 'b', 'c', 'd'] as [string, string, string, string], answerIndex: 0,
})

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => { for (const t of allTables()) await t.clear() })
})

async function setup() {
  const roadmap = await createRoadmap({ title: 'React' })
  const group = await createGroup(roadmap.id, 'Hooks')
  const inGroup = await createTopic({ roadmapId: roadmap.id, groupId: group.id, title: 'useEffect' })
  const ungrouped = await createTopic({ roadmapId: roadmap.id, title: 'Context' })
  const q1 = await addQuestion(inGroup.id, mcq('q1'))
  const q2 = await addQuestion(inGroup.id, mcq('q2'))
  const q3 = await addQuestion(ungrouped.id, mcq('q3'))
  return { roadmap, group, inGroup, ungrouped, q1, q2, q3 }
}

describe('getQuizSource', () => {
  it('loads one topic', async () => {
    const { inGroup, roadmap } = await setup()
    const source = (await getQuizSource({ kind: 'topic', topicId: inGroup.id }))!
    expect(source.title).toBe('useEffect')
    expect(source.subtitle).toBe(roadmap.title)
    expect(source.backHref).toBe(`/topic/${inGroup.id}`)
    expect(source.questions.map((q) => q.text).sort()).toEqual(['q1', 'q2'])
  })

  it('loads a whole roadmap, or one group of it', async () => {
    const { roadmap, group } = await setup()
    const all = (await getQuizSource({ kind: 'roadmap', roadmapId: roadmap.id }))!
    expect(all.questions).toHaveLength(3)
    expect(all.backHref).toBe(`/roadmap/${roadmap.id}`)
    const grouped = (await getQuizSource({ kind: 'roadmap', roadmapId: roadmap.id, groupId: group.id }))!
    expect(grouped.title).toBe('Hooks')
    expect(grouped.questions.map((q) => q.text).sort()).toEqual(['q1', 'q2'])
  })

  it('returns null for missing or mismatched scopes', async () => {
    const { roadmap } = await setup()
    const other = await createRoadmap({ title: 'Other' })
    const otherGroup = await createGroup(other.id, 'G')
    expect(await getQuizSource({ kind: 'topic', topicId: 'nope' })).toBeNull()
    expect(await getQuizSource({ kind: 'roadmap', roadmapId: 'nope' })).toBeNull()
    expect(await getQuizSource({ kind: 'roadmap', roadmapId: roadmap.id, groupId: otherGroup.id })).toBeNull()
  })

  it('lists questions whose latest answer was wrong', async () => {
    const { inGroup, q1, q2 } = await setup()
    const attempt = (id: string, questionId: string, correct: boolean, at: string) =>
      ({ id, questionId, topicId: inGroup.id, roadmapId: inGroup.roadmapId, correct, at })
    await db.attempts.bulkAdd([
      attempt('a1', q1.id, false, '2026-10-19T10:00:00.000Z'),
      attempt('a2', q2.id, false, '2026-10-19T10:00:01.000Z'),
      attempt('a3', q2.id, true, '2026-10-19T10:00:02.000Z'),
    ])
    const source = (await getQuizSource({ kind: 'topic', topicId: inGroup.id }))!
    expect(source.mistakeIds).toEqual([q1.id])
  })
})

describe('completeTopicsFromQuiz', () => {
  it('marks a topic done when every question was asked and the pass mark is reached', async () => {
    const { inGroup, q1, q2 } = await setup()
    const done = await completeTopicsFromQuiz([{ questionId: q1.id, correct: true }, { questionId: q2.id, correct: true }])
    expect(done.map((t) => t.id)).toEqual([inGroup.id])
    expect((await db.topics.get(inGroup.id))!.status).toBe('done')
  })

  it('does not mark a topic below the pass mark', async () => {
    const { inGroup, q1, q2 } = await setup()
    await completeTopicsFromQuiz([{ questionId: q1.id, correct: true }, { questionId: q2.id, correct: false }])
    expect((await db.topics.get(inGroup.id))!.status).toBe('todo')
  })

  it('does not mark a topic when only some of its questions were asked', async () => {
    const { inGroup, q1 } = await setup()
    expect(await completeTopicsFromQuiz([{ questionId: q1.id, correct: true }])).toEqual([])
    expect((await db.topics.get(inGroup.id))!.status).toBe('todo')
  })

  it('marks each topic of a roadmap quiz separately', async () => {
    const { inGroup, ungrouped, q1, q2, q3 } = await setup()
    const done = await completeTopicsFromQuiz([
      { questionId: q1.id, correct: false }, { questionId: q2.id, correct: false }, { questionId: q3.id, correct: true },
    ])
    expect(done.map((t) => t.id)).toEqual([ungrouped.id])
    expect((await db.topics.get(inGroup.id))!.status).toBe('todo')
  })

  it('leaves known and already-done topics alone, and rounds 4 of 5 up to a pass', async () => {
    const { inGroup, ungrouped, q3 } = await setup()
    await setTopicStatus(ungrouped.id, 'known')
    expect(await completeTopicsFromQuiz([{ questionId: q3.id, correct: true }])).toEqual([])
    expect((await db.topics.get(ungrouped.id))!.status).toBe('known')
    await addQuestions(inGroup.id, [mcq('a'), mcq('b'), mcq('c')])
    const all = await db.questions.where('topicId').equals(inGroup.id).toArray()
    expect(all).toHaveLength(5)
    const answers = all.map((q, i) => ({ questionId: q.id, correct: i !== 0 }))
    expect((await completeTopicsFromQuiz(answers)).map((t) => t.id)).toEqual([inGroup.id])
  })

  it('ignores answers for questions that no longer exist', async () => {
    await setup()
    expect(await completeTopicsFromQuiz([{ questionId: 'gone', correct: true }])).toEqual([])
  })
})
