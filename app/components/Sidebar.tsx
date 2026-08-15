import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { getAllCategories } from "~/lib/content";
import {
  isDesktop,
  readCollapsedCategories,
  writeCollapsedCategories,
  writeSidebarVisibility,
} from "~/lib/preferences";
import { DraftBadge } from "~/components/EntryCard";

/** Mobile-only: tapping the backdrop or a link dismisses the overlay. */
function closeOnMobile() {
  if (!isDesktop()) {
    // Not persisted — this is incidental navigation, not a stated preference.
    document.documentElement.setAttribute("data-sidebar", "hidden");
  }
}

export function Sidebar() {
  const categories = getAllCategories();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  useEffect(() => {
    // Prerendered HTML always ships fully expanded, so reading storage here
    // (rather than during render) keeps hydration matching. The boot script has
    // already hidden the right groups visually; `data-hydrated` retires its
    // stylesheet in the same commit that React applies the real state.
    setCollapsed(readCollapsedCategories());
    document.documentElement.setAttribute("data-hydrated", "");
  }, []);

  function toggleCategory(slug: string) {
    setCollapsed((previous) => {
      const next = previous.includes(slug)
        ? previous.filter((item) => item !== slug)
        : [...previous, slug];
      writeCollapsedCategories(next);
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        data-sidebar-backdrop=""
        aria-label="Close navigation"
        onClick={() =>
          document.documentElement.setAttribute("data-sidebar", "hidden")
        }
        className="fixed inset-0 z-20 bg-black/50 lg:hidden"
      />

      <aside
        data-sidebar-panel=""
        aria-label="Site navigation"
        className="fixed inset-y-0 left-0 z-30 w-72 shrink-0 overflow-y-auto border-r border-edge bg-surface p-5 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:bg-transparent lg:px-6 lg:pt-8"
      >
        <nav className="space-y-6">
          {categories.map((category) => {
            const isCollapsed = collapsed.includes(category.slug);

            return (
              <div key={category.slug} data-category={category.slug}>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/category/${category.slug}`}
                    onClick={closeOnMobile}
                    className="text-xs font-semibold tracking-wide text-muted uppercase transition hover:text-ink"
                  >
                    {category.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.slug)}
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${category.title}`}
                    className="rounded p-1 text-muted transition hover:text-ink"
                  >
                    <svg
                      className={`size-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>

                {!isCollapsed && (
                  <ul data-entries="" className="mt-2 space-y-0.5">
                    {category.entries.map((entry) => {
                      const to = `/library/${entry.slug}`;
                      const isCurrent = pathname === to;

                      return (
                        <li key={entry.slug}>
                          <Link
                            to={to}
                            onClick={closeOnMobile}
                            aria-current={isCurrent ? "page" : undefined}
                            className={
                              isCurrent
                                ? "flex items-center gap-2 rounded-lg border-l-2 border-accent bg-canvas px-3 py-1.5 text-sm font-medium text-ink"
                                : "flex items-center gap-2 rounded-lg border-l-2 border-transparent px-3 py-1.5 text-sm text-muted transition hover:text-ink"
                            }
                          >
                            <span className="truncate">
                              {entry.frontmatter.title}
                            </span>
                            {entry.frontmatter.status === "draft" && (
                              <DraftBadge />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

/**
 * Lives in the header. Reads the panel's *computed* visibility rather than
 * tracking state, so it does the right thing whether the current state came
 * from the breakpoint default or an explicit choice.
 */
export function SidebarToggle() {
  function toggleSidebar() {
    const panel = document.querySelector("[data-sidebar-panel]");
    if (!panel) return;

    const next =
      getComputedStyle(panel).display === "none" ? "open" : "hidden";
    document.documentElement.setAttribute("data-sidebar", next);
    writeSidebarVisibility(next);
  }

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Toggle navigation sidebar"
      title="Toggle sidebar"
      className="rounded-lg border border-edge bg-surface p-2 text-muted transition hover:text-ink"
    >
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </svg>
    </button>
  );
}
