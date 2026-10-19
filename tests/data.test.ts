import { beforeEach, describe, expect, it } from 'vitest'
import {
  addQuestion, addResource, allTables, applyTopicMove, buildSections, createGroup, createRoadmap,
  createTopic, db, deleteGroup, deleteRoadmap, deleteTopic, getProgress, getRoadmapOverviews,
  getRoadmapPage, listGroups, listTopics, moveTopic, moveTopicToRoadmap, recordAttempt,
  reorderGroups, reorderRoadmaps, setTopicStatus, updateRoadmap, updateTopic, listRoadmaps,
  deleteQuestion, updateQuestion, listMistakeQuestionIds,
} from '../src/lib/data'
import { roadmapFileSchema, topicSchema, roadmapSchema, groupSchema, questionSchema, resourceSchema } from '../src/lib/schemas'

const mcq = { type: 'mcq' as const, text: 'Q?', options: ['a', 'b', 'c', 'd'] as [string, string, string, string], answerIndex: 1 }
const titles = async (rid: string, gid?: string) =>
  (await listTopics(rid)).filter((t) => (t.groupId ?? undefined) === gid).map((t) => `${t.title}:${t.order}`)

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => { for (const t of allTables()) await t.clear() })
})

describe('roadmaps', () => {
  it('creates, orders, updates, clears icon', async () => {
    const a = await createRoadmap({ title: '  React  ', icon: '⚛' })
    const b = await createRoadmap({ title: 'English' })
    expect(a.title).toBe('React'); expect(a.order).toBe(0); expect(b.order).toBe(1)
    await updateRoadmap(a.id, { icon: '' })
    expect((await db.roadmaps.get(a.id))!.icon).toBeUndefined()
    await reorderRoadmaps([b.id, a.id])
    expect((await listRoadmaps()).map((r) => r.title)).toEqual(['English', 'React'])
    await expect(createRoadmap({ title: '   ' })).rejects.toThrow()
    await expect(createRoadmap({ title: 'x'.repeat(101) })).rejects.toThrow()
    await expect(updateRoadmap('nope', { title: 'x' })).rejects.toThrow('not found')
  })
  it('stored records pass the zod schemas', async () => {
    const r = await createRoadmap({ title: 'R', color: '#fff' })
    const g = await createGroup(r.id, 'G')
    const t = await createTopic({ roadmapId: r.id, groupId: g.id, title: 'T' })
    const q = await addQuestion(t.id, mcq)
    const e = await addQuestion(t.id, { type: 'essay', text: 'Essay', referenceAnswer: 'ref' })
    const res = await addResource({ topicId: t.id, url: 'https://react.dev/learn' })
    expect(roadmapSchema.safeParse(r).success).toBe(true)
    expect(groupSchema.safeParse(g).success).toBe(true)
    expect(topicSchema.safeParse(await db.topics.get(t.id)).success).toBe(true)
    expect(questionSchema.safeParse(q).success).toBe(true)
    expect(questionSchema.safeParse(e).success).toBe(true)
    expect(resourceSchema.safeParse(res).success).toBe(true)
    const file = { format: 'askme-roadmap', version: 1, exportedAt: new Date().toISOString(), roadmap: r, groups: [g], topics: [await db.topics.get(t.id)], resources: [res], questions: [q, e] }
    expect(roadmapFileSchema.safeParse(file).success).toBe(true)
    const bad = { ...file, topics: [{ ...(await db.topics.get(t.id)), groupId: 'missing' }] }
    expect(roadmapFileSchema.safeParse(bad).success).toBe(false)
  })
})

