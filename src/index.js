/**
 * markdown-renderer
 *
 * A performance-first markdown-to-HTML renderer with Obsidian-flavored extensions,
 * distributed via CDN. Built on markdown-it with custom rules for callouts,
 * wikilinks, embeds, and heading anchors.
 *
 * @module markdown-renderer
 *
 * @example
 * // Quick render
 * import render from 'markdown-renderer';
 * const html = render('# Hello [[World]]');
 *
 * @example
 * // Full control
 * import { MarkdownRenderer } from 'markdown-renderer';
 * const renderer = new MarkdownRenderer({
 *   rules: { callouts: true, wikilinks: true },
 *   wikilinks: { resolveHref: (page) => `/pages/${page}.html` }
 * });
 * const html = renderer.render('> [!tip] Pro tip here');
 */

import { MarkdownRenderer } from "./core/renderer.js";
export { MarkdownRenderer };
export { createMarkdownIt } from "./core/markdown-it-instance.js";
export * as rules from "./core/rules/index.js";
export { PluginRegistry } from "./plugins/registry.js";
export { LazyLoader } from "./plugins/lazy-loader.js";
export { getDefaultPack } from "./plugins/default-pack.js";
export * as bundledPlugins from "./plugins/bundled/index.js";
export * as lazyPlugins from "./plugins/lazy/index.js";

/**
 * Convenience function for quick, one-off renders.
 *
 * Creates a new MarkdownRenderer instance with the given options
 * and renders the markdown string. For repeated renders, construct
 * a MarkdownRenderer directly to avoid recreating the parser.
 *
 * @param {string} markdownString - The markdown source to render
 * @param {object} [options] - Options passed to MarkdownRenderer constructor
 * @returns {string} The rendered HTML string
 */
export default function render(markdownString, options) {
  return new MarkdownRenderer(options).render(markdownString);
}
