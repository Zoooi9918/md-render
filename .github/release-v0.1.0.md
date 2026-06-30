# v0.1.0 — md-render

First public release of **md-render**, a performance-first markdown-to-HTML renderer with Obsidian-flavored extensions.

## Features

- **GFM + Obsidian syntax**: callouts (7 types), wikilinks, embeds, task lists
- **8 bundled plugins**: mark, sub, sup, ins, footnote, emoji, task lists, def lists
- **3 lazy CDN plugins**: mermaid, KaTeX, highlight.js (zero cost until needed)
- **Theming**: light / dark / auto / custom via CSS custom properties
- **Multiple formats**: ESM, UMD, IIFE, CSS (bundled + minified)
- **Zero config**: works from a single `<script>` tag

## Bundle Sizes

| Format | Size |
|--------|------|
| UMD min | 255.4 KB |
| ESM min | 254.7 KB |
| IIFE min | 254.8 KB |
| CSS min | 16.5 KB |

## CDN (pinned to v0.1.0)

```html
<script src="https://cdn.jsdelivr.net/gh/Zoooi9918/md-render@v0.1.0/dist/md-render.umd.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zoooi9918/md-render@v0.1.0/dist/md-render.min.css">
```

## Installation

CDN only for v0.1.0 — npm publish coming in v0.1.1.

## Roadmap

- **v0.1.1**: npm publish
- **v0.2.0**: TypeScript declaration files, block ref support
- **v1.0**: stable API guarantees

## Known Limitations

- No block refs (`^id`)
- No Dataview support
- No TypeScript types yet
