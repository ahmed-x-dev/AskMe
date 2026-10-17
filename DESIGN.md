# DESIGN.md: Revision Quiz App

Design system for the app described in `PLAN.md`. Style name: **Soft cards**.
Agents: use only the tokens in this file. Do not invent new colors, radii or font sizes. If something is missing, add it here first.

## 1. Principles

- Fast, calm, readable. Short study sessions on a phone.
- Mobile first. Reading-focused screens stay centered in a column; the library expands on large displays.
- This describes the responsive layout, not release order: web first, desktop second, and mobile through the PWA.
- Two themes only: light (soft off-white) and dark (soft near-black). No third theme.
- Soft filled cards, no shadows, no gradients. Cards stay borderless; form controls and neutral buttons use a subtle boundary so they remain easy to identify.
- One accent color (green). Meaning is never carried by color alone: correct and wrong states also show an icon.
- Neutrals are tinted slightly toward the accent hue so the whole UI feels like one family.
- Depth comes from lightness steps (`--bg` → `--card` → `--card-hover`), not from shadows.

## 2. Colors

Define all colors as CSS variables. Components use the variables, never raw hex.

### Light theme (`data-theme="light"`)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FBFCFB` | App background |
| `--card` | `#EFF3F1` | Cards, option rows, inputs |
| `--card-hover` | `#E6ECE9` | Pressed and hover state of cards, option rows, secondary buttons |
| `--fg` | `#121715` | Primary text |
| `--muted` | `#5C6661` | Secondary text, inactive icons |
| `--accent` | `#09785E` | Primary button fill, progress fill, selected outline |
| `--on-accent` | `#FFFFFF` | Text and icons on `--accent` |
| `--accent-text` | `#09785E` | Accent used as text or icon on `--bg`, `--card` or `--card-hover` |
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
| `--bg` | `#0D1110` |
| `--card` | `#1E2523` |
| `--card-hover` | `#262F2C` |
| `--fg` | `#E8EEEB` |
| `--muted` | `#8C9893` |
| `--accent` | `#3DD6A5` |
| `--on-accent` | `#06100C` |
| `--accent-text` | `#3DD6A5` |
| `--ok-bg` | `#0F2F25` |
| `--ok-fg` | `#7BE8C0` |
| `--bad-bg` | `#34161A` |
| `--bad-fg` | `#FF9A92` |
| `--warn-bg` | `#2B2108` |
| `--warn-fg` | `#F2C45A` |
| `--essay-bg` | `#1E2350` |
| `--essay-fg` | `#B8C0FF` |
| `--overlay` | `#000000 / 48%` |

### Contrast results (WCAG relative luminance)

Calculated from the hex values above. Re-check whenever a token changes.

| Pair | Light | Dark |
|---|---|---|
| `--fg` on `--bg` | 17.6 | 16.2 |
| `--fg` on `--card` | 16.2 | 13.3 |
| `--muted` on `--bg` | 5.8 | 6.4 |
| `--muted` on `--card` | 5.3 | 5.2 |
| `--on-accent` on `--accent` | 5.4 | 10.5 |
| `--accent-text` on `--bg` | 5.3 | 10.3 |
| `--accent-text` on `--card` | 4.9 | 8.5 |
| `--accent-text` on `--card-hover` | 4.5 | 7.5 |
| `--ok-fg` on `--ok-bg` | 5.6 | 9.7 |
| `--bad-fg` on `--bad-bg` | 5.6 | 8.1 |
| `--warn-fg` on `--warn-bg` | 6.2 | 9.7 |
| `--essay-fg` on `--essay-bg` | 6.6 | 8.5 |
| `--card` vs `--bg` (separation, not text) | 1.1 | 1.2 |

Card separation is intentionally subtle (no borders, no shadows). If cards still look flat on a real device, lighten dark `--card` or darken light `--card` by one step. Do not add borders to cards.

### Rules

