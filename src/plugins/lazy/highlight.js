/**
 * @module plugins/lazy/highlight
 * Lazy-loaded highlight.js plugin for code block syntax highlighting.
 * Loads from CDN only when code blocks with a language are detected.
 * @implements {LazyPlugin}
 */

export default {
  id: "highlight",
  provides: ["code-highlight", "syntax"],
  bundled: false,
  cdnScript: "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11/highlight.min.js",
  cdnStyle: "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11/styles/github.min.css",
  fallbackScript: "https://unpkg.com/@highlightjs/cdn-assets@11/highlight.min.js",
  fallbackStyle: "https://unpkg.com/@highlightjs/cdn-assets@11/styles/github.min.css",
  options: {
    theme: "github",
    autoDetect: true,
  },
  /**
   * Load highlight.js from CDN and return a markdown-it plugin factory.
   * @param {Object} [loaderOpts] - Optional loader configuration
   * @param {Function} [loaderOpts.injectScript] - Script injection function
   * @param {Function} [loaderOpts.injectStylesheet] - Stylesheet injection function
   * @returns {Promise<Function>} markdown-it plugin factory
   */
  async load(loaderOpts = {}) {
    const { injectScript, injectStylesheet } = loaderOpts;
    try {
      await Promise.all([
        injectScript(this.cdnScript, this.fallbackScript),
        injectStylesheet(this.cdnStyle, this.fallbackStyle),
      ]);
    } catch (err) {
      // Degrade gracefully — code blocks render without highlighting
      console.warn(`[highlight] CDN load failed: ${err.message}`);
    }
    return (md) => {
      const hljs = typeof window !== "undefined" ? window.hljs : null;
      if (!hljs) return;
      md.options.highlight = function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (_) { /* fall through */ }
        }
        if (this.options.highlighted) {
          try {
            const result = hljs.highlightAuto(str);
            if (result.language) {
              return hljs.highlight(str, { language: result.language }).value;
            }
          } catch (_) { /* fall through */ }
        }
        return null; // fallback to default escaping
      };
    };
  },
};
