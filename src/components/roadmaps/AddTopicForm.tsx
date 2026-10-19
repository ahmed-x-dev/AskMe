"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

type AddTopicFormProps = {
  placeholder: string;
  onAdd: (title: string) => Promise<void>;
};

/** One-line form: type a name and press Enter to add a topic. */
export function AddTopicForm({ placeholder, onAdd }: AddTopicFormProps) {
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
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={error !== null}
          className="min-h-12 min-w-0 flex-1 rounded-2xl bg-bg px-4 text-[16px] text-fg placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={isSaving || title.trim() === ""}
          aria-label="Add topic"
          className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-accent text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] leading-5 text-bad-fg">
          {error}
        </p>
      ) : null}
    </form>
  );
}
