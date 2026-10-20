import { beforeEach, describe, expect, it } from 'vitest'

import {
  addQuestion, addQuestions, allTables, buildBackup, buildRoadmapFile, addResource, createGroup, createRoadmap, createTopic,
  db, importRoadmapFile, recordAttempt, resetAllData, restoreBackup, setTopicStatus,
} from '../src/lib/data'
import { shouldRemindBackup } from '../src/lib/backupReminder'
import {
  cloneWithNewIds, parseProgressFile, parseRoadmapFile, slugify, stringifyFile, validateBackup,
} from '../src/lib/importExport'
import {
  createBackupArchive,
  MAX_BACKUP_ARCHIVE_BYTES,
  MAX_BACKUP_UNCOMPRESSED_BYTES,
  readBackupArchive,
} from '../src/lib/libraryArchive'
import { zipSync } from 'fflate'
import { clearAiApiKey, saveAiApiKey } from '../src/platform/secureStorage'

const mcq = (text: string) => ({
  type: 'mcq' as const, text, options: ['a', 'b', 'c', 'd'] as [string, string, string, string], answerIndex: 1,
})

beforeEach(async () => {
  await db.transaction('rw', allTables(), async () => { for (const t of allTables()) await t.clear() })
})

async function seed() {
  const roadmap = await createRoadmap({ title: 'React Hooks!', icon: 'atom', color: '#09785E' })
  const group = await createGroup(roadmap.id, 'Basics')
  const grouped = await createTopic({ roadmapId: roadmap.id, groupId: group.id, title: 'useState' })
  const loose = await createTopic({ roadmapId: roadmap.id, title: 'Context' })
  const resource = await addResource({ topicId: grouped.id, title: 'Docs', url: 'https://react.dev', kind: 'docs' })
  const q1 = await addQuestion(grouped.id, mcq('q1'))
  const q2 = await addQuestion(loose.id, { type: 'essay', text: 'Explain context', referenceAnswer: 'Shares values' })
  await setTopicStatus(grouped.id, 'done')
  await db.resources.update(resource.id, { done: true })
  await recordAttempt(q1.id, true)
  await recordAttempt(q2.id, false)
  return { roadmap, group, grouped, loose, resource, q1, q2 }
}

