"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { menuSurface } from "./styles";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
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
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className="flex h-11 w-11 items-center justify-center rounded-[14px] text-muted transition-colors duration-150 hover:bg-card-hover hover:text-fg"
      >
        <Ellipsis aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          className={`absolute inset-e-0 top-full z-50 mt-2 w-48 max-w-[calc(100vw-2rem)] ${menuSurface}`}
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
              className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${danger ? "text-bad-fg hover:bg-bad-bg" : "text-fg hover:bg-card-hover"}`}
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
