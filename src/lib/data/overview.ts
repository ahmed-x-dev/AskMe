import { db } from './db'
import { listDueReviews } from './reviews'
import { getProgress } from './sections'
import { listRoadmaps } from './roadmaps'
import type { Roadmap, Topic, TopicStatus } from '../../types/study'

/** Number of topics in each learning status. */
export type StatusCounts = Record<TopicStatus, number>

/** A roadmap with the counts shown on its card in the home grid. */
export interface RoadmapOverview {
  roadmap: Roadmap
  topicCount: number
  /** Topics marked done or known. */
  completedCount: number
  questionCount: number
  /** Topics per status, so a card can say "2 active · 5 to do". */
  statusCounts: StatusCounts
  /** Cards of this roadmap that are due for review now. */
  dueCount: number
}

/** Counts topics by status. Every status is present, even when it is 0. */
export function countByStatus(topics: readonly Topic[]): StatusCounts {
  const counts: StatusCounts = { todo: 0, active: 0, done: 0, known: 0 }

  for (const topic of topics) {
    counts[topic.status] += 1
  }

  return counts
}

/** Returns every roadmap with its topic, progress, question and due counts. Safe to use inside `useLiveQuery`. */
export async function getRoadmapOverviews(now: Date = new Date()): Promise<RoadmapOverview[]> {
  const roadmaps = await listRoadmaps()
  const dueReviews = await listDueReviews(now)
  const roadmapOfTopic = new Map(
    (await db.topics.toArray()).map((topic) => [topic.id, topic.roadmapId]),
  )

  return Promise.all(
    roadmaps.map(async (roadmap) => {
      const [topics, questionCount] = await Promise.all([
        db.topics.where('roadmapId').equals(roadmap.id).toArray(),
        db.questions.where('roadmapId').equals(roadmap.id).count(),
      ])
      const { completed, total } = getProgress(topics)
      const dueCount = dueReviews.filter(
        (review) => roadmapOfTopic.get(review.topicId) === roadmap.id,
      ).length

      return {
        roadmap,
        topicCount: total,
        completedCount: completed,
        questionCount,
        statusCounts: countByStatus(topics),
        dueCount,
      }
    }),
  )
}