describe('roadmap file', () => {
  it('exports content only: statuses reset, links not done, no progress', async () => {
    const { roadmap } = await seed()
    const file = (await buildRoadmapFile(roadmap.id))!
    expect(file).toMatchObject({ format: 'askme-roadmap', version: 1 })
    expect(file.topics.map((t) => t.status)).toEqual(['todo', 'todo'])
    expect(file.resources.every((r) => r.done === false)).toBe(true)
    expect(file.questions).toHaveLength(2)
    expect(Object.keys(file)).not.toContain('attempts')
    expect(JSON.stringify(file)).not.toContain('"correct"')
    expect(await buildRoadmapFile('missing')).toBeNull()
  })

  it('round-trips through JSON text and passes the schema', async () => {
    const { roadmap } = await seed()
    const file = (await buildRoadmapFile(roadmap.id))!
    expect(parseRoadmapFile(stringifyFile(file))).toEqual(file)
  })

  it('round-trips every supported question type', async () => {
    const roadmap = await createRoadmap({ title: 'All types' })
    const topic = await createTopic({ roadmapId: roadmap.id, title: 'Question variants' })
    await addQuestions(topic.id, [
      mcq('Choose one'),
      { type: 'essay', text: 'Explain it' },
      { type: 'true-false', text: 'It is true', answer: true },
      { type: 'fill-blank', text: 'Complete this', answer: 'answer' },
      { type: 'flashcard', text: 'Front', answer: 'Back' },
    ])
    const file = (await buildRoadmapFile(roadmap.id))!

    expect(parseRoadmapFile(stringifyFile(file)).questions.map((question) => question.type).sort()).toEqual([
      'essay', 'fill-blank', 'flashcard', 'mcq', 'true-false',
    ])
  })

  it('imports as a new roadmap with new ids, keeping the links between records', async () => {
    const { roadmap } = await seed()
    const file = (await buildRoadmapFile(roadmap.id))!
    const result = await importRoadmapFile(file)

    expect(result).toMatchObject({ topicCount: 2, questionCount: 2 })
    expect(result.roadmap.id).not.toBe(roadmap.id)
    expect(result.roadmap).toMatchObject({ title: 'React Hooks!', icon: 'atom', order: 1 })

    const topics = await db.topics.where('roadmapId').equals(result.roadmap.id).toArray()
    const groups = await db.groups.where('roadmapId').equals(result.roadmap.id).toArray()
    expect(topics).toHaveLength(2)
    expect(topics.find((t) => t.title === 'useState')!.groupId).toBe(groups[0].id)
    expect(groups[0].id).not.toBe(file.groups[0].id)
    const questions = await db.questions.where('roadmapId').equals(result.roadmap.id).toArray()
    expect(questions.every((q) => topics.some((t) => t.id === q.topicId))).toBe(true)
    expect(await db.attempts.where('roadmapId').equals(result.roadmap.id).count()).toBe(0)

    // The original is untouched, and importing twice gives a second copy.
    expect(await db.roadmaps.count()).toBe(2)
    await importRoadmapFile(file)
    expect(await db.roadmaps.count()).toBe(3)
  })

  it('cloneWithNewIds is deterministic with a custom id maker', async () => {
    const { roadmap } = await seed()
    const file = (await buildRoadmapFile(roadmap.id))!
    let n = 0
    const clone = cloneWithNewIds(file, () => `id${(n += 1)}`)
    expect(clone.roadmap.id).toBe('id1')
    expect(new Set([clone.roadmap.id, ...clone.topics.map((t) => t.id), ...clone.questions.map((q) => q.id)]).size).toBe(5)
    expect(clone.questions.every((q) => q.roadmapId === 'id1')).toBe(true)
  })

  it('rejects bad files with a readable message', async () => {
    expect(() => parseRoadmapFile('not json')).toThrow('not JSON')
    expect(() => parseRoadmapFile('{"format":"other"}')).toThrow('not a valid AskMe roadmap file')
    const { roadmap } = await seed()
    const file = (await buildRoadmapFile(roadmap.id))!
    const broken = { ...file, questions: [{ ...file.questions[0], topicId: 'nope' }] }
    expect(() => parseRoadmapFile(JSON.stringify(broken))).toThrow('A question points to a topic that is not in the file.')
    const wrongRoadmap = { ...file, questions: [{ ...file.questions[0], roadmapId: 'elsewhere' }] }
    expect(() => parseRoadmapFile(JSON.stringify(wrongRoadmap))).toThrow('A question belongs to a different roadmap.')
    const badUrl = { ...file, resources: [{ ...file.resources[0], url: 'javascript:alert(1)' }] }
    expect(() => parseRoadmapFile(JSON.stringify(badUrl))).toThrow('not a valid AskMe roadmap file')
  })
})