- Text on a colored fill always uses the matching `*-fg` or `--on-accent` token.
- Contrast target: 4.5:1 for normal text. The light `--accent` is deliberately deep so white button text and accent text on cards both pass.
- Light accent is deeper, dark accent is brighter. Never reuse the same hex in both themes.
- Dark tinted fills (`--ok-bg`, `--bad-bg`, `--warn-bg`, `--essay-bg`) stay dark and low-saturation. The bright color lives only in the text and icon.
- Use `--accent` for action and progress only. Correct, wrong and essay each own their own hue; no color has two meanings.
- Do not use `--ok-*` for anything except correct answers, MCQ chips and success states. Never use `--ok-bg` as a solid button-like fill.
- Grayscale test: screenshots of both themes in grayscale must still show correct vs wrong through icon and position.
- Theme is stored as `light` or `dark`, set as `data-theme` on `<html>`, and persists across reloads.

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
  --card: #eff3f1;
  --card-hover: #e6ece9;
  --fg: #121715;
  --muted: #5c6661;
  --accent: #09785e;
  --on-accent: #ffffff;
  --accent-text: #09785e;
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
  --bg: #0d1110;
  --card: #1e2523;
  --card-hover: #262f2c;
  --fg: #e8eeeb;
  --muted: #8c9893;
  --accent: #3dd6a5;
  --on-accent: #06100c;
  --accent-text: #3dd6a5;
  --ok-bg: #0f2f25;
  --ok-fg: #7be8c0;
  --bad-bg: #34161a;
  --bad-fg: #ff9a92;
  --warn-bg: #2b2108;
  --warn-fg: #f2c45a;
  --essay-bg: #1e2350;
  --essay-fg: #b8c0ff;
  --overlay: rgb(0 0 0 / 0.48);
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
  --color-card-hover: var(--card-hover);
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

This gives utilities such as `bg-card`, `bg-card-hover`, `text-muted`, `bg-accent text-on-accent`.

## 3. Shape and spacing

| Element | Radius |
|---|---|
| Page cards (set card, question card) | 16px |
| Option rows, inputs, small cards | 14px |
| Buttons | 16px |
| Chips, progress bar | fully rounded |
| Index badges (A, B, C, D) | 6px |

- Spacing scale: 4, 8, 12, 16, 24, 32 px. Nothing else.
- Screen side padding: 16px, plus safe-area insets.
- Minimum tap target: 48px height for buttons and option rows, 44px for icon buttons.
- At large widths, the shared app shell grows to `max-width: 1280px` and `1536px` at 2xl. Keep single-column settings and quiz results centered within 768px, and quiz setup, question editing, and active questions within 1024px. The set detail uses a two-column overview and AI helper, with its question cards in two columns. The Sets library uses 2 columns above 768px, 3 above 1024px, and 4 above 1536px; its intro text can grow to 600px and its empty state stays within 768px.
- Cards have no borders. Inputs, text areas, selects, and neutral buttons have a 1px solid `--card-hover` boundary. Separation for cards still comes from `--card` on `--bg`; the 2px `--accent` selected-state outline and focus ring remain distinct from this control boundary.
- No shadows and no gradients anywhere.

## 4. Typography

- One sans-serif family for the whole app. Prefer the locally available Inter font, then `Segoe UI` and the platform sans-serif fallback; do not rely on a remote font download. Weights: 400 and 500 only.
- Arabic content: add an Arabic font to the stack (for example Noto Sans Arabic). Use CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) instead of left and right so RTL works. No letter-spacing on Arabic text.

| Role | Size / line height | Weight |
|---|---|---|
| Screen title | 22px / 28px | 500 |
| Question text (quiz) | 18px / 28px | 500 |
| Body, option text | 16px / 24px | 400 |
| Card title | 16px / 24px | 500 |
| Secondary text, chips, captions | 13px / 18px | 400 or 500 |
| Score number | 40px / 44px | 500 |

- Sentence case everywhere. No ALL CAPS.
- Numbers that change (question index `3/10`, score, counts) use tabular numerals: `font-variant-numeric: tabular-nums`.
- Question text line length: aim for 52 to 68 characters on wide screens.

