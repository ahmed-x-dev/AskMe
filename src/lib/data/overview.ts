import { db } from './db'
import { getProgress } from './sections'
import { listRoadmaps } from './roadmaps'
import type { Roadmap } from '../../types/study'

/** A roadmap with the counts shown on its card in the home grid. */
export interface RoadmapOverview {
  roadmap: Roadmap
  topicCount: number
  /** Topics marked done or known. */
  completedCount: number
  questionCount: number
}

/** Returns every roadmap with its topic, progress and question counts. Safe to use inside `useLiveQuery`. */
export async function getRoadmapOverviews(): Promise<RoadmapOverview[]> {
  const roadmaps = await listRoadmaps()

  return Promise.all(
    roadmaps.map(async (roadmap) => {
      const [topics, questionCount] = await Promise.all([
        db.topics.where('roadmapId').equals(roadmap.id).toArray(),
        db.questions.where('roadmapId').equals(roadmap.id).count(),
      ])
      const { completed, total } = getProgress(topics)

      return { roadmap, topicCount: total, completedCount: completed, questionCount }
    }),
  )
}
