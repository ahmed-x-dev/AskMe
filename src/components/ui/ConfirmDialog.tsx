"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ErrorMessage } from "./ErrorMessage";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  title: string;
  /** What will happen, in one or two sentences. */
  message: string;
  confirmLabel: string;
  /** Label shown on the confirm button while `onConfirm` is running. */
  busyLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

/** Asks before a destructive action: a ghost Cancel and a destructive confirm button. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busyLabel = "Deleting…",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsBusy(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Something went wrong.");
      setIsBusy(false);
    }
  };

  return (
    <Modal titleId="confirm-dialog-title" isBusy={isBusy} onClose={onClose}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h2 id="confirm-dialog-title" className="text-[22px] font-medium leading-7 text-fg">
            {title}
          </h2>
          <p className="wrap-break-word text-[16px] leading-6 text-muted">{message}</p>
        </div>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            data-plain
            onClick={onClose}
            disabled={isBusy}
            className="min-h-12 rounded-2xl px-4 text-[16px] font-medium text-accent-text transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isBusy}
            aria-busy={isBusy}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-bad-bg px-4 text-[16px] font-medium text-bad-fg transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            <Trash2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
