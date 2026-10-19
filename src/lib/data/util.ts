const MAX_TITLE_LENGTH = 100

/** Creates a new random record id. */
export function newId(): string {
  return crypto.randomUUID()
}

/** Returns the current time as an ISO 8601 UTC string. */
export function nowIso(): string {
  return new Date().toISOString()
}

/** Trims and validates a user-entered title, throwing a readable error when invalid. */
export function cleanTitle(value: string, label: string): string {
  const title = value.trim().replace(/\s+/g, ' ')

  if (!title) {
    throw new Error(`${label} cannot be empty.`)
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`${label} must be ${MAX_TITLE_LENGTH} characters or fewer.`)
  }

  return title
}

/** Validates an http(s) URL and returns its normalized form. */
export function cleanUrl(value: string): string {
  const raw = value.trim()
  let url: URL

  try {
    url = new URL(raw)
  } catch {
    throw new Error('Enter a valid link, including https://')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Links must start with http:// or https://')
  }

  return url.toString()
}

/** Returns the next free `order` value for a list of records. */
export function nextOrder(items: ReadonlyArray<{ order: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1
}

/** Sorts records by their `order` field without changing the input array. */
export function byOrder<T extends { order: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order)
}
