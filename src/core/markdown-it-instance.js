/**
 * Core markdown-it instance factory.
 *
 * Creates and configures a markdown-it instance with sensible defaults
 * optimized for performance-first rendering with Obsidian-flavored extensions.
 *
 * @module markdown-it-instance
 */

import MarkdownIt from "markdown-it";

/** Default configuration — tuned for performance and Obsidian compatibility */
const DEFAULT_OPTIONS = Object.freeze({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

/**
 * Creates a configured markdown-it instance.
 *
 * User options are merged over defaults, allowing selective overrides
 * without needing to re-specify the entire config.
 *
 * @param {object} [userOptions={}] - Options to override defaults
 * @param {boolean} [userOptions.html] - Enable HTML tags inside the markdown text
 * @param {boolean} [userOptions.linkify] - Autoconvert URL-like text to links
 * @param {boolean} [userOptions.typographer] - Enable some language-neutral replacement + quotes beautification
 * @param {boolean} [userOptions.breaks] - Convert `\n` in paragraphs into `<br>`
 * @returns {MarkdownIt} Configured markdown-it instance (no plugins registered yet)
 */
export function createMarkdownIt(userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  return new MarkdownIt(options);
}
