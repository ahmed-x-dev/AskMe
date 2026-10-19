"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CircleAlert } from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";
import { buttonSecondaryCompact, fieldClassName } from "@/components/ui/styles";
import { updateTopic } from "@/lib/data";

type NotesSectionProps = {
  topicId: string;
  /** The saved notes. Only used as the starting value and to detect unsaved changes. */
  notes: string | undefined;
};

type Mode = "edit" | "preview";

/** `updateTopic` stores blank notes as "no notes", so compare against the same form. */
const normalize = (value: string) => (value.trim() ? value : "");

const SAVE_DELAY_MS = 800;

/**
 * Markdown notes with an Edit / Preview switch. The text lives in local state so typing never
 * fights the live query; it is saved shortly after you stop typing and when the field loses focus.
 * Render it with `key={topicId}` so moving to another topic starts fresh.
 */
export function NotesSection({ topicId, notes }: NotesSectionProps) {
  const saved = notes ?? "";
  const [draft, setDraft] = useState(saved);
  const [mode, setMode] = useState<Mode>(saved ? "preview" : "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef(saved);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const isDirty = normalize(draft) !== saved;

  const save = useCallback((value: string) => {
    const normalized = normalize(value);
    const request = saveQueue.current.then(async () => {
      if (normalized === savedRef.current) return;

      setIsSaving(true);

      try {
        await updateTopic(topicId, { notes: normalized });
        savedRef.current = normalized;
        setError(null);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save the notes.");
      } finally {
        setIsSaving(false);
      }
    });

    saveQueue.current = request;
    return request;
  }, [topicId]);

  useEffect(() => {
    if (!isDirty) return;

    const timer = window.setTimeout(() => void save(draft), SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [draft, isDirty, save]);

  const statusText = error ?? (isSaving ? "Saving…" : isDirty ? "Unsaved changes" : "Saved");

  return (
    <section aria-labelledby="notes-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="notes-heading" className="text-[16px] font-medium leading-6 text-fg">
          Notes
        </h2>

        <div role="group" aria-label="Notes view" className="flex gap-1 rounded-[14px] bg-card p-[3px]">
          {(["edit", "preview"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`min-h-12 rounded-[11px] px-3 text-[13px] font-medium leading-[18px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                mode === value
                  ? "bg-accent text-on-accent active:scale-[0.98]"
                  : "text-muted hover:bg-card-hover hover:text-fg active:scale-[0.98]"
              }`}
            >
              {value === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (isDirty) void save(draft);
          }}
          rows={8}
          aria-label="Notes (Markdown)"
          placeholder="Write notes in Markdown: # headings, **bold**, - lists, `code`…"
          className={`min-h-48 w-full max-w-[72ch] resize-y py-3 ${fieldClassName}`}
        />
      ) : (
        <div className="min-h-24 w-full max-w-[72ch] rounded-2xl bg-card p-4">
          {draft.trim() ? (
            <Markdown>{draft}</Markdown>
          ) : (
            <p className="text-[16px] leading-6 text-muted">
              No notes yet. Switch to Edit to add some.
            </p>
          )}
        </div>
      )}

      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-[13px] leading-[18px] text-bad-fg">
          <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 flex-1 wrap-break-word">{statusText}</span>
          <button type="button" onClick={() => void save(draft)} className={buttonSecondaryCompact}>
            Try again
          </button>
        </div>
      ) : (
        <p role="status" className="flex items-center gap-2 text-[13px] leading-[18px] text-muted">
          {!isSaving && !isDirty ? (
            <Check aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          ) : null}
          {statusText}
        </p>
      )}
    </section>
  );
}
