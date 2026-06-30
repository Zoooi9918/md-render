/**
 * Heading IDs rule.
 *
 * Assigns a deterministic `id` attribute to every heading, enabling
 * anchor links and in-document navigation without external tooling.
 *
 * @module heading-ids
 */

/**
 * Slugifies a heading text for use as an HTML `id`.
 *
 * Deterministic and idempotent: running the slug through this function
 * a second time produces the same result.
 *
 * @param {string} text - Raw heading text
 * @returns {string} URL-safe slug
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Registers the heading-ids rule on a markdown-it instance.
 *
 * Hooks into the `heading_open` token and sets `id={slug}` based on
 * the heading's child text content.
 *
 * @param {MarkdownIt} md - The markdown-it instance
 */
export function applyHeadingIds(md) {
  const defaultRenderer = md.renderer.rules.heading_open;

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const textToken = tokens[idx + 1];

    if (textToken && textToken.content) {
      const slug = slugify(textToken.content);
      // Set or override the id attribute
      const attrIdx = token.attrIndex("id");
      if (attrIdx < 0) {
        token.attrPush(["id", slug]);
      } else {
        token.attrs[attrIdx][1] = slug;
      }
    }

    // Delegate to default renderer for consistent output
    return defaultRenderer ? defaultRenderer(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
  };
}
