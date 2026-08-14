/**
 * The content schema. Every .mdx file in app/content/libraries must satisfy
 * this exactly — see README.md for the authoring guide.
 */

export const POPULARITY_LEVELS = ["high", "medium", "niche"] as const;
export const STATUSES = ["draft", "published"] as const;

export type Popularity = (typeof POPULARITY_LEVELS)[number];
export type Status = (typeof STATUSES)[number];

export interface Alternative {
  /** Slug of another entry — linked automatically if that entry exists. */
  slug: string;
  /** WHY you'd reach for it instead. Never just restate the name. */
  reason: string;
}

export interface LibraryFrontmatter {
  title: string;
  /** Open-ended. Categories are derived from content, never hardcoded. */
  category: string;
  tags: string[];
  tldr: string;
  whenToUse: string;
  whenNotTo: string;
  alternatives: Alternative[];
  docsUrl: string;
  popularity: Popularity;
  status: Status;
  /** false until a human has read the entry through. */
  verified: boolean;
  /** ISO date, e.g. "2026-08-14". */
  lastReviewed: string;
}

/**
 * Frontmatter arrives as `unknown` from MDX, and a typo silently renders
 * "undefined" into the page. Validating here turns that into a build-time
 * error naming the file and the field.
 */
export function parseFrontmatter(
  slug: string,
  value: unknown,
): LibraryFrontmatter {
  const fail = (message: string): never => {
    throw new Error(`Invalid frontmatter in "${slug}.mdx": ${message}`);
  };

  if (typeof value !== "object" || value === null) {
    return fail("expected a YAML frontmatter block, found none.");
  }

  const data = value as Record<string, unknown>;

  const str = (key: string): string => {
    const raw = data[key];
    return typeof raw === "string" && raw.trim().length > 0
      ? raw
      : fail(`"${key}" must be a non-empty string.`);
  };

  const bool = (key: string): boolean => {
    const raw = data[key];
    return typeof raw === "boolean"
      ? raw
      : fail(`"${key}" must be true or false.`);
  };

  const oneOf = <T extends string>(key: string, allowed: readonly T[]): T => {
    const raw = data[key];
    return allowed.includes(raw as T)
      ? (raw as T)
      : fail(`"${key}" must be one of: ${allowed.join(", ")}.`);
  };

  const strings = (key: string): string[] => {
    const raw = data[key];
    return Array.isArray(raw) && raw.every((v) => typeof v === "string")
      ? (raw as string[])
      : fail(`"${key}" must be an array of strings.`);
  };

  const alternatives = (): Alternative[] => {
    const raw = data.alternatives ?? [];
    if (!Array.isArray(raw)) {
      return fail('"alternatives" must be an array.');
    }
    return raw.map((entry, index) => {
      const item = entry as Record<string, unknown>;
      if (
        typeof item?.slug !== "string" ||
        typeof item?.reason !== "string" ||
        item.reason.trim().length === 0
      ) {
        return fail(
          `alternatives[${index}] needs a "slug" and a non-empty "reason" ` +
            `explaining why you'd pick it instead.`,
        );
      }
      return { slug: item.slug, reason: item.reason };
    });
  };

  return {
    title: str("title"),
    category: str("category"),
    tags: strings("tags"),
    tldr: str("tldr"),
    whenToUse: str("whenToUse"),
    whenNotTo: str("whenNotTo"),
    alternatives: alternatives(),
    docsUrl: str("docsUrl"),
    popularity: oneOf("popularity", POPULARITY_LEVELS),
    status: oneOf("status", STATUSES),
    verified: bool("verified"),
    lastReviewed: str("lastReviewed"),
  };
}
