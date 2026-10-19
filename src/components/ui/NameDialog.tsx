"use client";

import { useState, type FormEvent } from "react";
import { ErrorMessage } from "./ErrorMessage";
import { Modal } from "./Modal";
import { buttonGhost, buttonPrimary, fieldClassName } from "./styles";

type NameDialogProps = {
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (value: string) => Promise<void>;
  onClose: () => void;
};

/** A small dialog with one text field, used to name or rename things. */
export function NameDialog({
  title,
  label,
  initialValue = "",
  placeholder,
  submitLabel,
  onSubmit,
  onClose,
}: NameDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSubmit(value);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save the name.",
      );
      setIsSaving(false);
    }
  };

  return (
    <Modal titleId="name-dialog-title" isBusy={isSaving} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
        <h2 id="name-dialog-title" className="text-[22px] font-medium leading-7">
          {title}
        </h2>

        <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
          {label}
          <input
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={100}
            required
            autoFocus
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "name-dialog-error" : undefined}
            className={fieldClassName}
          />
        </label>

        {error ? <ErrorMessage id="name-dialog-error">{error}</ErrorMessage> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || value.trim() === ""}
            aria-busy={isSaving}
            className={buttonPrimary}
          >
            {isSaving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
