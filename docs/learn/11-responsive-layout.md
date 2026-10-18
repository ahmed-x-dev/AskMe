# Responsive layout: phone-first, desktop-friendly

The app is designed for short mobile revision sessions before being widened to larger screens.

## Why we need it

The app is meant to be used on a phone, but the same layout should still feel comfortable on tablets and desktops. Mobile-first design makes the basics easy to use and reliable.

## The concept, simply

CSS should start from the narrowest view and add layout improvements as the screen gets wider. This keeps content readable and touch-friendly everywhere.

This phone-first layout approach is separate from release order: AskMe ships as a web app first and desktop second. Mobile delivery is deferred, and PWA install/offline support is currently disabled.

In this project, the shell uses safe-area padding and expands on large displays. Each screen then uses the space that fits its task: set details place the overview beside the AI helper and show questions in a two-column grid; quiz setup places filters side by side; settings, editors, and active quiz content remain in centered, readable panels.

The library home page uses a compact heading with set/question totals, a search field, import/export actions, and group filter chips. These controls stack on phones and share a row when the available width allows. On wide screens, the set cards deliberately stay in two columns so each one can keep a clear primary **Start quiz** action beside an **Open** link instead of becoming a dense tile.

The shared header keeps the AskMe brand on the library page. On inner pages it replaces that brand with a 48px-tall **Back to sets** link, leaving the theme control in the same place.

## In our code

`src/components/AppLayout.tsx` selects the library width with the Next.js pathname and lets the outer page fill the viewport before its inner column is centered. `src/components/SetsPage.tsx` uses a responsive grid, and `app/globals.css` keeps the app centered with safe-area padding.

```css
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

The page does not need a Vite `#root` element: Next.js renders the route under the root layout. The layout classes in `AppLayout.tsx` set an 800px base maximum, expanding to 1280px at large widths and 1536px at extra-large widths. Each page component constrains its own content or switches to columns where useful. `SetDetailPage.tsx` places its overview and AI helper next to each other and uses two columns for questions. `QuizPage.tsx` lays out setup filters in two columns and offers MCQ choices in a two-column grid, while keeping the score card narrower. `QuestionEditorPage.tsx` uses a wider form and two columns for MCQ options, and `SettingsPage.tsx` keeps its short form centered. In `SetsPage.tsx`, `md:grid-cols-2`, `lg:grid-cols-3`, and `2xl:grid-cols-4` use available width for more set cards without stretching each card too far. The intro paragraph grows to 600px and the empty state stays within 768px. Breakpoint variants such as `sm:flex-row` switch page actions from a vertical stack to a horizontal row. The shared `AppLayout` uses `usePathname()` to show the brand on `/` and a direct library link elsewhere.

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

- `lg:max-w-7xl 2xl:max-w-screen-2xl` lets the set library use wide desktop space.
- `lg:max-w-3xl` keeps an empty-state card from becoming too wide.
- `lg:grid-cols-2` lets related content share desktop space while keeping each card readable.
- `max-w-[480px]` keeps question and quiz screens readable at a desktop width.
- `md:grid-cols-2` expands the library into roomy action cards.
- `sm:flex-row` can move stacked controls into a row when there is room.
- `Link href="/"` provides a reliable return to the library from any inner route.
- `env(safe-area-inset-*)` keeps the app from being clipped on modern phones.

## Key Takeaways

- Mobile-first design is about constraints, not limitations.
- A small set of safe spacing rules makes the app consistent across devices.
- Responsive layout should support touch usage without sacrificing readability.

## Links to related files

- `app/globals.css`
- `src/components/SetsPage.tsx`
- `src/components/AppLayout.tsx`
