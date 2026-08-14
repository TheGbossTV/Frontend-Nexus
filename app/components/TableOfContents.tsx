import type { TocEntry } from "@stefanprobst/rehype-extract-toc";
import { Link } from "react-router";
import {
  DIFFICULTY_SECTION_ID,
  LEVELS,
  LEVEL_QUERY_KEY,
} from "~/components/DifficultyTabs";

const LEVEL_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  advanced: "Advanced",
};

/**
 * Built from the `tableOfContents` export that rehype-extract-toc adds to every
 * MDX file at build time — so it ships inside the prerendered HTML rather than
 * being scraped from the DOM after hydration.
 *
 * Only top-level (h2) headings are listed. Headings nested inside difficulty
 * panels would otherwise appear as dead links while their tab is hidden; the
 * tabs get their own jump links instead, which also switch the active tab.
 */
export function TableOfContents({
  toc,
  hasDifficultyTabs,
}: {
  toc: TocEntry[];
  hasDifficultyTabs: boolean;
}) {
  const headings = toc.filter((entry) => entry.depth === 2 && entry.id);

  if (headings.length === 0 && !hasDifficultyTabs) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        On this page
      </p>

      <ul className="mt-3 space-y-1.5 border-l border-edge">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="-ml-px block border-l border-transparent pl-3 text-sm text-muted transition hover:border-accent hover:text-ink"
            >
              {heading.value}
            </a>
          </li>
        ))}

        {hasDifficultyTabs && (
          <>
            <li>
              <a
                href={`#${DIFFICULTY_SECTION_ID}`}
                className="-ml-px block border-l border-transparent pl-3 text-sm text-muted transition hover:border-accent hover:text-ink"
              >
                Learn it
              </a>
            </li>
            {LEVELS.map((level) => (
              <li key={level}>
                <Link
                  to={{
                    search: `?${LEVEL_QUERY_KEY}=${level}`,
                    hash: `#${DIFFICULTY_SECTION_ID}`,
                  }}
                  preventScrollReset
                  className="-ml-px block border-l border-transparent pl-6 text-sm text-muted transition hover:border-accent hover:text-ink"
                >
                  {LEVEL_LABELS[level]}
                </Link>
              </li>
            ))}
          </>
        )}
      </ul>
    </nav>
  );
}
