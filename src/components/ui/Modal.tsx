"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  titleId: string;
  /** Blocks closing (Escape, backdrop click) while something is saving. */
  isBusy?: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** A modal dialog that opens as soon as it is mounted. Render it only while it should be visible. */
export function Modal({ titleId, isBusy = false, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isBusy) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl bg-card p-0 text-fg backdrop:bg-overlay"
    >
      {children}
    </dialog>
  );
}
