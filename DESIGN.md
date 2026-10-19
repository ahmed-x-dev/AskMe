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
- Depth comes from lightness steps (`--bg` → `--card` → `--card-hover`), not from shadows. The dark theme keeps `--bg` clearly lighter than black so surfaces read as layers, not as one flat void.

## 2. Colors

Define all colors as CSS variables. Components use the variables, never raw hex.

### Light theme (`data-theme="light"`)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FBFCFB` | App background |
| `--card` | `#EDF1EF` | Cards, option rows, inputs |
| `--card-hover` | `#E4EAE7` | Pressed and hover state of cards, option rows, secondary buttons |
| `--line` | `#C9D4CE` | Control and divider boundaries (inputs, selects, neutral buttons, separators) |
| `--fg` | `#121715` | Primary text |
| `--muted` | `#57615C` | Secondary text, inactive icons |
| `--accent` | `#09785E` | Primary button fill, progress fill, selected outline |
| `--on-accent` | `#FFFFFF` | Text and icons on `--accent` |
| `--accent-text` | `#096A53` | Accent used as text or icon on `--bg`, `--card` or `--card-hover` |
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

| Token | Hex |
|---|---|
| `--bg` | `#131917` |
| `--card` | `#24312D` |
| `--card-hover` | `#303E39` |
| `--line` | `#43524C` |
| `--fg` | `#E9EFEC` |
| `--muted` | `#9AA8A3` |
| `--accent` | `#3DD6A5` |
| `--on-accent` | `#06100C` |
| `--accent-text` | `#46DFAE` |
| `--ok-bg` | `#12322A` |
| `--ok-fg` | `#7BE8C0` |
| `--bad-bg` | `#3A1A1E` |
| `--bad-fg` | `#FFA39B` |
| `--warn-bg` | `#33270B` |
| `--warn-fg` | `#F2C45A` |
| `--essay-bg` | `#232A5C` |
| `--essay-fg` | `#C2C9FF` |
| `--overlay` | `#000000 / 55%` |

### Contrast results (WCAG relative luminance)

Calculated from the hex values above. Re-check whenever a token changes.

| Pair | Light | Dark |
|---|---|---|
| `--fg` on `--bg` | 17.6 | 15.3 |
| `--fg` on `--card` | 15.9 | 11.6 |
| `--muted` on `--bg` | 6.2 | 7.2 |
| `--muted` on `--card` | 5.6 | 5.5 |
| `--on-accent` on `--accent` | 5.4 | 10.4 |
| `--accent-text` on `--bg` | 6.4 | 10.5 |
| `--accent-text` on `--card` | 5.8 | 8.0 |
| `--accent-text` on `--card-hover` | 5.4 | 6.6 |
| `--ok-fg` on `--ok-bg` | 5.6 | 9.3 |
| `--bad-fg` on `--bad-bg` | 5.6 | 8.1 |
| `--warn-fg` on `--warn-bg` | 6.2 | 8.9 |
| `--essay-fg` on `--essay-bg` | 6.6 | 8.4 |
| `--card` vs `--bg` (separation, not text) | 1.1 | 1.3 |
| `--line` vs `--card` (separation, not text) | 1.3 | 1.6 |

Card separation is intentionally subtle (no borders, no shadows) but the dark theme keeps a full lightness step between `--bg` and `--card` so cards never merge into the page. Control boundaries use `--line`, which is a separate, slightly stronger step than `--card-hover` so inputs and neutral buttons stay identifiable on any surface without looking heavy.

### Rules

