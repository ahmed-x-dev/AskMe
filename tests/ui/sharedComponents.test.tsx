import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionMenu } from "../../src/components/ui/ActionMenu";
import { ConfirmDialog } from "../../src/components/ui/ConfirmDialog";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { ErrorMessage } from "../../src/components/ui/ErrorMessage";
import { Modal } from "../../src/components/ui/Modal";
import { NameDialog } from "../../src/components/ui/NameDialog";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { SegmentedControl } from "../../src/components/ui/SegmentedControl";
import { AppLayout } from "../../src/components/layout/AppLayout";
import { Check, Pencil, Trash2 } from "lucide-react";

const mockRoute = vi.hoisted(() => ({ pathname: "/" }))

vi.mock("next/navigation", () => ({
  usePathname: () => mockRoute.pathname,
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
let originalShowModal: PropertyDescriptor | undefined
let originalClose: PropertyDescriptor | undefined

beforeEach(() => {
  mockRoute.pathname = "/"
  originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal")
  originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close")
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "")
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open")
    },
  })

  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  if (originalShowModal) {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal)
  } else {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal
  }
  if (originalClose) {
    Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose)
  } else {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close
  }
  vi.restoreAllMocks()
})

function render(node: ReactNode) {
  act(() => root.render(node))
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

function button(label: string, scope: ParentNode = container) {
  return [...scope.querySelectorAll("button")].find((candidate) =>
    candidate.textContent?.includes(label),
  ) as HTMLButtonElement | undefined
}

describe("ActionMenu", () => {
  it("supports menu keys, skips disabled actions, and restores focus on Escape", async () => {
    render(
      <ActionMenu
        label="Roadmap actions"
        items={[
          { label: "Edit", icon: Pencil, onSelect: vi.fn() },
          { label: "Unavailable", icon: Check, disabled: true, onSelect: vi.fn() },
          { label: "Delete", icon: Trash2, danger: true, onSelect: vi.fn() },
        ]}
      />,
    )

    const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!
    await click(trigger)
    const menu = document.body.querySelector<HTMLElement>('[role="menu"]')!
    const edit = button("Edit", menu)!
    const deleteAction = button("Delete", menu)!

    expect(menu.style.visibility).toBe("visible")
    expect(document.activeElement).toBe(edit)
    await act(async () => {
      edit.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    })
    expect(document.activeElement).toBe(deleteAction)

    await act(async () => window.dispatchEvent(new Event("resize")))
    expect(document.activeElement).toBe(deleteAction)

    await act(async () => {
      deleteAction.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }))
    })
    expect(document.activeElement).toBe(edit)

    await act(async () => {
      edit.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    })
    expect(document.body.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it("keeps the menu inside viewport edges and calls the selected action", async () => {
    const onSelect = vi.fn()
    render(
      <ActionMenu
        label="Actions"
        items={[{ label: "Edit", icon: Pencil, onSelect }]}
      />,
    )

    const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      x: 980,
      y: 700,
      left: 980,
      right: 1004,
      top: 700,
      bottom: 744,
      width: 24,
      height: 44,
      toJSON: () => ({}),
    } as DOMRect)
    await click(trigger)
    const menu = document.body.querySelector<HTMLElement>('[role="menu"]')!
    Object.defineProperty(menu, "scrollHeight", { configurable: true, value: 160 })
    await act(async () => window.dispatchEvent(new Event("resize")))

    const left = Number.parseFloat(menu.style.left)
    const top = Number.parseFloat(menu.style.top)
    expect(left).toBeGreaterThanOrEqual(16)
    expect(left + 192).toBeLessThanOrEqual(window.innerWidth - 16)
    expect(top).toBeLessThan(700)

    await click(button("Edit", menu)!)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(document.body.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it("allows Escape to close a menu when every action is disabled", async () => {
    render(
      <ActionMenu
        label="Unavailable actions"
        items={[{ label: "Unavailable", icon: Check, disabled: true, onSelect: vi.fn() }]}
      />,
    )

    const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!
    await click(trigger)
    const menu = document.body.querySelector<HTMLElement>('[role="menu"]')!
    expect(document.activeElement).toBe(menu)
    await act(async () => {
      menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    })

    expect(document.body.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})

describe("AppLayout navigation", () => {
  it("keeps Roadmaps active for roadmap detail routes", () => {
    mockRoute.pathname = "/roadmap/roadmap-1"
    render(
      <AppLayout theme="light" setTheme={vi.fn()}>
        <h1>Roadmap</h1>
      </AppLayout>,
    )

    const primaryNavigation = container.querySelector('nav[aria-label="Primary navigation"]')!
    const roadmaps = primaryNavigation.querySelector<HTMLAnchorElement>('a[href="/"]')
    expect(roadmaps?.getAttribute("aria-current")).toBe("location")
    expect(primaryNavigation.querySelector('a[href="/review"]')?.hasAttribute("aria-current")).toBe(false)
  })
})

describe("shared feedback and choice controls", () => {
  it("clamps progress values and exposes the selected segmented option", async () => {
    const onChange = vi.fn()
    render(
      <>
        <ProgressBar label="Study progress" completed={8} total={5} />
        <SegmentedControl
          label="Question type"
          value="mcq"
          options={[
            { value: "mcq", label: "Multiple choice" },
            { value: "essay", label: "Essay", disabled: true },
          ]}
          onChange={onChange}
        />
      </>,
    )

    const progress = container.querySelector('[role="progressbar"]')!
    expect(progress.getAttribute("aria-valuemax")).toBe("5")
    expect(progress.getAttribute("aria-valuenow")).toBe("5")
    expect((container.querySelector('button[aria-pressed="true"]') as HTMLButtonElement).disabled).toBe(false)
    expect((button("Essay") as HTMLButtonElement).disabled).toBe(true)
    await click(button("Multiple choice")!)
    expect(onChange).toHaveBeenCalledWith("mcq")
  })

  it("provides an actionable alert and a usable empty-state action", async () => {
    const retry = vi.fn()
    const create = vi.fn()
    render(
      <>
        <ErrorMessage actionLabel="Try again" onAction={retry}>
          Could not load roadmaps.
        </ErrorMessage>
        <EmptyState
          title="Start studying"
          description="Create a roadmap to organize your topics."
          actionLabel="Create roadmap"
          onAction={create}
        />
      </>,
    )

    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Could not load roadmaps.")
    await click(button("Try again")!)
    await click(button("Create roadmap")!)
    expect(retry).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledOnce()
  })
})

describe("dialog submission states", () => {
  it("describes name constraints and prevents duplicate submissions while saving", async () => {
    let resolveSubmit!: () => void
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    render(
      <NameDialog
        title="Rename roadmap"
        label="Roadmap name"
        initialValue="Biology"
        submitLabel="Save"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    )

    const input = container.querySelector<HTMLInputElement>("input")!
    expect(input.getAttribute("aria-describedby")).toContain("name-dialog-help")
    const submit = button("Save")!
    await act(async () => {
      submit.click()
      submit.click()
    })

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(submit.disabled).toBe(true)
    expect(submit.getAttribute("aria-busy")).toBe("true")

    await act(async () => resolveSubmit())
  })

  it("reports failed confirmation and allows a deliberate retry", async () => {
    const onConfirm = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("The item could not be deleted."))
      .mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(
      <ConfirmDialog
        title="Delete roadmap?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    )

    await click(button("Delete")!)
    expect(container.textContent).toContain("The item could not be deleted.")
    expect(button("Delete")?.disabled).toBe(false)

    await click(button("Delete")!)
    expect(onConfirm).toHaveBeenCalledTimes(2)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("blocks Escape dismissal while a modal operation is busy", () => {
    const onClose = vi.fn()
    render(
      <Modal titleId="busy-title" isBusy onClose={onClose}>
        <h2 id="busy-title">Saving</h2>
      </Modal>,
    )

    const dialog = container.querySelector("dialog")!
    const cancel = new Event("cancel", { cancelable: true })
    dialog.dispatchEvent(cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })
})
