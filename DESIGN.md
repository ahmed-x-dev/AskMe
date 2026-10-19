# DESIGN.md: Revision Quiz App

Design system for the app described in `PLAN.md`. Style name: **Soft cards**.
Agents: use only the tokens in this file. Do not invent new colors, radii or font sizes. If something is missing, add it here first.

## 1. Principles

- Fast, calm, readable. Short study sessions on a phone.
- Mobile first. Reading-focused screens stay centered in a column; the library expands on large displays.
- This describes the responsive layout, not release order: web first, desktop second, and mobile through the PWA.
- Two themes only: light (soft off-white) and dark (layered charcoal with a green tint). No third theme.
- Soft filled cards, no shadows, no gradients. Cards stay borderless; form controls and neutral buttons use a subtle boundary so they remain easy to identify.
- One accent color (green). Meaning is never carried by color alone: correct and wrong states also show an icon.
- Neutrals are tinted slightly toward the accent hue so the whole UI feels like one family.
- Depth comes from lightness steps (`--bg` → `--card` → `--card-elevated` → `--card-hover`), not from shadows. The dark theme keeps `--bg` clearly lighter than black so surfaces read as layers, not as one flat void.
- Light and dark are two designed versions of the same product: the same surface ramp, the same semantic roles, and the same accent hue family. Only the direction of the ramp and the depth of the accent change.

## 2. Colors

Define all colors as CSS variables. Components use the variables, never raw hex.

### Surfaces

Four neutral surfaces form one lightness ramp. Every element sits on the step below it, so a control is never invisible on its own background.

| Role | Token | Used by |
|---|---|---|
| Page | `--bg` | App background, sticky header and bottom navigation, insets inside a `--card` panel |
| Resting surface | `--card` | Cards, option rows, inputs and selects on the page, insets inside a floating surface |
| Floating surface | `--card-elevated` | Dialogs, overflow menus, popovers, bottom sheets — anything that overlaps other content |
| Interactive state | `--card-hover` | Hover and press feedback on any surface above |

Lightness order differs by theme, because light themes add depth by darkening and dark themes by lightening:

- Light, darkest to lightest: `--card-hover` → `--card` → `--bg` → `--card-elevated`
- Dark, darkest to lightest: `--bg` → `--card` → `--card-elevated` → `--card-hover`

Two rules follow:

- A field or option row inside a surface uses the step below that surface. On `--bg` and on `--card-elevated` it is `--card`; inside a `--card` panel it is `--bg`.
- `--card-hover` is always further from the surface than the surface is from the page, so hovering stays visible on cards, panels and menus alike.

### Light theme (`data-theme="light"`)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FBFCFB` | App background |
| `--card` | `#E9EEEB` | Cards, option rows, inputs, menus on the page |
| `--card-elevated` | `#FFFFFF` | Dialogs, menus, popovers |
| `--card-hover` | `#DFE6E2` | Pressed and hover state of any surface |
| `--line` | `#C4D0C9` | Control and divider boundaries (inputs, selects, neutral buttons, separators) |
| `--fg` | `#121715` | Primary text |
| `--muted` | `#545E59` | Secondary text, inactive icons |
| `--accent` | `#09785E` | Primary button fill, progress fill, focus ring, selected outline |
| `--on-accent` | `#FFFFFF` | Text and icons on `--accent` |
| `--accent-text` | `#096A53` | Accent used as text or icon on `--bg`, `--card`, `--card-elevated` or `--card-hover` |
| `--ok-bg` | `#DDF3E8` | Correct answer fill, MCQ chip fill |
| `--ok-fg` | `#0A6B4D` | Text and icon on `--ok-bg` |
| `--bad-bg` | `#FCE9E7` | Wrong answer fill |
| `--bad-fg` | `#B3261E` | Text and icon on `--bad-bg`, delete actions |
| `--warn-bg` | `#FFF1CC` | Warning banners |
| `--warn-fg` | `#7A5200` | Text and icon on `--warn-bg` |
| `--essay-bg` | `#E6EAFB` | Essay chip fill |
| `--essay-fg` | `#3B47A8` | Text on `--essay-bg` |
| `--overlay` | `#000000 / 40%` | Dialog and bottom-sheet backdrop |

### Dark theme (`data-theme="dark"`)

