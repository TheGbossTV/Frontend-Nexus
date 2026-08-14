import { Link } from "react-router";
import type { Route } from "./+types/library";
import { SITE_NAME } from "../../site.config";
import { DraftBadge } from "../components/EntryCard";
import { getLibraryBySlug, toTitleCase } from "../lib/content";

export function meta({ params }: Route.MetaArgs) {
  const entry = getLibraryBySlug(params.slug);
  return entry
    ? [
        { title: `${entry.frontmatter.title} — ${SITE_NAME}` },
        { name: "description", content: entry.frontmatter.tldr },
      ]
    : [{ title: `Not found — ${SITE_NAME}` }];
}

export default function LibraryPage({ params }: Route.ComponentProps) {
  const entry = getLibraryBySlug(params.slug);

  if (!entry) {
    return (
      <section className="py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Entry not found
        </h1>
        <p className="mt-3 text-muted">
          There&rsquo;s no entry for &ldquo;{params.slug}&rdquo; yet.
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

  const { Content, frontmatter } = entry;

  return (
    <article>
      {/* 1. Title + TL;DR, with the official docs link kept high on the page. */}
      <header className="border-b border-edge pb-8">
        <Link
          to={`/category/${frontmatter.category}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← {toTitleCase(frontmatter.category)}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            {frontmatter.title}
          </h1>
          {frontmatter.status === "draft" && <DraftBadge />}
        </div>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          {frontmatter.tldr}
        </p>

        <a
          href={frontmatter.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition hover:opacity-90"
        >
          Official documentation
          <span aria-hidden="true">↗</span>
        </a>
      </header>

      {/* 2. Introduction and any additional prose, straight from the MDX body. */}
      <div className="prose-entry">
        <Content />
      </div>

      {/* 3. When to use / when not to. */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-edge bg-surface p-5">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            When to use it
          </h2>
          <p className="mt-3 leading-7 text-muted">{frontmatter.whenToUse}</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface p-5">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            When <em>not</em> to
          </h2>
          <p className="mt-3 leading-7 text-muted">{frontmatter.whenNotTo}</p>
        </div>
      </section>

      {/* 4. Alternatives — linked when the alternative has its own entry. */}
      {frontmatter.alternatives.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Alternatives
          </h2>
          <ul className="mt-4 space-y-3">
            {frontmatter.alternatives.map((alternative) => {
              const target = getLibraryBySlug(alternative.slug);
              return (
                <li
                  key={alternative.slug}
                  className="rounded-xl border border-edge bg-surface p-5"
                >
                  <h3 className="font-semibold tracking-tight">
                    {target ? (
                      <Link
                        to={`/library/${alternative.slug}`}
                        className="text-accent underline underline-offset-4"
                      >
                        {target.frontmatter.title}
                      </Link>
                    ) : (
                      toTitleCase(alternative.slug)
                    )}
                  </h3>
                  <p className="mt-2 leading-7 text-muted">
                    {alternative.reason}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="mt-12 flex flex-wrap gap-x-6 gap-y-1 border-t border-edge pt-6 text-sm text-muted">
        <span>Popularity: {frontmatter.popularity}</span>
        <span>Last reviewed: {frontmatter.lastReviewed}</span>
        {!frontmatter.verified && <span>Not yet human-verified</span>}
      </footer>
    </article>
  );
}
