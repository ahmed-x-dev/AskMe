import type { Roadmap } from "@/types/study";

type RoadmapIconProps = {
  roadmap: Pick<Roadmap, "title" | "icon" | "color">;
};

/** The colored tile that shows a roadmap's emoji, or the first letter of its name. */
export function RoadmapIcon({ roadmap }: RoadmapIconProps) {
  const hue = roadmap.color || "var(--accent)";

  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-medium leading-none"
      style={{
        backgroundColor: `color-mix(in oklab, ${hue} 22%, var(--bg))`,
        color: hue,
      }}
    >
      {roadmap.icon || roadmap.title.charAt(0).toUpperCase()}
    </span>
  );
}
