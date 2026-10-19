import { z } from 'zod'

import type { Attempt, Group, Question, Resource, Review, Roadmap, Topic } from '../types/study'

const id = z.string().min(1)
const timestamp = z.iso.datetime()
const title = z.string().trim().min(1).max(100)
const order = z.number().int().min(0)

export const roadmapSchema: z.ZodType<Roadmap> = z.object({
  id,
  title,
  icon: z.string().optional(),
  color: z.string().optional(),
  order,
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const groupSchema: z.ZodType<Group> = z.object({
  id,
  roadmapId: id,
  title,
  order,
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const topicSchema: z.ZodType<Topic> = z.object({
  id,
  roadmapId: id,
  groupId: id.optional(),
  title,
  order,
  status: z.enum(['todo', 'active', 'done', 'known']),
  notes: z.string().optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const resourceSchema: z.ZodType<Resource> = z.object({
  id,
  topicId: id,
  title: z.string().min(1),
  // Only web links, like `cleanUrl` in the app. A `javascript:` link in an imported file must not get through.
  url: z.url({ protocol: /^https?$/ }),
  kind: z.enum(['docs', 'video', 'article', 'other']),
  done: z.boolean(),
  order,
})

const questionBase = {
  id,
  topicId: id,
  roadmapId: id,
  text: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
  createdAt: timestamp,
  updatedAt: timestamp,
}

export const questionSchema: z.ZodType<Question> = z.discriminatedUnion('type', [
  z.object({
    ...questionBase,
    type: z.literal('mcq'),
    options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
    answerIndex: z.number().int().min(0).max(3),
  }),
  z.object({
    ...questionBase,
    type: z.literal('essay'),
    referenceAnswer: z.string().optional(),
  }),
])

export const attemptSchema: z.ZodType<Attempt> = z.object({
  id,
  questionId: id,
  topicId: id,
  roadmapId: id,
  correct: z.boolean(),
  at: timestamp,
})

export const reviewSchema: z.ZodType<Review> = z.object({
  questionId: id,
  topicId: id,
  ease: z.number().min(1.3).max(10),
  interval: z.number().int().min(0),
  due: timestamp,
  lapses: z.number().int().min(0),
})

/** Portable file for sharing one roadmap. It holds content only, never progress (attempts, reviews). */
export const roadmapFileSchema = z
  .object({
    format: z.literal('askme-roadmap'),
    version: z.literal(1),
    exportedAt: timestamp,
    roadmap: roadmapSchema,
    groups: z.array(groupSchema),
    topics: z.array(topicSchema),
    resources: z.array(resourceSchema),
    questions: z.array(questionSchema),
  })
  .superRefine((file, context) => {
    const groupIds = new Set(file.groups.map((group) => group.id))
    const topicIds = new Set(file.topics.map((topic) => topic.id))

    const problems: string[] = []

    if (file.groups.some((group) => group.roadmapId !== file.roadmap.id)) {
      problems.push('A group belongs to a different roadmap.')
    }

    if (file.topics.some((topic) => topic.roadmapId !== file.roadmap.id)) {
      problems.push('A topic belongs to a different roadmap.')
    }

    if (file.topics.some((topic) => topic.groupId && !groupIds.has(topic.groupId))) {
      problems.push('A topic points to a group that is not in the file.')
    }

    if (file.resources.some((resource) => !topicIds.has(resource.topicId))) {
      problems.push('A link points to a topic that is not in the file.')
    }

    if (file.questions.some((question) => !topicIds.has(question.topicId))) {
      problems.push('A question points to a topic that is not in the file.')
    }

    for (const message of problems) {
      context.addIssue({ code: 'custom', message })
    }
  })

export type RoadmapFile = z.infer<typeof roadmapFileSchema>

/** The progress half of a full backup: what the learner answered and when each question is due. */
export const progressFileSchema = z.object({
  format: z.literal('askme-progress'),
  version: z.literal(1),
  exportedAt: timestamp,
  attempts: z.array(attemptSchema),
  reviews: z.array(reviewSchema),
})

export type ProgressFile = z.infer<typeof progressFileSchema>
