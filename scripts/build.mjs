/**
 * build.mjs — Main build orchestrator.
 *
 * 1. Runs build-css.mjs (CSS concatenation + minification + inline baking)
 * 2. Runs esbuild 6 times for ESM, UMD, and IIFE outputs
 * 3. Prints a size summary table
 *
 * Run: node scripts/build.mjs
 */

import { execSync } from "node:child_process";
import { statSync, existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import * as esbuild from "esbuild";

const DIST_DIR = resolve("dist");
const ENTRY = resolve("src/index.js");

/** Shared esbuild config — all builds extend this. */
const baseConfig = {
  entryPoints: [ENTRY],
  bundle: true,
  target: "es2020",
  platform: "browser",
  sourcemap: true,
  external: [], /* markdown-it + bundled plugins are bundled, not external */
};

/** UMD wrapper — esbuild has no native UMD format. */
const UMD_WRAPPER = `
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MarkdownRenderer = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  __IIFE_BODY__
  return {
    MarkdownRenderer,
    createMarkdownIt,
    rules,
    PluginRegistry,
    LazyLoader,
    render: function (text, options) {
      var r = new MarkdownRenderer(options || {});
      return r.render(text);
    }
  };
});
`;

/* ── Step 1: CSS ── */
console.log("\n=== Step 1: CSS Build ===");
try {
  execSync("node scripts/build-css.mjs", { stdio: "inherit", cwd: process.cwd() });
} catch (err) {
  console.error("build: CSS build failed");
  process.exit(1);
}

/* ── Step 2: JS Builds ── */
console.log("\n=== Step 2: JS Build ===");
mkdirSync(DIST_DIR, { recursive: true });

const builds = [
  {
    name: "ESM",
    format: "esm",
    outfile: resolve(DIST_DIR, "markdown-renderer.esm.js"),
    globalName: undefined,
  },
  {
    name: "ESM (min)",
    format: "esm",
    minify: true,
    outfile: resolve(DIST_DIR, "markdown-renderer.esm.min.js"),
    globalName: undefined,
  },
  {
    name: "IIFE",
    format: "iife",
    outfile: resolve(DIST_DIR, "markdown-renderer.iife.js"),
    globalName: "MarkdownRenderer",
    banner: { js: "/* markdown-renderer IIFE — exposes window.MarkdownRenderer */\n" },
  },
  {
    name: "IIFE (min)",
    format: "iife",
    minify: true,
    outfile: resolve(DIST_DIR, "markdown-renderer.iife.min.js"),
    globalName: "MarkdownRenderer",
  },
];

for (const build of builds) {
  console.log(`  Building ${build.name}...`);
  try {
    await esbuild.build({
      ...baseConfig,
      format: build.format,
      minify: build.minify || false,
      globalName: build.globalName,
      outfile: build.outfile,
      banner: build.banner,
    });
    const size = statSync(build.outfile).size;
    console.log(`  ✓ ${build.name} — ${formatSize(size)}`);
  } catch (err) {
    console.error(`  ✗ ${build.name} failed:`, err.message);
    process.exit(1);
  }
}

/* ── Step 2b: UMD (hand-rolled from IIFE) ── */
console.log("  Building UMD...");
for (const minified of [false, true]) {
  const suffix = minified ? ".min" : "";
  const iifeFile = resolve(DIST_DIR, `markdown-renderer.iife${suffix}.js`);
  const umdFile = resolve(DIST_DIR, `markdown-renderer.umd${suffix}.js`);

  const iifeBody = readFileSync(iifeFile, "utf8");
  const umdCode = UMD_WRAPPER.replace("__IIFE_BODY__", iifeBody);
  writeFileSync(umdFile, umdCode, "utf8");

  const size = statSync(umdFile).size;
  console.log(`  ✓ UMD${minified ? " (min)" : ""} — ${formatSize(size)}`);
}

/* ── Step 3: Size Summary ── */
console.log("\n=== Build Output ===");
const files = [
  "markdown-renderer.esm.js",
  "markdown-renderer.esm.min.js",
  "markdown-renderer.umd.js",
  "markdown-renderer.umd.min.js",
  "markdown-renderer.iife.js",
  "markdown-renderer.iife.min.js",
  "markdown-renderer.css",
  "markdown-renderer.min.css",
];

const sep1 = "┌" + "─".repeat(44) + "┐";
const sep2 = "├" + "─".repeat(44) + "┤";
const sep3 = "└" + "─".repeat(44) + "┘";

console.log(sep1);
console.log("│ Build output".padEnd(45) + "│");
console.log(sep2);

for (const f of files) {
  const path = resolve(DIST_DIR, f);
  if (existsSync(path)) {
    const size = statSync(path).size;
    const label = `${f}  ${formatSize(size)}`;
    console.log(`│ ${label.padEnd(45)}│`);
  } else {
    console.log(`│ ${f}  MISSING`.padEnd(45) + "│");
  }
}

console.log(sep3);
console.log("\nBuild complete.");

/** @param {number} bytes */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
