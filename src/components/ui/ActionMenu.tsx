"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ellipsis, type LucideIcon } from "lucide-react";

export type ActionMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type ActionMenuProps = {
  /** Accessible name of the ⋯ button, for example "Actions for React". */
  label: string;
  items: ActionMenuItem[];
};

/** A ⋯ button that opens a small menu. Closes on outside click and Escape. */
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative shrink-0 ${isOpen ? "z-40" : ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={menuId}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-fg transition-colors hover:bg-card-hover"
      >
        <Ellipsis aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          className="absolute inset-e-0 top-full z-50 mt-2 flex w-48 flex-col gap-1 rounded-2xl bg-card p-2 shadow-lg"
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, danger, disabled }) => (
            <button
              key={itemLabel}
              type="button"
              disabled={disabled}
              onClick={() => {
                setIsOpen(false);
                onSelect();
              }}
              className={`flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] transition-colors ${danger ? "text-bad-fg hover:bg-bad-bg" : "text-fg hover:bg-card-hover"}`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              {itemLabel}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
