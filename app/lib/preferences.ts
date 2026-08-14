/**
 * Persisted UI preferences, and the script that restores them before first paint.
 *
 * Everything here is client-only. Pages are prerendered to static HTML, so the
 * markup React ships is always the *default* state — reading localStorage during
 * render would desync from that HTML and trip hydration. Instead the boot script
 * below applies the persisted state to the DOM before anything paints, and React
 * catches up in an effect without changing what the user sees.
 */

export const STORAGE_KEYS = {
  theme: "theme",
  sidebarVisibility: "sidebar:visibility",
  collapsedCategories: "sidebar:collapsed",
} as const;

/** Desktop breakpoint. Kept in sync with the `lg:` rules in app.css. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

export function isDesktop(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

export function readCollapsedCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.collapsedCategories);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((slug): slug is string => typeof slug === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeCollapsedCategories(slugs: string[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.collapsedCategories,
      JSON.stringify(slugs),
    );
  } catch {
    // Storage disabled — the choice just won't survive a reload.
  }
}

export function writeSidebarVisibility(value: "open" | "hidden"): void {
  try {
    localStorage.setItem(STORAGE_KEYS.sidebarVisibility, value);
  } catch {
    // As above.
  }
}

/**
 * Inlined into <head> and run synchronously, so it lands before the browser
 * paints and there is no flash of the wrong theme or an unwanted sidebar.
 *
 * Collapsed categories are applied as an injected stylesheet rather than by
 * touching elements, because at <head> time the sidebar markup doesn't exist
 * yet. The rules are scoped to `html:not([data-hydrated])`, so the moment
 * Sidebar mounts and stamps that attribute, React takes over cleanly.
 */
export const bootScript = `
(function () {
  var root = document.documentElement;

  try {
    if (localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)}) === "light") {
      root.classList.remove("dark");
    }
  } catch (e) {}

  try {
    var visibility = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.sidebarVisibility)});
    // "open" is only restored on desktop — mobile always starts collapsed.
    if (visibility === "hidden") {
      root.setAttribute("data-sidebar", "hidden");
    } else if (visibility === "open" && window.matchMedia(${JSON.stringify(DESKTOP_QUERY)}).matches) {
      root.setAttribute("data-sidebar", "open");
    }
  } catch (e) {}

  try {
    var collapsed = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEYS.collapsedCategories)}) || "[]");
    if (Array.isArray(collapsed) && collapsed.length) {
      var rules = collapsed
        .map(function (slug) {
          var safe = String(slug).replace(/["\\\\]/g, "\\\\$&");
          return 'html:not([data-hydrated]) [data-category="' + safe + '"] [data-entries]{display:none}';
        })
        .join("");
      var style = document.createElement("style");
      style.textContent = rules;
      document.head.appendChild(style);
    }
  } catch (e) {}
})();
`;
