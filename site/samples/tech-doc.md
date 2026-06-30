# MarkdownRenderer API Reference

## `MarkdownRenderer`

The main class for rendering markdown to HTML.

### Constructor

```js
const renderer = new MarkdownRenderer(options);
```

### Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `string` | `"light"` | Color theme for rendered output |
| `injectStyles` | `boolean` | `false` | Auto-inject CSS into `<head>` |
| `containerClass` | `string` | `"md-content"` | Wrapper element class |
| `disablePlugins` | `string[]` | `[]` | Plugin IDs to disable |
| `enablePlugins` | `string[]` | `null` | If set, only these plugins load |

### Methods

#### `render(markdown: string): string`

Synchronously renders markdown to HTML. Does not load lazy plugins.

```js
const html = renderer.render("# Hello");
// => '<h1 id="hello">Hello</h1>\n'
```

#### `renderInto(element, markdown: string): Promise<void>`

Renders markdown into a DOM element. Loads lazy plugins (mermaid, KaTeX, highlight.js) if the content requires them.

```js
await renderer.renderInto(document.getElementById("output"), markdown);
```

#### `getInstance(): MarkdownIt`

Returns the underlying markdown-it instance for advanced configuration.

```js
const md = renderer.getInstance();
md.use(somePlugin);
```

## Performance Characteristics

The renderer uses the following equation to estimate render time for large documents[^1]:

$$T(n) = O(n \cdot k)$$

where $n$ is the number of tokens and $k$ is the average plugin processing cost.

## Code Examples

### JavaScript

```javascript
import { MarkdownRenderer } from "markdown-renderer";

const r = new MarkdownRenderer({ theme: "dark" });
const html = r.render("**bold** and *italic*");
console.log(html);
```

### Python (equivalent logic)

```python
# This is a JS library, but the concept translates:
# 1. Instantiate renderer with options
# 2. Call render() or renderInto()
# 3. Handle async lazy plugin loading
```

### Bash (build command)

```bash
npm install markdown-renderer
npm run build
```

## Glossary

: **Bundled plugin** — A plugin included in the main JS bundle (mark, sub, sup, ins, footnote, emoji, tasklist, deflist).

: **Lazy plugin** — A plugin loaded from CDN only when content requires it (mermaid, KaTeX, highlight.js).

: **Token** — A parsed markdown-it AST node representing a structural element (heading, paragraph, fence, etc.).

: **Callout** — An Obsidian-flavored blockquote with a type indicator (note, tip, warning, etc.).

## Caveats

The `render()` method is synchronous and does not trigger lazy plugin loading. Use `renderInto()` for full async rendering with mermaid, KaTeX, and syntax highlighting.[^2]

---

[^1]: Measured on Node.js v20, M2 MacBook Air. Actual times vary by content complexity.
[^2]: Lazy plugins are loaded via dynamic `import()` from jsDelivr CDN. Network latency applies.
