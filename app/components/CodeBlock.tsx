import { type ComponentPropsWithoutRef, useRef, useState } from "react";

/**
 * The only interactive part of a code block. Everything around it is static
 * prerendered HTML with build-time Shiki colors, so this stays a small island.
 */
function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (insecure origin, denied permission) — stay silent
      // rather than claiming a copy that didn't happen.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
      className="rounded-md p-1.5 text-muted transition hover:bg-edge hover:text-ink"
    >
      {copied ? (
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
    </button>
  );
}

/**
 * Replaces the <pre> that rehype-pretty-code emits, wrapping it in IDE-window
 * chrome. Mapped in via the MDX `components` prop — see app/components/mdx.tsx.
 */
export function CodeBlock({
  children,
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const language = props["data-language" as keyof typeof props] as
    | string
    | undefined;

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-edge bg-canvas px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>

        {language && (
          <span className="font-mono text-xs tracking-wide text-muted">
            {language}
          </span>
        )}

        <CopyButton
          getText={() =>
            preRef.current?.querySelector("code")?.textContent ?? ""
          }
        />
      </div>

      <pre
        {...props}
        ref={preRef}
        className="overflow-x-auto p-4 text-sm leading-6"
      >
        {children}
      </pre>
    </div>
  );
}
