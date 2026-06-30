# markdown-renderer

> A performance-first markdown-to-HTML renderer with Obsidian-flavored extensions, distributed via CDN.

[![CI](https://github.com/Zoooi9918/markdown-renderer/actions/workflows/ci.yml/badge.svg)](https://github.com/Zoooi9918/markdown-renderer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/UMD%20min-256%20KB-lightgrey)](https://github.com/Zoooi9918/markdown-renderer)
[![CSS Size](https://img.shields.io/badge/CSS%20min-17%20KB-lightgrey)](https://github.com/Zoooi9918/markdown-renderer)

## Why

Most markdown renderers are Node-only libraries or require a build step. This project fills the gap for **browser-first, zero-config rendering** with support for Obsidian-flavored syntax (callouts, wikilinks, embeds) and lazy-loading of heavy dependencies (mermaid, KaTeX, highlight.js) only when the content actually needs them.

Unlike `markdown-it` (Node-centric), `marked` (no plugin ecosystem), or `remark` (requires build tooling), this renderer works from a single `<script>` tag and handles the full Obsidian syntax surface out of the box.

## Quick Start

### CDN (one-tag inclusion)

```html
<script src="https://cdn.jsdelivr.net/npm/markdown-renderer@latest/dist/markdown-renderer.umd.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/markdown-renderer@latest/dist/markdown-renderer.min.css">
<script>
  const renderer = new MarkdownRenderer();
  document.getElementById("output").innerHTML = renderer.render("# Hello");
</script>
```

### npm install

```bash
npm install markdown-renderer
```

```js
import { MarkdownRenderer } from "markdown-renderer";
import "markdown-renderer/css/min";

const renderer = new MarkdownRenderer();
document.getElementById("output").innerHTML = renderer.render("# Hello");
```

### Self-hosted

Download the latest release artifacts from [GitHub Releases](https://github.com/Zoooi9918/markdown-renderer/releases), place `dist/` next to your HTML, and reference locally:

```html
<script src="dist/markdown-renderer.umd.min.js"></script>
<link rel="stylesheet" href="dist/markdown-renderer.min.css">
```

## Features

- GFM + Obsidian syntax: callouts, wikilinks, embeds, task lists
- Lazy-loaded mermaid, KaTeX, highlight.js (zero cost until content needs them)
- Light / dark / auto / custom themes via CSS custom properties
- 8 bundled plugins: mark, sub, sup, ins, footnote, emoji, task lists, def lists
- Pluggable architecture: register custom plugins or disable defaults
- 256 KB minified JS + 17 KB minified CSS
- Zero runtime dependencies beyond markdown-it

## Usage

### Basic render

```js
const renderer = new MarkdownRenderer();
const html = renderer.render("# Hello World");
```

### With theme

```js
const renderer = new MarkdownRenderer({ theme: "dark" });
renderer.renderInto("#output", markdownString);
```

### Auto-inject styles

```js
const renderer = new MarkdownRenderer({ injectStyles: true });
await renderer.renderInto("#output", markdownString);
```

### Enable / disable plugins

```js
const renderer = new MarkdownRenderer({
  disablePlugins: ["emoji", "footnote"],
  enablePlugins: ["mark"],
});
```

### Async render with lazy plugins

```js
const renderer = new MarkdownRenderer();
await renderer.renderInto("#output", "```mermaid\ngraph TD; A-->B\n```");
// mermaid loads automatically from CDN
```

### Render into a DOM element

```js
const renderer = new MarkdownRenderer();
await renderer.renderInto(document.querySelector("#preview"), markdownString);
```

## API Reference

### MarkdownRenderer

Main class. Accepts an options object in the constructor.

**Constructor options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `string` | `"light"` | Theme: `light`, `dark`, `auto`, or custom name |
| `containerClass` | `string` | `"md-content"` | CSS class on the wrapper element |
| `injectStyles` | `boolean` | `false` | Inject CSS into `<head>` on first render |
| `disablePlugins` | `string[]` | `[]` | Plugin ids to skip |
| `enablePlugins` | `string[]` | `null` | If set, only these plugins load |
| `wikilinkHref` | `Function` | default resolver | Custom `[[link]]` → `href` function |

**Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `render(md)` | `string` | Synchronous markdown-to-HTML |
| `renderInto(element, md)` | `Promise` | Render and inject into DOM element |
| `getInstance()` | `MarkdownIt` | Access the underlying markdown-it instance |
| `getDeferredPlugins()` | `string[]` | List of lazy-loaded plugin ids |

### PluginRegistry

Manages bundled plugin registration.

| Method | Description |
|--------|-------------|
| `register(id, fn)` | Register a plugin function |
| `deregister(id)` | Remove a registered plugin |
| `get(id)` | Get a registered plugin |

### getDefaultPack()

Returns the default plugin configuration (all 8 bundled plugins).

### bundledPlugins

Namespace for bundled plugin factories: `mark`, `sub`, `sup`, `ins`, `footnote`, `emoji`, `tasklist`, `deflist`.

### lazyPlugins

Namespace for lazy-loaded plugin factories: `mermaid`, `katex`, `highlight`.

### Default export

```js
import render from "markdown-renderer";
const html = render("# Hello");
```

## Obsidian Compatibility

| Feature | Supported | Notes |
|---------|-----------|-------|
| `[[wikilinks]]` | Yes | href resolver configurable |
| `[[page#heading]]` | Yes | anchor links via slug |
| `![[image.png]]` | Yes | inline render |
| `![[file.pdf]]` | Yes | embedded iframe |
| `> [!note]` callouts | Yes | 7 types + fold |
| `==highlight==` | Yes | bundled plugin |
| Block refs `^id` | No | future |
| Dataview | No | out of scope |

## Browser Support

- Chromium 90+, Firefox 90+, Safari 14+, Edge 90+
- ES2020 target
- No IE, no Opera Mini

## Performance

Measured on Node.js v20, M2 MacBook Air:

| Metric | Value |
|--------|-------|
| Constructor | < 50 ms |
| First render (no lazy) | < 10 ms |
| Async render with lazy load | < 2 s (good connection) |
| 500 headers + 500 paragraphs | < 500 ms |

## Examples

- [Live demo](https://Zoooi9918.github.io/markdown-renderer/)
- [examples/dev-preview.html](examples/dev-preview.html) — in-repo development preview
- [examples/test-content.md](examples/test-content.md) — sample markdown

## Roadmap

- **v0.1** (current): GFM + Obsidian + lazy heavies + theming
- **v0.2** (planned): block ref support, TypeScript declaration files
- **v0.3** (planned): smaller bundles, code splitting
- **v1.0**: stable API guarantees

## Contributing

See [docs/architecture.md](docs/architecture.md) for project structure and design decisions.

Run tests with `npm test`. Branch from `main`, commit with Conventional Commits, and open a PR.

## License

MIT
