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
Developed and deployed on **Node 24** (pinned in [`.nvmrc`](.nvmrc), which CI
reads too, so local and CI can't drift).

```bash
node -v            # expect v24.x
npm install
npm run dev        # then open http://localhost:5173/Frontend-Nexus/
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Static output into `build/client` |
| `npm run preview` | Serves `build/client` the way GitHub Pages does |
| `npm run typecheck` | `react-router typegen` + `tsc --noEmit` |

**The dev URL includes the base path.** The site is served at
`http://localhost:5173/Frontend-Nexus/`, not bare `localhost:5173` — Vite
redirects the bare root, but the terminal link is the one to click.

**`npm install` warns about a blocked `esbuild` install script.** That's npm 11
blocking install scripts by default, and it's safe to ignore here: esbuild's
binary ships in its platform package (`@esbuild/win32-x64`), not that script, so
builds work without approving it. Leaving it blocked is the safer default.

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
plugins/
  remark-difficulty-flag.mjs   Flags entries using <DifficultyTabs>, so the
                               TOC never emits a jump link to a missing anchor
  vite-search-index.mjs        Emits search-index.json at build time

app/
  root.tsx                     <html> shell, no-flash theme script, error boundary
  routes.ts                    Route table
  app.css                      Tailwind entry, dark variant, theme tokens, MDX prose
  routes/
    home.tsx                   /                    category grid
    category.tsx               /category/:slug      entries in one category
    library.tsx                /library/:slug       a single entry
  components/                  Header, Sidebar, ThemeToggle, EntryCard
    CodeBlock.tsx              IDE-window chrome + copy-to-clipboard island
    DifficultyTabs.tsx         easy/medium/advanced tabs, synced to ?level=
    TableOfContents.tsx        Sticky in-page TOC, built at build time
    Search.tsx                 Ctrl/Cmd+K search dialog
    mdx.tsx                    Components + element overrides for MDX bodies
  lib/
    frontmatter.ts             The content schema + its validator
    content.ts                 Typed content loader (the only content API)
    preferences.ts             localStorage keys + the pre-paint boot script
    search.ts                  Lazy Fuse + index loader, FUSE_OPTIONS
  content/
    libraries/*.mdx            The entries themselves
```

## Code blocks

Fenced code in MDX is highlighted by Shiki via `rehype-pretty-code` **at build
time** — configured in [`vite.config.ts`](vite.config.ts) with VS Code's own
`light-plus` / `dark-plus` themes. The highlighter never reaches the browser;
only the resulting coloured markup does.

Dual themes mean each token ships both palettes as custom properties
(`--shiki-light` / `--shiki-dark`), and `app.css` picks between them off the
`.dark` class. Switching theme is a pure CSS flip with no re-highlighting.

[`CodeBlock.tsx`](app/components/CodeBlock.tsx) replaces the emitted `<pre>`
with IDE-window chrome (title bar, language label, copy button) and is wired up
through the MDX `components` map in [`mdx.tsx`](app/components/mdx.tsx). Only the
copy button is interactive; the block itself stays static HTML.

To highlight a new language, just use its name in the fence — Shiki loads
grammars at build time, so nothing needs registering.

## Search

`Ctrl`/`Cmd` + `K`, or the button in the header. Fuzzy search over title, tags,
category, and TL;DR, with arrow-key navigation and client-side routing on
select — no page reload.

[`plugins/vite-search-index.mjs`](plugins/vite-search-index.mjs) emits
`search-index.json` at build time and serves the identical JSON from memory in
dev, so both environments hit the same URL (rebuilt per request in dev, so
editing an entry shows up without a restart).

Both the index **and Fuse.js itself** are fetched on first open — the 27 KB Fuse
chunk is not preloaded, so a reader who never searches pays nothing for it. The
index holds metadata only, never body text, which is what keeps it small enough
to justify fetching on demand.

The Fuse options live in [`app/lib/search.ts`](app/lib/search.ts) as an exported
`FUSE_OPTIONS` so retrieval can be exercised directly rather than only through
the UI.

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

The MDX body holds the **introduction**, any extra prose, and the
`<DifficultyTabs>` block. Don't repeat the TL;DR, when-to-use, when-not-to,
alternatives, or docs link in the body — those are rendered from frontmatter, in
the right place, by the page template.

Start the body at `##` — `#` is the entry title, rendered from frontmatter.

### Difficulty tabs

```mdx
<DifficultyTabs>

<Level value="easy">

Markdown, including ```fenced code```, works normally in here.

</Level>

<Level value="medium">…</Level>

<Level value="advanced">…</Level>

</DifficultyTabs>
```

The blank lines around the content are load-bearing — MDX only treats JSX
children as markdown when they're separated that way.

Levels render in canonical order however you author them, and any level you omit
is simply skipped. The active tab syncs to a `?level=` query param so a specific
level is linkable; switching tabs uses `replace` so it doesn't fill up history.

Use `###` or deeper for headings **inside** a level. The table of contents lists
only `##` headings, because a link to a heading inside a collapsed tab would be
a dead link — the tabs get their own jump links instead.

### Page order

The page renders: title + TL;DR + docs link → when to use / when not →
alternatives → MDX body (introduction, then the difficulty tabs) → footer, with
the sticky TOC alongside on wide screens.

The introduction sits lower than in the original spec because a compiled MDX
body is a single component: the introduction and the difficulty tabs cannot be
split around the frontmatter-driven sections. Given that, the frontmatter
sections were kept high — directly under the TL;DR, where the "should I use
this?" answer is most useful — rather than stranding them below a long block of
code examples.

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
- [x] **Phase 3** — Shiki syntax highlighting + IDE-window code blocks
- [x] **Phase 4** — `<DifficultyTabs>` + sticky in-page TOC
- [x] **Phase 5** — Client-side search over a build-time index
- [ ] **Phase 6** — Content generation pass

Deferred on purpose: SEO/meta/sitemap, auth, comments, custom domain.
