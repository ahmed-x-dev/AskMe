import { db } from './db'
import { computeStreak, dayKey, findWeakTopics, type Streak } from '../progress'
import { countDue } from './reviews'
import type { Roadmap, Topic } from '../../types/study'

/** Only answers from this many recent days decide which topics are weak, so old mistakes fade. */
const WEAK_WINDOW_DAYS = 30

/** A weak topic with the names needed to show and open it. */
export interface WeakTopicInfo {
  topic: Topic
  roadmap: Roadmap
  attempts: number
  /** Share of correct answers, from 0 to 1. */
  accuracy: number
}

/** The numbers on the "Today" card of the home page. */
export interface ProgressSummary {
  dueCount: number
  streak: Streak
  /** Answers saved today. */
  answeredToday: number
  weakTopics: WeakTopicInfo[]
}

/** Loads due count, streak and weak topics. Safe to use inside `useLiveQuery`. */
export async function getProgressSummary(now: Date = new Date()): Promise<ProgressSummary> {
  const since = new Date(now)

  since.setDate(since.getDate() - WEAK_WINDOW_DAYS)

  const [dueCount, timestamps, recent] = await Promise.all([
    countDue(now),
    // `at` is indexed, so this reads only the index keys and never loads the attempt records.
    db.attempts.orderBy('at').keys() as Promise<string[]>,
    db.attempts.where('at').aboveOrEqual(since.toISOString()).toArray(),
  ])

  const streak = computeStreak(timestamps, now)
  const today = dayKey(now)
  const answeredToday = timestamps.filter((value) => dayKey(value) === today).length

  const weak = findWeakTopics(recent)
  const topics = await db.topics.bulkGet(weak.map((entry) => entry.topicId))
  const roadmaps = new Map((await db.roadmaps.toArray()).map((roadmap) => [roadmap.id, roadmap]))
  const weakTopics: WeakTopicInfo[] = []

  weak.forEach((entry, index) => {
    const topic = topics[index]
    const roadmap = topic ? roadmaps.get(topic.roadmapId) : undefined

    if (topic && roadmap) {
      weakTopics.push({ topic, roadmap, attempts: entry.attempts, accuracy: entry.accuracy })
    }
  })

  return { dueCount, streak, answeredToday, weakTopics }
}
