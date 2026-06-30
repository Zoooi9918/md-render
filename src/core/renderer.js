/**
 * MarkdownRenderer — the main public API.
 *
 * Constructs a markdown-it instance with configurable custom rules
 * and provides a clean interface for rendering markdown to HTML.
 *
 * @module renderer
 */

import { createMarkdownIt } from "./markdown-it-instance.js";
import {
  applyHeadingIds,
  applyCallouts,
  applyWikilinks,
  applyObsidianEmbed,
} from "./rules/index.js";

/** Default rule toggles — all enabled */
const DEFAULT_RULES = Object.freeze({
  headingIds: true,
  callouts: true,
  wikilinks: true,
  obsidianEmbed: true,
});

/**
 * High-performance markdown-to-HTML renderer with Obsidian-flavored extensions.
 *
 * Constructs a markdown-it instance on instantiation and applies
 * the enabled custom rules. The instance is cached for subsequent
 * render calls, avoiding reconstruction overhead.
 */
export class MarkdownRenderer {
  /**
   * Creates a new MarkdownRenderer instance.
   *
   * @param {object} [options] - Configuration options
   * @param {object} [options.markdownItOptions] - Options passed to markdown-it (html, linkify, typographer, breaks)
   * @param {object} [options.rules] - Toggle individual custom rules on/off
   * @param {boolean} [options.rules.headingIds] - Enable heading ID generation
   * @param {boolean} [options.rules.callouts] - Enable Obsidian-style callouts
   * @param {boolean} [options.rules.wikilinks] - Enable [[wikilink]] syntax
   * @param {boolean} [options.rules.obsidianEmbed] - Enable ![[embed]] syntax
   * @param {object} [options.callouts] - Options forwarded to applyCallouts
   * @param {object} [options.wikilinks] - Options forwarded to applyWikilinks
   * @param {object} [options.obsidianEmbed] - Options forwarded to applyObsidianEmbed
   */
  constructor(options = {}) {
    const {
      markdownItOptions = {},
      rules = {},
      callouts: calloutOptions = {},
      wikilinks: wikilinkOptions = {},
      obsidianEmbed: embedOptions = {},
    } = options;

    const enabledRules = { ...DEFAULT_RULES, ...rules };

    // Build the markdown-it instance with user options
    this._md = createMarkdownIt(markdownItOptions);

    // Apply enabled custom rules in dependency order
    // headingIds has no dependencies
    if (enabledRules.headingIds) {
      applyHeadingIds(this._md);
    }

    // callouts runs as a core rule after inline processing
    if (enabledRules.callouts) {
      applyCallouts(this._md, calloutOptions);
    }

    // wikilinks and obsidianEmbed are inline rules
    if (enabledRules.wikilinks) {
      applyWikilinks(this._md, wikilinkOptions);
    }

    if (enabledRules.obsidianEmbed) {
      applyObsidianEmbed(this._md, embedOptions);
    }
  }

  /**
   * Renders a markdown string to HTML.
   *
   * @param {string} markdownString - The markdown source to render
   * @returns {string} The rendered HTML string
   */
  render(markdownString) {
    return this._md.render(markdownString);
  }

  /**
   * Renders markdown and inserts the HTML into a DOM element.
   *
   * @param {string|HTMLElement} elementOrSelector - A CSS selector string or an HTMLElement
   * @param {string} markdownString - The markdown source to render
   * @returns {HTMLElement} The target element with rendered content
   */
  renderInto(elementOrSelector, markdownString) {
    const target = typeof elementOrSelector === "string"
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;

    if (!target) {
      throw new Error(`Target element not found: ${elementOrSelector}`);
    }

    target.innerHTML = this.render(markdownString);
    return target;
  }

  /**
   * Returns the underlying markdown-it instance.
   *
   * Useful for advanced use cases: registering additional plugins,
   * accessing the tokenizer, or custom rule manipulation.
   *
   * @returns {MarkdownIt} The internal markdown-it instance
   */
  getInstance() {
    return this._md;
  }
}