Dark is a layered charcoal with a green tint, not black. `--bg` sits at about 9% lightness so surfaces read as steps, never as one flat void.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#151B19` | App background |
| `--card` | `#242F2A` | Cards, option rows, inputs, menus on the page |
| `--card-elevated` | `#2E3A34` | Dialogs, menus, popovers |
| `--card-hover` | `#39463F` | Pressed and hover state of any surface |
| `--line` | `#44524B` | Control and divider boundaries |
| `--fg` | `#EDF3EF` | Primary text |
| `--muted` | `#AAB5AE` | Secondary text, inactive icons |
| `--accent` | `#3DD6A5` | Primary button fill, progress fill, focus ring, selected outline |
| `--on-accent` | `#06100C` | Text and icons on `--accent` |
| `--accent-text` | `#4FD9AC` | Accent used as text or icon on any dark surface |
| `--ok-bg` | `#14322A` | Correct answer fill, MCQ chip fill |
| `--ok-fg` | `#7CE8C1` | Text and icon on `--ok-bg` |
| `--bad-bg` | `#3B1C20` | Wrong answer fill |
| `--bad-fg` | `#FFA69E` | Text and icon on `--bad-bg`, delete actions |
| `--warn-bg` | `#342A0F` | Warning banners |
| `--warn-fg` | `#F3C65F` | Text and icon on `--warn-bg` |
| `--essay-bg` | `#232B57` | Essay chip fill |
| `--essay-fg` | `#C4CBFF` | Text on `--essay-bg` |
| `--overlay` | `#000000 / 55%` | Dialog and bottom-sheet backdrop |


### Contrast results (WCAG relative luminance)

Calculated from the hex values above. Re-check whenever a token changes.

| Pair | Light | Dark |
|---|---|---|
| `--fg` on `--bg` | 17.6 | 15.5 |
| `--fg` on `--card` | 15.4 | 12.3 |
| `--fg` on `--card-elevated` | 18.1 | 10.5 |
| `--muted` on `--bg` | 6.5 | 8.3 |
| `--muted` on `--card` | 5.7 | 6.6 |
| `--muted` on `--card-elevated` | 6.7 | 5.6 |
| `--muted` on `--card-hover` | 5.3 | 4.7 |
| `--on-accent` on `--accent` | 5.4 | 10.5 |
| `--accent-text` on `--bg` | 6.4 | 9.9 |
| `--accent-text` on `--card` | 5.6 | 7.8 |
| `--accent-text` on `--card-elevated` | 6.6 | 6.7 |
| `--accent-text` on `--card-hover` | 5.2 | 5.6 |
| `--ok-fg` on `--ok-bg` | 5.6 | 9.3 |
| `--bad-fg` on `--bad-bg` | 5.6 | 8.2 |
| `--bad-fg` on `--bg` | 6.4 | 9.3 |
| `--warn-fg` on `--warn-bg` | 6.2 | 8.8 |
| `--essay-fg` on `--essay-bg` | 6.6 | 8.6 |
| `--accent` on `--bg` (focus ring, non-text) | 5.3 | 9.5 |
| `--card` vs `--bg` (separation, not text) | 1.1 | 1.3 |
| `--card-elevated` vs `--card` (separation) | 1.2 | 1.2 |
| `--card-hover` vs `--card-elevated` (separation) | 1.3 | 1.2 |
| `--line` vs `--card` (separation, not text) | 1.4 | 1.7 |

Every text pair clears the 4.5:1 target. Card separation stays intentionally subtle (no borders, no shadows), but each dark step is a real jump in luminance — `--bg` 0.010, `--card` 0.026, `--card-elevated` 0.039, `--card-hover` 0.056 — so cards never merge into the page and floating surfaces never merge into cards. `--line` is a separate, slightly stronger step so inputs and neutral buttons stay identifiable on any surface without looking heavy.

### Rules

