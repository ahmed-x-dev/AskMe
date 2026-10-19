import { allTables, db } from './db'
import { listRoadmaps } from './roadmaps'
import { byOrder, nextOrder, nowIso } from './util'
import { cloneWithNewIds, stripProgress, validateBackup } from '../importExport'
import type { BackupContents } from '../libraryArchive'
import type { ProgressFile, RoadmapFile } from '../schemas'
import type { Roadmap } from '../../types/study'

/** Reads one roadmap with its groups, topics, links and questions. Must run inside a transaction on those tables. */
async function readRoadmap(roadmap: Roadmap): Promise<RoadmapFile> {
  const topics = byOrder(await db.topics.where('roadmapId').equals(roadmap.id).toArray())
  const topicIds = topics.map((topic) => topic.id)

  return {
    format: 'askme-roadmap',
    version: 1,
    exportedAt: nowIso(),
    roadmap,
    groups: byOrder(await db.groups.where('roadmapId').equals(roadmap.id).toArray()),
    topics,
    resources: byOrder(await db.resources.where('topicId').anyOf(topicIds).toArray()),
    questions: (await db.questions.where('roadmapId').equals(roadmap.id).toArray()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ),
  }
}

/**
 * Builds the portable file of one roadmap, or `null` when it does not exist. The file holds
 * content only: topic statuses and "done" links are reset, and attempts and reviews are left out.
 */
export async function buildRoadmapFile(roadmapId: string): Promise<RoadmapFile | null> {
  return db.transaction('r', db.roadmaps, db.groups, db.topics, db.resources, db.questions, async () => {
    const roadmap = await db.roadmaps.get(roadmapId)

    return roadmap ? stripProgress(await readRoadmap(roadmap)) : null
  })
}

/** Reads everything for a full backup: every roadmap with its progress marks, plus attempts and reviews. */
export async function buildBackup(): Promise<BackupContents> {
  return db.transaction('r', allTables(), async () => {
    const roadmaps = await Promise.all((await listRoadmaps()).map(readRoadmap))
    const progress: ProgressFile = {
      format: 'askme-progress',
      version: 1,
      exportedAt: nowIso(),
      attempts: await db.attempts.toArray(),
      reviews: await db.reviews.toArray(),
    }

    return { roadmaps, progress }
  })
}

/** Counts of what an import added, to show in a message. */
export interface ImportResult {
  roadmap: Roadmap
  topicCount: number
  questionCount: number
}

/**
 * Adds a roadmap file as a new roadmap at the end of the home grid. All ids are new, so it never
 * touches existing data, and importing the same file twice gives two copies.
 */
export async function importRoadmapFile(file: RoadmapFile): Promise<ImportResult> {
  const copy = cloneWithNewIds(file)

  return db.transaction('rw', db.roadmaps, db.groups, db.topics, db.resources, db.questions, async () => {
    const roadmap: Roadmap = {
      ...copy.roadmap,
      order: nextOrder(await db.roadmaps.toArray()),
      updatedAt: nowIso(),
    }

    await db.roadmaps.add(roadmap)
    await db.groups.bulkAdd(copy.groups)
    await db.topics.bulkAdd(copy.topics)
    await db.resources.bulkAdd(copy.resources)
    await db.questions.bulkAdd(copy.questions)

    return { roadmap, topicCount: copy.topics.length, questionCount: copy.questions.length }
  })
}

/**
 * Replaces ALL stored data with a backup, in one transaction. If anything fails, nothing changes.
 * The backup is checked first with `validateBackup`.
 */
export async function restoreBackup({ roadmaps, progress }: BackupContents): Promise<void> {
  validateBackup(roadmaps, progress)

  await db.transaction('rw', allTables(), async () => {
    for (const table of allTables()) {
      await table.clear()
    }

    await db.roadmaps.bulkAdd(roadmaps.map((file) => file.roadmap))
    await db.groups.bulkAdd(roadmaps.flatMap((file) => file.groups))
    await db.topics.bulkAdd(roadmaps.flatMap((file) => file.topics))
    await db.resources.bulkAdd(roadmaps.flatMap((file) => file.resources))
    await db.questions.bulkAdd(roadmaps.flatMap((file) => file.questions))
    await db.attempts.bulkAdd(progress.attempts)
    await db.reviews.bulkAdd(progress.reviews)
  })
}

/** Deletes every roadmap, topic, question, attempt and review. The AI key and theme are not touched. */
export async function resetAllData(): Promise<void> {
  await db.transaction('rw', allTables(), async () => {
    for (const table of allTables()) {
      await table.clear()
    }
  })
}
