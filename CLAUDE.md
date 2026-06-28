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

There are no lint or test scripts — Astro's TypeScript checking runs as part of the build. A clean `npm run build` (5 pages, 0 errors) is the acceptance check.

The dev server launch config is at `.claude/launch.json` and can be started with the `preview_start` MCP tool (`name: "cxna-dev"`).

## Architecture

**Stack:** Astro 4 (static output) → GitHub Pages via `.github/workflows/deploy.yml`.

**Base path:** `base: '/cxna-site'` in `astro.config.mjs` means all internal links must be constructed as `${b}/page` where `b = import.meta.env.BASE_URL.replace(/\/$/, '')`. Every page file already does this. Forgetting the slash separator produces broken URLs like `/cxna-sitescience`.

**Layout:** One shared layout at `src/layouts/BaseLayout.astro`. It owns the sticky nav (CSS-only mobile hamburger via `<input type="checkbox">`), sticky header, and footer. Pass `title` and optionally `description` as props.

**Design system:** `src/styles/global.css` is imported globally via `<style is:global>` in `BaseLayout.astro`. It defines all CSS custom properties (`--c-*` palette, `--sp-*` spacing scale, `--font-sans/mono`). Component-level styles live in `<style>` blocks inside each `.astro` file and are scoped automatically by Astro.

**Key CSS patterns:**
- Status badges: `.badge--confirmed` / `.badge--progress` / `.badge--pending`
- Expandable sections: native `<details class="expand">` / `<summary>` — no JS
- Result/method blocks: `.result-block` / `.method-block` (header + body split)
- Figure placeholders: `.placeholder-block` with `.pending-label` for wet-lab pending data
- In-text citations: `<a class="cite" href="#ref-x">[n]</a>` linking to `<li id="ref-x">` in the reference list
- Key findings: `.key-finding` / `.key-finding--warn` callout blocks

**Content model:** All content is inline in the `.astro` page files — no CMS, no Markdown files yet. Phase 2 will add a Markdown-based lab notebook system; Phase 3 adds a Mol* 3D structure viewer; Phase 4 adds deep-linking between Methods/Results and notebook entries.

**Structure files** (`.cif`, `.pdb`, `.pdbqt`) go in `/structures/` in the repo root. They are loaded client-side by the Mol* viewer (Phase 3) directly from that path — do not move them elsewhere.

**Lab notebook entries** (Phase 2) will be Markdown files with this frontmatter schema:
```yaml
---
date: YYYY-MM-DD
project: A | B | both
type: wet-lab | dry-lab
status: confirmed | in-progress | pending
---
```
The `project` and `date` fields power the dual chronological/project indexes. The `status` field maps directly to the `.badge--confirmed` / `.badge--progress` / `.badge--pending` CSS classes.

**Placeholder results sections:** when a wet-lab result is not yet available, use `.placeholder-block` + `.pending-label` inside a `.result-block` that is structurally identical to the finished dry-lab result blocks above it — same `.result-header` with method cross-link, same `.result-id` tag, same `.result-meta` badge row, just with `badge--pending` and no data. Do not abbreviate or simplify the placeholder structure; it must be ready to receive real content by replacing the inner `.placeholder-block` only.

**SVG diagrams** are all inline in the page files (no external assets). The enzyme schematic (home hero), cellulose polymer diagram (science page), degradation pathway (science page), and workflow pipeline (methods page) are all hand-authored SVGs with `viewBox` coordinates. Figures that will eventually hold real data are represented as `.placeholder-block` divs with `<code>` paths indicating where image files should go (e.g. `figures/drylab/af3_vs_1FHD_overlay.png`).

**Pages and their primary sections:**
- `index.astro` — hero with trifunctional enzyme SVG, Project A/B cards, approach overview, nav cards
- `overview.astro` — plain-language summary, Project A vs B side-by-side tracks, iDEC affiliation
- `science.astro` — cellulose biology, three enzyme classes, CxnA origin, directed evolution mechanism, key literature
- `methods.astro` — workflow pipeline SVG, dry-lab methods DL-1 through DL-5, wet-lab methods WL-1 through WL-6
- `results.astro` — dry-lab results DL-R1 through DL-R6 (complete), wet-lab results WL-R1 through WL-R5 (placeholder structure), full reference list

## Deployment

Before first deploy, update `astro.config.mjs`:
- `site` → `https://hanw404.github.io` ✓ (already set)
- `base` → `/cxna-site` ✓ (already set)

Then push to `main`. GitHub Actions handles the rest (`actions/deploy-pages`). Enable Pages in repo Settings → Pages → Source: GitHub Actions.
