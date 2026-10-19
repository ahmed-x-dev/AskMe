import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

const heading =
  (Tag: "h3" | "h4" | "h5" | "h6", className: string) =>
  ({ children }: { children?: ReactNode }) => (
    <Tag className={`${className} wrap-break-word`}>{children}</Tag>
  );

const components: Components = {
  h1: heading("h3", "mt-2 text-[22px] font-medium leading-7"),
  h2: heading("h4", "mt-2 text-[18px] font-medium leading-7"),
  h3: heading("h5", "mt-1 text-[16px] font-medium leading-6"),
  h4: heading("h6", "text-[16px] font-medium leading-6"),
  h5: heading("h6", "text-[16px] font-medium leading-6"),
  h6: heading("h6", "text-[16px] font-medium leading-6"),
  ul: ({ children }) => <ul className="list-disc space-y-1 ps-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 ps-6">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-s-4 border-card-hover ps-4 text-muted">{children}</blockquote>
  ),
  hr: () => <hr className="border-card-hover" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-text underline underline-offset-2"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-2xl bg-bg p-3 font-mono text-[14px] leading-5 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code className={className ?? "rounded-md bg-bg px-1.5 py-0.5 font-mono text-[14px]"}>
      {children}
    </code>
  ),
  // Remote images are not loaded, so a note can never make the browser fetch from another site.
  img: ({ alt }) => <span className="text-muted">[image{alt ? `: ${alt}` : ""}]</span>,
};

/** Renders user-written Markdown safely: no raw HTML, unsafe link schemes dropped, links open in a new tab. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-4 text-[16px] leading-6 text-fg wrap-break-word [&_h3]:mt-2 [&_h4]:mt-1 [&_h5]:mt-1 [&_p]:wrap-break-word">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
