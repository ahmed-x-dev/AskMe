"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { buttonGhost, buttonPrimary, fieldClassName } from "@/components/ui/styles";
import type { Roadmap } from "@/types/study";

export type RoadmapFormValues = {
  title: string;
  icon: string;
  /** Hex color, or an empty string for the theme's accent color. */
  color: string;
};

type RoadmapDialogProps = {
  /** The roadmap being edited, or undefined when creating a new one. */
  roadmap?: Roadmap;
  onSubmit: (values: RoadmapFormValues) => Promise<void>;
  onClose: () => void;
};

const SUGGESTED_ICONS = ["⚛️", "🇬🇧", "⚡", "🧬", "💻", "📐", "🧠", "📚"];

export const ROADMAP_COLORS = [
  { name: "Green", value: "" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#eab308" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Slate", value: "#64748b" },
];

export function RoadmapDialog({ roadmap, onSubmit, onClose }: RoadmapDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(roadmap?.title ?? "");
  const [icon, setIcon] = useState(roadmap?.icon ?? "");
  const [color, setColor] = useState(roadmap?.color ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({ title, icon: icon.trim(), color });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The roadmap could not be saved.",
      );
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="roadmap-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isSaving) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-line bg-card-elevated p-0 text-fg backdrop:bg-overlay"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
        <h2
          id="roadmap-dialog-title"
          className="text-[22px] font-medium leading-7"
        >
          {roadmap ? "Edit roadmap" : "New roadmap"}
        </h2>

        <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
          Name
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
            autoFocus
            placeholder="React, English, Electronics…"
            aria-invalid={error !== null && title.trim() === ""}
            className={`${fieldClassName} font-normal`}
          />
        </label>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="roadmap-icon"
            className="text-[16px] font-medium leading-6"
          >
            Icon <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="roadmap-icon"
            type="text"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            maxLength={12}
            placeholder="Paste or pick an emoji"
            className={fieldClassName}
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_ICONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setIcon(suggestion)}
                aria-label={`Use ${suggestion} as icon`}
                aria-pressed={icon === suggestion}
                className={`flex h-11 w-11 items-center justify-center rounded-[14px] text-[20px] transition-colors hover:bg-card-hover ${icon === suggestion ? "bg-card ring-2 ring-accent" : "bg-card"}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[16px] font-medium leading-6">Color</legend>
          <div className="flex flex-wrap gap-3">
            {ROADMAP_COLORS.map((option) => (
              <label key={option.name} className="cursor-pointer">
                <input
                  type="radio"
                  name="roadmap-color"
                  value={option.value}
                  checked={color === option.value}
                  onChange={() => setColor(option.value)}
                  className="peer sr-only"
                />
                <span
                  title={option.name}
                  className="block h-9 w-9 rounded-full ring-offset-2 ring-offset-card-elevated peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
                  style={{ backgroundColor: option.value || "var(--accent)" }}
                />
                <span className="sr-only">{option.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

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
            disabled={isSaving || title.trim() === ""}
            aria-busy={isSaving}
            className={buttonPrimary}
          >
            {roadmap ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
