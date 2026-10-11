# Responsive layout: phone-first, desktop-friendly

The app is designed for short mobile revision sessions before being widened to larger screens.

## Why we need it

The app is meant to be used on a phone, but the same layout should still feel comfortable on tablets and desktops. Mobile-first design makes the basics easy to use and reliable.

## The concept, simply

CSS should start from the narrowest view and add layout improvements as the screen gets wider. This keeps content readable and touch-friendly everywhere.

In this project, the shell uses a centered column with safe-area padding. The library can widen for a two-column set grid, while question and quiz screens stay in a narrower reading column.

The library header stacks its controls on phones and places them beside the heading at wider sizes. Set-card actions also move below the title on narrow screens, giving long set names more room.

The shared header keeps the AskMe brand on the library page. On inner pages it replaces that brand with a 48px-tall **Back to sets** link, leaving the theme control in the same place.

## In our code

`src/components/AppLayout.tsx` selects the library width based on the current route. `src/components/SetsPage.tsx` uses a responsive grid, and `src/index.css` keeps the app centered with safe-area padding.

```css
#root {
  width: 100%;
}

body {
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
}

@media (min-width: 768px) {
  body {
    display: flex;
    justify-content: center;
  }
}
```

The root needs a full width because the body becomes a flex container on desktop. Without it, the app root can shrink to its content width, preventing the library from reaching its 800px maximum. The layout classes in `AppLayout.tsx` set an 800px maximum for the library and a 480px maximum for other screens. In `SetsPage.tsx`, breakpoint variants such as `sm:flex-row` switch the page actions from a vertical stack to a horizontal row. The shared `AppLayout` uses the current route to show the brand on `/` and a direct library link elsewhere.

## ❌ / ✅ examples

- ❌ Building the desktop layout first and only shrinking later.
- ✅ Starting with a phone-sized canvas and then widening it.
- ❌ Using a fixed width that breaks on narrow screens.
- ✅ A max-width container and safe-area padding keep things stable.
- ❌ Force the heading and all actions into one row at phone width.
- ✅ Let the controls wrap or stack until there is enough room.
- ❌ Make the logo the only way back to the library on inner pages.
- ✅ Use a clearly labeled, touch-sized back link to `/`.

## Try it yourself

1. Open the app at a narrow width and confirm the title, import and create controls fit.
2. Increase the viewport width and see the sets grid widen and actions move beside the heading.
3. Open a set detail or editor page and confirm **Back to sets** and the theme toggle both fit.

## Quick Reference

- `max-w-[800px]` gives the set library room for two columns.
- `max-w-[480px]` keeps question and quiz screens readable at a desktop width.
- `md:grid-cols-2` expands the set library on larger screens.
- `sm:flex-row` can move stacked controls into a row when there is room.
- `Link to="/"` provides a reliable return to the library from any inner route.
- `env(safe-area-inset-*)` keeps the app from being clipped on modern phones.

## Key Takeaways

- Mobile-first design is about constraints, not limitations.
- A small set of safe spacing rules makes the app consistent across devices.
- Responsive layout should support touch usage without sacrificing readability.

## Links to related files

- `src/index.css`
- `src/components/SetsPage.tsx`
- `src/components/AppLayout.tsx`
