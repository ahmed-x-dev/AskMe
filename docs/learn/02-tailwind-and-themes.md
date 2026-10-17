# Tailwind and Themes

**Goal:** See how Tailwind utility classes and saved theme state style the app.

## Why we need it

The app needs a consistent visual language and a theme that remains selected after a reload. Tailwind provides utility classes; CSS variables let the same component styles use different theme values.

## The concept, simply

Tailwind utilities are small classes for individual styles, such as `min-h-screen` or `px-4`. Tailwind CSS v4 is imported in the global stylesheet and integrated with Next.js through its PostCSS plugin.

Theme values are CSS custom properties. CSS reads a variable with `var(--name)`. The app puts `data-theme="light"` or `"dark"` on the root HTML element, allowing CSS to select the corresponding values.

React state controls which theme is active. `localStorage` keeps the choice in this browser across reloads. The app uses the system preference only when there is no valid saved choice.

An icon-only theme switch saves space on small screens. Because the icon alone does not say what the button does, give the button an accessible name with `aria-label`.

## In our code

From `src/components/AppShell.tsx`:

```tsx
useEffect(() => {
  let isCurrent = true;
  queueMicrotask(() => {
    if (!isCurrent) return;
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    document.documentElement.setAttribute("data-theme", preferredTheme);
    setIsThemeLoaded(true);
  });
  return () => {
    isCurrent = false;
  };
}, []);
```

- The browser preference is read in an effect because Next.js can pre-render client components on the server.
- The effect updates the root element so CSS can respond to the saved theme.
- A second effect persists later theme changes after the saved value has loaded.

`DESIGN.md` is the source of truth for every color and styling rule. In `app/globals.css`, the theme selectors copy its color values into CSS variables and `@theme inline` exposes those variables as Tailwind utilities such as `bg-card`, `bg-card-hover`, and `text-muted`. Keep these mappings aligned with the design token table.

The soft-cards design uses lightness for depth: `bg-bg` is the page, `bg-card` is a surface, and `bg-card-hover` is the pressed or hovered state. UI components never contain raw hex colors; changing a token updates the whole app in both themes. Primary actions alone use `bg-accent`; secondary controls stay neutral and use `bg-card-hover` for feedback.

Cards deliberately have no border. Controls are different: inputs, text areas, selects, and neutral buttons receive a 1px `--card-hover` boundary. This makes fields and secondary actions easy to find without giving every card a hard outline. The focus ring remains a separate, thicker accent outline, so keyboard focus is always clear.

State belongs in the design system too. A temporary action uses `aria-busy="true"` with a progress label, while an invalid field uses `aria-invalid="true"` and points to its error text with `aria-describedby`. Global CSS can then apply the same cursor, opacity, and error boundary rules everywhere instead of each form inventing them.

In `src/components/AppLayout.tsx`, the theme button shows a moon when it can switch to dark mode and a sun when it can switch to light mode. The SVGs are decorative; the button's `aria-label` communicates the action to assistive technology.

## ❌ / ✅ examples

❌ Store arbitrary user input as a theme without checking it; unexpected values may not match any CSS theme.

✅ `getPreferredTheme` accepts only `"light"` or `"dark"` and otherwise uses the system preference.

❌ Use an icon-only button without an accessible name.

✅ Keep the icon visual and set an `aria-label` that describes the action.

## Try it yourself

1. Toggle the theme and inspect the `<html>` element's `data-theme` attribute.
2. Check that the theme button has a useful accessible name in the accessibility tree.
3. Reload the page and check that the selected theme is restored.

## Quick Reference

```css
@import 'tailwindcss';

:root {
  --bg: #fbfcfb;
  --card: #eff3f1;
  --card-hover: #e6ece9;
  --fg: #121715;
  --muted: #5c6661;
  --accent: #09785e;
  --overlay: rgb(0 0 0 / 0.4);
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
  --color-card-hover: var(--card-hover);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
}
```

```ts
window.localStorage.setItem("askme-theme", "dark");
```

## Key Takeaways

- Tailwind classes compose small styling utilities in markup.
- CSS variables allow values to change by theme without rewriting components.
- `bg-card-hover` gives neutral controls feedback without giving them primary-action color.
- A `--card-hover` border distinguishes controls; cards remain borderless.
- `aria-busy` and `aria-invalid` connect visual states to assistive technology.
- React state drives the active theme; `localStorage` persists it in this browser.
- The saved value is validated before it is used.
- Icon-only controls still need accessible names.

## Links to related files

- [01 — Vite, React, and TypeScript](./01-vite-react-typescript.md)
- Design tokens and visual rules: [DESIGN.md](../../DESIGN.md)
- Theme component: [src/components/AppShell.tsx](../../src/components/AppShell.tsx)
- CSS variables: [app/globals.css](../../app/globals.css)
