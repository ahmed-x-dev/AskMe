"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { ErrorMessage } from "./ErrorMessage";
import { Modal } from "./Modal";
import { buttonDanger, buttonGhost } from "./styles";

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
  const isConfirming = useRef(false);

  const handleConfirm = async () => {
    if (isConfirming.current) return;
    isConfirming.current = true;
    setIsBusy(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Something went wrong.");
      isConfirming.current = false;
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

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isBusy}
            aria-busy={isBusy}
            className={buttonDanger}
          >
            <Trash2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
