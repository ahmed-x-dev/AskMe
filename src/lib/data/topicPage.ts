import { db } from './db'
import { listQuestionsByTopic } from './questions'
import { listResources } from './resources'
import type { Group, Question, Resource, Roadmap, Topic } from '../../types/study'

/** Everything the topic page needs, loaded in one live query. */
export interface TopicPageData {
  topic: Topic
  roadmap: Roadmap
  /** The group the topic belongs to, if any. */
  group: Group | undefined
  resources: Resource[]
  questions: Question[]
}

/** Loads a topic with its roadmap, group, resources and questions. Returns `null` when it does not exist. */
export async function getTopicPage(topicId: string): Promise<TopicPageData | null> {
  const topic = await db.topics.get(topicId)

  if (!topic) {
    return null
  }

  const [roadmap, group, resources, questions] = await Promise.all([
    db.roadmaps.get(topic.roadmapId),
    topic.groupId ? db.groups.get(topic.groupId) : undefined,
    listResources(topicId),
    listQuestionsByTopic(topicId),
  ])

  if (!roadmap) {
    return null
  }

  return { topic, roadmap, group, resources, questions }
}

/** What the question editor needs: the topic, and the question when editing one. */
export interface QuestionEditorData {
  topic: Topic
  /** `null` when creating, or when the requested question is not in this topic. */
  question: Question | null
}

/** Loads the data for the question editor. Returns `null` when the topic does not exist. */
export async function getQuestionEditorData(
  topicId: string,
  questionId?: string,
): Promise<QuestionEditorData | null> {
  const topic = await db.topics.get(topicId)

  if (!topic) {
    return null
  }

  if (!questionId) {
    return { topic, question: null }
  }

  const question = await db.questions.get(questionId)

  return { topic, question: question && question.topicId === topicId ? question : null }
}
