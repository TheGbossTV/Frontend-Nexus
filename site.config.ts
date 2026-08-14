/**
 * Single source of truth for anything that changes when the site moves hosts.
 *
 * BASE_PATH is consumed in exactly two places:
 *   - vite.config.ts          -> Vite `base` (asset URLs)
 *   - react-router.config.ts  -> React Router `basename` (route matching)
 *
 * Nothing else may hardcode the prefix. Use <Link to="/library/zustand"> and
 * let the basename be prepended, and import assets so Vite rewrites the URL.
 *
 * Deploying to a custom domain later? Set BASE_PATH to "/" and you're done.
 */
export const BASE_PATH = "/Frontend-Nexus/";

export const SITE_NAME = "Frontend Nexus";

export const SITE_TAGLINE =
  "A quick-reference codex for frontend libraries, tools, and concepts.";