- Text on a colored fill always uses the matching `*-fg` or `--on-accent` token.
- Contrast target: 4.5:1 for normal text, 3:1 for boundaries and the focus ring. The light `--accent` is deliberately deep so white button text and accent text on cards both pass.
- Light accent is deeper, dark accent is brighter. Never reuse the same hex in both themes.
- The dark accent is a muted mint-green, not a neon green: it is used as a fill and a thin ring, never as large glowing text.
- Dark tinted fills (`--ok-bg`, `--bad-bg`, `--warn-bg`, `--essay-bg`) stay dark and low-saturation. The bright color lives only in the text and icon.
- Use `--accent` for action, progress and focus only. Correct, wrong and essay each own their own hue; no color has two meanings.
- Do not use `--ok-*` for anything except correct answers, MCQ chips and success states. Never use `--ok-bg` as a solid button-like fill.
- Grayscale test: screenshots of both themes in grayscale must still show correct vs wrong through icon and position.
- Theme is stored as `light` or `dark`, set as `data-theme` on `<html>`, and persists across reloads.
- Neutral surfaces only ever step `--bg` → `--card` → `--card-elevated` → `--card-hover`; boundaries always use `--line`. Do not invent a fifth surface or a second border color.
- Never use pure black, a gradient, or a glow. Dark `--bg` stays above `#101010` so the theme reads as charcoal.

### Optional accent: deep teal

To separate the accent further from the "correct" green, swap only `--accent` and `--accent-text`:

| Token | Light | Dark |
|---|---|---|
| `--accent` / `--accent-text` | `#0F766E` | `#2DD4BF` |

Re-run the contrast check before adopting it. Do not ship both accents.

### CSS skeleton (Tailwind v4)

```css
@import "tailwindcss";

:root,
[data-theme="light"] {
  color-scheme: light;
  --bg: #fbfcfb;
  --card: #e9eeeb;
  --card-elevated: #ffffff;
  --card-hover: #dfe6e2;
  --line: #c4d0c9;
  --fg: #121715;
  --muted: #545e59;
  --accent: #09785e;
  --on-accent: #ffffff;
  --accent-text: #096a53;
  --ok-bg: #ddf3e8;
  --ok-fg: #0a6b4d;
  --bad-bg: #fce9e7;
  --bad-fg: #b3261e;
  --warn-bg: #fff1cc;
  --warn-fg: #7a5200;
  --essay-bg: #e6eafb;
  --essay-fg: #3b47a8;
  --overlay: rgb(0 0 0 / 0.4);
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg: #151b19;
  --card: #242f2a;
  --card-elevated: #2e3a34;
  --card-hover: #39463f;
  --line: #44524b;
  --fg: #edf3ef;
  --muted: #aab5ae;
  --accent: #3dd6a5;
  --on-accent: #06100c;
  --accent-text: #4fd9ac;
  --ok-bg: #14322a;
  --ok-fg: #7ce8c1;
  --bad-bg: #3b1c20;
  --bad-fg: #ffa69e;
  --warn-bg: #342a0f;
  --warn-fg: #f3c65f;
  --essay-bg: #232b57;
  --essay-fg: #c4cbff;
  --overlay: rgb(0 0 0 / 0.55);
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
  --color-card-elevated: var(--card-elevated);
  --color-card-hover: var(--card-hover);
  --color-line: var(--line);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-on-accent: var(--on-accent);
  --color-accent-text: var(--accent-text);
  --color-ok-bg: var(--ok-bg);
  --color-ok-fg: var(--ok-fg);
  --color-bad-bg: var(--bad-bg);
  --color-bad-fg: var(--bad-fg);
  --color-warn-bg: var(--warn-bg);
  --color-warn-fg: var(--warn-fg);
  --color-essay-bg: var(--essay-bg);
  --color-essay-fg: var(--essay-fg);
  --color-overlay: var(--overlay);
}
```

This gives utilities such as `bg-bg`, `bg-card`, `bg-card-elevated`, `bg-card-hover`, `border-line`, `text-muted`, `bg-accent text-on-accent`.

## 3. Shape and spacing

| Element | Radius |
|---|---|
| Page cards (set card, question card) | 16px |
| Option rows, inputs, small cards | 14px |
| Buttons | 16px |
| Chips, progress bar | fully rounded |
| Index badges (A, B, C, D) | 6px |

