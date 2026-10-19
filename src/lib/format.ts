/** Returns "1 topic" / "3 topics" style text. */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
