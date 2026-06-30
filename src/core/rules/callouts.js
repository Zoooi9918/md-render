/**
 * Obsidian-style callouts rule.
 *
 * Renders `> [!type] title` blockquotes as structured callout divs
 * with optional fold support (`+` expanded, `-` collapsed).
 *
 * Uses string parsing (indexOf) rather than regex for [!type] detection,
 * making the parser more robust against edge cases and easier to debug.
 *
 * @module callouts
 */

/**
 * Default callout types that Obsidian recognizes.
 * Used only for normalization — unknown types are passed through as-is.
 */
const KNOWN_CALLOUT_TYPES = new Set([
  "note", "abstract", "summary", "tldr", "info", "todo", "tip",
  "hint", "important", "success", "check", "done", "question",
  "help", "faq", "warning", "attention", "caution", "failure",
  "fail", "missing", "danger", "error", "bug", "example",
  "quote", "cite",
]);

/**
 * Normalizes a callout type to lowercase, trimming whitespace.
 *
 * @param {string} rawType - The raw type string from the markdown
 * @returns {string} Normalized callout type
 */
function normalizeType(rawType) {
  return rawType.trim().toLowerCase();
}

/**
 * Escapes a string for safe HTML attribute embedding.
 *
 * @param {string} s - Raw string
 * @returns {string} HTML-safe string
 */
function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Parses the first inline token of a blockquote for callout syntax.
 *
 * Looks for `[!type]` optionally followed by `+` or `-` (fold markers)
 * and an optional title.
 *
 * @param {string} content - The inline content string
 * @returns {{isCallout: boolean, type: string, foldMarker: string|null, title: string}|null}
 */
function parseCalloutHeader(content) {
  const bracketOpen = content.indexOf("[!");
  if (bracketOpen < 0) return null;

  const bracketClose = content.indexOf("]", bracketOpen + 2);
  if (bracketClose < 0) return null;

  // Must be at the start of the content (allowing leading whitespace)
  const before = content.substring(0, bracketOpen);
  if (before.trim() !== "") return null;

  const type = normalizeType(content.substring(bracketOpen + 2, bracketClose));
  if (!type) return null;

  const afterBracket = content.substring(bracketClose + 1);

  // Check for fold marker
  let foldMarker = null;
  let rest = afterBracket;
  if (rest.startsWith("+")) {
    foldMarker = "+";
    rest = rest.substring(1);
  } else if (rest.startsWith("-")) {
    foldMarker = "-";
    rest = rest.substring(1);
  }

  const title = rest.trim();

  return { isCallout: true, type, foldMarker, title };
}

/**
 * Registers the callouts rule on a markdown-it instance.
 *
 * @param {MarkdownIt} md - The markdown-it instance
 * @param {object} [options] - Configuration options
 * @param {string} [options.defaultType="note"] - Fallback type if parsing fails
 */
export function applyCallouts(md, options = {}) {
  const { defaultType = "note" } = options;

  md.core.ruler.after("inline", "callouts", (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "blockquote_open") continue;

      // Find the first inline token inside this blockquote
      let inlineToken = null;
      let inlineIdx = -1;
      let depth = 1;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === "blockquote_open") depth++;
        if (tokens[j].type === "blockquote_close") {
          depth--;
          if (depth === 0) break;
        }
        if (tokens[j].type === "inline" && !inlineToken) {
          inlineToken = tokens[j];
          inlineIdx = j;
        }
      }

      if (!inlineToken) continue;

      const parsed = parseCalloutHeader(inlineToken.content);
      if (!parsed || !parsed.isCallout) continue;

      const { type, foldMarker, title } = parsed;
      const calloutType = type || defaultType;

      // Build the callout HTML in a single pass
      const titleHtml = title
        ? `<div class="callout-title">${escapeAttr(title)}</div>`
        : `<div class="callout-title">${escapeAttr(calloutType)}</div>`;

      // Extract body content (everything after the [!type] marker line)
      const headerEnd = inlineToken.content.indexOf("\n", parsed.type.length + parsed.type.length);
      const bodyContent = headerEnd > 0 ? inlineToken.content.substring(headerEnd).trim() : "";

      const bodyHtml = bodyContent
        ? `<div class="callout-body">${md.renderInline(bodyContent)}</div>`
        : "";

      // Build fold classes
      let classes = `callout callout-${calloutType}`;
      if (foldMarker) {
        classes += " callout-foldable";
        if (foldMarker === "-") {
          classes += " callout-collapsed";
        }
      }

      const calloutHtml = `<div class="${classes}">${titleHtml}${bodyHtml}</div>`;

      // Replace the inline content with an html_block token
      // This avoids double-rendering the blockquote content
      inlineToken.type = "html_block";
      inlineToken.content = calloutHtml;
      inlineToken.tag = "";

      // Hide the surrounding paragraph tokens to avoid wrapper <p> tags
      for (let k = inlineIdx - 1; k >= i + 1; k--) {
        if (tokens[k].type === "paragraph_open") {
          tokens[k].hidden = true;
          tokens[k].content = "";
          break;
        }
      }
      for (let k = inlineIdx + 1; k < tokens.length; k++) {
        if (tokens[k].type === "paragraph_close") {
          tokens[k].hidden = true;
          tokens[k].content = "";
          break;
        }
      }

      // Add class to blockquote_open token
      const attrIdx = tokens[i].attrIndex("class");
      if (attrIdx < 0) {
        tokens[i].attrPush(["class", classes]);
      } else {
        tokens[i].attrs[attrIdx][1] = classes;
      }
    }
  });
}