describe('full backup', () => {
  it('creates a ZIP with one file per roadmap plus progress, and reads it back', async () => {
    await seed()
    await createRoadmap({ title: 'English' })
    const contents = await buildBackup()
    const zip = createBackupArchive(contents)
    const read = readBackupArchive(zip)

    expect(read.roadmaps.map((f) => f.roadmap.title)).toEqual(['React Hooks!', 'English'])
    expect(read.progress.attempts).toHaveLength(2)
    expect(read.progress.reviews).toHaveLength(2)
    // A full backup keeps progress marks, unlike a shared roadmap file.
    expect(read.roadmaps[0].topics.find((t) => t.title === 'useState')!.status).toBe('done')
    expect(read.roadmaps[0].resources[0].done).toBe(true)
  })

  it('never contains the AI key', async () => {
    saveAiApiKey('gemini', 'SECRET-KEY-123')
    await seed()
    const zip = createBackupArchive(await buildBackup())
    const text = new TextDecoder('latin1').decode(zip)
    expect(text).not.toContain('SECRET-KEY-123')
    const { unzipSync } = await import('fflate')
    const all = Object.values(unzipSync(zip)).map((bytes) => new TextDecoder().decode(bytes)).join('')
    expect(all).not.toContain('SECRET-KEY-123')
    clearAiApiKey('gemini')
  })

  it('restore replaces everything and brings progress back', async () => {
    const { roadmap, q1 } = await seed()
    const zip = createBackupArchive(await buildBackup())

    await resetAllData()
    await createRoadmap({ title: 'Something else' })
    await restoreBackup(readBackupArchive(zip))

    const roadmaps = await db.roadmaps.toArray()
    expect(roadmaps.map((r) => r.id)).toEqual([roadmap.id])
    expect(await db.attempts.count()).toBe(2)
    expect(await db.reviews.get(q1.id)).toBeDefined()
    expect((await db.topics.toArray()).find((t) => t.title === 'useState')!.status).toBe('done')
  })

  it('restore changes nothing when the backup is damaged', async () => {
    const { roadmap } = await seed()
    const contents = await buildBackup()
    const damaged = { ...contents, progress: { ...contents.progress, attempts: [{ ...contents.progress.attempts[0], questionId: 'ghost' }] } }

    await expect(restoreBackup(damaged)).rejects.toThrow('damaged')
    expect((await db.roadmaps.toArray()).map((r) => r.id)).toEqual([roadmap.id])
    expect(await db.attempts.count()).toBe(2)
  })

  it('validateBackup catches repeated ids across roadmaps', async () => {
    await seed()
    const { roadmaps, progress } = await buildBackup()
    expect(() => validateBackup([roadmaps[0], roadmaps[0]], progress)).toThrow('same id appears twice')
  })

  it('rejects files that are not backups', () => {
    expect(() => readBackupArchive(new Uint8Array([1, 2, 3]))).toThrow('not a readable ZIP')
    expect(() => readBackupArchive(createBackupArchiveWithoutProgress())).toThrow('progress.json is missing')
    expect(() => parseProgressFile('{"format":"askme-progress","version":1}')).toThrow('not a valid AskMe progress file')
  })

  it('rejects oversized archives before reading their contents', () => {
    expect(() => readBackupArchive(new Uint8Array(MAX_BACKUP_ARCHIVE_BYTES + 1))).toThrow('no larger than')
  })

  it('stops extracting when the expanded backup exceeds its size limit', () => {
    const oversized = zipSync({
      'progress.json': new Uint8Array(MAX_BACKUP_UNCOMPRESSED_BYTES + 1),
    })

    expect(() => readBackupArchive(oversized)).toThrow('restore size limit')
  })
})

function createBackupArchiveWithoutProgress() {
  // A ZIP with an unrelated file only.
  return new Uint8Array([
    0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ])
}

describe('reset', () => {
  it('clears every table', async () => {
    await seed()
    await resetAllData()
    for (const table of allTables()) expect(await table.count()).toBe(0)
  })
})

describe('slugify and the backup reminder', () => {
  it('makes safe file names', () => {
    expect(slugify('React Hooks!')).toBe('react-hooks')
    expect(slugify('  ***  ')).toBe('roadmap')
    expect(slugify('اللغة العربية')).toBe('اللغة-العربية')
  })

  const now = new Date('2026-10-19T12:00:00.000Z')
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()

  it('never reminds when there is no data', () => {
    expect(shouldRemindBackup({ now, lastBackupAt: null, snoozedUntil: null, oldestDataAt: null })).toBe(false)
  })

  it('reminds a week after the last backup, or after the first roadmap when there is none', () => {
    expect(shouldRemindBackup({ now, lastBackupAt: daysAgo(3), snoozedUntil: null, oldestDataAt: daysAgo(40) })).toBe(false)
    expect(shouldRemindBackup({ now, lastBackupAt: daysAgo(8), snoozedUntil: null, oldestDataAt: daysAgo(40) })).toBe(true)
    expect(shouldRemindBackup({ now, lastBackupAt: null, snoozedUntil: null, oldestDataAt: daysAgo(2) })).toBe(false)
    expect(shouldRemindBackup({ now, lastBackupAt: null, snoozedUntil: null, oldestDataAt: daysAgo(10) })).toBe(true)
  })

  it('stays quiet while snoozed', () => {
    const later = new Date(now.getTime() + 86_400_000).toISOString()
    expect(shouldRemindBackup({ now, lastBackupAt: null, snoozedUntil: later, oldestDataAt: daysAgo(10) })).toBe(false)
    expect(shouldRemindBackup({ now, lastBackupAt: null, snoozedUntil: daysAgo(1), oldestDataAt: daysAgo(10) })).toBe(true)
  })
})