- Text on a colored fill always uses the matching `*-fg` or `--on-accent` token.
- Contrast target: 4.5:1 for normal text. The light `--accent` is deliberately deep so white button text and accent text on cards both pass.
- Light accent is deeper, dark accent is brighter. Never reuse the same hex in both themes.
- Dark tinted fills (`--ok-bg`, `--bad-bg`, `--warn-bg`, `--essay-bg`) stay dark and low-saturation. The bright color lives only in the text and icon.
- Use `--accent` for action and progress only. Correct, wrong and essay each own their own hue; no color has two meanings.
- Do not use `--ok-*` for anything except correct answers, MCQ chips and success states. Never use `--ok-bg` as a solid button-like fill.
- Grayscale test: screenshots of both themes in grayscale must still show correct vs wrong through icon and position.
- Theme is stored as `light` or `dark`, set as `data-theme` on `<html>`, and persists across reloads.
- Neutral surfaces only ever step `--bg` → `--card` → `--card-hover`; boundaries use `--line`. Do not invent a fourth surface or a second border color.

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
  --bg: #fbfcfb;
  --card: #edf1ef;
  --card-hover: #e4eae7;
  --line: #c9d4ce;
  --fg: #121715;
  --muted: #57615c;
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
  --bg: #131917;
  --card: #24312d;
  --card-hover: #303e39;
  --line: #43524c;
  --fg: #e9efec;
  --muted: #9aa8a3;
  --accent: #3dd6a5;
  --on-accent: #06100c;
  --accent-text: #46dfae;
  --ok-bg: #12322a;
  --ok-fg: #7be8c0;
  --bad-bg: #3a1a1e;
  --bad-fg: #ffa39b;
  --warn-bg: #33270b;
  --warn-fg: #f2c45a;
  --essay-bg: #232a5c;
  --essay-fg: #c2c9ff;
  --overlay: rgb(0 0 0 / 0.55);
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
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

This gives utilities such as `bg-card`, `bg-card-hover`, `border-line`, `text-muted`, `bg-accent text-on-accent`.

## 3. Shape and spacing

| Element | Radius |
|---|---|
| Page cards (set card, question card) | 16px |
| Option rows, inputs, small cards | 14px |
| Buttons | 16px |
| Chips, progress bar | fully rounded |
| Index badges (A, B, C, D) | 6px |

- Spacing scale: 4, 8, 12, 16, 24, 32 px. Nothing else.
- Screen side padding: 16px on phones, 24px from 1024px, 32px from 1536px, plus safe-area insets.
- Minimum tap target: 48px height for buttons and option rows, 44px for icon buttons.
- Wide screens: the shell is fluid and centered with `max-width: 1440px` (full width up to `1600px` at 2xl); it never leaves large unused margins. Content cards stretch with the grid instead of sitting in a narrow column.
- Reading and focus screens stay bounded for line length: topic notes, quiz setup, the quiz runner, quiz results, question editing, and single-form dialogs center within `max-width: 768px` to `1024px` depending on the content. They are centered inside the shell, not floating in the page.
- List and grid screens use the width: the roadmap list is `1 → 2 → 3 → 4` columns (from 640px / 1024px / 1440px).
- Reorderable lists stay single column so drag-and-drop ordering stays predictable; the roadmap detail widens its column to `max-width: 1024px` instead of splitting into two columns.
- Above 1024px, settings pairs its sections in two columns (primary content plus a secondary rail) so a laptop or monitor is used instead of a single tall column.
- Cards have no borders. Inputs, text areas, selects, and neutral buttons have a 1px solid `--line` boundary. Separation for cards still comes from `--card` on `--bg`; the 2px `--accent` selected-state outline and focus ring remain distinct from this control boundary.
- Dividers and section separators use 1px `--line` at low emphasis; never a full border on a card.
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

Shared style is centralized in `src/components/ui/` so every surface matches. Buttons and fields each have a single exported class constant in `src/components/ui/styles.ts` (`buttonPrimary`, `buttonSecondary`, `buttonSecondaryOnCard`, `buttonSecondaryCompact`, `buttonGhost`, `buttonDestructive`, `buttonDanger`, `iconButton`, `fieldClassName`, `fieldOnCardClassName`, `menuSurface`) that components reuse; do not hand-write a new button or field string per screen.

### Navigation / shell
- A single sticky top bar sits above all content: brand on the start side, primary navigation in the middle (or beside the brand on wide screens), and theme/account controls on the end side.
- Primary navigation (Roadmaps, Review, Settings) is visible on **every** route, not only home. The active route is marked with `text-fg` plus an accent underline or pill; inactive items are `text-muted`.
- On screens narrower than 768px the top-bar links collapse into a bottom navigation bar with three labeled icon targets (Roadmaps, Review, Settings); the Review target keeps its due badge.
- The shell is `max-width: 1440px`, centered, with responsive side padding. Back links appear on detail routes in place of the brand subtitle.
- The theme toggle is an icon button with an `aria-label` that reflects the next action ("Switch to dark theme").

