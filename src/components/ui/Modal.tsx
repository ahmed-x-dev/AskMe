"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  titleId: string;
  /** Blocks closing (Escape, backdrop click) while something is saving. */
  isBusy?: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** A viewport-bounded native modal that restores focus and blocks dismissal while busy. */
export function Modal({
  titleId,
  isBusy = false,
  onClose,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        if (!isBusy) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isBusy) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100%-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-control-line bg-card-elevated p-0 text-fg backdrop:bg-overlay"
    >
      {children}
    </dialog>
  );
}
