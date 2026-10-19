import { byOrder } from './util'
import type { Group, Topic, TopicTarget } from '../../types/study'

/** One block of the topics page: a group with its topics, or the ungrouped topics (`group: null`). */
export interface TopicSection {
  group: Group | null
  topics: Topic[]
}

/**
 * Splits a roadmap's topics into display sections.
 * With no groups this returns a single flat section, so groups stay optional.
 */
export function buildSections(groups: readonly Group[], topics: readonly Topic[]): TopicSection[] {
  const groupIds = new Set(groups.map((group) => group.id))

  const sections: TopicSection[] = byOrder(groups).map((group) => ({
    group,
    topics: byOrder(topics.filter((topic) => topic.groupId === group.id)),
  }))

  const ungrouped = byOrder(topics.filter((topic) => !topic.groupId || !groupIds.has(topic.groupId)))

  if (ungrouped.length > 0 || groups.length === 0) {
    sections.push({ group: null, topics: ungrouped })
  }

  return sections
}

/** Progress as a count of finished topics. Topics marked `known` count as finished. */
export function getProgress(topics: readonly Topic[]): { completed: number; total: number } {
  const completed = topics.filter((topic) => topic.status === 'done' || topic.status === 'known')

  return { completed: completed.length, total: topics.length }
}

/**
 * Pure version of a topic move: returns the roadmap's topics with the moved topic placed at
 * `target` and the `order` of both the source and target containers renumbered from 0.
 * The topics page uses it for instant drag-and-drop feedback, and `moveTopic` saves the same result.
 */
export function applyTopicMove(
  topics: readonly Topic[],
  topicId: string,
  target: TopicTarget,
): Topic[] {
  const moving = topics.find((topic) => topic.id === topicId)

  if (!moving) {
    return [...topics]
  }

  const targetGroupId = target.groupId ?? undefined
  const sourceGroupId = moving.groupId ?? undefined
  const containerOf = (groupId: string | undefined) =>
    byOrder(
      topics.filter((topic) => topic.id !== topicId && (topic.groupId ?? undefined) === groupId),
    )

  const targetList = containerOf(targetGroupId)
  const index = Math.min(Math.max(Math.trunc(target.index), 0), targetList.length)
  targetList.splice(index, 0, moving)

  const updated = new Map<string, Topic>()

  targetList.forEach((topic, position) => {
    updated.set(topic.id, { ...topic, order: position, groupId: targetGroupId })
  })

  if (sourceGroupId !== targetGroupId) {
    containerOf(sourceGroupId).forEach((topic, position) => {
      updated.set(topic.id, { ...topic, order: position })
    })
  }

  return topics.map((topic) => updated.get(topic.id) ?? topic)
}
