import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppLayout } from "../src/components/layout/AppLayout";
import { BackupReminder } from "../src/components/backup/BackupReminder";
import { ImportRoadmapButton } from "../src/components/backup/ImportRoadmapButton";
import { DataSection } from "../src/components/settings/DataSection";
import { SettingsPage } from "../src/components/settings/SettingsPage";
import { StoragePersistenceSection } from "../src/components/settings/StoragePersistenceSection";
import { allTables, buildBackup, buildRoadmapFile, createRoadmap, db, resetAllData } from "../src/lib/data";
import { createBackupArchive, MAX_BACKUP_ARCHIVE_BYTES } from "../src/lib/libraryArchive";

const mockDownloadBackup = vi.hoisted(() => vi.fn<() => Promise<void>>());
const mockRoute = vi.hoisted(() => ({ pathname: "/settings" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockRoute.pathname,
}));

vi.mock("../src/lib/backupActions", () => ({
  downloadBackup: mockDownloadBackup,
}));

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let originalShowModal: PropertyDescriptor | undefined;
let originalClose: PropertyDescriptor | undefined;
let originalStorage: PropertyDescriptor | undefined;

beforeEach(async () => {
  await db.transaction("rw", allTables(), async () => {
    for (const table of allTables()) await table.clear();
  });
  window.localStorage.clear();
  mockDownloadBackup.mockReset();
  mockRoute.pathname = "/settings";
  originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
  originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
  originalStorage = Object.getOwnPropertyDescriptor(navigator, "storage");
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (originalShowModal) {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  }
  if (originalClose) {
    Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  }
  if (originalStorage) {
    Object.defineProperty(navigator, "storage", originalStorage);
  } else {
    Reflect.deleteProperty(navigator, "storage");
  }
  vi.restoreAllMocks();
});

function button(label: string, scope: ParentNode = container) {
  return [...scope.querySelectorAll("button")].find((candidate) =>
    candidate.textContent?.includes(label),
  ) as HTMLButtonElement | undefined;
}

