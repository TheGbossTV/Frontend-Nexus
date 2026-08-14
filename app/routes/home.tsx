import { Link } from "react-router";
import { SITE_NAME, SITE_TAGLINE } from "../../site.config";
import { getAllCategories, getAllLibraries } from "../lib/content";

export function meta() {
  return [
    { title: SITE_NAME },
    { name: "description", content: SITE_TAGLINE },
  ];
}

export default function Home() {
  const categories = getAllCategories();
  const total = getAllLibraries().length;

  return (
    <>
      <section className="border-b border-edge pb-10">
        <h1 className="text-4xl font-semibold tracking-tight">{SITE_NAME}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">{SITE_TAGLINE}</p>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          Each entry is enough to learn a little and know when to reach for the
          tool — not a replacement for the official docs, which every page links
          out to.
        </p>
      </section>

      <section className="pt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Categories</h2>
          <span className="text-sm text-muted">
            {total} {total === 1 ? "entry" : "entries"}
          </span>
        </div>

        {categories.length === 0 ? (
          <p className="mt-6 text-muted">
            No entries yet. Add an .mdx file to app/content/libraries to get
            started.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="rounded-xl border border-edge bg-surface p-5 transition hover:border-accent"
              >
                <h3 className="font-semibold tracking-tight">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {category.entries.length}{" "}
                  {category.entries.length === 1 ? "entry" : "entries"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
