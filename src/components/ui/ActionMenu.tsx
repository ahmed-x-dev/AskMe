"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { iconButton, menuSurface } from "./styles";

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

/** An accessible action menu positioned to its trigger and bounded by the viewport. */
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasFocusedMenu = useRef(false);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const positionMenu = () => {
      const triggerElement = triggerRef.current;
      const trigger = triggerElement?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!triggerElement || !trigger || !menu) return;

      const margin = 16;
      const gap = 8;
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.min(menu.offsetWidth || 192, viewportWidth - margin * 2);
      const maxHeight = Math.max(0, viewportHeight - margin * 2);
      const height = Math.min(menu.scrollHeight, maxHeight);
      const spaceBelow = viewportHeight - trigger.bottom - margin;
      const spaceAbove = trigger.top - margin;
      const openAbove = spaceBelow < height + gap && spaceAbove > spaceBelow;
      const isRtl = window.getComputedStyle(triggerElement).direction === "rtl";
      const alignedLeft = isRtl ? trigger.left : trigger.right - width;

      setPosition({
        left: Math.max(margin, Math.min(alignedLeft, viewportWidth - width - margin)),
        top: openAbove
          ? Math.max(margin, trigger.top - height - gap)
          : Math.min(trigger.bottom + gap, viewportHeight - height - margin),
        maxHeight,
      });
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    positionMenu();
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("scroll", positionMenu, true);
    window.addEventListener("resize", positionMenu);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("scroll", positionMenu, true);
      window.removeEventListener("resize", positionMenu);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      hasFocusedMenu.current = false;
    } else if (position && !hasFocusedMenu.current) {
      const firstEnabledItem = itemRefs.current.find((item) => item && !item.disabled);
      (firstEnabledItem ?? menuRef.current)?.focus();
      hasFocusedMenu.current = true;
    }
  }, [isOpen, position]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabledItems = itemRefs.current.filter(
      (item): item is HTMLButtonElement => Boolean(item && !item.disabled),
    );

    switch (event.key) {
      case "ArrowDown":
        if (enabledItems.length === 0) return;
        {
          const currentIndex = enabledItems.indexOf(document.activeElement as HTMLButtonElement);
          enabledItems[(currentIndex + 1) % enabledItems.length]?.focus();
        }
        event.preventDefault();
        return;
      case "ArrowUp":
        if (enabledItems.length === 0) return;
        {
          const currentIndex = enabledItems.indexOf(document.activeElement as HTMLButtonElement);
          enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length]?.focus();
        }
        event.preventDefault();
        return;
      case "Home":
        enabledItems[0]?.focus();
        event.preventDefault();
        return;
      case "End":
        enabledItems[enabledItems.length - 1]?.focus();
        event.preventDefault();
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      case "Tab": {
        const focusable = [
          ...document.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ),
        ].filter(
          (element) =>
            !menuRef.current?.contains(element) &&
            !element.closest("[hidden], [inert]") &&
            element.getAttribute("aria-hidden") !== "true" &&
            window.getComputedStyle(element).visibility !== "hidden" &&
            window.getComputedStyle(element).display !== "none" &&
            element.getClientRects().length > 0,
        );
        const triggerIndex = focusable.indexOf(triggerRef.current as HTMLButtonElement);
        const target = focusable[triggerIndex + (event.shiftKey ? -1 : 1)];
        setIsOpen(false);
        if (target) {
          event.preventDefault();
          target.focus();
        } else {
          triggerRef.current?.focus();
        }
        return;
      }
      default:
        return;
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setPosition(null);
          setIsOpen((current) => !current);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={`${iconButton} text-muted`}
      >
        <Ellipsis aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              tabIndex={-1}
              onKeyDown={handleMenuKeyDown}
              style={
                position
                  ? {
                      position: "fixed",
                      left: position.left,
                      top: position.top,
                      maxHeight: position.maxHeight,
                      visibility: "visible",
                    }
                  : { position: "fixed", visibility: "hidden" }
              }
              className={`z-50 w-48 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain ${menuSurface}`}
            >
              {items.map(({ label: itemLabel, icon: Icon, onSelect, danger, disabled }, index) => (
                <button
                  key={`${itemLabel}-${index}`}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  role="menuitem"
                  disabled={disabled}
                  onClick={() => {
                    setIsOpen(false);
                    triggerRef.current?.focus();
                    onSelect();
                  }}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-[14px] px-3 text-start text-[16px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card-elevated ${danger ? "text-bad-fg hover:bg-bad-bg" : "text-fg hover:bg-card-hover"}`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                  {itemLabel}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
