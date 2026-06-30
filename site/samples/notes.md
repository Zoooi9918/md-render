---
tags: [daily, notes, obsidian]
created: 2026-06-30
---

# Daily Notes — June 30, 2026

## Morning

Started work on the [[markdown-renderer]] project. The Phase 6 build pipeline is merged and CI is green.

> [!note] Reminder
> Need to set up the GitHub Pages demo site today.

Checked the [[CI Pipeline]] status — all 43 smoke tests passing.

## Afternoon

Worked on the README rewrite. Key decisions:

> [!tip] README Structure
> Follow standard library conventions: Quick Start → Features → API → Examples. No marketing fluff.

> [!idea] Demo Site Concept
> Split-pane editor on the left, rendered output on the right. No framework needed — just vanilla HTML + JS.

Discussed the theme system with the team:

> [!example] Theme API
> ```js
> new MarkdownRenderer({ theme: "dark", injectStyles: true });
> ```
> The `injectStyles` option bakes the CSS string directly into the JS bundle.

## Concerns

> [!warning] Bundle Size
> The ESM bundle is 400 KB unminified. This is expected since markdown-it is bundled. The minified UMD is 256 KB.

> [!failure] Known Issue
> The `deflist` plugin output doesn't match Obsidian's exact CSS classes. Tracked in [[Issue Tracker]].

## Evening

> [!quote] On Simplicity
> "The best code is code you don't write." — Applied this to the demo site: no Monaco, no CodeMirror, just a `<textarea>`.

## Tomorrow's Plan

- [ ] Finish the demo site HTML/CSS
- [ ] Write 4 sample markdown files
- [ ] Set up GitHub Pages deployment
- [ ] Take screenshots for README

## Links

- [[Project Roadmap]] — v0.1 through v1.0 milestones
- [[Build Pipeline]] — esbuild + csso architecture
- [[Theme System]] — CSS variables and dark mode
