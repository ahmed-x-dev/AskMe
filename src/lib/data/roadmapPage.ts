import { db } from './db'
import { listGroups } from './groups'
import { listRoadmaps } from './roadmaps'
import { listTopics } from './topics'
import type { Group, Roadmap, Topic } from '../../types/study'

/** Everything the topics page needs, loaded in one live query. */
export interface RoadmapPageData {
  roadmap: Roadmap
  /** All roadmaps, used by the "move topic" dialog. */
  roadmaps: Roadmap[]
  groups: Group[]
  topics: Topic[]
  /** Number of questions in each topic, keyed by topic id. */
  questionCounts: Record<string, number>
}

/** Loads a roadmap with its groups, topics and question counts. Returns `null` when it does not exist. */
export async function getRoadmapPage(roadmapId: string): Promise<RoadmapPageData | null> {
  const roadmap = await db.roadmaps.get(roadmapId)

  if (!roadmap) {
    return null
  }

  const [roadmaps, groups, topics] = await Promise.all([
    listRoadmaps(),
    listGroups(roadmapId),
    listTopics(roadmapId),
  ])

  const counts = await Promise.all(
    topics.map(async (topic) => [
      topic.id,
      await db.questions.where('topicId').equals(topic.id).count(),
    ] as const),
  )

  return { roadmap, roadmaps, groups, topics, questionCounts: Object.fromEntries(counts) }
}
