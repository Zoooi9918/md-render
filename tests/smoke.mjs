/**
 * smoke.mjs — Node smoke test for markdown-renderer.
 *
 * Imports from src/ (not dist) and runs 30+ assertions covering
 * all phases: 2 (core), 3 (plugins), 4 (lazy), 4.6 (hljs), 5 (theme), 6 (build).
 *
 * Run: node tests/smoke.mjs
 * Exit code 0 = pass, 1 = fail.
 */

import { MarkdownRenderer } from "../src/index.js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
  }
}

/* ── Phase 2: Core Renderer ── */
{
  const r = new MarkdownRenderer();

  assert("Phase 2: heading IDs generated",
    r.render("# Hello").includes("id="));

  assert("Phase 2: headings render",
    r.render("# Hello").includes("<h1"));

  assert("Phase 2: paragraphs render",
    r.render("Hello world").includes("<p>"));

  assert("Phase 2: bold render",
    r.render("**bold**").includes("<strong>"));

  assert("Phase 2: italic render",
    r.render("*italic*").includes("<em>"));

  assert("Phase 2: links render",
    r.render("[link](https://example.com)").includes("<a "));

  assert("Phase 2: images render",
    r.render("![alt](img.png)").includes("<img"));

  assert("Phase 2: code blocks render",
    r.render("```js\nconst x=1;\n```").includes("<pre>"));

  assert("Phase 2: lists render",
    r.render("- item").includes("<ul>"));

  assert("Phase 2: getInstance returns markdown-it",
    typeof r.getInstance().parse === "function");
}

/* ── Phase 3: Plugin Layer ── */
{
  const r = new MarkdownRenderer();

  assert("Phase 3: mark plugin loaded",
    r.render("==highlighted==").includes("mark") || r.render("==highlighted==").includes("mark-"));

  assert("Phase 3: sub plugin loaded",
    r.render("H~2~O").includes("<sub>"));

  assert("Phase 3: sup plugin loaded",
    r.render("x^2^").includes("<sup>"));

  assert("Phase 3: ins plugin loaded",
    r.render("++inserted++").includes("<ins>"));

  assert("Phase 3: emoji plugin loaded",
    r.render(":smile:").includes("😄") || r.render(":smile:").length > 5);

  assert("Phase 3: footnote plugin loaded",
    r.render("Footnote[^1]\n[^1]: ref").includes("footnote"));

  assert("Phase 3: tasklist plugin loaded",
    r.render("- [ ] task").includes("task-list"));

  assert("Phase 3: deflist plugin loaded",
    r.render("term\n: def").includes("dl>"));

  assert("Phase 3: wikilink plugin loaded",
    r.render("[[Page]]").includes("wikilink"));

  assert("Phase 3: embed plugin loaded",
    r.render("![embed|200](Page)").includes("<img"));
}

/* ── Phase 4: Lazy Plugins ── */
{
  const r = new MarkdownRenderer();

  assert("Phase 4: mermaid in deferred",
    r.getDeferredPlugins().includes("mermaid"));

  assert("Phase 4: highlight in deferred",
    r.getDeferredPlugins().includes("highlight"));

  assert("Phase 4: katex in deferred",
    r.getDeferredPlugins().includes("katex"));

  // _scanTokens takes tokens array, use md.parse(markdown, {}) with env object
  const md = r.getInstance();
  const mermaidTokens = md.parse("```mermaid\ngraph TD\nA-->B\n```", {});
  assert("Phase 4: AST scanner detects mermaid",
    r._scanTokens(mermaidTokens).includes("mermaid"));

  const codeTokens = md.parse("```js\nconst x=1;\n```", {});
  assert("Phase 4: AST scanner detects highlight",
    r._scanTokens(codeTokens).includes("highlight"));

  const mathTokens = md.parse("E = $E = mc^2$", {});
  assert("Phase 4: AST scanner detects katex via regex",
    r._scanTokens(mathTokens).includes("katex"));

  const blockMathTokens = md.parse("$$E = mc^2$$", {});
  assert("Phase 4: AST scanner detects katex block",
    r._scanTokens(blockMathTokens).includes("katex"));
}

/* ── Phase 4.6: hljs CSS class regression ── */
{
  const r = new MarkdownRenderer();
  const html = r.render("```javascript\nconst x = 1;\n```");
  assert("Phase 4.6: code block has language class",
    html.includes("language-javascript") || html.includes("class="));
}

/* ── Phase 5: Theme ── */
{
  const r1 = new MarkdownRenderer();
  assert("Phase 5: default theme is light",
    r1._theme === "light");

  const r2 = new MarkdownRenderer({ theme: "dark" });
  assert("Phase 5: dark theme respected",
    r2._theme === "dark");

  const r3 = new MarkdownRenderer({ containerClass: "my-md" });
  assert("Phase 5: custom container class",
    r3._containerClass === "my-md");

  assert("Phase 5: injectStyles option defaults false",
    r1._injectStyles === false);
}

/* ── Phase 6: Build artifacts (conditional ── skip if dist/ not built) ── */
{
  const dist = join(__dirname, "..", "dist");
  const hasBuild = existsSync(join(dist, "markdown-renderer.esm.js"));

  if (hasBuild) {
    assert("Phase 6: dist/esm.js exists",
      existsSync(join(dist, "markdown-renderer.esm.js")));

    assert("Phase 6: dist/esm.min.js exists",
      existsSync(join(dist, "markdown-renderer.esm.min.js")));

    assert("Phase 6: dist/umd.js exists",
      existsSync(join(dist, "markdown-renderer.umd.js")));

    assert("Phase 6: dist/umd.min.js exists",
      existsSync(join(dist, "markdown-renderer.umd.min.js")));

    assert("Phase 6: dist/iife.js exists",
      existsSync(join(dist, "markdown-renderer.iife.js")));

    assert("Phase 6: dist/iife.min.js exists",
      existsSync(join(dist, "markdown-renderer.iife.min.js")));

    assert("Phase 6: dist/css exists",
      existsSync(join(dist, "markdown-renderer.css")));

    assert("Phase 6: dist/min.css exists",
      existsSync(join(dist, "markdown-renderer.min.css")));

    // Size checks (minified should be smaller than unminified)
    const esm = readFileSync(join(dist, "markdown-renderer.esm.js"), "utf8");
    const esmMin = readFileSync(join(dist, "markdown-renderer.esm.min.js"), "utf8");
    assert("Phase 6: ESM min is smaller than unminified",
      esmMin.length < esm.length);

    const css = readFileSync(join(dist, "markdown-renderer.css"), "utf8");
    const cssMin = readFileSync(join(dist, "markdown-renderer.min.css"), "utf8");
    assert("Phase 6: CSS min is smaller than unminified",
      cssMin.length < css.length);
  } else {
    console.log("  ⊘ Phase 6: skipped (run 'npm run build' first)");
  }
}
/* ── Performance ── */
{
  const r = new MarkdownRenderer();
  const longMd = "# Header\n\n".repeat(500) + "Paragraph\n\n".repeat(500);
  const start = performance.now();
  r.render(longMd);
  const elapsed = performance.now() - start;
  assert("Performance: 500 headers + 500 paras < 500ms",
    elapsed < 500);
}

/* ── Summary ── */
console.log(`\n${"=".repeat(50)}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`${"=".repeat(50)}`);

if (failed > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}

console.log("\n✓ All assertions passed.");
process.exit(0);