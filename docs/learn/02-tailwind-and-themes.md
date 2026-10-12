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

`DESIGN.md` is the source of truth for every color and styling rule. In `app/globals.css`, the theme selectors copy its color values into CSS variables and `@theme inline` exposes those variables as Tailwind utilities such as `bg-card` and `text-muted`. Keep these mappings aligned with the design token table.

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
  --bg: #ffffff;
  --card: #f3f4f6;
  --fg: #111111;
  --muted: #6b6b6b;
  --accent: #0b8566;
}

@theme inline {
  --color-bg: var(--bg);
  --color-card: var(--card);
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
- React state drives the active theme; `localStorage` persists it in this browser.
- The saved value is validated before it is used.
- Icon-only controls still need accessible names.

## Links to related files

- [01 — Vite, React, and TypeScript](./01-vite-react-typescript.md)
- Design tokens and visual rules: [DESIGN.md](../../DESIGN.md)
- Theme component: [src/components/AppShell.tsx](../../src/components/AppShell.tsx)
- CSS variables: [app/globals.css](../../app/globals.css)
