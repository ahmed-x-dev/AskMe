/**
 * Shared class strings for interactive surfaces.
 *
 * These are presentation only: no behavior, state or data lives here. Importing a
 * constant keeps buttons, fields and cards visually identical across screens.
 * Any visual change belongs in `DESIGN.md` first, then in this file.
 */

const buttonBase =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[16px] font-medium leading-6 transition-colors duration-150 disabled:cursor-not-allowed';

/** Filled accent button. Use for the single primary action of a screen or card. */
export const buttonPrimary = `${buttonBase} bg-accent text-on-accent hover:opacity-90 active:scale-[0.98]`;

/** Neutral button with the shared control boundary. */
export const buttonSecondary = `${buttonBase} border border-line bg-card text-fg hover:bg-card-hover`;

/** Neutral button for a `bg-card` surface (dialog or settings panel), using the inverse surface. */
export const buttonSecondaryOnCard = `${buttonBase} border border-line bg-bg text-fg hover:bg-card-hover`;

/** Borderless text button for low-emphasis actions such as Cancel. */
export const buttonGhost = `${buttonBase} px-3 text-accent-text hover:bg-card-hover`;

/** Compact neutral button for back links and inline row actions. */
export const buttonSecondaryCompact =
  'inline-flex min-h-12 w-fit max-w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card px-3 text-[13px] font-medium leading-[18px] text-fg transition-colors duration-150 hover:bg-card-hover';

/** Filled destructive confirm used inside a `ConfirmDialog`. */
export const buttonDanger = `${buttonBase} bg-bad-bg text-bad-fg hover:opacity-90 active:scale-[0.98]`;

/** Destructive trigger that opens a confirm dialog. Outlined, so it never competes with the primary action. */
export const buttonDestructive = `${buttonBase} border border-line bg-bg text-bad-fg hover:bg-bad-bg`;

/** Square icon-only button. Always give it an `aria-label`. */
export const iconButton =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-line bg-card text-fg transition-colors duration-150 hover:bg-card-hover';

/** Field styling for inputs, text areas and selects that sit on the page background. */
export const fieldClassName =
  'min-h-12 w-full rounded-[14px] border border-line bg-card px-3 text-[16px] leading-6 text-fg placeholder:text-muted';

/** Field styling for controls inside a `bg-card` surface (for example a dialog). */
export const fieldOnCardClassName =
  'min-h-12 w-full rounded-[14px] border border-line bg-bg px-3 text-[16px] leading-6 text-fg placeholder:text-muted';

/** Raised menu surface (overflow menu, dropdown). */
export const menuSurface =
  'flex flex-col gap-1 rounded-2xl border border-line bg-card p-2';