- Spacing scale: 4, 8, 12, 16, 24, 32 px. Nothing else, apart from the shell's fluid side padding described next.
- Screen side padding: fluid at `clamp(16px, 2.5vw, 40px)` — 16px on phones, growing with the viewport and capping at 40px on wide monitors — plus safe-area insets.
- Minimum tap target: 48px height for buttons and option rows, 44px for icon buttons.
- Wide screens: the shell is fluid and centered; it covers the full viewport width without leaving unused margins on the left or right. Content cards stretch with the grid to fill the available space.
- Every screen is truly fluid and full-width, centered inside the shell; content stretches to fill the available space regardless of the task. Line lengths for text-heavy content (topic notes, quiz questions) follow the container width.
- List and grid screens use the width: the roadmap list is `1 → 2 → 3 → 4` columns (from 640px / 1024px / 1536px). The column count also follows the number of items, so a list with only one or two entries never leaves empty columns at a breakpoint.
- Reorderable lists stay single column so drag-and-drop ordering stays predictable.
- Roadmap detail is full-width. Reorderable group sections stretch to fill the viewport.
- Above 1024px, settings pairs its sections in two columns (primary content plus a secondary rail) so a laptop or monitor is used instead of a single tall column.
- Cards have no borders. Inputs, text areas, selects, and neutral buttons have a 1px solid `--line` boundary. Separation for cards and floating surfaces still comes from the lightness ramp (`--card` on `--bg`, `--card-elevated` on `--card`); the 2px `--accent` selected-state outline and focus ring remain distinct from this control boundary.
- Dividers and section separators use 1px `--line` at low emphasis; never a full border on a card.
- Sticky chrome (top bar, bottom navigation) sits on `--bg` with a single `--line` separator, so content keeps the surface ramp to itself.
- No shadows and no gradients anywhere.

## 4. Typography

- One sans-serif family for the whole app. Prefer the locally available Inter font, then `Segoe UI` and the platform sans-serif fallback; do not rely on a remote font download. Weights: 400 and 500 only.
- Arabic content: add an Arabic font to the stack (for example Noto Sans Arabic). Use CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) instead of left and right so RTL works. No letter-spacing on Arabic text.

| Role | Size / line height | Weight |
|---|---|---|
| App title (home) | 28px, scaling to 34px on wide screens (`clamp(1.75rem, 3.5vw, 2.125rem)`) | 500 |
| Screen title | 22px / 28px | 500 |
| Section title | 16px / 24px | 500 |
| Question text (quiz) | 18px / 28px | 500 |
| Body, option text | 16px / 24px | 400 |
| Card title | 16px / 24px | 500 |
| Card title (large, home grid, roadmap header) | 18px / 26px | 500 |
| Secondary text, chips, captions | 13px / 18px | 400 or 500 |
| Score number | 40px / 44px | 500 |

- Headings stay modest: no title is larger than the app title, and the app title never exceeds 34px. Avoid multi-line oversized headings.

- Sentence case everywhere. No ALL CAPS.
- Numbers that change (question index `3/10`, score, counts) use tabular numerals: `font-variant-numeric: tabular-nums`.
- Question text line length: aim for 52 to 68 characters on wide screens.

## 5. Components

Shared style is centralized in `src/components/ui/` so every surface matches. Buttons and fields each have a single exported class constant in `src/components/ui/styles.ts` (`buttonPrimary`, `buttonSecondary`, `buttonSecondaryOnCard`, `buttonSecondaryCompact`, `buttonGhost`, `buttonDestructive`, `buttonDanger`, `iconButton`, `fieldClassName`, `fieldOnCardClassName`, `menuSurface`, `pageContainer`) that components reuse; do not hand-write a new button or field string per screen.

### Navigation / shell
- A single sticky top bar sits above all content: brand on the start side, primary navigation in the middle (or beside the brand on wide screens), and theme/account controls on the end side.
- Primary navigation (Roadmaps, Review, Settings) is visible on **every** route, not only home. The active route is marked with `text-fg` plus an accent underline or pill; inactive items are `text-muted`.
- The Roadmaps item remains active on roadmap and topic detail routes. Review and Settings are active only on their own route trees; a URL substring that merely starts with a route name is not enough.
- On screens narrower than 768px the top-bar links collapse into a bottom navigation bar with three labeled icon targets (Roadmaps, Review, Settings); the Review target keeps its due badge.
- The shell is full-width and fluid with side padding (`clamp(16px, 2.5vw, 40px)`). Back links appear on detail routes in place of the brand subtitle.
- The theme toggle is an icon button with an `aria-label` that reflects the next action ("Switch to dark theme").

