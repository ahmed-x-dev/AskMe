# Set groups

**Goal:** organize related study sets with a group created from a deliberate manual selection.

## Why we need it

A library can become hard to scan when it has many sets. A group gives related sets one editable label while each set remains its own quiz and export file.

## The concept, simply

Grouping is metadata: it describes where a set appears in the library, not the set's questions. A set has either no group or exactly one group.

Each member stores the same small `group` value. It contains a UUID and a name. This means exporting or syncing a set also preserves its group membership. Renaming, removing a member, or removing the whole group updates every affected member together. Removing a group never deletes its sets.

## In our code

`src/data/repository.ts` keeps the rule in one place:

```ts
export async function createSetGroup(setIds: readonly string[], name: string): Promise<QuizSet[]> {
  const group = { id: crypto.randomUUID(), name: sanitizeGroupName(name) }
  // Each selected set receives this one group value in a transaction.
}
```

- `setIds` comes from the selected set cards.
- `crypto.randomUUID()` creates a stable group identity.
- A Dexie transaction saves every changed member together.
- UI components call the repository; they never write to Dexie directly.

## ❌ / ✅ examples

❌ Store only a group name such as `"Biology"`. Two different groups could then collide.

✅ Store both a UUID and a readable name.

❌ Let the page update individual IndexedDB rows itself.

✅ Put create and rename rules in `repository.ts` so every group update follows the same persistence rules.

❌ Delete the sets when the user only wants to remove their organizing label.

✅ Clear the optional `group` value, leaving each set and its questions unchanged.

## Try it yourself

1. Create three sets, then manually select two and name their group.
2. Remove one set from the group, then remove the group itself. Check that the sets remain.
3. Turn on **Groups only** and confirm that ungrouped sets are hidden.

## Quick Reference

- **Create group** opens manual selection mode.
- A group's trash button removes the group but keeps every set.
- A set's folder-with-X button removes only that set from its group.
- **Groups only** hides the **Ungrouped sets** section; **Show all sets** restores it.
- `group: { id, name }` is optional; a missing value means ungrouped.
- `npm run test` checks persistence and import migrations.

## Key Takeaways

- One set can have zero or one group.
- A group ID is stable; its name is editable.
- Every group-changing action goes through the repository.
- Manual selection keeps grouping intentional and easy to understand.
- View filters only change what is visible; they never change stored membership.

## Links to related files

Builds on [03 — Domain types and Dexie](./03-domain-types-and-dexie.md), [04 — Repository and tests](./04-repository-and-tests.md), and [05 — Routing and sets](./05-routing-and-sets.md).
