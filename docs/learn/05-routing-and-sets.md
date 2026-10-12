# Routing and sets

One-line goal: understand how Next.js App Router URLs connect to AskMe screens and how the library persists set changes.

## Why we need it

Before the app can do anything practical, it needs a way to move between screens and a place to keep quiz sets. The app stores sets in Dexie, but the UI still needs to list them and let the user act on them without losing data after reload.

## The concept, simply

A route maps a URL to a page. Next.js uses folders and `page.tsx` files under `app/`: `/` shows the set library, and `/set/[id]` shows one set. The route page reads its URL parameters and passes them to a screen component. The repository remains responsible for persistence.

## In our code

The library route lives in `app/page.tsx`:

```tsx
import { SetsPage } from '../src/components/SetsPage'

export default function Page() {
  return <SetsPage />
}
```

The set detail route at `app/set/[id]/page.tsx` receives its dynamic URL parameter and passes it to the screen:

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SetDetailPage key={id} setId={id} />
}
```

The route files stay small. Interactive behavior and browser-only data access live in client-side screen components, while `src/data/repository.ts` remains the persistence boundary. The library refreshes from that repository after writes so it displays the stored state.

Each set card uses a full-card `Link` to open its set. Rename and delete controls sit above that link and retain their own button semantics, accessible names, and 44px tap targets. This lets the card act as one large navigation target without nesting buttons inside a link.

## ❌ / ✅ examples

❌ Bad: creating a set in the UI but never refreshing the list, so the card disappears after reload.
✅ Good: create or rename a set, then read the list again from `listSets()`, which is the same source the app uses after a reload.

❌ Bad: put restore logic in multiple screens.
✅ Good: route to a detail view and use the same repository fetch path whenever the page loads.

❌ Bad: nest a delete button inside a card link; clicking delete could also navigate.
✅ Good: make the card link a sibling layer and keep action buttons above it.

## Try it yourself

1. Open the app and create a couple of sets.
2. Rename one of them and reload the page.
3. Delete a set and confirm it is hidden from the set list after the reload.
4. Click a card's title area to open it; use the separate icon buttons to rename or delete.

## Quick Reference

- `app/**/page.tsx` maps folders to routes.
- `[id]` is a dynamic route segment; its value comes from `params`.
- `Link` from `next/link` navigates between app routes.
- `useRouter()` from `next/navigation` supports programmatic navigation in client components.
- `listSets()` is the read path for the set library.
- `updateSetTitle()` and `softDeleteSet()` are the write paths for rename and delete.
- Each card link opens its set; icon actions remain separate accessible buttons.

## Key Takeaways

- The route tree decides which screen to show.
- The repository remains the single source of truth for persisted data.
- Every write should refresh the screen from storage to keep UI state honest.

## Links to related files

- [04-repository-and-tests.md](./04-repository-and-tests.md)
- [src/data/repository.ts](../../src/data/repository.ts)
- [app/page.tsx](../../app/page.tsx)
- [app/set/[id]/page.tsx](../../app/set/[id]/page.tsx)
- [18-nextjs-app-router.md](./18-nextjs-app-router.md)
