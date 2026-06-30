/**
 * Obsidian embed rule.
 *
 * Renders `![[file]]` syntax as appropriate HTML embed elements
 * based on file extension detection.
 *
 * @module obsidian-embed
 */

/** File extensions mapped to embed type */
const EMBED_TYPES = Object.freeze({
  pdf: "iframe",
  png: "img",
  jpg: "img",
  jpeg: "img",
  gif: "img",
  webp: "img",
  svg: "img",
  avif: "img",
  mp4: "video",
  webm: "video",
  ogv: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  m4a: "audio",
});

/** Default iframe height in pixels */
const DEFAULT_IFRAME_HEIGHT = 600;

/** CSS class for unknown embed types */
const UNKNOWN_EMBED_CLASS = "wikilink-embed";

/**
 * Extracts the file extension from a target string.
 *
 * @param {string} target - The file path or URL
 * @returns {string} Lowercase extension without the dot
 */
function getExtension(target) {
  const lastDot = target.lastIndexOf(".");
  if (lastDot < 0) return "";
  // Handle query strings: extract extension before ?
  const hashIdx = target.indexOf("?", lastDot);
  const end = hashIdx > 0 ? hashIdx : target.length;
  return target.substring(lastDot + 1, end).toLowerCase();
}

/**
 * Generates the HTML for an embed element based on file type.
 *
 * @param {string} src - The resolved source URL/path
 * @param {string} embedType - One of: iframe, img, video, audio, link
 * @param {string} [alt] - Alt text for images (fallback to filename)
 * @param {number} [iframeHeight] - Height for iframe embeds
 * @returns {string} HTML string
 */
function buildEmbedHtml(src, embedType, alt, iframeHeight = DEFAULT_IFRAME_HEIGHT) {
  const escapedSrc = src.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const escapedAlt = (alt || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  switch (embedType) {
    case "iframe":
      return `<iframe src="${escapedSrc}" height="${iframeHeight}" loading="lazy"></iframe>`;
    case "img":
      return `<img src="${escapedSrc}" alt="${escapedAlt}" loading="lazy">`;
    case "video":
      return `<video src="${escapedSrc}" controls></video>`;
    case "audio":
      return `<audio src="${escapedSrc}" controls></audio>`;
    default:
      return `<a href="${escapedSrc}" class="${UNKNOWN_EMBED_CLASS}">${escapedAlt || escapedSrc}</a>`;
  }
}

/**
 * Default source resolver — returns the target as-is.
 * Supports both absolute URLs and relative paths.
 *
 * @param {string} target - The raw target from ![[target]]
 * @returns {string} Resolved source
 */
function defaultResolveSrc(target) {
  return target;
}

/**
 * Registers the obsidian-embed rule on a markdown-it instance.
 *
 * @param {MarkdownIt} md - The markdown-it instance
 * @param {object} [options] - Configuration options
 * @param {Function} [options.resolveSrc] - Custom source resolver (target) => string
 * @param {number} [options.iframeHeight] - Default height for PDF iframes
 */
export function applyObsidianEmbed(md, options = {}) {
  const {
    resolveSrc = defaultResolveSrc,
    iframeHeight = DEFAULT_IFRAME_HEIGHT,
  } = options;

  // Insert before the "link" rule so embeds take priority
  md.inline.ruler.before("link", "obsidian_embed", (state, silent) => {
    const pos = state.pos;

    // Check for ![[ prefix
    if (state.src[pos] !== "!") return false;
    if (state.src[pos + 1] !== "[") return false;
    if (state.src[pos + 2] !== "[") return false;

    // Find the closing ]]
    const closeIdx = state.src.indexOf("]]", pos + 3);
    if (closeIdx < 0) return false;

    if (silent) return true;

    const raw = state.src.substring(pos + 3, closeIdx).trim();
    if (!raw) {
      state.pos = closeIdx + 2;
      return true;
    }

    // Parse potential alt text: ![[file.png|alt text]]
    let target = raw;
    let alt = null;
    const pipeIdx = raw.lastIndexOf("|");
    if (pipeIdx > 0) {
      alt = raw.substring(pipeIdx + 1).trim();
      target = raw.substring(0, pipeIdx).trim();
    }

    const ext = getExtension(target);
    const embedType = EMBED_TYPES[ext] || "link";
    const src = resolveSrc(target);

    const html = buildEmbedHtml(src, embedType, alt, iframeHeight);

    const token = state.push("html_inline", "", 0);
    token.content = html;

    state.pos = closeIdx + 2;

    return true;
  });
}
