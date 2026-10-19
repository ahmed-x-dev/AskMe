# Responsive layout: phone-first, desktop-friendly

How one set of layout rules serves a 375px phone and a 1920px monitor without stretching text.

## Why we need it

The app is meant for short revision sessions on a phone, but the same screens must feel
comfortable on a tablet and use a wide monitor instead of sitting in a narrow strip in the
middle. Mobile-first keeps the basics reliable; the wide-screen rules stop us from wasting
the extra space or, the opposite mistake, stretching a paragraph across the whole monitor.

## The concept, simply

CSS starts at the narrowest view and adds layout as the screen grows. Two ideas do most of the work:

- **A fluid container**: one centered box with fluid side padding. Everything inside
  it shares the same left and right edge, so the header lines up with the content below it.
- **Full-width layout**: a wide monitor is used to its full potential for every screen. Whether it's a grid of cards or a text-heavy study session, the content stretches to fill the available space.

The padding that keeps content off the screen edge is **fluid**: it is 16px on a phone and
grows with the viewport until it stops at 40px. That single value replaces the old fixed steps
(16px / 24px / 32px) and means every width in between is handled, not just the breakpoints.

## In our code

The shell is `src/components/layout/AppLayout.tsx`. Its header and its content wrapper both
reuse one shared string from `src/components/ui/styles.ts`:

```ts
export const pageContainer =
  'mx-auto w-full px-[clamp(1rem,2.5vw,2.5rem)]';
```

Line by line:

- `mx-auto w-full` — fill the available width, centered.
- `px-[clamp(1rem,2.5vw,2.5rem)]` — `clamp(min, preferred, max)`: at least `1rem` (16px),
  at most `2.5rem` (40px), otherwise `2.5vw` (2.5% of the viewport width).

At the widths we test, the padding works out to roughly:

| Viewport | Side padding | Container |
|---|---|---|
| 375px | 16px | full width |
| 768px | 19px | full width |
| 1024px | 26px | full width |
| 1440px | 36px | full width |
| 1920px | 40px | full width |

Each page then constrains its own content with a second max-width, chosen by the task:

- **Every screen** uses the container as-is, filling the full width of the shell.
  `src/components/roadmaps/RoadmapGrid.tsx` fills it, but its column count follows
  the number of items, so a short list never leaves an empty column:

```ts
function gridClassName(tileCount: number): string {
  if (tileCount <= 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  if (tileCount === 3) return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
}
```

The count passed in is `overviews.length + 1`, because the "New roadmap" tile is a grid child
too. The loading skeleton calls the same function with `3`, so the placeholder shape matches.

- **Reading screens** (topic, review, quiz, editor) now fill the full shell width.
  They are centered *inside* the container, so they cover all available space on a wide page.

Below 768px the primary navigation leaves the header and becomes a bottom bar
(`md:hidden`); dialogs (`w-[min(30rem,calc(100%-2rem))]`) and the overflow menu
(`w-48 max-w-[calc(100vw-2rem)]`) are clamped to the viewport, so nothing overflows sideways.

## ❌ / ✅ examples

- ❌ Hard-coding `max-w-[1440px]` and fixed `px-4 md:px-6 xl:px-8`, so a 1920px monitor keeps
  the same 1440px box with 240px of unused space each side.
- ✅ Truly fluid `w-full` with `px-[clamp(1rem,2.5vw,2.5rem)]`, so the content covers the viewport.
- ❌ A static `sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` for one card, leaving dead columns.
- ✅ Let the column count follow the item count.
- ❌ Limiting reading screens to a fixed width like `max-w-3xl` or `max-w-4xl`.
- ✅ Truly fluid `w-full` for all screens, so the content covers the entire viewport.

## Try it yourself

1. Set the browser to 375px, 768px, 1024px, 1440px, and 1920px. Confirm the content never
   scrolls horizontally and that the header and the content share the same left edge.
2. Add one roadmap, then three, then eight. Watch the home grid go 2 → 3 → 4 columns and confirm
   there is never an empty column beside a lone card.
3. Open Review and the quiz runner at 1920px. Confirm the content covers all available
   space rather than being restricted to a narrow column.

## Quick Reference

- `pageContainer` — the shared shell container; compose it with `flex …` classes.
- `mx-auto w-full` — centered and truly fluid, covers all spaces on all pages.
- `px-[clamp(1rem,2.5vw,2.5rem)]` — fluid side padding: 16px minimum, 40px maximum.
- `sm:` 640px · `md:` 768px · `lg:` 1024px · `xl:` 1280px · `2xl:` 1536px — the Tailwind steps.
- `md:hidden` on the bottom nav / `hidden md:flex` on the top-bar nav — the nav swap at 768px.
- `w-[min(30rem,calc(100%-2rem))]` — a dialog that always fits the viewport.

## Key Takeaways

- One container constant keeps the header and every page aligned and easy to change.
- Fluid padding beats fixed breakpoint steps because it covers every width in between.
- Wide is for everything; line length follows the full container width.
- Grids should follow the item count so short lists never look broken.
- Overflow safety comes from clamping dialogs and menus to the viewport, not from removing max-widths.

## Links to related files

- `DESIGN.md` §3 (Shape and spacing) and §6 (Screens → layout per screen) — the rules this code follows.
- `src/components/ui/styles.ts` — where `pageContainer` and the other shared class strings live.
- `src/components/layout/AppLayout.tsx` — the header, content wrapper, and bottom navigation.
- `src/components/roadmaps/RoadmapGrid.tsx` — the item-count grid.
- Builds on `02-tailwind-and-themes.md` (tokens and `@theme`).
