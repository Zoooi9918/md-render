# Theming

## Overview

The markdown-renderer CSS system uses CSS custom properties (tokens) for complete theme customization. All styles are scoped under `.markdown-renderer` to avoid leaking into the host page.

## Container Scoping

Every rendered output is wrapped in:

```html
<div class="markdown-renderer" data-theme="light">
  <!-- rendered markdown HTML -->
</div>
```

All CSS selectors are prefixed with `.markdown-renderer`, so styles don't affect sibling elements.

## Themes

Three built-in themes are available:

| Theme | `data-theme` | Description |
|-------|--------------|-------------|
| Light | `light` | Default, white background |
| Dark | `dark` | GitHub-dark inspired |
| Auto | `auto` | Follows `prefers-color-scheme` |

Switch themes at runtime:

```javascript
container.setAttribute("data-theme", "dark");
```

## CSS Tokens

All themable values are CSS custom properties on `.markdown-renderer`.

### Color Tokens

| Token | Description |
|-------|-------------|
| `--md-bg` | Background color |
| `--md-fg` | Text color |
| `--md-link` | Link color |
| `--md-link-hover` | Link hover color |
| `--md-border` | Border color |
| `--md-border-strong` | Strong border color |
| `--md-code-bg` | Code background |
| `--md-code-fg` | Code text color |
| `--md-code-border` | Code border |
| `--md-blockquote-bg` | Blockquote background |
| `--md-blockquote-border` | Blockquote border |
| `--md-mark-bg` | Highlight background |
| `--md-table-header-bg` | Table header background |
| `--md-table-stripe-bg` | Table stripe background |
| `--md-kbd-bg` | Keyboard background |
| `--md-kbd-border` | Keyboard border |

### Callout Tokens

Each callout type (note, tip, warning, danger, info, success, question) has:

- `--md-callout-{type}-bg`
- `--md-callout-{type}-border`
- `--md-callout-{type}-icon`

### Typography Tokens

| Token | Description |
|-------|-------------|
| `--md-font-base` | Primary font stack |
| `--md-font-mono` | Monospace font stack |
| `--md-font-size-base` | Base font size (16px) |
| `--md-font-size-sm` | Small font size (14px) |
| `--md-font-size-lg` | Large font size (20px) |
| `--md-line-height-base` | Normal line height (1.6) |
| `--md-line-height-tight` | Tight line height (1.3) |

### Spacing Tokens

| Token | Value |
|-------|-------|
| `--md-space-xs` | 4px |
| `--md-space-sm` | 8px |
| `--md-space-md` | 16px |
| `--md-space-lg` | 24px |
| `--md-space-xl` | 32px |

### Radii & Shadows

| Token | Value |
|-------|-------|
| `--md-radius-sm` | 4px |
| `--md-radius-md` | 6px |
| `--md-radius-lg` | 8px |
| `--md-shadow-sm` | 0 1px 2px rgba(0,0,0,0.06) |
| `--md-shadow-md` | 0 3px 8px rgba(0,0,0,0.1) |

## Custom Overrides

Override any token on the container:

```css
.markdown-renderer.my-theme {
  --md-bg: #fefefe;
  --md-link: #e91e63;
  --md-link-hover: #c2185b;
}
```

## File Structure

```
src/styles/
  tokens.css        → Light theme tokens
  tokens-dark.css   → Dark theme + auto bridge
  base.css          → Headings, paragraphs, lists, tables
  callouts.css      → 7 callout types + fold UI + SVG icons
  wikilinks.css     → Wikilink pills + embed cards
  embeds.css        → Image/video/audio/PDF iframes
  plugins.css       → mark/sub/sup/ins/kbd/footnote/task/deflist
  code.css          → Inline + fenced code scaffolding
  print.css         → @media print overrides
  index.css         → Master import (all files)
```

## Distribution

The bundled CSS is at `dist/markdown-renderer.css` (~25KB unminified). Include it:

```html
<link rel="stylesheet" href="dist/markdown-renderer.css">
```

## Inline Injection

For CDN or zero-CSS-link usage, pass `injectStyles: true`:

```javascript
const renderer = new MarkdownRenderer({ injectStyles: true });
```

This injects the CSS as a `<style>` tag in `<head>`.

## Print Styles

`@media print` rules flatten colors, show link URLs, and prevent page breaks inside tables, code blocks, and images.
