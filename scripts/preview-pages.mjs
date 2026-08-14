/**
 * Serves build/client the way GitHub Pages does, which `vite preview` does not.
 *
 * vite preview treats the output as an SPA and answers *every* path with
 * index.html — so a completely broken prerender still looks fine there. Pages
 * instead resolves directory indexes off disk and falls back to 404.html, which
 * is what this script reproduces. If a page renders here, it renders in prod.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { readFileSync } from "node:fs";

const ROOT = resolve("build/client");
const PORT = Number(process.env.PORT ?? 4173);

// site.config.ts stays the single source of truth for the base path. It's TS,
// so it can't be imported from a plain .mjs — read the literal out instead.
const BASE_PATH =
  readFileSync(resolve("site.config.ts"), "utf8").match(
    /BASE_PATH\s*=\s*["'`](.*?)["'`]/,
  )?.[1] ?? "/";

if (!existsSync(ROOT)) {
  console.error("build/client not found — run `npm run build` first.");
  process.exit(1);
}

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

/** Resolve a URL path to a file on disk, or null. Mirrors Pages' lookup order. */
function resolveFile(urlPath) {
  // Keep the request inside ROOT even if the path contains ".." segments.
  const relative = normalize(decodeURIComponent(urlPath)).replace(
    /^(\.\.[/\\])+/,
    "",
  );
  const candidate = join(ROOT, relative);
  if (!candidate.startsWith(ROOT + sep) && candidate !== ROOT) return null;

  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

  const asIndex = join(candidate, "index.html");
  if (existsSync(asIndex)) return asIndex;

  return null;
}

createServer((request, response) => {
  const { pathname } = new URL(request.url, `http://localhost:${PORT}`);

  if (!pathname.startsWith(BASE_PATH)) {
    response.writeHead(302, { location: BASE_PATH }).end();
    return;
  }

  const file = resolveFile(pathname.slice(BASE_PATH.length - 1));
  const status = file ? 200 : 404;
  const body = file ?? join(ROOT, "404.html");

  response.writeHead(status, {
    "content-type": MIME[extname(body)] ?? "application/octet-stream",
  });
  createReadStream(body).pipe(response);
}).listen(PORT, () => {
  console.log(`Pages-accurate preview: http://localhost:${PORT}${BASE_PATH}`);
});
