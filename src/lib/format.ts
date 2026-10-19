/** Adds https:// to a link typed without a scheme, so "react.dev" works. */
export function withHttps(value: string): string {
  const trimmed = value.trim();

  return trimmed === "" || trimmed.includes("://") ? trimmed : `https://${trimmed}`;
}

/** Returns "1 topic" / "3 topics" style text. */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
