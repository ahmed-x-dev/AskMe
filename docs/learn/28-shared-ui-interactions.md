# Shared UI interactions

**Goal:** Make reusable controls work consistently with a pointer, keyboard, and assistive technology.

## Why we need it

Menus and dialogs appear on many pages. A fix in one shared component improves every consumer, but an interaction that fails there affects every consumer too.

## The concept, simply

A floating menu should follow its trigger without being trapped by a card's clipping. A dialog should keep the user's attention until it closes. Controls should explain what they need and what went wrong.

ARIA roles describe an interaction; they do not implement it. A menu role therefore needs keyboard behavior, and an invalid field needs both `aria-invalid` and a linked message.

## In our code

In `src/components/ui/ActionMenu.tsx`:

```tsx
<div role="menu" aria-label={label} onKeyDown={handleMenuKeyDown}>
  {items.map((item) => (
    <button role="menuitem" disabled={item.disabled}>
      {item.label}
    </button>
  ))}
</div>
```

- `role="menu"` names the popup as a menu, rather than an unrelated panel.
- Each action is a real button, so it keeps native activation and disabled behavior.
- The keyboard handler moves among enabled actions and supports Home, End, and Escape.
- Rendering the popup in `document.body` lets it escape ancestor overflow clipping.

`src/components/ui/Modal.tsx` uses the browser's native `<dialog>` and `showModal()`. The browser provides modal focus behavior; the component keeps Escape and backdrop dismissal from interrupting a save.

## ❌ / ✅ examples

❌ Put a menu inside a card with `overflow-hidden` and rely on a larger `z-index`.

✅ Render the menu outside the card and position it using the trigger's viewport rectangle.

❌ Show a red error without telling the user what field needs attention.

✅ Set `aria-invalid`, connect helper/error text through `aria-describedby`, and offer a labeled recovery action when one is safe.

## Try it yourself

1. Open a roadmap action menu and use Arrow Down, Home, End, and Escape.
2. Resize the viewport and open a menu near each edge; verify it remains visible.
3. Trigger a name-save error and inspect the input's accessible description.

## Quick Reference

- Menu: `role="menu"`, buttons with `role="menuitem"`, arrow keys, Home/End, Escape.
- Field: visible label, helper text, `aria-invalid`, and `aria-describedby`.
- Pending action: disable only the initiating control and set `aria-busy`.
- Dialog: native `<dialog>.showModal()`; keep its content scrollable within the viewport.
- Recovery action: use a short visible label such as “Try again”.

## Key Takeaways

- A shared component should own the complete interaction, not just its appearance.
- Portals solve clipping; viewport measurement solves edge placement.
- Native buttons and dialogs provide useful behavior when their state is wired correctly.
- Accessible feedback explains both the problem and a next step.

## Links to related files

- Builds on [26 — Icon components](./26-icon-components.md) and [11 — Responsive layout](./11-responsive-layout.md).
- See the specification in [DESIGN.md](../../DESIGN.md).