### Button
- **Primary:** `bg-accent text-on-accent`, height 48px, radius 16px, weight 500. Pressed: `scale(0.98)`. Use one primary button per decision area; separate cards may each have their own primary action.
- **Secondary:** `bg-card text-fg`, 1px solid `--line`, same size. Pressed or hover: `bg-card-hover`.
- **Secondary (on a card):** the same button with `bg-bg`, for controls that sit inside a `bg-card` panel (dialogs, settings sections). Never place a `bg-card` control directly on a `bg-card` surface.
- **Compact secondary:** `w-fit`, 13px label, used for back links and inline row actions such as "Quiz group".
- **Ghost / text:** no fill, `text-accent-text`, weight 500.
- **Destructive text:** `text-bad-fg`. Destructive actions always ask for confirmation.
- **Destructive trigger:** outlined `border border-line bg-bg text-bad-fg` (for example "Delete question", "Reset all data"). It stands out from neutral buttons but never competes with the primary action.
- **Destructive confirm:** filled `bg-bad-bg text-bad-fg` with a trash icon. Used only as the confirm button inside a confirm dialog.
- Do not use disabled buttons when a message can explain why (for example "No essay questions in this set"). When a temporary request is running, disable only its initiating button, set `aria-busy="true"`, and replace its label with a short progress label such as “Saving…” or “Generating…”.
- Icon-only buttons are 44px square, `bg-card`, radius 14px, `--line` boundary when they act as a standalone control (for example the overflow menu), `aria-label` required.

**State rules:** Disabled controls use 60% opacity and `cursor: not-allowed`. Invalid fields use a 1px `--bad-fg` boundary, `aria-invalid="true"`, and an error message linked with `aria-describedby`; keyboard focus still uses the accent focus ring. Success and error messages include an icon and are announced with `role="status"` or `role="alert"`.

### Card
`bg-card`, radius 16px, padding 12px to 16px, no border. Tappable cards use `bg-card-hover` when pressed or hovered. On wide screens cards in a grid stretch to fill their column; do not cap a card at a narrow fixed width.

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
`bg-card`, radius 14px, padding 12px, 1px solid `--line`, placeholder `text-muted`. Focus: 2px outline `--accent`. Errors: message below in `text-bad-fg` plus an icon. Selects use the same boundary and focus treatment. Inside a `bg-card` panel (dialog, settings section, question editor) fields and option rows use `bg-bg` so they stay visible against the panel.

### Checkbox, radio, and switch

Use a 20px control with a 1px `--line` boundary on `bg-card`. Its label is body text and the whole label/control pair has a 48px minimum tap target. Checked state is `bg-accent text-on-accent` with a check or selected indicator; disabled state follows the shared state rules. Never rely on the checked color without the visible indicator.

### Segmented control (MCQ | Essay)
Container `bg-card`, radius 14px, padding 3px, no border. Active segment `bg-accent text-on-accent`, inactive `text-muted`, inactive hover `bg-card-hover text-fg`. The inner radius is 11px (container radius minus padding). Inside a `bg-card` panel the container uses `bg-bg` instead, so the seam stays visible.

### Overflow menu, bottom sheet, confirm dialog
Surface `bg-card`, radius 16px, 1px `--line` boundary, backdrop `bg-overlay`. Menus align to the trigger's end edge and stay inside the viewport. Confirm dialogs have a ghost Cancel and a destructive confirm.

### Empty state
A bordered-dashed or `bg-card` panel with an icon tile (24px, `text-muted`), a one-line title, a one-line body (`max-width` about 40ch), and a primary button that creates something. Center it within the content area. Do not write "Nothing here yet".

### Loading and error states
- Loading uses `role="status"` text plus skeleton blocks that match the shape of the content being loaded (same radius and surface), never a blank screen.
- Errors use the shared banner (`bg-bad-bg text-bad-fg`, icon, `role="alert"`) for page-level problems and inline text for field-level problems.

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
- Home is a grid that uses the full shell width (`1 → 2 → 3 → 4` columns).
- Roadmap detail keeps a single, wider column (`max-width: 1024px`) because its group sections reorder by drag and drop.
- Topic, question editor, quiz setup, quiz runner, quiz results, and review stay centered and bounded (768px to 1024px) for reading.
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

- Text contrast at least 4.5:1 in both themes (see the contrast table in section 2).
- Correct and wrong states always include an icon, not only color.
- Visible focus ring (2px `--accent` outline, 2px offset) on every interactive element.
- Touch targets as in section 3.
- Respect safe areas and the on-screen keyboard.

## 9. Out of scope for P1

Do not build these until their phase: sync status indicator (P3), Gemini key and grading UI (P2), streaks, mastery levels and spaced repetition (P5), tablet dual-pane layout, countdown timers.
