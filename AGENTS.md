# Project Instructions

These instructions apply to the entire `zhixuanli.github.io` repository unless a more specific nested `AGENTS.md` overrides them.

## Communication and scope

- Use Simplified Chinese for user-facing progress updates and handoff summaries. Keep paths, commands, identifiers, venue acronyms, and code in their original technical form.
- Inspect before editing. Start repository work with `git status --short --branch` and preserve all unrelated or pre-existing changes.
- Treat `STATE.md`, `docs/`, handoff files, and local helper scripts as user-owned local material. Do not stage, commit, delete, or rewrite them unless the user explicitly includes them.
- Do not open the oversized historical Codex task `019f0829-fc7b-7f11-b5d4-15420ae20fd2`; it can crash Codex. Resume historical work from `docs/handoffs/2026-07-28-homepage-redesign-thread-migration.md` and `STATE.md` when those files are present.
- The formal repository and any isolated prototype/visualization directory are separate workspaces. Never migrate prototype changes into the formal site, or copy formal changes back into a prototype, without explicit approval.

## Editing principles

- Preserve the site's current visual identity and existing shared components. Prefer the smallest scoped change over a redesign or new abstraction.
- On Windows, preserve each text file's UTF-8 BOM state and newline style. Treat console mojibake as display evidence only; verify actual Unicode code points or bytes before rewriting.
- Prefer `apply_patch` for small edits. If it cannot run in the Windows sandbox, use narrowly validated exact replacements with explicit UTF-8 encoding and unique match counts.
- Do not edit or commit generated `_site/` output, caches, dependencies, screenshots, or temporary artifacts.
- Do not add a production dependency without explaining the need and receiving approval.

## Project Page rules

- There are 16 production standalone Project Pages under `projects/<slug>/index.html`; `projects/academic_page_template/` is not one of them.
- When asked to fix or audit all Project Pages, inspect every production page. Do not sample.
- Keep Project Pages on the shared `projects/project-theme.css` and `projects/project-theme.js` system. Use page-scoped classes for genuine one-page exceptions.
- Section labels must use the middle dot `·`. Never use the Chinese character `路` as a separator.
- Keep research images responsive and avoid upscaling small source images. The BEAT Algorithm figure uses the scoped `compact-figure` treatment with a `960px` maximum width.

### Venue eyebrow

- The top `.eyebrow` shows only the concise venue acronym or short venue name. Do not include the year, ranking, category, or expanded conference name there.
- Use these values:
  - `lee2026dipguava`: `AAAI`
  - `li2022a3d`: `ECCV`
  - `li2023gin`: `TMM`
  - `li2023muva`: `ICCV`
  - `li2023oaformer`: `ICASSP`
  - `li2025aura`: `ICCV`
  - `li2025beat`: `Preprint`
  - `li2025msiqa`: `MICCAI`
  - `li2025shapemoe`: `Preprint`
  - `li2025vela`: `ACM MM`
  - `liu2024blade`: `AAAI`
  - `liu2026sega`: `TPAMI`
  - `mi2026qclip`: `ICML`
  - `mi2026ugdiml`: `Neurocomputing`
  - `song2025lvpnet`: `MICCAI`
  - `ye2024vipnet`: `ACCV`
- Full venue names and years still belong in publication metadata, page body content, and BibTeX where appropriate.

### Author identity and contribution notes

- For author-link audits, inventory every author hyperlink on every production page. Confirm the linked identity before changing it; change only links proven wrong and never guess a profile.
- Preserve author order, affiliation numbers, contribution symbols, and corresponding-author identity unless authoritative paper metadata confirms a change.
- Follow ShapeMoE for corresponding-author presentation:
  - Put the note immediately after the closing `.affiliations` element, not inside it.
  - Use `<p class="corresponding"><sup>*</sup>Corresponding author</p>` or the page's existing `&dagger;` marker.
  - Preserve combined notes such as equal contribution plus corresponding author.
  - Do not add a corresponding-author note to a page that does not already declare one.
  - Do not use stray or unmatched `<small>` / `<span>` closing tags.

### Page-specific facts

- VELA is accepted by ACM MM 2026. Its project page uses the `ACM MM` eyebrow, includes Chenyue Song in the author list, and uses the accepted-paper BibTeX metadata (`li2026vela`, ACM International Conference on Multimedia, 2026). Keep the arXiv/PDF links until an official ACM paper URL is confirmed.
- On AURA, the technology-transfer/source-code notice is small muted text in the top hero, immediately below the paper-resource buttons. It must not replace the Abstract. Preserve the full original paper abstract.

## Publication data

- Keep homepage publication order as: arXiv/preprints first, then the user's first/co-first-author papers, then collaborative papers; within each group use descending year.
- Preserve the user-set lead-paper order: ShapeMoE, BEAT, then VELA.
- Cross-check duplicated publication facts across the homepage data, Project Page, and `bibtex/` file. Do not invent a DOI, official paper URL, author profile, or affiliation.

## Build and local verification

- On this Windows machine, use the compatibility build:
  - `C:\Users\Oliver\Ruby27-x64\bin\ruby.exe scripts\jekyll_windows_compat.rb build`
- A successful build may still print the known Ruby keyword-argument warning and unauthenticated GitHub Metadata warning; report them as non-blocking only when the build exits successfully.
- Serve and review the formal `_site` at `http://127.0.0.1:4000/`. The old isolated prototype used port `4173`; do not confuse the two.
- After visual or content changes, provide a local preview before commit unless the user explicitly asks to skip review.
- For changes affecting multiple Project Pages, verify every affected page at desktop width and at a mobile breakpoint. Check the exact text, element placement, horizontal overflow, and broken images.
- If the browser displays stale local HTML, compare source with `_site`, then use a cache-busting query parameter and recheck before changing source again.
- Before handoff, run `git diff --check`, inspect `git diff --stat`, and report exactly what remains modified or untracked.

## Commit, push, and deployment

- Do not commit or push merely because an edit is complete. Obtain explicit approval for the current batch.
- When approved, stage only the reviewed files. Exclude `STATE.md`, `docs/`, local handoffs, and unrelated work unless explicitly requested.
- Before pushing, show and verify the exact remote URL. The expected remote is `https://github.com/zhixuanli/zhixuanli.github.io.git`, but never assume it without checking.
- After commit, verify the staged/committed scope and confirm local `HEAD` matches `origin/main` after push.
- Wait for the GitHub Pages workflow to finish. Verify the affected public URLs with a cache-busting query and confirm HTTP 200 plus the expected content before reporting the deployment complete.
