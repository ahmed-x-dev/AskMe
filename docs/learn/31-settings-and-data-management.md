# Settings and data management

**Goal:** Understand how theme preferences reach settings controls and how data actions communicate what they will do.

## Why we need it

Settings combine everyday preferences with actions that can replace or delete local data. Grouping the controls and stating the exact effect before confirmation helps prevent mistakes.

## The concept, simply

The app shell owns the active theme because it applies the preference across every route. A React context lets a nested settings screen read and change that same value without copying it into a second state store.

Data actions have different scopes:

- A full backup ZIP includes roadmaps and progress.
- A roadmap JSON file shares roadmap content, but not progress.
- Import adds another roadmap.
- Restore replaces the current local library.
- Reset deletes the library and progress, while leaving the AI key and theme preference.

## In our code

`src/components/layout/AppLayout.tsx` shares the current theme with child screens:

```tsx
<AppThemeContext value={{ theme, setTheme }}>
  <main>{children}</main>
</AppThemeContext>
```

- The shell remains the single source of truth for the theme value.
- `useAppTheme()` reads the value in a nested component and reports a clear error if used outside the shell.
- `SettingsPage` uses native radio inputs, so keyboard users can select Light or Dark with the standard radio-group keys.
- `DataSection` explains each file format and scope before offering its action. Restore and reset repeat their consequences in a confirmation dialog.

## ❌ / ✅ examples

❌ Clear a saved key when the user presses a button labeled “Save”.

✅ Use a dedicated Remove action, explain that the key cannot be recovered from the app, and confirm before clearing it.

❌ Call every export a backup, even when it omits progress.

✅ Say which content is included, and explain that import adds while restore replaces.

❌ Show only a color change after an operation completes.

✅ Announce an explicit success or error message with a recovery link when available.

## Try it yourself

1. Switch themes from Settings, navigate to another page, and verify the header control and page stay in sync.
2. Export a roadmap and compare its contents with a full backup; confirm only the full backup includes progress.
3. Open Reset all data and Restore dialogs; verify each states what will be removed or replaced before confirming.

## Quick Reference

- Use context for app-wide state that a nested screen needs to read or update.
- Native radios provide a familiar keyboard-accessible choice group.
- A roadmap JSON is an add/import format; a full ZIP is a backup/restore format.
- Use `role="status"` for success and `role="alert"` for an error.
- Keep destructive actions visually distinct and require confirmation.

## Key Takeaways

- Keep one source of truth for global preferences.
- Describe the consequence and scope before an irreversible action.
- Do not confuse import (adds) with restore (replaces).
- UI feedback does not change the underlying file format or persistence contract.

## Links to related files

- Builds on [02 — Tailwind and themes](./02-tailwind-and-themes.md), [09 — JSON import and export](./09-json-import-export.md), and [28 — Shared UI interactions](./28-shared-ui-interactions.md).
- See the settings visual rules in [DESIGN.md](../../DESIGN.md).
