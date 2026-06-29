# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node.js lives at `D:\杂七杂八\nodejs\` but the Chinese-character path breaks most tooling. **Always use the junction `D:\claudeStuff\nodejs-link\`** — never reference the original path. Add it to PATH before running any npm command:

```powershell
$env:PATH = "D:\claudeStuff\nodejs-link;" + $env:PATH
```

| Task | Command |
|---|---|
| Dev server (port 4321) | `npm run dev -- --port 4321 --host` |
| Production build | `npm run build` |
| Preview production build | `npm run preview` |

No lint or test scripts — Astro's TypeScript checking runs as part of the build. A clean `npm run build` (0 errors) is the acceptance check. Page count grows as notebook entries are added; the current count is shown in the build output.

The dev server launch config is at `.claude/launch.json` and can be started with the `preview_start` MCP tool (`name: "cxna-dev"`).

## Architecture

**Stack:** Astro 4 (static output) → GitHub Pages via `.github/workflows/deploy.yml`. Site is live; `site` and `base` are already set in `astro.config.mjs`.

**Base path:** `base: '/cxna-site'` means all internal links must be `${b}/page` where `b = import.meta.env.BASE_URL.replace(/\/$/, '')`. Every page file already does this. Forgetting the separator produces broken URLs like `/cxna-sitescience`.

**Layout:** `src/layouts/BaseLayout.astro` owns everything in the shell:
- Sticky header with CSS-only mobile hamburger (`<input type="checkbox" id="nav-toggle">`), slide/X animation, active nav link via `aria-current="page"` set by JS on load
- `#theme-toggle` button (dark mode, always in header — not inside the dropdown)
- `<div id="progress-bar">` scroll depth indicator (fixed, green→amber gradient)
- FOUC-prevention inline script in `<head>` (reads `localStorage` before paint)
- Shared `<script>` block handling: progress bar, dark mode toggle, active nav, table scroll fades, TOC pill-bar scroll fade + arrow hint

**Dark mode:** `[data-theme="dark"]` on `<html>` swaps all `--c-*` variables. Persisted via `localStorage('theme')`. Respects `prefers-color-scheme` on first visit. The inline script in `<head>` prevents flash of wrong theme — do not remove it or move it below the stylesheet link.

**Design system:** `src/styles/global.css` defines all CSS custom properties (`--c-*` palette, `--sp-*` spacing scale, `--font-sans/mono`). Component-level styles live in `<style>` blocks inside each `.astro` file and are scoped by Astro automatically.

**Key CSS patterns:**
- Status badges: `.badge--confirmed` / `.badge--progress` / `.badge--pending`
- Pending inline hint: `.pending-hint` (used in methods.astro for unfinished steps)
- Expandable sections: native `<details class="expand">` / `<summary>` — no JS
- Method/result cards: `.method-block` / `.result-block` — glassmorphism (`backdrop-filter: blur(14px)`, semi-transparent `rgba` backgrounds). Do **not** set a solid `var(--c-surface)` background on these; it breaks the blur effect.
- Figure placeholders: `.placeholder-block` with `.pending-label` for wet-lab pending data
- Key findings: `.key-finding` / `.key-finding--warn` callout blocks
- In-text citations: `<a class="cite" href="#ref-x">[n]</a>` → `<li id="ref-x">` in reference list
- Dark mode toggle: `.theme-toggle` button with `.icon-sun` / `.icon-moon` swap

**Table scroll pattern (mobile):** Every `<table class="data-table">` must be wrapped:
```html
<div class="table-wrap"><div class="table-scroll"><table class="data-table">…</table></div></div>
```
`.table-wrap` must have `min-width: 0` (already in CSS) — without it, flex-column parents silently override `overflow-x: auto` via `min-width: auto`. The `::after` right-edge fade disappears via `.scroll-at-end` toggled by JS in BaseLayout.

**TOC system (methods & results only):**
- Mobile/tablet: `<div class="toc-pill-wrap"><nav class="toc-pill-bar">…</nav></div>` — sticky at `top: 56px`, horizontally scrollable. The outer `.toc-pill-wrap` holds the `::after` fade and the `::before` animated arrow hint (fires once on page load, dismissed on first scroll via `pill-scrolled` class).
- Desktop ≥1380px: `<aside class="toc-fixed">` — fixed sidebar, `.toc-pill-wrap` is hidden.
- Section anchors must match exactly: methods use `id="method-dl1"` … `id="method-wl6"`, results use `id="drylab-structure"`, `id="drylab-gh10"`, etc.
- IntersectionObserver lives in a `<script>` block at the bottom of each page (not in BaseLayout). Adding a new section requires: the `id` on the block, a link in the pill-bar, and a link in the fixed sidebar.