### Button
- **Primary:** `bg-accent text-on-accent`, height 48px, radius 16px, weight 500. Pressed: `scale(0.98)`. Use one primary button per decision area; separate cards may each have their own primary action.
- **Secondary:** `bg-card text-fg`, 1px solid `--line`, same size. Pressed or hover: `bg-card-hover`.
- **Secondary (on a card):** the same button with `bg-bg`, for controls that sit inside a `bg-card` panel (settings sections, question editor, quiz setup). Never place a `bg-card` control directly on a `bg-card` surface. Inside a floating `bg-card-elevated` surface the standard `bg-card` secondary already sits one step below, so use that one.
- **Compact secondary:** `w-fit`, 13px label, used for back links and inline row actions such as "Quiz group".
- **Ghost / text:** no fill, `text-accent-text`, weight 500.
- **Destructive text:** `text-bad-fg`. Destructive actions always ask for confirmation.
- **Destructive trigger:** outlined `border border-line bg-bg text-bad-fg` (for example "Delete question", "Reset all data"). It stands out from neutral buttons but never competes with the primary action.
- **Destructive confirm:** filled `bg-bad-bg text-bad-fg` with a trash icon. Used only as the confirm button inside a confirm dialog.
- Do not use disabled buttons when a message can explain why (for example "No essay questions in this set"). When a temporary request is running, disable only its initiating button, set `aria-busy="true"`, and replace its label with a short progress label such as “Saving…” or “Generating…”.
- Icon-only buttons are 44px square, `bg-card`, radius 14px, `--line` boundary when they act as a standalone control (for example the overflow menu), `aria-label` required.

**State rules:** Disabled controls use 60% opacity and `cursor: not-allowed`. Invalid fields use a 1px `--bad-fg` boundary, `aria-invalid="true"`, and an error message linked with `aria-describedby`; keyboard focus still uses the accent focus ring. Success and error messages include an icon and are announced with `role="status"` or `role="alert"`.

### Card
`bg-card`, radius 16px, padding 12px to 16px, no border. Tappable cards use `bg-card-hover` when pressed or hovered. On wide screens cards in a grid stretch to fill their column; do not cap a card at a narrow fixed width. A box nested inside a card (an AI result, a reference answer, an inset row) uses `bg-bg` so it does not disappear into its parent.

### Option button (MCQ)
Full-width row, `bg-card`, radius 14px, min height 48px, padding 12px, 1px `--line` boundary. Left: index badge A to D (20px square, `bg-bg`, 6px radius, 13px text). Then the option text.

| State | Style |
|---|---|
| idle | `bg-card text-fg` |
| pressed / hover | `bg-card-hover text-fg` |
| selected (before submit, if used) | 2px outline `--accent` |
| correct (revealed) | `bg-ok-bg text-ok-fg`, check icon on the end side |
| wrong (revealed) | `bg-bad-bg text-bad-fg`, X icon on the end side |

After an answer, the correct option is always revealed. Options stop accepting taps.

### Chips
Rounded-full, 13px, weight 500, padding 2px 10px.
- MCQ: `bg-ok-bg text-ok-fg`
- Essay: `bg-essay-bg text-essay-fg`

### Progress bar
Height 6px, fully rounded. Track `bg-card-hover`, fill `bg-accent`, width animates with a short transition. Shown at the top of quiz screens with `n/total` beside it.

### Inputs and text areas
`bg-card`, radius 14px, padding 12px, 1px solid `--line`, placeholder `text-muted`. Focus: 2px outline `--accent`. Errors: message below in `text-bad-fg` plus an icon. Selects use the same boundary and focus treatment. A field always takes the step below its surface: on the page and inside a dialog or menu it is `bg-card` (`fieldClassName`); inside a `bg-card` panel (settings section, question editor, quiz setup) it is `bg-bg` (`fieldOnCardClassName`).

### Checkbox, radio, and switch

Use a 20px control with a 1px `--line` boundary on `bg-card`. Its label is body text and the whole label/control pair has a 48px minimum tap target. Checked state is `bg-accent text-on-accent` with a check or selected indicator; disabled state follows the shared state rules. Never rely on the checked color without the visible indicator.

### Segmented control (MCQ | Essay)
Container `bg-card`, radius 14px, padding 3px, no border. Active segment `bg-accent text-on-accent`, inactive `text-muted`, inactive hover `bg-card-hover text-fg`. The inner radius is 11px (container radius minus padding). Pass `onCard` when the control sits inside a `bg-card` panel; the container then uses `bg-bg` so the seam stays visible. Segments have a 48px minimum tap height, a visible focus ring against the container surface, and support standard button keyboard activation. Disabled segments use the shared disabled opacity and cursor. The same rule applies to any custom segmented control.

