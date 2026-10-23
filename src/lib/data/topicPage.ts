import { db } from './db'
import { listQuestionsByTopic } from './questions'
import { listLessons } from './lessons'
import type { Group, Lesson, Question, Roadmap, Topic } from '../../types/study'

/** Everything the topic page needs, loaded in one live query. */
export interface TopicPageData {
  topic: Topic
  roadmap: Roadmap
  /** The group the topic belongs to, if any. */
  group: Group | undefined
  lessons: Lesson[]
  questions: Question[]
}

/** Loads a topic with its roadmap, group, lessons and questions. Returns `null` when it does not exist. */
export async function getTopicPage(topicId: string): Promise<TopicPageData | null> {
  const topic = await db.topics.get(topicId)

  if (!topic) {
    return null
  }

  const [roadmap, group, lessons, questions] = await Promise.all([
    db.roadmaps.get(topic.roadmapId),
    topic.groupId ? db.groups.get(topic.groupId) : undefined,
    listLessons(topicId),
    listQuestionsByTopic(topicId),
  ])

  if (!roadmap) {
    return null
  }

  return { topic, roadmap, group, lessons, questions }
}

/** What the question editor needs: the topic, and the question when editing one. */
export interface QuestionEditorData {
  topic: Topic
  /** The target lesson for a new question, or `null` if the lesson is missing or belongs elsewhere. */
  lesson: Lesson | null
  /** `null` when creating, or when the requested question is not in this topic. */
  question: Question | null
}

/** Loads the data for the question editor. Returns `null` when the topic does not exist. */
export async function getQuestionEditorData(
  topicId: string,
  questionId?: string,
  lessonId?: string,
): Promise<QuestionEditorData | null> {
  const topic = await db.topics.get(topicId)

  if (!topic) {
    return null
  }

  const question = questionId ? await db.questions.get(questionId) : undefined
  const targetLessonId = questionId ? question?.lessonId : lessonId
  const lesson = targetLessonId
    ? await db.lessons.get(targetLessonId)
    : undefined

  return {
    topic,
    lesson:
      targetLessonId && lesson?.topicId === topicId
        ? lesson
        : null,
    question: question && question.topicId === topicId ? question : null,
  }
}
