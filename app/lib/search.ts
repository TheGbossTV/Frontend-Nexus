import type Fuse from "fuse.js";
import type { Status } from "./frontmatter";

export interface SearchEntry {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  tldr: string;
  status: Status;
}

export interface SearchIndex {
  entries: SearchEntry[];
  fuse: Fuse<SearchEntry>;
}

/** Exported so it can be exercised directly in tests, not just through the UI. */
export const FUSE_OPTIONS = {
  // Weighted so a title hit beats a passing mention in the summary.
  keys: [
    { name: "title", weight: 3 },
    { name: "tags", weight: 2 },
    { name: "category", weight: 1.5 },
    { name: "tldr", weight: 1 },
  ],
  threshold: 0.35,
  // Matches anywhere in the field, not just near the start.
  ignoreLocation: true,
};

/**
 * Both the index and Fuse itself are fetched on first use, so a reader who
 * never opens search pays nothing for it. The promise is cached, so concurrent
 * callers share one request.
 */
let pending: Promise<SearchIndex> | null = null;

export function loadSearchIndex(): Promise<SearchIndex> {
  pending ??= (async () => {
    const [{ default: FuseConstructor }, response] = await Promise.all([
      import("fuse.js"),
      // BASE_URL is Vite's view of BASE_PATH, so this URL is correct on both
      // the GitHub Pages subpath and a future custom domain.
      fetch(`${import.meta.env.BASE_URL}search-index.json`),
    ]);

    if (!response.ok) {
      throw new Error(`Search index request failed (${response.status})`);
    }

    const entries = (await response.json()) as SearchEntry[];

    return {
      entries,
      fuse: new FuseConstructor(entries, FUSE_OPTIONS),
    };
  })();

  return pending;
}

export function searchEntries(
  index: SearchIndex,
  query: string,
  limit = 8,
): SearchEntry[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return index.entries.slice(0, limit);
  return index.fuse
    .search(trimmed, { limit })
    .map((result) => result.item);
}