## 5. Components

### Button
- **Primary:** `bg-accent text-on-accent`, height 48px, radius 16px, weight 500. Pressed: `scale(0.98)`. Use one primary button per decision area; separate cards may each have their own primary action.
- **Secondary:** `bg-card text-fg`, 1px solid `--card-hover`, same size. Pressed or hover: `bg-card-hover`.
- **Ghost / text:** no fill, `text-accent-text`, weight 500.
- **Destructive text:** `text-bad-fg`. Destructive actions always ask for confirmation.
- Do not use disabled buttons when a message can explain why (for example "No essay questions in this set"). When a temporary request is running, disable only its initiating button, set `aria-busy="true"`, and replace its label with a short progress label such as “Saving…” or “Generating…”.

**State rules:** Disabled controls use 60% opacity and `cursor: not-allowed`. Invalid fields use a 1px `--bad-fg` boundary, `aria-invalid="true"`, and an error message linked with `aria-describedby`; keyboard focus still uses the accent focus ring. Success and error messages include an icon and are announced with `role="status"` or `role="alert"`.

### Card
`bg-card`, radius 16px, padding 12px to 16px, no border. Tappable cards use `bg-card-hover` when pressed or hovered.

### Option button (MCQ)
Full-width row, `bg-card`, radius 14px, min height 48px, padding 12px. Left: index badge A to D (20px square, `bg-bg`, 6px radius, 13px text). Then the option text.

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
Height 6px, fully rounded. Track `bg-card`, fill `bg-accent`, width animates with a short transition. Shown at the top of quiz screens with `n/total` beside it.

### Inputs and text areas
`bg-card`, radius 14px, padding 12px, 1px solid `--card-hover`, placeholder `text-muted`. Focus: 2px outline `--accent`. Errors: message below in `text-bad-fg` plus an icon. Selects use the same boundary and focus treatment.

### Checkbox, radio, and switch

Use a 20px control with a 1px `--card-hover` boundary on `bg-card`. Its label is body text and the whole label/control pair has a 48px minimum tap target. Checked state is `bg-accent text-on-accent` with a check or selected indicator; disabled state follows the shared state rules. Never rely on the checked color without the visible indicator.

### Segmented control (MCQ | Essay)
Container `bg-card`, radius 14px, padding 3px. Active segment `bg-accent text-on-accent`, inactive `text-muted`.

### Overflow menu, bottom sheet, confirm dialog
Surface `bg-bg` or `bg-card`, radius 16px, backdrop `bg-overlay`. Confirm dialogs have a ghost Cancel and a destructive confirm.

### Empty state
Icon (24px, `text-muted`), one-line title, one-line body, and a primary button that creates something. Do not write "Nothing here yet".

### Icons
Use one outline icon set at 1.5px stroke (for example Tabler or Lucide). Sizes: 16px inline, 20px in rows, 24px in empty states. Icon-only buttons must have an `aria-label`.

## 6. Screens (P1)

| Screen | Route | Key content |
|---|---|---|
| Sets | `/` | Set cards (title, question count, overflow menu), "New set" primary button, empty state |
| Set detail | `/set/:id` | Title, "Start quiz", question rows with type chip, "Add question" |
| Question editor | `/set/:id/q/:qid?` | MCQ/Essay segmented control, text area, options with correct-answer selector, reference answer (essay), Save |
| Quiz setup | `/set/:id/quiz` | Three mode cards: Random, MCQ only, Essay only, each with a count; selected card has the accent outline |
| Quiz: MCQ | `/set/:id/quiz` | Progress bar, question card, option buttons, Continue |
| Quiz: essay | `/set/:id/quiz` | Progress bar, question card with Essay chip, large answer area, Reveal reference, self-assessment choices, Next |
| Results | `/set/:id/quiz` | Score `8 / 10`, progress bar, list of missed questions, Retry, Back to set |
| Settings | `/settings` | Theme toggle (light, dark) |

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
