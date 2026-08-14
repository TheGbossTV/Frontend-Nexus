import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { DraftBadge } from "~/components/EntryCard";
import { toTitleCase } from "~/lib/content";
import {
  loadSearchIndex,
  searchEntries,
  type SearchEntry,
  type SearchIndex,
} from "~/lib/search";

export function Search() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const results: SearchEntry[] = index ? searchEntries(index, query) : [];

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlighted(0);
  }, []);

  // Fetch on first open only — nothing is downloaded until search is used.
  useEffect(() => {
    if (!open || index) return;
    let cancelled = false;
    loadSearchIndex().then(
      (loaded) => {
        if (!cancelled) setIndex(loaded);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, index]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Global shortcut. Registered in an effect so it never runs during prerender.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      const entry = results[highlighted];
      if (entry) {
        event.preventDefault();
        go(entry.slug);
      }
    }
  }

  function go(slug: string) {
    close();
    // Client-side navigation — no page reload.
    navigate(`/library/${slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search entries"
        className="flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-muted transition hover:text-ink"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] md:inline">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
          <button
            type="button"
            aria-label="Close search"
            onClick={close}
            className="fixed inset-0 bg-black/60"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search entries"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-edge bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-edge px-4">
              <svg
                className="size-4 shrink-0 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search libraries, tags, categories…"
                aria-label="Search query"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted"
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {failed && (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Couldn&rsquo;t load the search index.
                </p>
              )}

              {!failed && !index && (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Loading…
                </p>
              )}

              {index && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  No matches for &ldquo;{query}&rdquo;.
                </p>
              )}

              <ul>
                {results.map((entry, position) => (
                  <li key={entry.slug}>
                    <button
                      type="button"
                      onClick={() => go(entry.slug)}
                      onMouseEnter={() => setHighlighted(position)}
                      className={
                        position === highlighted
                          ? "block w-full rounded-lg bg-canvas px-3 py-2 text-left"
                          : "block w-full rounded-lg px-3 py-2 text-left"
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {entry.title}
                        </span>
                        {entry.status === "draft" && <DraftBadge />}
                        <span className="ml-auto shrink-0 text-xs text-muted">
                          {toTitleCase(entry.category)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-muted">
                        {entry.tldr}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
