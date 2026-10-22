"use client";

import { useEffect, useState } from "react";
import { buttonSecondaryOnCard } from "@/components/ui/styles";

type StorageStatus = {
  kind: "success" | "warning" | "error";
  message: string;
};

/** Lets the learner ask the browser to protect local study data from automatic eviction. */
export function StoragePersistenceSection() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [status, setStatus] = useState<StorageStatus | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const checkPersistence = async () => {
      const storage = navigator.storage;

      if (typeof storage?.persisted !== "function" || typeof storage.persist !== "function") {
        if (isCurrent) {
          setIsSupported(false);
          setIsChecking(false);
        }
        return;
      }

      try {
        const persisted = await storage.persisted();
        if (isCurrent) {
          setIsSupported(true);
          setIsPersisted(persisted);
        }
      } catch (error) {
        if (isCurrent) {
          setIsSupported(true);
          setStatus({
            kind: "error",
            message: error instanceof Error ? error.message : "The browser's storage status could not be checked.",
          });
        }
      } finally {
        if (isCurrent) setIsChecking(false);
      }
    };

    void checkPersistence();

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleRequest = async () => {
    const storage = navigator.storage;

    if (typeof storage?.persist !== "function") {
      setIsSupported(false);
      setStatus({
        kind: "warning",
        message: "This browser does not support persistent local storage. Keep a backup of your study data.",
      });
      return;
    }

    setIsRequesting(true);
    setStatus(null);

    try {
      const persisted = await storage.persist();
      setIsPersisted(persisted);
      setStatus({
        kind: persisted ? "success" : "warning",
        message: persisted
          ? "The browser granted persistent storage. Your data can still be removed by you or the browser."
          : "The browser did not grant persistent storage. Keep a backup of your study data.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "The browser could not update storage persistence.",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <section aria-labelledby="storage-persistence-heading" aria-busy={isChecking || isRequesting || undefined} className="w-full rounded-2xl bg-card p-4">
      <h2 id="storage-persistence-heading" className="text-lg font-medium leading-6.5 text-fg">
        Local data retention
      </h2>
      <p className="mt-2 text-base leading-6 text-muted">
        Ask the browser not to automatically evict AskMe’s local study data. This is best-effort and does not replace
        downloading a backup.
      </p>
      <p className="mt-3 text-[13px] leading-4.5 text-muted">
        {isChecking
          ? "Checking browser storage…"
          : isPersisted
            ? "Persistent storage is currently granted."
            : isSupported === false
              ? "Persistent storage is not supported in this browser."
              : "The browser may clear this site's local data when storage is under pressure."}
      </p>
      <button
        type="button"
        onClick={() => void handleRequest()}
        disabled={isChecking || isRequesting || isPersisted || isSupported === false}
        aria-busy={isRequesting}
        className={`mt-3 ${buttonSecondaryOnCard}`}
      >
        {isRequesting
          ? "Requesting…"
          : isPersisted
            ? "Persistent storage granted"
            : "Request persistent storage"}
      </button>
      {status ? (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-3 text-[13px] leading-4.5 ${
            status.kind === "error"
              ? "text-bad-fg"
              : status.kind === "warning"
                ? "text-warn-fg"
                : "text-accent-text"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </section>
  );
}
