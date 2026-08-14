import type { TocEntry } from "@stefanprobst/rehype-extract-toc";
import type { ComponentType } from "react";
import { type LibraryFrontmatter, parseFrontmatter } from "./frontmatter";

export interface Library {
  /** Derived from the filename: zustand.mdx -> "zustand". */
  slug: string;
  frontmatter: LibraryFrontmatter;
  /** The compiled MDX body. Render as <entry.Content />. */
  Content: ComponentType<Record<string, unknown>>;
  /** Headings extracted at build time by rehype-extract-toc. */
  toc: TocEntry[];
  /** Whether the body uses <DifficultyTabs>, detected at build time. */
  hasDifficultyTabs: boolean;
}

export interface Category {
  slug: string;
  /** Human-readable form of the slug, e.g. "State Management". */
  title: string;
  entries: Library[];
}

interface MdxModule {
  default: ComponentType<Record<string, unknown>>;
  /** Injected by remark-mdx-frontmatter; validated before use. */
  frontmatter?: unknown;
  /** Injected by rehype-extract-toc's mdx export. */
  tableOfContents?: unknown;
  /** Injected by plugins/remark-difficulty-flag.mjs. */
  hasDifficultyTabs?: unknown;
}

/*
 * One eager glob gives us both the metadata and the component per entry, so
 * there is exactly one source of truth for content — no parallel index to keep
 * in sync. Eager means every entry's compiled MDX lands in one chunk; fine at
 * this scale, and Phase 5's build-time search index is the natural point to
 * split metadata from bodies if the catalogue outgrows it.
 */
const modules = import.meta.glob<MdxModule>("../content/libraries/*.mdx", {
  eager: true,
});

export function toTitleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const libraries: Library[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").pop()!.replace(/\.mdx$/, "");
    return {
      slug,
      frontmatter: parseFrontmatter(slug, module.frontmatter),
      Content: module.default,
      // Build-generated, so a shape check is enough — no need to validate deeply.
      toc: Array.isArray(module.tableOfContents)
        ? (module.tableOfContents as TocEntry[])
        : [],
      hasDifficultyTabs: module.hasDifficultyTabs === true,
    };
  })
  .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));

const librariesBySlug = new Map(libraries.map((entry) => [entry.slug, entry]));

export function getAllLibraries(): Library[] {
  return libraries;
}

export function getLibraryBySlug(slug: string): Library | undefined {
  return librariesBySlug.get(slug);
}

export function getLibrariesByCategory(category: string): Library[] {
  return libraries.filter((entry) => entry.frontmatter.category === category);
}

/**
 * Categories are whatever the content says they are — adding a new one is just
 * a matter of writing an entry with a new `category` value.
 */
export function getAllCategories(): Category[] {
  const grouped = new Map<string, Library[]>();

  for (const entry of libraries) {
    const key = entry.frontmatter.category;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(key, [entry]);
    }
  }

  return [...grouped.entries()]
    .map(([slug, entries]) => ({ slug, title: toTitleCase(slug), entries }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
