/**
 * LazyLoader — one-time async loader and browser script injector.
 *
 * Used by Phase 4 for heavy plugins (mermaid, katex, highlight.js).
 * In Phase 3 the infrastructure exists but is unused for bundled plugins.
 *
 * @module plugins/lazy-loader
 */

/**
 * Ensures each plugin loads at most once per LazyLoader instance,
 * and can inject <script>/<link> tags for CDN-hosted libraries.
 */
export class LazyLoader {
  /**
   * Creates a LazyLoader instance.
   */
  constructor() {
    /** @type {Map<string, Promise<Function>>} */
    this._cache = new Map();
  }

  /**
   * Load a plugin's factory exactly once.
   * @param {LazyPlugin} plugin - The plugin to load
   * @returns {Promise<Function>} The markdown-it plugin factory
   */
  async loadOnce(plugin) {
    if (this._cache.has(plugin.id)) {
      return this._cache.get(plugin.id);
    }
    const promise = plugin.load().then((factory) => {
      // Normalize: markdown-it-emoji exports {full, ...}, take .full if present
      if (plugin.id === "emoji" && typeof factory.full === "function") {
        return factory.full;
      }
      return factory;
    });
    this._cache.set(plugin.id, promise);
    return promise;
  }

  /**
   * Inject a <script> tag into the document head (browser only).
   * @param {string} url - The script URL
   * @returns {Promise<void>}
   */
  injectScript(url) {
    if (typeof document === "undefined") {
      return Promise.reject(
        new Error("LazyLoader.injectScript requires a browser environment (document is undefined)")
      );
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Inject a <link rel="stylesheet"> tag into the document head (browser only).
   * @param {string} url - The stylesheet URL
   * @returns {Promise<void>}
   */
  injectStylesheet(url) {
    if (typeof document === "undefined") {
      return Promise.reject(
        new Error("LazyLoader.injectStylesheet requires a browser environment (document is undefined)")
      );
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () =>
        reject(new Error(`Failed to load stylesheet: ${url}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Clear the load cache so plugins can be reloaded.
   */
  reset() {
    this._cache.clear();
  }
}
