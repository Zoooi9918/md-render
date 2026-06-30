/**
 * @module plugins/lazy/mermaid
 * Lazy-loaded mermaid plugin for diagram rendering.
 * Loads ESM build from CDN only when ```mermaid fences are detected.
 * @implements {LazyPlugin}
 */

export default {
  id: "mermaid",
  provides: ["diagram", "mermaid"],
  bundled: false,
  cdnScript: "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs",
  fallbackScript: "https://unpkg.com/mermaid@10/dist/mermaid.esm.min.mjs",
  options: {
    theme: "default",
    startOnLoad: false,
    securityLevel: "strict",
  },
  /**
   * Load mermaid ESM module from CDN and return a markdown-it plugin factory.
   * @param {Object} [loaderOpts] - Optional loader configuration
   * @param {Function} [loaderOpts.injectModule] - Module injection function
   * @returns {Promise<Function>} markdown-it plugin factory
   */
  async load(loaderOpts = {}) {
    const { injectModule } = loaderOpts;
    /** @type {any} */
    let mermaidMod = null;
    try {
      mermaidMod = await injectModule(this.cdnScript, this.fallbackScript);
      if (mermaidMod && typeof mermaidMod.default !== "undefined") {
        mermaidMod.default.initialize(this.options);
      }
    } catch (err) {
      console.warn(`[mermaid] CDN load failed: ${err.message}`);
    }
    return (md) => {
      const originalFence = md.renderer.rules.fence;
      md.renderer.rules.fence = function (tokens, idx, opts, env, self) {
        const token = tokens[idx];
        const code = token.content.replace(/\n$/, "");
        if (token.info.trim() === "mermaid") {
          return `<pre class="mermaid">${self.escapeHtml(code)}</pre>\n`;
        }
        if (originalFence) {
          return originalFence(tokens, idx, opts, env, self);
        }
        return self.renderToken(tokens, idx, opts);
      };
      // Expose run hook for post-render
      if (typeof window !== "undefined" && mermaidMod) {
        window.markdownRendererMermaid = {
          run: () => mermaidMod.default.run({ querySelector: ".mermaid" }),
        };
      }
    };
  },
};