describe('topics and groups', () => {
  it('numbers topics per container and appends', async () => {
    const r = await createRoadmap({ title: 'R' })
    const g = await createGroup(r.id, 'Basics')
    await createTopic({ roadmapId: r.id, title: 'u1' })
    await createTopic({ roadmapId: r.id, groupId: g.id, title: 'g1' })
    await createTopic({ roadmapId: r.id, groupId: g.id, title: 'g2' })
    await createTopic({ roadmapId: r.id, title: 'u2' })
    expect(await titles(r.id)).toEqual(['u1:0', 'u2:1'])
    expect(await titles(r.id, g.id)).toEqual(['g1:0', 'g2:1'])
  })
  it('rejects a group from another roadmap', async () => {
    const r1 = await createRoadmap({ title: 'A' }); const r2 = await createRoadmap({ title: 'B' })
    const g = await createGroup(r2.id, 'G')
    await expect(createTopic({ roadmapId: r1.id, groupId: g.id, title: 'x' })).rejects.toThrow()
  })
  it('moveTopic reorders inside a container', async () => {
    const r = await createRoadmap({ title: 'R' })
    const [a, b, c] = [await createTopic({ roadmapId: r.id, title: 'a' }), await createTopic({ roadmapId: r.id, title: 'b' }), await createTopic({ roadmapId: r.id, title: 'c' })]
    await moveTopic(c.id, { groupId: null, index: 0 })
    expect(await titles(r.id)).toEqual(['c:0', 'a:1', 'b:2'])
    await moveTopic(c.id, { groupId: null, index: Number.MAX_SAFE_INTEGER })
    expect(await titles(r.id)).toEqual(['a:0', 'b:1', 'c:2'])
    void a; void b
  })
  it('moveTopic across groups renumbers both sides and unsets groupId', async () => {
    const r = await createRoadmap({ title: 'R' })
    const g = await createGroup(r.id, 'G')
    const a = await createTopic({ roadmapId: r.id, title: 'a' })
    await createTopic({ roadmapId: r.id, title: 'b' })
    await createTopic({ roadmapId: r.id, groupId: g.id, title: 'x' })
    await moveTopic(a.id, { groupId: g.id, index: 0 })
    expect(await titles(r.id)).toEqual(['b:0'])
    expect(await titles(r.id, g.id)).toEqual(['a:0', 'x:1'])
    await moveTopic(a.id, { groupId: null, index: 1 })
    expect(await titles(r.id)).toEqual(['b:0', 'a:1'])
    expect(await titles(r.id, g.id)).toEqual(['x:0'])
    expect('groupId' in (await db.topics.get(a.id))! && (await db.topics.get(a.id))!.groupId !== undefined).toBe(false)
  })
  it('deleteGroup keeps topics, ungrouped at the end', async () => {
    const r = await createRoadmap({ title: 'R' })
    const g = await createGroup(r.id, 'G')
    await createTopic({ roadmapId: r.id, title: 'u' })
    await createTopic({ roadmapId: r.id, groupId: g.id, title: 'g1' })
    await createTopic({ roadmapId: r.id, groupId: g.id, title: 'g2' })
    await deleteGroup(g.id)
    expect(await titles(r.id)).toEqual(['u:0', 'g1:1', 'g2:2'])
    expect(await listGroups(r.id)).toHaveLength(0)
  })
  it('reorderGroups + sections + progress', async () => {
    const r = await createRoadmap({ title: 'R' })
    const g1 = await createGroup(r.id, 'one'); const g2 = await createGroup(r.id, 'two')
    await reorderGroups([g2.id, g1.id])
    const t = await createTopic({ roadmapId: r.id, groupId: g1.id, title: 't' })
    await setTopicStatus(t.id, 'known')
    const sections = buildSections(await listGroups(r.id), await listTopics(r.id))
    expect(sections.map((s) => s.group?.title ?? null)).toEqual(['two', 'one'])
    expect(getProgress(sections[1].topics)).toEqual({ completed: 1, total: 1 })
    expect(buildSections([], [])).toEqual([{ group: null, topics: [] }])
  })
  it('updateTopic title/notes', async () => {
    const r = await createRoadmap({ title: 'R' }); const t = await createTopic({ roadmapId: r.id, title: 't' })
    await updateTopic(t.id, { notes: '# hi' }); expect((await db.topics.get(t.id))!.notes).toBe('# hi')
    await updateTopic(t.id, { notes: '  ' }); expect((await db.topics.get(t.id))!.notes).toBeUndefined()
  })
})

