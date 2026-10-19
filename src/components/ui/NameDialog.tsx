"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
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
            className="min-h-12 rounded-2xl bg-bg px-4 text-[16px] font-normal text-fg placeholder:text-muted"
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-[16px] leading-6 text-bad-fg">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="min-h-12 rounded-2xl bg-bg px-5 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || value.trim() === ""}
            aria-busy={isSaving}
            className="min-h-12 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