### Overflow menu, bottom sheet, confirm dialog
Surface `bg-card-elevated`, radius 16px, 1px `--line` boundary, backdrop `bg-overlay`. Floating surfaces always sit one step above the content they cover, so a menu opened from a card never blends into that card. Fields inside them use `bg-card`. Menus align to the trigger's end edge, flip above it when needed, stay inside viewport boundaries, and escape ancestor clipping. Action menus support arrow, Home/End, Escape, and Tab navigation; disabled actions are skipped. Dialogs fit the viewport, scroll their own content without chaining the page, focus within the native modal, restore focus when closed, and block Escape/backdrop dismissal while saving. Confirm dialogs have a ghost Cancel and a destructive confirm.

### Empty state
A bordered-dashed or `bg-card` panel with an icon tile (24px, `text-muted`), a one-line title, a one-line body (`max-width` about 40ch), and a primary button that creates something. Center it within the content area. Do not write "Nothing here yet".

### Loading and error states
- Loading uses `role="status"` text plus skeleton blocks that match the shape of the content being loaded (same radius and surface), never a blank screen.
- Errors use the shared banner (`bg-bad-bg text-bad-fg`, icon, `role="alert"`) for page-level problems and inline text for field-level problems. When a safe recovery exists, give the banner a clearly labeled action; never make recovery depend on color.
- Inputs show concise helper text where constraints are not obvious. Invalid input uses `aria-invalid="true"` and a message referenced by `aria-describedby`; temporary submissions disable the initiating action and announce the pending label.

### Icons
Use one outline icon set at 1.5px stroke (for example Tabler or Lucide). Sizes: 16px inline, 20px in rows, 24px in empty states. Icon-only buttons must have an `aria-label`.

## 6. Screens

| Screen | Route | Key content |
|---|---|---|
| Roadmaps (home) | `/` | Backup reminder, "Today" summary, roadmap cards (icon, title, topic/question counts, due badge, overflow menu), "New roadmap" primary button, empty state |
| Roadmap detail | `/roadmap/:id` | Roadmap header (icon, title, counts, progress), "Quiz all topics" and "New group" actions, group sections with draggable topic rows, "Add topic" inline form |
| Topic | `/topic/:id` | Back link, title, status chip, overflow menu, resources list, notes editor, question list with type chips and "Add question"/"Generate with AI" |
| Question editor | `/topic/:id/q/:qid` | MCQ/Essay toggle, question text, difficulty, tags, options with a correct-answer selector, reference answer (essay), Save/Delete |
| New question | `/topic/:id/q/new` | Same editor without Delete |
| Topic quiz | `/topic/:id/quiz` | Setup (type, difficulty, limit, mistakes-only) then runner then results |
| Roadmap quiz | `/roadmap/:id/quiz` | Topic picker, then the same setup/runner/results flow across topics |
| Review | `/review` | Due count, breakdown by roadmap, "Start review" |
| Settings | `/settings` | Light/dark theme, AI provider key, data backup/restore/import/reset |

Layout per screen:
- Home is a grid that uses the full shell width (`1 → 2 → 3 → 4` columns, fewer when the list is short).
- Roadmap detail, topic, question editor, quiz setup, quiz runner, quiz results, and review use the full shell width.
- Settings pairs its sections in two columns above 1024px.
- Every screen keeps the header actions visible and reachable; on phones the primary action may sit in a sticky footer.

Quiz-flow rules:
- The question text and the options must fit on one phone screen without scrolling for typical questions.
- Essay answers can be written before revealing the reference answer; after reveal, the learner marks the response right or wrong before continuing.
- A mode card is shown but explains itself when it has 0 questions.

## 7. Motion

- Short and subtle: 150 to 200ms ease-out for press, selection and progress changes.
- Respect `prefers-reduced-motion`: remove transforms and keep only opacity changes.

## 8. Accessibility checklist

- Text contrast at least 4.5:1 in both themes, and at least 3:1 for control boundaries and the focus ring (see the contrast table in section 2).
- Surfaces are distinguishable without borders: page, card, floating surface and hover state each differ in luminance in both themes.
- Correct and wrong states always include an icon, not only color.
- Visible focus ring (2px `--accent` outline, 2px offset) on every interactive element.
- Touch targets as in section 3.
- Respect safe areas and the on-screen keyboard.

## 9. Out of scope for P1

Do not build these until their phase: sync status indicator (P3), Gemini key and grading UI (P2), streaks, mastery levels and spaced repetition (P5), tablet dual-pane layout, countdown timers.
