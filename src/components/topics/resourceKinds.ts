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

/** Returns a privacy-enhanced embed URL for recognized YouTube or Vimeo links. */
export function videoEmbedUrl(url: string): string | null {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const hostname = parsed.hostname.toLowerCase();
  const youtubeHosts = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
  ]);

  if (hostname === "youtu.be") {
    const videoId = parsed.pathname.match(/^\/([A-Za-z0-9_-]{11})(?:\/|$)/)?.[1];
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  }

  if (youtubeHosts.has(hostname)) {
    const videoId = parsed.pathname === "/watch"
      ? parsed.searchParams.get("v")
      : parsed.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/)?.[1];

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  }

  if (hostname === "vimeo.com" || hostname === "www.vimeo.com" || hostname === "player.vimeo.com") {
    const videoId = hostname === "player.vimeo.com"
      ? parsed.pathname.match(/^\/video\/(\d+)(?:\/|$)/)?.[1]
      : parsed.pathname.match(/^\/(\d+)(?:\/|$)/)?.[1];

    if (!videoId) return null;

    const privacyHash = parsed.searchParams.get("h");
    const query = privacyHash && /^[A-Za-z0-9]+$/.test(privacyHash)
      ? `?h=${encodeURIComponent(privacyHash)}`
      : "";

    return `https://player.vimeo.com/video/${videoId}${query}`;
  }

  return null;
}