**Content model:** Science/methods/results pages are inline HTML in `.astro` files. Lab notebook entries are Markdown files in an Astro content collection. Phase 3 adds a Mol* 3D viewer; Phase 4 adds deep-linking between Methods/Results and notebook entries.

**Structure files** (`.cif`, `.pdb`, `.pdbqt`) go in `/structures/` in the repo root — loaded client-side by the Mol* viewer (Phase 3). Do not move them.

**Lab notebook system** — see dedicated section below.

**Placeholder result sections:** use `.placeholder-block` + `.pending-label` inside a `.result-block` that is structurally identical to finished dry-lab blocks — same `.result-header`, `.result-id`, `.result-meta` badge row with `badge--pending`. Do not simplify the structure; it must be ready to receive real data by replacing only the inner `.placeholder-block`.

**SVG diagrams** are all inline (no external assets): enzyme schematic (home hero), cellulose polymer + degradation pathway (science), workflow pipeline (methods). Future figures use `.placeholder-block` divs with `<code>` paths (e.g. `figures/drylab/af3_vs_1FHD_overlay.png`).

**Pages and their primary sections:**
- `index.astro` — hero with trifunctional enzyme SVG, Project A/B cards, approach overview, nav cards
- `overview.astro` — plain-language summary, Project A vs B side-by-side tracks, iDEC affiliation
- `science.astro` — cellulose biology, enzyme classes, CxnA origin, directed evolution mechanism, key literature
- `methods.astro` — workflow pipeline SVG, dry-lab methods DL-1–DL-5, wet-lab methods WL-1–WL-6
- `results.astro` — dry-lab results DL-R1–DL-R6 (complete), wet-lab results WL-R1–WL-R5 (placeholders), reference list
- `notebook/index.astro` — weekly grouped entry timeline with Wet lab / Dry lab filter buttons
- `notebook/[slug].astro` — individual entry page with prev/next navigation

## Lab notebook system

### File structure

```
src/content/
  config.ts                      # Zod collection schema
  labnotes/
    YYYY-MM-DD-wet.md            # wet-lab entry
    YYYY-MM-DD-dry.md            # dry-lab entry
```

Each calendar day can have **at most two files** — one wet-lab and one dry-lab. The slug used in the URL is the filename without `.md` (e.g. `2026-06-18-dry` → `/notebook/2026-06-18-dry`). No manual route wiring needed: `getCollection('labnotes')` auto-discovers all files.

### Frontmatter schema

```yaml
---
title: "Short descriptive title"
date: YYYY-MM-DD        # must be a parseable date; Zod coerces it
project: A | B | both   # which directed evolution track this covers
type: wet-lab | dry-lab
status: confirmed | in-progress | pending
---
```

All five fields are **required** (Zod will throw a build error if any are missing). The schema is defined in `src/content/config.ts`.

`status` maps to badge classes: `confirmed` → `.badge--confirmed` (green), `in-progress` → `.badge--progress` (amber), `pending` → `.badge--pending` (grey).

`project` controls the "Project A / Project B / Both projects" label on the individual entry page. Use `both` for entries that cover dry-lab analyses applicable to both tracks, or wet-lab work that feeds both.

### Ordering and prev/next navigation

The index page sorts all entries by `date` ascending. Entries with the same date are ordered alphabetically by slug — which means `dry` comes before `wet` on the same day. This ordering also governs the prev/next links on individual entry pages.

### Filter system

The index page has "All entries / Wet lab / Dry lab" buttons that toggle `hidden` on `.entry-card` elements via the `data-type` attribute, and collapse `.week-group` sections whose cards all become hidden.

**CSS footgun:** any element with an explicit `display` value (e.g. `display: grid`) overrides the browser's built-in `[hidden] { display: none }` since they share the same specificity. Always add `[element][hidden] { display: none !important }` alongside any `display` rule on a filterable element.

### Adding a new entry

1. Create `src/content/labnotes/YYYY-MM-DD-{wet|dry}.md` with all five frontmatter fields.
2. Run `npm run build` to confirm 0 errors (Zod validates the frontmatter at build time).
3. No changes needed to any `.astro` page files — the index and detail pages auto-discover the new entry.

### Prose conventions

- Use `##` headings for major sections within an entry, `###` for sub-sections.
- Tables render with full styling — no wrapper div needed (the `[slug].astro` prose styles handle `display: block` + `overflow-x: auto` on `table` directly).
- For caveats or flagged items, use `> blockquote` syntax.
- Missing attachment files: `*[Attachment: filename.ext]*` in italics — these are deliberate placeholders, not errors.
- Preserve negative results honestly. Use `status: pending` for entries whose outcome isn't recorded yet; use `status: in-progress` for entries that are partially complete.

## Deployment

Site is live at `https://hanw404.github.io/cxna-site`. Push to `main` — GitHub Actions deploys automatically via `actions/deploy-pages`. GitHub Pages source is set to GitHub Actions in repo Settings.
