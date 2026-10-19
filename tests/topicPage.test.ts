import { beforeEach, describe, expect, it } from 'vitest'
import {
  addQuestion, addResource, allTables, createGroup, createRoadmap, createTopic, db, deleteResource,
  getQuestionEditorData, getTopicPage, listResources, reorderResources, setResourceDone,
  updateResource, updateTopic,
} from '../src/lib/data'
import { withHttps } from '../src/lib/format'

const mcq = { type: 'mcq' as const, text: 'Q?', options: ['a', 'b', 'c', 'd'] as [string, string, string, string], answerIndex: 0 }

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => { for (const t of allTables()) await t.clear() })
})

describe('getTopicPage', () => {
  it('returns the topic with roadmap, group, ordered resources and questions', async () => {
    const r = await createRoadmap({ title: 'React' })
    const g = await createGroup(r.id, 'Basics')
    const t = await createTopic({ roadmapId: r.id, groupId: g.id, title: 'JSX' })
    await addResource({ topicId: t.id, url: 'https://a.dev', title: 'A' })
    await addResource({ topicId: t.id, url: 'https://b.dev', title: 'B' })
    const q1 = await addQuestion(t.id, mcq)
    await new Promise((x) => setTimeout(x, 5))
    const q2 = await addQuestion(t.id, { type: 'essay', text: 'Essay' })
    const page = await getTopicPage(t.id)
    expect(page!.roadmap.id).toBe(r.id)
    expect(page!.group!.title).toBe('Basics')
    expect(page!.resources.map((x) => x.title)).toEqual(['A', 'B'])
    expect(page!.questions.map((q) => q.id)).toEqual([q1.id, q2.id])
  })
  it('has no group for ungrouped topics and null for a missing topic', async () => {
    const r = await createRoadmap({ title: 'R' })
    const t = await createTopic({ roadmapId: r.id, title: 'T' })
    expect((await getTopicPage(t.id))!.group).toBeUndefined()
    expect(await getTopicPage('missing')).toBeNull()
  })
})

describe('getQuestionEditorData', () => {
  it('handles new, existing, wrong-topic and missing cases', async () => {
    const r = await createRoadmap({ title: 'R' })
    const t1 = await createTopic({ roadmapId: r.id, title: 'T1' })
    const t2 = await createTopic({ roadmapId: r.id, title: 'T2' })
    const q = await addQuestion(t1.id, mcq)
    expect((await getQuestionEditorData(t1.id))!.question).toBeNull()
    expect((await getQuestionEditorData(t1.id, q.id))!.question!.id).toBe(q.id)
    expect((await getQuestionEditorData(t2.id, q.id))!.question).toBeNull()
    expect((await getQuestionEditorData(t1.id, 'nope'))!.question).toBeNull()
    expect(await getQuestionEditorData('missing')).toBeNull()
  })
})

describe('resources as the topic page uses them', () => {
  it('adds, normalizes links, ticks, edits, reorders and deletes', async () => {
    const r = await createRoadmap({ title: 'R' })
    const t = await createTopic({ roadmapId: r.id, title: 'T' })
    const a = await addResource({ topicId: t.id, url: withHttps('react.dev/learn'), kind: 'docs' })
    expect(a.url).toBe('https://react.dev/learn')
    expect(a.title).toBe('react.dev')
    const b = await addResource({ topicId: t.id, url: 'https://youtu.be/x', title: 'Video', kind: 'video' })
    await expect(addResource({ topicId: t.id, url: 'javascript:alert(1)' })).rejects.toThrow()
    await expect(addResource({ topicId: t.id, url: withHttps('javascript:alert(1)') })).rejects.toThrow()
    await setResourceDone(a.id, true)
    await updateResource(b.id, { title: 'Renamed', kind: 'other' })
    await reorderResources([b.id, a.id])
    const list = await listResources(t.id)
    expect(list.map((x) => [x.title, x.done, x.kind])).toEqual([['Renamed', false, 'other'], ['react.dev', true, 'docs']])
    await deleteResource(a.id)
    expect(await listResources(t.id)).toHaveLength(1)
  })
  it('withHttps only adds a scheme when missing', () => {
    expect(withHttps('  react.dev ')).toBe('https://react.dev')
    expect(withHttps('http://x.dev')).toBe('http://x.dev')
    expect(withHttps('')).toBe('')
  })
})

describe('notes', () => {
  it('keeps markdown as written and clears blank notes', async () => {
    const r = await createRoadmap({ title: 'R' })
    const t = await createTopic({ roadmapId: r.id, title: 'T' })
    await updateTopic(t.id, { notes: '# Title\n\n- a\n- b' })
    expect((await getTopicPage(t.id))!.topic.notes).toBe('# Title\n\n- a\n- b')
    await updateTopic(t.id, { notes: '   ' })
    expect((await getTopicPage(t.id))!.topic.notes).toBeUndefined()
  })
})
