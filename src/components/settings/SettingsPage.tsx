"use client";

import { useEffect, useState } from "react";

import {
  buttonDestructive,
  buttonPrimary,
  buttonSecondaryOnCard,
  fieldOnCardClassName,
} from "@/components/ui/styles";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppTheme, type Theme } from "@/components/layout/AppLayout";
import {
  clearAiApiKey,
  DEFAULT_AI_PROVIDER,
  getAiApiKey,
  getAiProvider,
  saveAiApiKey,
  setAiProvider,
  type AiProvider,
} from "@/platform/secureStorage";
import { DataSection } from "./DataSection";
import { StoragePersistenceSection } from "./StoragePersistenceSection";

const providerOptions: { value: AiProvider; label: string }[] = [
  { value: "gemini", label: "Gemini" },
  { value: "openai", label: "OpenAI" },
];

function AiKeySection() {
  const [provider, setProvider] = useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [apiKey, setApiKey] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    let isCurrent = true;

    queueMicrotask(() => {
      try {
        const savedProvider = getAiProvider();
        const savedKey = getAiApiKey(savedProvider);

        if (isCurrent) {
          setProvider(savedProvider);
          setApiKey(savedKey);
          setHasSavedKey(savedKey.length > 0);
        }
      } catch (error) {
        if (isCurrent) {
          setStorageAvailable(false);
          setStatus({
            kind: "error",
            message: error instanceof Error ? error.message : "AI settings could not be loaded from this browser.",
          });
        }
      } finally {
        if (isCurrent) setIsLoaded(true);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleProviderChange = (nextProvider: AiProvider) => {
    try {
      const nextKey = getAiApiKey(nextProvider);
      setAiProvider(nextProvider);
      setProvider(nextProvider);
      setApiKey(nextKey);
      setHasSavedKey(nextKey.length > 0);
      setStatus(null);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "The AI provider could not be changed.",
      });
    }
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();

    if (!trimmed) {
      return;
    }

    try {
      saveAiApiKey(provider, trimmed);
      setHasSavedKey(true);
      setStatus({
        kind: "success",
        message: `${provider === "openai" ? "OpenAI" : "Gemini"} key saved in this browser.`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "The API key could not be saved.",
      });
    }
  };

  return (
    <section
      aria-labelledby="ai-key-heading"
      aria-busy={!isLoaded || undefined}
      className="w-full rounded-2xl bg-card p-4"
    >
      <h2 id="ai-key-heading" className="text-[18px] font-medium leading-[26px] text-fg">
        AI assistance
      </h2>

      <p className="mt-2 text-[16px] leading-6 text-muted">
        Choose a provider and save its API key to use AI question generation, grading, and explanations. The key stays
        in this browser and is never included in backups or sync files. Browser storage is not encrypted.
      </p>

      <label
        className="mt-5 block text-[13px] font-medium leading-[18px] text-muted"
        htmlFor="ai-provider"
      >
        AI provider
      </label>
      <select
        id="ai-provider"
        value={provider}
        disabled={!isLoaded || !storageAvailable}
        onChange={(event) =>
          handleProviderChange(event.target.value as AiProvider)
        }
        className={`mt-2 ${fieldOnCardClassName}`}
      >
        {providerOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label
        className="mt-5 block text-[13px] font-medium leading-[18px] text-muted"
        htmlFor="ai-key"
      >
        API key
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="ai-key"
          type={isVisible ? "text" : "password"}
          value={apiKey}
          disabled={!isLoaded || !storageAvailable}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={`Enter your ${provider === "openai" ? "OpenAI" : "Gemini"} key`}
          aria-describedby="ai-key-help"
          className={`flex-1 ${fieldOnCardClassName}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          disabled={!isLoaded || !storageAvailable}
          aria-label={isVisible ? "Hide API key" : "Show API key"}
          className={`shrink-0 ${buttonSecondaryOnCard}`}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>

      <p id="ai-key-help" className="mt-2 text-[13px] leading-[18px] text-muted">
        Saving a non-empty key stores it for this provider. To remove a saved key, use Remove.
      </p>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isLoaded || !storageAvailable || apiKey.trim() === ""}
          className={`flex-1 ${buttonPrimary}`}
        >
          Save key
        </button>
        <button
          type="button"
          onClick={() => setIsRemoveOpen(true)}
          disabled={!isLoaded || !storageAvailable || !hasSavedKey}
          className={`flex-1 ${buttonDestructive}`}
        >
          Remove key
        </button>
      </div>

      {!isLoaded ? (
        <p role="status" className="mt-4 text-[13px] leading-[18px] text-muted">
          Loading saved AI settings…
        </p>
      ) : null}

      {status ? (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-4 text-[13px] leading-[18px] ${
            status.kind === "error" ? "text-bad-fg" : "text-accent-text"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      {isRemoveOpen ? (
        <ConfirmDialog
          title={`Remove ${provider === "openai" ? "OpenAI" : "Gemini"} API key?`}
          message="This removes the saved key from this browser. It cannot be recovered here unless you enter it again."
          confirmLabel="Remove key"
          busyLabel="Removing…"
          onConfirm={() => {
            clearAiApiKey(provider);
            setApiKey("");
            setHasSavedKey(false);
            setStatus({
              kind: "success",
              message: `The ${provider === "openai" ? "OpenAI" : "Gemini"} key was removed.`,
            });
          }}
          onClose={() => setIsRemoveOpen(false)}
        />
      ) : null}
    </section>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useAppTheme();
  const options: { value: Theme; label: string; description: string }[] = [
    { value: "light", label: "Light", description: "Bright surfaces for a well-lit setting." },
    { value: "dark", label: "Dark", description: "Dimmer surfaces for low-light settings." },
  ];

  return (
    <section aria-labelledby="appearance-heading" className="w-full rounded-2xl bg-card p-4">
      <h2 id="appearance-heading" className="text-[18px] font-medium leading-[26px] text-fg">
        Appearance
      </h2>
      <p id="theme-help" className="mt-2 text-[16px] leading-6 text-muted">
        Choose a theme for this browser. Your preference is saved automatically; you can also switch it from the header.
      </p>
      <fieldset aria-describedby="theme-help" className="mt-4 flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-medium leading-[18px] text-muted">Color theme</legend>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-[14px] border px-3 py-3 transition-colors ${
              theme === option.value ? "border-accent bg-bg" : "border-control-line bg-bg hover:bg-card-hover"
            }`}
          >
            <input
              type="radio"
              name="theme-preference"
              value={option.value}
              checked={theme === option.value}
              onChange={() => setTheme(option.value)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-(--accent) focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span className="min-w-0">
              <span className="block text-[16px] font-medium leading-6 text-fg">{option.label}</span>
              <span className="block text-[13px] leading-[18px] text-muted">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <header className="min-w-0">
        <h1 className="text-[22px] font-medium leading-7 text-fg">Settings</h1>
        <p className="mt-1 text-[16px] leading-6 text-muted">
          Manage your appearance, AI assistance, and study data on this device.
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <AppearanceSection />
          <AiKeySection />
        </div>
        <div className="flex flex-col gap-6">
          <StoragePersistenceSection />
          <DataSection />
        </div>
      </div>
    </div>
  );
}
