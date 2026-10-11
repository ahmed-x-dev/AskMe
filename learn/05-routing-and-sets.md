# Routing and sets

One-line goal: connect the app to browser routes and build the first real collection screen for creating, renaming, and deleting quiz sets.

## Why we need it

Before the app can do anything practical, it needs a way to move between screens and a place to keep quiz sets. The app stores sets in Dexie, but the UI still needs to list them and let the user act on them without losing data after reload.

## The concept, simply

A router maps URLs to screens. In this app, the root URL (`/`) shows the set library, and a detail URL like `/set/:id` shows one specific set. The repository stays responsible for persistence, while the routes only decide which screen the user is viewing and which repository action to call.

## In our code

The main route setup lives in `src/routes.tsx`.

```tsx
export function createAppRouter(theme: Theme, setTheme: ThemeSetter) {
  return createBrowserRouter([
    {
      path: '/',
      element: <AppLayout theme={theme} setTheme={setTheme} />,
      children: [
        { index: true, element: <SetsPage /> },
        { path: 'set/:id', element: <SetDetailPage /> },
        { path: 'set/:id/q/:qid?', element: <QuestionEditorPage /> },
      ],
    },
  ])
}
```

This makes the URL state the source of truth for navigation. Then the sets screen calls the repository methods directly:

```tsx
const handleCreateSet = async () => {
  const created = await createSet(`Set ${sets.length + 1}`)
  await refreshSets()
  navigate(`/set/${created.id}`)
}
```

That pattern is important: the app does not keep a second copy of the same list in a separate state store. It re-reads from the repository after each write, so the UI matches the actual IndexedDB state.

## ❌ / ✅ examples

❌ Bad: creating a set in the UI but never refreshing the list, so the card disappears after reload.
✅ Good: create or rename a set, then read the list again from `listSets()`, which is the same source the app uses after a reload.

❌ Bad: put restore logic in multiple screens.
✅ Good: route to a detail view and use the same repository fetch path whenever the page loads.

## Try it yourself

1. Open the app and create a couple of sets.
2. Rename one of them and reload the page.
3. Delete a set and confirm it is hidden from the set list after the reload.

## Quick Reference

- `createBrowserRouter(...)` defines routes and nested screens.
- `Link` navigates without reloading the page.
- `useNavigate()` pushes a new route after a successful action.
- `listSets()` is the read path for the set library.
- `updateSetTitle()` and `softDeleteSet()` are the write paths for rename and delete.

## Key Takeaways

- The route tree decides which screen to show.
- The repository remains the single source of truth for persisted data.
- Every write should refresh the screen from storage to keep UI state honest.

## Links to related files

- [04-repository-and-tests.md](./04-repository-and-tests.md)
- [src/data/repository.ts](../src/data/repository.ts)
- [src/routes.tsx](../src/routes.tsx)