async function click(element: HTMLElement | undefined) {
  if (!element) throw new Error("Element not found");
  await act(async () => {
    element.click();
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
}

describe("SettingsPage", () => {
  it("groups appearance, AI, and data preferences and exposes the shared theme control", async () => {
    const setTheme = vi.fn();
    await act(async () => {
      root.render(
        <AppLayout theme="light" setTheme={setTheme}>
          <SettingsPage />
        </AppLayout>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector("#appearance-heading")?.textContent).toBe("Appearance");
    expect(container.querySelector("#ai-key-heading")?.textContent).toBe("AI assistance");
    expect(container.querySelector("#storage-persistence-heading")?.textContent).toBe("Local data retention");
    expect(container.querySelector("#data-heading")?.textContent).toBe("Study data");
    expect(container.querySelector<HTMLInputElement>('input[name="theme-preference"][value="light"]')?.checked).toBe(true);

    await click(container.querySelector<HTMLInputElement>('input[name="theme-preference"][value="dark"]')!);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("reports when the browser grants persistent local storage", async () => {
    const storage = {
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(true),
    };
    Object.defineProperty(navigator, "storage", { configurable: true, value: storage });
    await act(async () => root.render(<StoragePersistenceSection />));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await click(button("Request persistent storage"));

    expect(storage.persist).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="status"]')?.textContent).toContain("granted");
    expect(button("Persistent storage granted")?.disabled).toBe(true);
  });

  it("clearly reports when the browser denies persistent local storage", async () => {
    const storage = {
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    };
    Object.defineProperty(navigator, "storage", { configurable: true, value: storage });
    await act(async () => root.render(<StoragePersistenceSection />));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await click(button("Request persistent storage"));

    expect(container.querySelector('[role="status"]')?.textContent).toContain("did not grant");
    expect(container.textContent).toContain("Keep a backup");
  });

  it("explains when persistent local storage is unavailable", async () => {
    Object.defineProperty(navigator, "storage", { configurable: true, value: undefined });
    await act(async () => root.render(<StoragePersistenceSection />));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("not supported in this browser");
    expect(button("Request persistent storage")?.disabled).toBe(true);
  });

  it("confirms before removing a saved AI key", async () => {
    window.localStorage.setItem("askme-gemini-key", "saved-key");
    await act(async () => {
      root.render(
        <AppLayout theme="light" setTheme={vi.fn()}>
          <SettingsPage />
        </AppLayout>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await click(button("Remove"));
    const dialog = container.querySelector("dialog")!;
    expect(dialog.textContent).toContain("cannot be recovered here unless you enter it again");
    expect(window.localStorage.getItem("askme-gemini-key")).toBe("saved-key");

    await click(button("Remove key", dialog)!);
    expect(window.localStorage.getItem("askme-gemini-key")).toBeNull();
    expect(container.textContent).toContain("The Gemini key was removed.");
  });

  it("saves a key under the selected provider and keeps the other provider's key", async () => {
    window.localStorage.setItem("askme-openai-key", "existing-openai-key");
    await act(async () => {
      root.render(
        <AppLayout theme="light" setTheme={vi.fn()}>
          <SettingsPage />
        </AppLayout>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      const provider = container.querySelector<HTMLSelectElement>("#ai-provider")!;
      provider.value = "openai";
      provider.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const keyInput = container.querySelector<HTMLInputElement>("#ai-key")!;
    expect(keyInput.value).toBe("existing-openai-key");

    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        keyInput,
        "  new-openai-key  ",
      );
      keyInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click(button("Save key"));

    expect(window.localStorage.getItem("askme-ai-provider")).toBe("openai");
    expect(window.localStorage.getItem("askme-openai-key")).toBe("new-openai-key");
    expect(window.localStorage.getItem("askme-gemini-key")).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toContain("OpenAI key saved");
  });

  it("explains reset consequences and leaves data untouched until confirmation", async () => {
    await createRoadmap({ title: "Biology" });
    window.localStorage.setItem("askme-gemini-key", "saved-key");
    window.localStorage.setItem("askme-theme", "dark");
    await act(async () => root.render(<DataSection />));

    await click(button("Reset all data"));
    const dialog = container.querySelector("dialog")!;
    expect(dialog.textContent).toContain("deletes every roadmap, topic, question and all progress");
    expect(dialog.textContent).toContain("Your AI key and theme preference stay.");
    expect(await db.roadmaps.count()).toBe(1);

    await click(button("Cancel", dialog)!);
    expect(await db.roadmaps.count()).toBe(1);

    await click(button("Reset all data"));
    await click(button("Delete everything", container.querySelector("dialog")!)!);
    expect(await db.roadmaps.count()).toBe(0);
    expect(window.localStorage.getItem("askme-gemini-key")).toBe("saved-key");
    expect(window.localStorage.getItem("askme-theme")).toBe("dark");
  });

  it("disables duplicate backup requests and announces success", async () => {
    let resolveBackup!: () => void;
    mockDownloadBackup.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveBackup = resolve;
      }),
    );
    await act(async () => root.render(<DataSection />));

    await click(button("Download backup"));
    const pending = button("Preparing…")!;
    expect(pending.disabled).toBe(true);
    expect(pending.getAttribute("aria-busy")).toBe("true");

    await act(async () => resolveBackup());
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Backup downloaded");
  });

  it("announces a backup failure and allows a retry", async () => {
    mockDownloadBackup.mockRejectedValueOnce(new Error("Download is unavailable."));
    await act(async () => root.render(<DataSection />));

    await click(button("Download backup"));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Download is unavailable.");
    expect(button("Download backup")?.disabled).toBe(false);
  });

  it("keeps the backup reminder visible with explicit success feedback", async () => {
    mockDownloadBackup.mockResolvedValueOnce(undefined);
    await act(async () => root.render(<BackupReminder oldestDataAt="2026-01-01T00:00:00.000Z" />));

    await click(button("Back up now"));
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Backup downloaded");
    expect(container.querySelector('[aria-label="Backup reminder"]')?.className).toContain("bg-ok-bg");
    expect(button("Done")).toBeDefined();
  });

  it("reports an unreadable restore file without opening a replacement confirmation", async () => {
    await act(async () => root.render(<DataSection />));
    const input = container.querySelector<HTMLInputElement>('[data-testid="restore-input"]')!;
    const file = new File(["damaged"], "backup.zip", { type: "application/zip" });
    Object.defineProperty(file, "arrayBuffer", {
      configurable: true,
      value: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });

    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain("not a readable ZIP");
    expect(container.querySelector("dialog")).toBeNull();
  });

  it("rejects an oversized restore before reading the file into memory", async () => {
    await act(async () => root.render(<DataSection />));
    const input = container.querySelector<HTMLInputElement>('[data-testid="restore-input"]')!;
    const file = new File([], "oversized.zip", { type: "application/zip" });
    const arrayBuffer = vi.fn(async () => new ArrayBuffer(0));
    Object.defineProperty(file, "size", { configurable: true, value: MAX_BACKUP_ARCHIVE_BYTES + 1 });
    Object.defineProperty(file, "arrayBuffer", { configurable: true, value: arrayBuffer });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });

    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("no larger than 25 MB");
    expect(container.querySelector("dialog")).toBeNull();
  });

  it("explains restore replacement and only replaces data after confirmation", async () => {
    await createRoadmap({ title: "Incoming" });
    const archive = createBackupArchive(await buildBackup());
    await resetAllData();
    await createRoadmap({ title: "Current" });
    window.localStorage.setItem("askme-gemini-key", "saved-key");
    window.localStorage.setItem("askme-theme", "dark");
    await act(async () => root.render(<DataSection />));

    const file = new File([], "backup.zip", { type: "application/zip" });
    const bytes = new Uint8Array(archive);
    Object.defineProperty(file, "arrayBuffer", {
      configurable: true,
      value: async () => bytes.buffer,
    });
    const input = container.querySelector<HTMLInputElement>('[data-testid="restore-input"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const dialog = container.querySelector("dialog")!;
    expect(dialog.textContent).toContain("replaces all roadmaps, topics, questions, and progress");
    expect(dialog.textContent).toContain("Your AI key and theme preference stay.");
    expect(await db.roadmaps.toArray().then((roadmaps) => roadmaps.map((roadmap) => roadmap.title))).toEqual(["Current"]);

    await click(button("Replace my data", dialog)!);
    expect(await db.roadmaps.toArray().then((roadmaps) => roadmaps.map((roadmap) => roadmap.title))).toEqual(["Incoming"]);
    expect(window.localStorage.getItem("askme-gemini-key")).toBe("saved-key");
    expect(window.localStorage.getItem("askme-theme")).toBe("dark");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Backup restored");
  });

  it("announces a successful roadmap import and links to the added roadmap", async () => {
    const roadmap = await createRoadmap({ title: "Shared subject" });
    const fileContents = await buildRoadmapFile(roadmap.id);
    await act(async () => root.render(<DataSection />));

    const file = new File([], "roadmap.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      configurable: true,
      value: async () => JSON.stringify(fileContents),
    });
    const input = container.querySelector<HTMLInputElement>('[data-testid="import-roadmap-input"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.querySelector('[role="status"]')?.textContent).toContain('Imported “Shared subject”');
    expect(container.querySelector('[role="status"] a')?.getAttribute("href")).toMatch(/^\/roadmap\//);
    expect(await db.roadmaps.count()).toBe(2);
  });

  it("reports roadmap import validation failures", async () => {
    await act(async () => root.render(<ImportRoadmapButton className="test" onImported={vi.fn()} onError={(message) => { container.dataset.error = message; }} />));

    const file = new File([], "invalid.json", { type: "application/json" });
    Object.defineProperty(file, "text", { configurable: true, value: async () => "not json" });
    const input = container.querySelector<HTMLInputElement>('[data-testid="import-roadmap-input"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.dataset.error).toContain("not JSON");
    expect(button("Import roadmap")?.disabled).toBe(false);
  });
});
