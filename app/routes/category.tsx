import { Link } from "react-router";
import type { Route } from "./+types/category";
import { SITE_NAME } from "../../site.config";
import { EntryCard } from "~/components/EntryCard";
import { getLibrariesByCategory, toTitleCase } from "~/lib/content";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `${toTitleCase(params.slug)} — ${SITE_NAME}` }];
}

export default function CategoryPage({ params }: Route.ComponentProps) {
  const entries = getLibrariesByCategory(params.slug);

  if (entries.length === 0) {
    return (
      <section className="py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Nothing here yet
        </h1>
        <p className="mt-3 text-muted">
          No entries are filed under &ldquo;{params.slug}&rdquo;.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block text-accent underline underline-offset-4"
        >
          Back to all categories
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-edge pb-8">
        <Link to="/" className="text-sm text-muted hover:text-ink">
          ← All categories
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {toTitleCase(params.slug)}
        </h1>
        <p className="mt-2 text-muted">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <EntryCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </>
  );
}
