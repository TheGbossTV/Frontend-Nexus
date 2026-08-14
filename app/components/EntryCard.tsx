import { Link } from "react-router";
import type { Library } from "~/lib/content";

export function DraftBadge() {
  return (
    <span className="rounded border border-edge px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
      Draft
    </span>
  );
}

export function EntryCard({ entry }: { entry: Library }) {
  const { title, tldr, status, tags } = entry.frontmatter;

  return (
    <Link
      to={`/library/${entry.slug}`}
      className="block rounded-xl border border-edge bg-surface p-5 transition hover:border-accent"
    >
      <div className="flex items-center gap-2">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {status === "draft" && <DraftBadge />}
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{tldr}</p>
      {tags.length > 0 && (
        <p className="mt-3 text-xs text-muted">{tags.join(" · ")}</p>
      )}
    </Link>
  );
}
