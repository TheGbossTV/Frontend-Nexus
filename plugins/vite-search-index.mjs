import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = resolve("app/content/libraries");

export const SEARCH_INDEX_FILE = "search-index.json";

/**
 * Just enough per entry to search and render a result row — deliberately not
 * the body text. Keeping it small is the whole point: the index is fetched
 * lazily the first time someone opens search, so it must stay cheap.
 */
function buildIndex() {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const { data } = matter(readFileSync(join(CONTENT_DIR, file), "utf8"));
      return {
        slug: file.replace(/\.mdx$/, ""),
        title: data.title,
        category: data.category,
        tags: Array.isArray(data.tags) ? data.tags : [],
        tldr: data.tldr,
        status: data.status,
      };
    })
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

/**
 * Emits search-index.json next to the built site, and serves the same JSON from
 * memory in dev so both environments hit an identical URL.
 *
 * This reads the .mdx files straight off disk rather than reusing
 * app/lib/content.ts, for the same reason react-router.config.ts does: it runs
 * in plain Node, outside the MDX pipeline.
 */
export default function searchIndexPlugin({ base = "/" } = {}) {
  return {
    name: "frontend-nexus:search-index",

    configureServer(server) {
      const servedPaths = new Set([
        base + SEARCH_INDEX_FILE,
        "/" + SEARCH_INDEX_FILE,
      ]);

      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? "").split("?")[0];
        if (!servedPaths.has(path)) return next();

        // Rebuilt per request, so editing an .mdx shows up without a restart.
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify(buildIndex()));
      });
    },

    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: SEARCH_INDEX_FILE,
        source: JSON.stringify(buildIndex()),
      });
    },
  };
}
