# Icon components with Lucide React

This guide explains how AskMe uses named Lucide components instead of hand-written SVG markup for interface icons.

## Why we need it

Copying SVG paths into each button makes icons harder to change and keep consistent. Lucide provides ready-made React components while letting the app control their size, stroke, and accessibility.

## The concept, simply

Import only the icons a screen needs from `lucide-react`, then render them like any other React component. Lucide draws the SVG for us. Tailwind classes still control the icon's layout size, and icon props control its stroke and accessible name.

## In our code

`src/components/AppLayout.tsx` uses named icon components:

```tsx
import { ArrowLeft, Moon, Settings, Sun } from "lucide-react";

<Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
```

- The named import makes the icon choice clear where it is used.
- `aria-hidden` keeps a decorative icon out of the screen reader's name; its enclosing link or button provides the label.
- The classes retain the app's existing dimensions, and `strokeWidth` retains its thinner icon style.
- Importing icons by name allows the build to include only the icons the app uses.

## ❌ / ✅ examples

- ❌ Copy and maintain raw `<svg>` path markup inside each button.
- ✅ Import a named icon component and keep the button's accessible label on the button.
- ❌ Use an icon as the only accessible name for an icon-only button.
- ✅ Give the button an `aria-label`; mark the decorative icon `aria-hidden`.

## Try it yourself

1. Replace an existing named icon with another icon from Lucide React and keep the button's label unchanged.
2. Inspect an icon-only button with a screen reader or accessibility tree to confirm it still has a useful name.

## Quick Reference

- Install: `npm install lucide-react@latest`
- Import: `import { Settings } from "lucide-react"`
- Size and color are controlled by the surrounding CSS/Tailwind styles.
- Use `aria-hidden="true"` for decorative icons and label their controls.

## Key Takeaways

- Lucide supplies consistent, named icon components.
- Keep icon-only controls accessible with a label on the control itself.
- Existing Tailwind sizing and stroke choices can preserve the current visual design.

## Links to related files

- See [02-tailwind-and-themes.md](./02-tailwind-and-themes.md) for the app's styling approach.
- See [11-responsive-layout.md](./11-responsive-layout.md) for touch-sized controls.
