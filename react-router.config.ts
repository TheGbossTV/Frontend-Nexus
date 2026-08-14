import {
  copyFileSync,
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import type { Config } from "@react-router/dev/config";
import matter from "gray-matter";
import { BASE_PATH } from "./site.config";

const CONTENT_DIR = resolve("app/content/libraries");

/**
 * This file runs in plain Node, before Vite (and therefore before the MDX
 * pipeline) exists — so it cannot reuse app/lib/content.ts. It reads the same
 * .mdx files off disk and parses just enough frontmatter to know which URLs to
 * prerender. Frontmatter ends up parsed twice per build; that is cheap and
 * unavoidable given the ordering.
 */
function readEntries(): Array<{ slug: string; category: string }> {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const { data } = matter(readFileSync(join(CONTENT_DIR, file), "utf8"));
      const category = data.category;

      if (typeof category !== "string" || category.length === 0) {
        throw new Error(
          `Content entry "${file}" is missing a "category" in its frontmatter, ` +
            `so it cannot be prerendered.`,
        );
      }

      return { slug: file.replace(/\.mdx$/, ""), category };
    });
}

export default {
  // Static output: no runtime server, every page is written to HTML at build time.
  ssr: false,
  // Paths below are basename-relative — React Router prepends BASE_PATH itself.
  basename: BASE_PATH,

  async prerender() {
    const entries = readEntries();
    const categories = [...new Set(entries.map((entry) => entry.category))];

    return [
      "/",
      ...categories.map((category) => `/category/${category}`),
      ...entries.map((entry) => `/library/${entry.slug}`),
    ];
  },

  async buildEnd({ reactRouterConfig }) {
    const clientDir = resolve(reactRouterConfig.buildDirectory, "client");

    /*
     * With a basename set, React Router nests prerendered HTML under it
     * (build/client/Frontend-Nexus/index.html) while hashed assets stay at
     * build/client/assets — the layout you want when uploading to a server
     * root. GitHub Pages instead serves the uploaded directory *as* the
     * basename, so without flattening, every page would publish at
     * /Frontend-Nexus/Frontend-Nexus/ while the asset URLs baked into the HTML
     * (/Frontend-Nexus/assets/...) pointed at the correct, un-nested location.
     */
    const segments = BASE_PATH.split("/").filter(Boolean);
    if (segments.length > 0) {
      const nested = join(clientDir, ...segments);
      if (existsSync(nested)) {
        for (const entry of readdirSync(nested)) {
          cpSync(join(nested, entry), join(clientDir, entry), {
            recursive: true,
            force: true,
          });
        }
        rmSync(join(clientDir, segments[0]), { recursive: true, force: true });
      }
    }

    // GitHub Pages runs Jekyll by default, which strips files/dirs starting with "_".
    writeFileSync(join(clientDir, ".nojekyll"), "");

    // Pages serves 404.html for any unmatched path. Handing it the SPA fallback
    // means a deep link to a not-yet-prerendered route still boots the app
    // instead of showing GitHub's default 404.
    const fallback = join(clientDir, "__spa-fallback.html");
    if (existsSync(fallback)) {
      copyFileSync(fallback, join(clientDir, "404.html"));
    }
  },
} satisfies Config;
