# AGENTS.md

## Cursor Cloud specific instructions

This repository (`miguoliang-site`) is a single-product **static Astro site** (Chinese AI news digest, "AI 网摘"). There is no backend, database, or other backing service — "running it" just means the Astro dev/preview server. Standard commands live in `package.json` and `README.md`; use those. Node 22 + `npm` (there is a `package-lock.json`).

Non-obvious notes for future agents:

- **Dev vs. search:** `npm run dev` (http://localhost:4321) is enough for browsing blog, clippings, `/daily`, tags, and RSS. However, the full-text **search** feature (Pagefind) only works against the built site — it is NOT available under `npm run dev`. To test search, run `npm run build` then `npm run preview` and browse the preview server. Search is exposed at `/search` (and via a `Cmd/Ctrl+K` modal).
- **`npm run build` requires outbound internet.** The build's first step is `node scripts/check-clipping-links.mjs`, which makes live HTTP requests to validate every clipping's `url`. If a referenced source URL is down, the build can fail even though nothing in the repo changed. Use `npm run check:links` to run that check alone. If you only need the built HTML/search and want to skip link validation, run `npx astro build && npx pagefind --site dist` directly.
- **No test framework and no lint script are configured.** The closest thing to a check is `npx astro check` (strict TS). Note it currently reports one pre-existing type error in `src/layouts/Layout.astro` (an inline `setTheme(theme)` param) unrelated to any setup — do not treat that as a regression.
- Content is Markdown in `src/content/blog/` and `src/content/clippings/` with Zod-validated frontmatter (`src/content/config.ts`). Adding/editing content requires no extra tooling beyond the dev server.
