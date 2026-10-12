# DESIGN.md: Revision Quiz App

Design system for the app described in `PLAN.md`. Style name: **Soft cards**.
Agents: use only the tokens in this file. Do not invent new colors, radii or font sizes. If something is missing, add it here first.

## 1. Principles

- Fast, calm, readable. Short study sessions on a phone.
- Mobile first. Desktop is the same layout centered in a column.
- This describes the responsive layout, not release order: web first, desktop second, and mobile through the PWA.
- Two themes only: light (white) and dark (black). No third theme.
- Soft filled cards, no hairline borders, no shadows, no gradients.
- One accent color (green). Meaning is never carried by color alone: correct and wrong states also show an icon.

## 2. Colors

Define all colors as CSS variables. Components use the variables, never raw hex.

### Light theme (`data-theme="light"`)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | App background |
| `--card` | `#F3F4F6` | Cards, option rows, inputs |
| `--fg` | `#111111` | Primary text |
| `--muted` | `#6B6B6B` | Secondary text, inactive icons |
| `--accent` | `#0B8566` | Primary button fill, progress fill, selected outline |
| `--on-accent` | `#FFFFFF` | Text and icons on `--accent` |
| `--accent-text` | `#0B8566` | Accent used as text or icon on `--bg` or `--card` |
| `--ok-bg` | `#DFF5EC` | Correct answer fill, MCQ chip fill |
| `--ok-fg` | `#0A6B51` | Text and icon on `--ok-bg` |
| `--bad-bg` | `#FDE8E8` | Wrong answer fill |
| `--bad-fg` | `#B42318` | Text and icon on `--bad-bg`, delete actions |
| `--warn-bg` | `#FFF4D6` | Warning banners |
| `--warn-fg` | `#8A5A00` | Text and icon on `--warn-bg` |
| `--essay-bg` | `#EDE9FE` | Essay chip fill |
| `--essay-fg` | `#5B21B6` | Text on `--essay-bg` |

### Dark theme (`data-theme="dark"`)

| Token | Hex |
|---|---|
| `--bg` | `#000000` |
| `--card` | `#151515` |
| `--fg` | `#F2F2F2` |
| `--muted` | `#8A8A8A` |
| `--accent` | `#34D3A0` |
| `--on-accent` | `#000000` |
| `--accent-text` | `#34D3A0` |
| `--ok-bg` | `#0D2E24` |
| `--ok-fg` | `#6EE7BD` |
| `--bad-bg` | `#3A1212` |
| `--bad-fg` | `#FF8F86` |
| `--warn-bg` | `#2E2206` |
| `--warn-fg` | `#F5C451` |
| `--essay-bg` | `#2A1A5E` |
| `--essay-fg` | `#C4B5FD` |

### Rules

- Text on a colored fill always uses the matching `*-fg` or `--on-accent` token.
- Contrast target: 4.5:1 for normal text. The light `--accent` is deliberately a little darker than a typical mint green so white button text passes.
- Do not use `--ok-*` for anything except correct answers, MCQ chips and success states.
- Theme is stored as `light` or `dark`, set as `data-theme` on `<html>`, and persists across reloads.

### CSS skeleton (Tailwind v4)

```css
@import "tailwindcss";

:root,
[data-theme="light"] {
  --bg: #ffffff;
  --card: #f3f4f6;
  --fg: #111111;
  --muted: #6b6b6b;
  --accent: #0b8566;
  --on-accent: #ffffff;
  --accent-text: #0b8566;
  --ok-bg: #dff5ec;
  --ok-fg: #0a6b51;
  --bad-bg: #fde8e8;
  --bad-fg: #b42318;
  --warn-bg: #fff4d6;
  --warn-fg: #8a5a00;
  --essay-bg: #ede9fe;
  --essay-fg: #5b21b6;
}

[data-theme="dark"] {
  --bg: #000000;
  --card: #151515;
  --fg: #f2f2f2;
  --muted: #8a8a8a;
  --accent: #34d3a0;
  --on-accent: #000000;
  --accent-text: #34d3a0;
  --ok-bg: #0d2e24;
  --ok-fg: #6ee7bd;
  --bad-bg: #3a1212;
  --bad-fg: #ff8f86;
  --warn-bg: #2e2206;
  --warn-fg: #f5c451;
  --essay-bg: #2a1a5e;
  --essay-fg: #c4b5fd;
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
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
}
```

