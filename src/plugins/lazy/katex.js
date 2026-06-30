/**
 * @module plugins/lazy/katex
 * Lazy-loaded KaTeX plugin for math rendering via markdown-it-texmath.
 * Loads from CDN only when $...$ or $$...$$ is detected.
 * @implements {LazyPlugin}
 */

export default {
  id: "katex",
  provides: ["math", "latex"],
  bundled: false,
  cdnScript: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
  cdnStyle: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",
  texmathScript: "https://cdn.jsdelivr.net/npm/markdown-it-texmath@1/texmath.js",
  fallbackScript: "https://unpkg.com/katex@0.16.9/dist/katex.min.js",
  fallbackStyle: "https://unpkg.com/katex@0.16.9/dist/katex.min.css",
  fallbackTexmathScript: "https://unpkg.com/markdown-it-texmath@1/texmath.js",
  options: {
    delimiters: "dollars",
    throwOnError: false,
  },
  /**
   * Load KaTeX + texmath from CDN and return a markdown-it plugin factory.
   * @param {Object} [loaderOpts] - Optional loader configuration
   * @param {Function} [loaderOpts.injectScript] - Script injection function
   * @param {Function} [loaderOpts.injectStylesheet] - Stylesheet injection function
   * @returns {Promise<Function>} markdown-it plugin factory
   */
  async load(loaderOpts = {}) {
    const { injectScript, injectStylesheet } = loaderOpts;
    try {
      await injectStylesheet(this.cdnScript, this.fallbackStyle);
      await injectScript(this.cdnScript, this.fallbackScript);
      await injectScript(this.texmathScript, this.fallbackTexmathScript);
    } catch (err) {
      console.warn(`[katex] CDN load failed: ${err.message}`);
    }
    return (md) => {
      const katex = typeof window !== "undefined" ? window.katex : null;
      const texmath = typeof window !== "undefined" ? window.texmath : null;
      if (!katex || !texmath) return;
      md.use(texmath, {
        engine: katex,
        delimiters: this.options.delimiters,
        katexOptions: { throwOnError: this.options.throwOnError },
      });
    };
  },
};
