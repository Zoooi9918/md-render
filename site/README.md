# Demo Site

This directory contains the GitHub Pages demo site for markdown-renderer.

## Structure

- `index.html` — Main demo page (split-pane editor + preview)
- `style.css` — Site chrome styles only
- `demo.js` — Editor → preview wiring, theme toggle, sample loader
- `samples/` — Curated markdown samples

## Development

Open `index.html` with a local server (e.g., Live Server). No build step required.

## Deployment

The `.github/workflows/deploy-site.yml` workflow deploys this directory to the `gh-pages` branch on every push to `main` that changes files under `site/` or `dist/`.
