import { db } from './db'
import type { Question, Review, Roadmap, Topic } from '../../types/study'

/** How many cards one review session asks. Keeps a big backlog from feeling endless. */
export const REVIEW_SESSION_SIZE = 20

/** A card that is due, with where it comes from. */
export interface DueCard {
  question: Question
  review: Review
  topic: Topic
  roadmap: Roadmap
}

/** What the review page shows: every due card, oldest due first. */
export interface DueSummary {
  /** Total number of cards due now (not capped by the session size). */
  total: number
  cards: DueCard[]
  /** Due cards per roadmap, in roadmap order, only roadmaps that have some. */
  byRoadmap: { roadmap: Roadmap; count: number }[]
}

/** Returns the reviews that are due at `now`, oldest first. */
export async function listDueReviews(now: Date = new Date()): Promise<Review[]> {
  return db.reviews.where('due').belowOrEqual(now.toISOString()).sortBy('due')
}

/** Counts the cards that are due now. Cheap enough for a badge in `useLiveQuery`. */
export async function countDue(now: Date = new Date()): Promise<number> {
  return db.reviews.where('due').belowOrEqual(now.toISOString()).count()
}

/** Loads every due card with its question, topic and roadmap. Safe to use inside `useLiveQuery`. */
export async function getDueSummary(now: Date = new Date()): Promise<DueSummary> {
  const reviews = await listDueReviews(now)
  const questions = await db.questions.bulkGet(reviews.map((review) => review.questionId))
  const topics = new Map((await db.topics.toArray()).map((topic) => [topic.id, topic]))
  const roadmaps = await db.roadmaps.orderBy('order').toArray()
  const roadmapById = new Map(roadmaps.map((roadmap) => [roadmap.id, roadmap]))

  const cards: DueCard[] = []

  reviews.forEach((review, index) => {
    const question = questions[index]
    const topic = topics.get(review.topicId)
    const roadmap = topic ? roadmapById.get(topic.roadmapId) : undefined

    // A review whose question, topic or roadmap is gone is skipped instead of crashing the page.
    if (question && topic && roadmap) {
      cards.push({ question, review, topic, roadmap })
    }
  })

  const byRoadmap = roadmaps
    .map((roadmap) => ({
      roadmap,
      count: cards.filter((card) => card.roadmap.id === roadmap.id).length,
    }))
    .filter((entry) => entry.count > 0)

  return { total: cards.length, cards, byRoadmap }
}
