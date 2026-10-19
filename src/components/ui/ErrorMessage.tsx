import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

type ErrorMessageProps = {
  children: ReactNode;
  /** `banner` is a filled box for page-level errors; `inline` is small text under a field. */
  variant?: "banner" | "inline";
  /** Lets a field point at this message with `aria-describedby`. */
  id?: string;
};

/** An error with an icon, announced to screen readers. Meaning never depends on color alone. */
export function ErrorMessage({ children, variant = "banner", id }: ErrorMessageProps) {
  if (variant === "inline") {
    return (
      <p id={id} role="alert" className="flex items-start gap-2 text-[13px] leading-[18px] text-bad-fg">
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="min-w-0 wrap-break-word">{children}</span>
      </p>
    );
  }

  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-3 rounded-2xl bg-bad-bg px-4 py-3 text-[16px] leading-6 text-bad-fg"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
      <span className="min-w-0 wrap-break-word">{children}</span>
    </p>
  );
}
