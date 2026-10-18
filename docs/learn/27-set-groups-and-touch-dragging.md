# Set groups

**Goal:** organize related study sets with a group created from a deliberate manual selection.

## Why we need it

A library can become hard to scan when it has many sets. A group gives related sets one editable label while each set remains its own quiz and export file.

## The concept, simply

Grouping is metadata: it describes where a set appears in the library, not the set's questions. A set has either no group or exactly one group.

Each member stores the same small `group` value. It contains a UUID and a name. This means exporting or syncing a set also preserves its group membership. Renaming, adding a member, removing a member, or removing the whole group updates every affected member together. Removing a group never deletes its sets.

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
- `addSetsToGroup(groupId, setIds)` first looks up the existing group, then gives selected ungrouped sets that exact `{ id, name }` value.

## ❌ / ✅ examples

❌ Store only a group name such as `"Biology"`. Two different groups could then collide.

✅ Store both a UUID and a readable name.

❌ Let the page update individual IndexedDB rows itself.

✅ Put create and rename rules in `repository.ts` so every group update follows the same persistence rules.

❌ Delete the sets when the user only wants to remove their organizing label.

✅ Clear the optional `group` value, leaving each set and its questions unchanged.

## Try it yourself

1. Create a set, select it, and give its new group a name.
2. Use the folder-plus button on a group, choose an ungrouped set, then add it to that group.
3. Remove one set from the group, then remove the group itself. Check that the sets remain.

## Quick Reference

- **Create group** opens manual selection mode and shows only ungrouped sets; **Apply** saves the new group and **Cancel** abandons the selection.
- A group's ellipsis button opens its Add sets, Rename, and Delete group actions.
- **Add sets** selects ungrouped sets to add to that existing group; **Apply** confirms the addition.
- **Delete group** removes the group but keeps every set.
- A set's folder-with-X button removes only that set from its group.
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
