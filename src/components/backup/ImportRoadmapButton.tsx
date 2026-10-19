"use client";

import { useRef, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { importRoadmapFile, type ImportResult } from "@/lib/data";
import { parseRoadmapFile } from "@/lib/importExport";

type ImportRoadmapButtonProps = {
  className: string;
  children?: ReactNode;
  onImported: (result: ImportResult) => void;
  onError: (message: string) => void;
};

/** A button that opens the file picker and adds the chosen roadmap JSON file as a new roadmap. */
export function ImportRoadmapButton({ className, children = "Import roadmap", onImported, onError }: ImportRoadmapButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setIsBusy(true);

    try {
      onImported(await importRoadmapFile(parseRoadmapFile(await file.text())));
    } catch (error) {
      onError(error instanceof Error ? error.message : "The roadmap could not be imported.");
    } finally {
      setIsBusy(false);
      // Clearing the input lets the same file be picked again.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        hidden
        data-testid="import-roadmap-input"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={isBusy}
        aria-busy={isBusy}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        {isBusy ? "Importing…" : children}
      </button>
    </>
  );
}
