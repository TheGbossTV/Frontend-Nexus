# Frontend Nexus

A personal reference site for frontend libraries, tools, and concepts. Each
entry is enough to learn a little and know when to reach for the tool — it is
deliberately **not** a replacement for official docs, which every entry links
out to prominently.

Live at <https://thegbosstv.github.io/Frontend-Nexus/>.

## Stack

- **Vite 7 + React 19 + TypeScript**
- **React Router v7 in framework mode**, with `ssr: false` and `prerender` —
  every page is real static HTML, generated at build time. No Next.js, no
  runtime server.
- **MDX** for content, one file per entry
- **Tailwind CSS v4**, dark mode on by default with a light toggle
- Deployed to **GitHub Pages** via GitHub Actions

## Getting started

Requires **Node 22.12+** — Vite 7 warns and may misbehave on older versions.
Developed and deployed on **Node 24 LTS**.

```bash
npm install
npm run dev        # http://localhost:5173/Frontend-Nexus/
npm run build      # static output in build/client
npm run preview    # serve build/client the way GitHub Pages does
npm run typecheck  # react-router typegen + tsc
```

`npm run preview` deliberately uses [`scripts/preview-pages.mjs`](scripts/preview-pages.mjs)
rather than `vite preview`. `vite preview` answers *every* path with
`index.html`, so a completely broken prerender still looks fine there; the
script resolves directory indexes off disk and falls back to `404.html`, exactly
as Pages does.

## Folder structure

```
site.config.ts                 Base path + site name — the only place the
                               deploy path is written down
react-router.config.ts         ssr:false, basename, the prerender URL list,
                               and the Pages buildEnd hook
vite.config.ts                 Vite base + plugin order (MDX must be "pre")
scripts/preview-pages.mjs      Static server that mimics GitHub Pages

app/
  root.tsx                     <html> shell, no-flash theme script, error boundary
  routes.ts                    Route table
  app.css                      Tailwind entry, dark variant, theme tokens, MDX prose
  routes/
    home.tsx                   /                    category grid
    category.tsx               /category/:slug      entries in one category
    library.tsx                /library/:slug       a single entry
  components/                  Header, Sidebar, ThemeToggle, EntryCard
  lib/
    frontmatter.ts             The content schema + its validator
    content.ts                 Typed content loader (the only content API)
    preferences.ts             localStorage keys + the pre-paint boot script
  content/
    libraries/*.mdx            The entries themselves
```

## Persisted UI state

Theme, sidebar visibility, and which category groups are collapsed all live in
`localStorage`. Because pages are prerendered, the shipped HTML is always the
*default* state — reading storage during render would desync from it and trip
hydration.

So [`app/lib/preferences.ts`](app/lib/preferences.ts) exports a `bootScript`
that root.tsx inlines into `<head>`. It applies the persisted state before first
paint (no flash), React catches up in an effect, and collapsed groups are hidden
via a stylesheet scoped to `html:not([data-hydrated])` that retires itself the
moment the sidebar mounts.

Sidebar visibility has three states: an explicit choice on `<html data-sidebar>`
always wins, otherwise the breakpoint decides — collapsed on mobile (as an
overlay), open on desktop. A stored `open` is deliberately *not* restored on
mobile, so a small screen never loads with the overlay covering the page.

## Changing the deploy path

`BASE_PATH` in [`site.config.ts`](site.config.ts) is the single source of truth.
It feeds Vite's `base` (asset URLs) and React Router's `basename` (route
matching). Moving to a custom domain is a one-line change to `"/"`.

Nothing else may hardcode the prefix — always use `<Link to="/library/zustand">`
and let the basename be prepended, and `import` assets so Vite rewrites the URL.

## Authoring content

Add a file to `app/content/libraries/`. **The filename is the slug**, so
`zustand.mdx` becomes `/library/zustand`. That's the whole registration step —
there is no index to update, no route to add. The category page and the
prerender list both derive from the files on disk.

### Frontmatter schema

Every field is required and validated at build time by
[`app/lib/frontmatter.ts`](app/lib/frontmatter.ts) — a typo fails the build with
a message naming the file and the field, rather than rendering `undefined`.

```yaml
title: Zustand
category: state-management # Open-ended. A new value creates a new category.
tags: [state, react, store]
tldr: One or two sentences. Shows on cards and at the top of the entry.
whenToUse: When you'd reach for this.
whenNotTo: When you shouldn't. Be specific — this is the useful half.
alternatives:
  - slug: redux-toolkit # Auto-links if that entry exists, plain text if not.
    reason: WHY you'd pick it instead — never just restate the name.
docsUrl: https://zustand.docs.pmnd.rs/
popularity: high # high | medium | niche
status: published # published | draft (draft gets a badge)
verified: false # Flip to true by hand after reading it through.
lastReviewed: "2026-08-14" # ISO date. Quote it so YAML keeps it a string.
```

### Body

The MDX body holds the **introduction** and any extra prose. Don't repeat the
TL;DR, when-to-use, when-not-to, alternatives, or docs link in the body — those
are rendered from frontmatter, in the right place, by the page template.

Start the body at `##` — `#` is the entry title, rendered from frontmatter.

## Deploying

Push to `main` and the [workflow](.github/workflows/deploy.yml) builds and
publishes. **One-time setup:** repo Settings → Pages → Source → **GitHub
Actions**.

The build also writes `.nojekyll` (so Pages doesn't strip underscore-prefixed
paths) and copies the SPA fallback to `404.html` (so deep links to
not-yet-prerendered routes still boot the app).

## Roadmap

Built in phases; each one is verified before the next starts.

- [x] **Phase 1** — Scaffold, routing, content pipeline, deploy
- [x] **Phase 2** — Sidebar (grouped, collapsible, persisted)
- [ ] **Phase 3** — Shiki syntax highlighting + IDE-window code blocks
- [ ] **Phase 4** — `<DifficultyTabs>` + sticky in-page TOC
- [ ] **Phase 5** — Client-side search over a build-time index
- [ ] **Phase 6** — Content generation pass

Deferred on purpose: SEO/meta/sitemap, auth, comments, custom domain.