describe('cross-roadmap move and cascades', () => {
  it('moveTopicToRoadmap carries questions/attempts, renumbers source', async () => {
    const r1 = await createRoadmap({ title: 'A' }); const r2 = await createRoadmap({ title: 'B' })
    const g = await createGroup(r1.id, 'G')
    const t1 = await createTopic({ roadmapId: r1.id, groupId: g.id, title: 't1' })
    await createTopic({ roadmapId: r1.id, groupId: g.id, title: 't2' })
    await createTopic({ roadmapId: r2.id, title: 'existing' })
    const q = await addQuestion(t1.id, mcq); await recordAttempt(q.id, false)
    await moveTopicToRoadmap(t1.id, r2.id)
    expect(await titles(r1.id, g.id)).toEqual(['t2:0'])
    expect(await titles(r2.id)).toEqual(['existing:0', 't1:1'])
    expect((await db.questions.get(q.id))!.roadmapId).toBe(r2.id)
    expect((await db.attempts.where('questionId').equals(q.id).first())!.roadmapId).toBe(r2.id)
    expect((await db.topics.get(t1.id))!.groupId).toBeUndefined()
  })
  it('moveTopicToRoadmap can land in a group of the target roadmap, atomically', async () => {
    const r1 = await createRoadmap({ title: 'A' }); const r2 = await createRoadmap({ title: 'B' })
    const g2 = await createGroup(r2.id, 'G2')
    await createTopic({ roadmapId: r2.id, groupId: g2.id, title: 'first' })
    const t = await createTopic({ roadmapId: r1.id, title: 'moving' })
    await moveTopicToRoadmap(t.id, r2.id, g2.id)
    expect(await titles(r2.id, g2.id)).toEqual(['first:0', 'moving:1'])
    expect(await titles(r1.id)).toEqual([])
  })
  it('moveTopicToRoadmap rejects a group from another roadmap and changes nothing', async () => {
    const r1 = await createRoadmap({ title: 'A' }); const r2 = await createRoadmap({ title: 'B' })
    const g1 = await createGroup(r1.id, 'G1')
    const t = await createTopic({ roadmapId: r1.id, title: 'stay' })
    await expect(moveTopicToRoadmap(t.id, r2.id, g1.id)).rejects.toThrow('target roadmap')
    expect((await db.topics.get(t.id))!.roadmapId).toBe(r1.id)
  })
  it('deleteTopic / deleteRoadmap cascade', async () => {
    const r = await createRoadmap({ title: 'R' }); const other = await createRoadmap({ title: 'Other' })
    const t = await createTopic({ roadmapId: r.id, title: 't' }); const t2 = await createTopic({ roadmapId: r.id, title: 't2' })
    const ot = await createTopic({ roadmapId: other.id, title: 'ot' }); const oq = await addQuestion(ot.id, mcq)
    const q = await addQuestion(t.id, mcq); await addQuestion(t2.id, mcq); await addResource({ topicId: t.id, url: 'https://a.com' })
    await recordAttempt(q.id, true)
    expect(await db.reviews.count()).toBe(1) // recordAttempt scheduled it
    await deleteTopic(t.id)
    expect(await titles(r.id)).toEqual(['t2:0'])
    expect(await db.questions.get(q.id)).toBeUndefined()
    expect(await db.reviews.count()).toBe(0); expect(await db.attempts.count()).toBe(0); expect(await db.resources.count()).toBe(0)
    await deleteRoadmap(r.id)
    expect(await db.topics.where('roadmapId').equals(r.id).count()).toBe(0)
    expect(await db.questions.get(oq.id)).toBeDefined()
    expect(await listRoadmaps()).toHaveLength(1)
  })
  it('deleting an empty roadmap works', async () => {
    const r = await createRoadmap({ title: 'R' }); await deleteRoadmap(r.id); expect(await listRoadmaps()).toHaveLength(0)
  })
})

describe('questions, attempts, overview', () => {
  it('validates mcq and keeps roadmapId', async () => {
    const r = await createRoadmap({ title: 'R' }); const t = await createTopic({ roadmapId: r.id, title: 't' })
    await expect(addQuestion(t.id, { ...mcq, options: ['a', 'a', 'c', 'd'] })).rejects.toThrow()
    await expect(addQuestion(t.id, { ...mcq, answerIndex: 4 })).rejects.toThrow()
    const q = await addQuestion(t.id, mcq)
    await updateQuestion(q.id, { type: 'essay', text: 'now essay' })
    const after = (await db.questions.get(q.id))! as unknown as Record<string, unknown>
    expect(after.options).toBeUndefined(); expect(after.roadmapId).toBe(r.id)
    await deleteQuestion(q.id); expect(await db.questions.count()).toBe(0)
  })
  it('mistakes use the latest attempt; overview & page counts', async () => {
    const r = await createRoadmap({ title: 'R' }); const t = await createTopic({ roadmapId: r.id, title: 't' })
    const q1 = await addQuestion(t.id, mcq); const q2 = await addQuestion(t.id, mcq)
    await recordAttempt(q1.id, false); await new Promise((x) => setTimeout(x, 5)); await recordAttempt(q1.id, true); await recordAttempt(q2.id, false)
    expect(await listMistakeQuestionIds([t.id])).toEqual([q2.id])
    await setTopicStatus(t.id, 'done')
    const [o] = await getRoadmapOverviews()
    expect(o).toMatchObject({ topicCount: 1, completedCount: 1, questionCount: 2 })
    const page = await getRoadmapPage(r.id)
    expect(page!.questionCounts[t.id]).toBe(2)
    expect(await getRoadmapPage('missing')).toBeNull()
  })
})

describe('applyTopicMove (pure)', () => {
  it('clamps the index and ignores unknown ids', async () => {
    const r = await createRoadmap({ title: 'R' })
    await createTopic({ roadmapId: r.id, title: 'a' }); await createTopic({ roadmapId: r.id, title: 'b' })
    const ts = await listTopics(r.id)
    expect(applyTopicMove(ts, ts[0].id, { groupId: null, index: -5 }).map((t) => t.order)).toEqual([0, 1])
    expect(applyTopicMove(ts, 'zzz', { groupId: null, index: 0 })).toEqual(ts)
  })
})
