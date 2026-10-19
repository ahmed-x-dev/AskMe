"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { fieldClassName } from "@/components/ui/styles";

type AddTopicFormProps = {
  placeholder: string;
  /** Id of the text field, so other parts of the page can move focus to it. */
  inputId?: string;
  onAdd: (title: string) => Promise<void>;
};

/** One-line form: type a name and press Enter to add a topic. */
export function AddTopicForm({ placeholder, inputId, onAdd }: AddTopicFormProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim() === "") return;

    setIsSaving(true);
    setError(null);

    try {
      await onAdd(title);
      setTitle("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add the topic.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={error !== null}
          aria-describedby={error ? `${inputId ?? "add-topic"}-error` : undefined}
          className={`min-w-0 flex-1 ${fieldClassName}`}
        />
        <button
          type="submit"
          disabled={isSaving || title.trim() === ""}
          aria-label="Add topic"
          aria-busy={isSaving}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-accent text-on-accent transition duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed"
        >
          <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
      {error ? (
        <ErrorMessage variant="inline" id={`${inputId ?? "add-topic"}-error`}>
          {error}
        </ErrorMessage>
      ) : null}
    </form>
  );
}