This gives utilities such as `bg-card`, `text-muted`, `bg-accent text-on-accent`.

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
- On desktop, center the app in a column with `max-width: 480px`. The Sets screen may use 2 columns above 768px.
- No borders on cards. Separation comes from `--card` on `--bg`. The only outlines allowed are the 2px `--accent` selected-state outline and the focus ring.
- No shadows and no gradients anywhere.

## 4. Typography

- One sans-serif family for the whole app (Inter, bundled locally so the PWA works offline). Weights: 400 and 500 only.
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
- **Primary:** `bg-accent text-on-accent`, height 48px, radius 16px, weight 500. Pressed: `scale(0.98)`. One primary button per screen.
- **Secondary:** `bg-card text-fg`, same size.
- **Ghost / text:** no fill, `text-accent-text`, weight 500.
- **Destructive text:** `text-bad-fg`. Destructive actions always ask for confirmation.
- Do not use disabled buttons when a message can explain why (for example "No essay questions in this set").

### Card
`bg-card`, radius 16px, padding 12px to 16px, no border.

### Option button (MCQ)
Full-width row, `bg-card`, radius 14px, min height 48px, padding 12px. Left: index badge A to D (20px square, `bg-bg`, 6px radius, 13px text). Then the option text.

| State | Style |
|---|---|
| idle | `bg-card text-fg` |
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
`bg-card`, radius 14px, padding 12px, no border, placeholder `text-muted`. Focus: 2px outline `--accent`. Errors: message below in `text-bad-fg` plus an icon.

### Segmented control (MCQ | Essay)
Container `bg-card`, radius 14px, padding 3px. Active segment `bg-accent text-on-accent`, inactive `text-muted`.

### Overflow menu, bottom sheet, confirm dialog
Surface `bg-bg` or `bg-card`, radius 16px, backdrop `rgba(0,0,0,0.4)`. Confirm dialogs have a ghost Cancel and a destructive confirm.

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
| Quiz setup | `/set/:id/play` | Three mode cards: Random, MCQ only, Essay only, each with a count; selected card has the accent outline |
| Quiz: MCQ | `/quiz` | Progress bar, question card, option buttons, Continue |
| Quiz: essay | `/quiz` | Progress bar, question card with Essay chip, large answer area, Reveal reference, self-assessment choices, Next |
| Results | `/quiz/result` | Score `8 / 10`, progress bar, list of missed questions, Retry, Back to set |
| Settings | `/settings` | Theme toggle (light, dark) |

Quiz-flow rules:
- The question text and the options must fit on one phone screen without scrolling for typical questions.
- Essay answers can be written before revealing the reference answer; after reveal, the learner marks the response right or wrong before continuing.
- A mode card is shown but explains itself when it has 0 questions.

## 7. Motion

- Short and subtle: 150 to 200ms ease-out for press, selection and progress changes.
- Respect `prefers-reduced-motion`: remove transforms and keep only opacity changes.

## 8. Accessibility checklist

- Text contrast at least 4.5:1 in both themes.
- Correct and wrong states always include an icon, not only color.
- Visible focus ring (2px `--accent` outline, 2px offset) on every interactive element.
- Touch targets as in section 3.
- Respect safe areas and the on-screen keyboard.

## 9. Out of scope for P1

Do not build these until their phase: sync status indicator (P3), Gemini key and grading UI (P2), streaks, mastery levels and spaced repetition (P5), tablet dual-pane layout, countdown timers.
