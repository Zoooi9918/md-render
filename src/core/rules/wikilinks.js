/**
 * Wikilinks rule.
 *
 * Renders `[[page]]`, `[[page#heading]]`, and `[[page|alias]]` syntax
 * as proper `<a>` link tokens (not raw HTML), preserving markdown-it's
 * HTML escaping and security model.
 *
 * @module wikilinks
 */

import { slugify } from "./heading-ids.js";

/** Default CSS class applied to wikilink anchors */
const DEFAULT_LINK_CLASS = "wikilink";

/**
 * Default href resolver — produces relative markdown file links.
 *
 * @param {string} page - The target page name
 * @param {string} [heading] - Optional heading anchor
 * @returns {string} Resolved href
 */
function defaultResolveHref(page, heading) {
  let href = `./${slugify(page)}.md`;
  if (heading) {
    href += `#${slugify(heading)}`;
  }
  return href;
}

/**
 * Parses a wikilink target string into its components.
 *
 * Supports: `[[page]]`, `[[page#heading]]`, `[[page|alias]]`, `[[page#heading|alias]]`
 *
 * @param {string} raw - Content between [[ and ]]
 * @returns {{page: string, heading: string|null, alias: string|null}|null}
 */
function parseWikilink(raw) {
  if (!raw || !raw.trim()) return null;

  let page = raw;
  let alias = null;

  // Check for alias: split on the last | that's not inside a nested [[
  const pipeIdx = raw.lastIndexOf("|");
  if (pipeIdx > 0) {
    alias = raw.substring(pipeIdx + 1).trim();
    page = raw.substring(0, pipeIdx).trim();
    if (!alias) alias = null;
  }

  // Check for heading anchor
  let heading = null;
  const hashIdx = page.indexOf("#");
  if (hashIdx > 0) {
    heading = page.substring(hashIdx + 1).trim();
    page = page.substring(0, hashIdx).trim();
    if (!heading) heading = null;
  }

  if (!page) return null;

  return { page, heading, alias };
}

/**
 * Registers the wikilinks rule on a markdown-it instance.
 *
 * @param {MarkdownIt} md - The markdown-it instance
 * @param {object} [options] - Configuration options
 * @param {Function} [options.resolveHref] - Custom href resolver (page, heading) => string
 * @param {string} [options.linkClass] - CSS class for the anchor element
 */
export function applyWikilinks(md, options = {}) {
  const {
    resolveHref = defaultResolveHref,
    linkClass = DEFAULT_LINK_CLASS,
  } = options;

  // Insert before the "link" rule so wikilinks take priority
  md.inline.ruler.before("link", "wikilink", (state, silent) => {
    // Position: current position in the source
    const pos = state.pos;

    // Check for [[ prefix
    if (state.src[pos] !== "[") return false;
    if (state.src[pos + 1] !== "[") return false;

    // Find the closing ]]
    const closeIdx = state.src.indexOf("]]", pos + 2);
    if (closeIdx < 0) return false;

    if (silent) return true;

    const raw = state.src.substring(pos + 2, closeIdx);
    const parsed = parseWikilink(raw);
    if (!parsed) return false;

    const { page, heading, alias } = parsed;
    const href = resolveHref(page, heading);
    const displayText = alias || page;

    // Emit link_open token
    const linkOpen = state.push("link_open", "a", 1);
    linkOpen.attrs = [["href", href], ["class", linkClass]];

    // Emit text token with the display text
    const textToken = state.push("text", "", 0);
    textToken.content = displayText;

    // Emit link_close token
    state.push("link_close", "a", -1);

    // Advance position past ]]
    state.pos = closeIdx + 2;

    return true;
  });
}
