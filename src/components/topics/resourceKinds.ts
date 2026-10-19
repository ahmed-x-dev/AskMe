import type { ResourceKind } from "@/types/study";

export const RESOURCE_KINDS: { value: ResourceKind; label: string }[] = [
  { value: "docs", label: "Docs" },
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
  { value: "other", label: "Other" },
];

/** Only http(s) links are clickable, so a bad link from an import can never run script. */
export function isSafeLink(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Returns the host name of a link for display, or the link itself when it cannot be parsed. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
