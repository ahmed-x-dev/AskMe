import { hasPassed } from '../../features/quiz'
import { db } from './db'
import { listMistakeQuestionIds } from './attempts'
import { listQuestionsByTopic } from './questions'
import { listTopics } from './topics'
import { nowIso } from './util'
import type { Question, Topic } from '../../types/study'

/** What a quiz covers: one topic, a whole roadmap, or one group of a roadmap. */
export type QuizScope =
  | { kind: 'topic'; topicId: string }
  | { kind: 'roadmap'; roadmapId: string; groupId?: string }

/** Everything the quiz screens need to start a quiz. */
export interface QuizSource {
  title: string
  subtitle: string
  /** Where "back" and "exit" lead. */
  backHref: string
  backLabel: string
  topics: Topic[]
  questions: Question[]
  /** Ids of questions in this quiz whose latest answer was wrong. */
  mistakeIds: string[]
}

/** Loads the questions and mistakes for a quiz. Returns `null` when the topic, roadmap or group is gone. */
export async function getQuizSource(scope: QuizScope): Promise<QuizSource | null> {
  let title: string
  let subtitle: string
  let backHref: string
  let backLabel: string
  let topics: Topic[]
  let questions: Question[]

  if (scope.kind === 'topic') {
    const topic = await db.topics.get(scope.topicId)
    const roadmap = topic ? await db.roadmaps.get(topic.roadmapId) : undefined

    if (!topic || !roadmap) {
      return null
    }

    title = topic.title
    subtitle = roadmap.title
    backHref = `/topic/${topic.id}`
    backLabel = 'Back to topic'
    topics = [topic]
    questions = await listQuestionsByTopic(topic.id)
  } else {
    const roadmap = await db.roadmaps.get(scope.roadmapId)

    if (!roadmap) {
      return null
    }

    const group = scope.groupId ? await db.groups.get(scope.groupId) : undefined

    if (scope.groupId && (!group || group.roadmapId !== roadmap.id)) {
      return null
    }

    const allTopics = await listTopics(roadmap.id)

    topics = group ? allTopics.filter((topic) => topic.groupId === group.id) : allTopics
    title = group ? group.title : roadmap.title
    subtitle = group ? roadmap.title : 'All topics'
    backHref = `/roadmap/${roadmap.id}`
    backLabel = 'Back to roadmap'

    const topicIds = new Set(topics.map((topic) => topic.id))
    const roadmapQuestions = await db.questions.where('roadmapId').equals(roadmap.id).toArray()

    questions = roadmapQuestions
      .filter((question) => topicIds.has(question.topicId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  const known = new Set(questions.map((question) => question.id))
  const mistakeIds = (await listMistakeQuestionIds(topics.map((topic) => topic.id))).filter((id) =>
    known.has(id),
  )

  return { title, subtitle, backHref, backLabel, topics, questions, mistakeIds }
}

/** One answered question from a finished quiz. */
export interface QuizAnswer {
  questionId: string
  correct: boolean
}

/**
 * Marks topics as done after a quiz. A topic is marked when the quiz asked every one of its
 * questions and at least 80% were correct. Only `todo` and `active` topics change, so a topic
 * marked `known` stays that way. Returns the topics that were marked.
 */
export async function completeTopicsFromQuiz(answers: QuizAnswer[]): Promise<Topic[]> {
  const results = new Map(answers.map((answer) => [answer.questionId, answer.correct]))

  return db.transaction('rw', db.topics, db.questions, async () => {
    const asked = (await db.questions.bulkGet([...results.keys()])).filter(
      (question): question is Question => question !== undefined,
    )
    const topicIds = [...new Set(asked.map((question) => question.topicId))]
    const completed: Topic[] = []

    for (const topicId of topicIds) {
      const topic = await db.topics.get(topicId)

      if (!topic || (topic.status !== 'todo' && topic.status !== 'active')) {
        continue
      }

      const topicQuestions = await db.questions.where('topicId').equals(topicId).toArray()

      if (topicQuestions.length === 0 || !topicQuestions.every((question) => results.has(question.id))) {
        continue
      }

      const correct = topicQuestions.filter((question) => results.get(question.id)).length

      if (hasPassed(correct, topicQuestions.length)) {
        const updated: Topic = { ...topic, status: 'done', updatedAt: nowIso() }

        await db.topics.put(updated)
        completed.push(updated)
      }
    }

    return completed
  })
}
