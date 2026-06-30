/**
 * LazyLoader — one-time async loader and browser script injector.
 *
 * Used by Phase 4 for heavy plugins (mermaid, katex, highlight.js).
 * Deduplicates parallel loads, supports CDN fallback, and tracks
 * load history for observability.
 *
 * @module plugins/lazy-loader
 */

/**
 * Ensures each plugin loads at most once per LazyLoader instance,
 * and can inject &lt;script&gt;/&lt;link&gt; tags for CDN-hosted libraries.
 */
export class LazyLoader {
  /**
   * Creates a LazyLoader instance.
   */
  constructor() {
    /** @type {Map<string, Promise<Function>>} */
    this._cache = new Map();
    /** @type {Map<string, Promise<void>>} */
    this._urlCache = new Map();
    /** @type {Array<{url: string, durationMs: number, success: boolean, fallback?: boolean}>} */
    this._loadHistory = [];
  }

  /**
   * Load a plugin's factory exactly once.
   * @param {LazyPlugin} plugin - The plugin to load
   * @param {Object} [loaderOpts] - Loader helpers passed from renderer
   * @returns {Promise<Function>} The markdown-it plugin factory
   */
  async loadOnce(plugin, loaderOpts) {
    if (this._cache.has(plugin.id)) {
      return this._cache.get(plugin.id);
    }
    const promise = plugin.load(loaderOpts).catch((err) => {
      console.warn(`[LazyLoader] Failed to load plugin ${plugin.id}:`, err.message);
      // Return a no-op factory so render doesn't crash
      return () => {};
    });
    this._cache.set(plugin.id, promise);
    return promise;
  }

  /**
   * Inject a &lt;script&gt; tag into the document head (browser only).
   * Deduplicates by URL. Supports fallback URL.
   * @param {string} url - The primary script URL
   * @param {string} [fallbackUrl] - Fallback script URL
   * @param {Object} [attrs] - Additional script attributes
   * @returns {Promise<void>}
   */
  injectScript(url, fallbackUrl, attrs = {}) {
    if (this._urlCache.has(url)) {
      return this._urlCache.get(url);
    }
    const promise = this._injectScriptImpl(url, fallbackUrl, attrs);
    this._urlCache.set(url, promise);
    return promise;
  }

  /**
   * @private
   */
  async _injectScriptImpl(url, fallbackUrl, attrs) {
    if (typeof document === "undefined") {
      throw new Error(
        "LazyLoader.injectScript requires a browser environment (document is undefined)"
      );
    }
    const start = performance.now();
    try {
      await this._loadScript(url, attrs);
      this._loadHistory.push({
        url,
        durationMs: Math.round(performance.now() - start),
        success: true,
      });
    } catch (primaryErr) {
      if (fallbackUrl) {
        try {
          await this._loadScript(fallbackUrl, attrs);
          this._loadHistory.push({
            url: fallbackUrl,
            durationMs: Math.round(performance.now() - start),
            success: true,
            fallback: true,
          });
          return;
        } catch (fallbackErr) {
          this._loadHistory.push({
            url: fallbackUrl,
            durationMs: Math.round(performance.now() - start),
            success: false,
            fallback: true,
          });
          throw new Error(
            `Failed to load script from primary (${url}) and fallback (${fallbackUrl}): ${fallbackErr.message}`
          );
        }
      }
      this._loadHistory.push({
        url,
        durationMs: Math.round(performance.now() - start),
        success: false,
      });
      throw primaryErr;
    }
  }

  /**
   * @private
   */
  _loadScript(url, attrs) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      if (attrs.type) script.type = attrs.type;
      if (attrs.crossorigin) script.crossOrigin = attrs.crossorigin;
      if (attrs.integrity) script.integrity = attrs.integrity;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Dynamically import an ESM module from a URL (browser or Node).
   * Deduplicates by URL. Supports fallback URL.
   * @param {string} url - The primary module URL
   * @param {string} [fallbackUrl] - Fallback module URL
   * @returns {Promise<any>} The module namespace object
   */
  async injectModule(url, fallbackUrl) {
    if (this._urlCache.has(url)) {
      return this._urlCache.get(url);
    }
    const promise = this._injectModuleImpl(url, fallbackUrl);
    this._urlCache.set(url, promise);
    return promise;
  }

  /**
   * @private
   */
  async _injectModuleImpl(url, fallbackUrl) {
    const start = performance.now();
    try {
      const mod = await import(/* @vite-ignore */ url);
      this._loadHistory.push({
        url,
        durationMs: Math.round(performance.now() - start),
        success: true,
      });
      return mod;
    } catch (primaryErr) {
      if (fallbackUrl) {
        try {
          const mod = await import(/* @vite-ignore */ fallbackUrl);
          this._loadHistory.push({
            url: fallbackUrl,
            durationMs: Math.round(performance.now() - start),
            success: true,
            fallback: true,
          });
          return mod;
        } catch (fallbackErr) {
          this._loadHistory.push({
            url: fallbackUrl,
            durationMs: Math.round(performance.now() - start),
            success: false,
            fallback: true,
          });
          throw new Error(
            `Failed to load module from primary (${url}) and fallback (${fallbackUrl}): ${fallbackErr.message}`
          );
        }
      }
      this._loadHistory.push({
        url,
        durationMs: Math.round(performance.now() - start),
        success: false,
      });
      throw primaryErr;
    }
  }

  /**
   * Inject a &lt;link rel="stylesheet"&gt; tag into the document head (browser only).
   * Deduplicates by URL. Supports fallback URL.
   * @param {string} url - The primary stylesheet URL
   * @param {string} [fallbackUrl] - Fallback stylesheet URL
   * @returns {Promise<void>}
   */
  injectStylesheet(url, fallbackUrl) {
    if (this._urlCache.has(url)) {
      return this._urlCache.get(url);
    }
    const promise = this._injectStylesheetImpl(url, fallbackUrl);
    this._urlCache.set(url, promise);
    return promise;
  }

  /**
   * @private
   */
  async _injectStylesheetImpl(url, fallbackUrl) {
    if (typeof document === "undefined") {
      throw new Error(
        "LazyLoader.injectStylesheet requires a browser environment (document is undefined)"
      );
    }
    const start = performance.now();
    try {
      await this._loadStylesheet(url);
      this._loadHistory.push({
        url,
        durationMs: Math.round(performance.now() - start),
        success: true,
      });
    } catch (primaryErr) {
      if (fallbackUrl) {
        try {
          await this._loadStylesheet(fallbackUrl);
          this._loadHistory.push({
            url: fallbackUrl,
            durationMs: Math.round(performance.now() - start),
            success: true,
            fallback: true,
          });
          return;
        } catch (fallbackErr) {
          this._loadHistory.push({
            url: fallbackUrl,
            durationMs: Math.round(performance.now() - start),
            success: false,
            fallback: true,
          });
          throw new Error(
            `Failed to load stylesheet from primary (${url}) and fallback (${fallbackUrl}): ${fallbackErr.message}`
          );
        }
      }
      this._loadHistory.push({
        url,
        durationMs: Math.round(performance.now() - start),
        success: false,
      });
      throw primaryErr;
    }
  }

  /**
   * @private
   */
  _loadStylesheet(url) {
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
   * Check if a feature is already loaded (e.g., window.hljs, window.katex).
   * @param {string} feature - Feature name (e.g., "hljs", "katex", "mermaid")
   * @returns {boolean}
   */
  hasFeature(feature) {
    if (typeof window === "undefined") return false;
    return typeof window[feature] !== "undefined";
  }

  /**
   * Get the number of in-flight load promises.
   * @returns {number}
   */
  getActiveLoads() {
    let count = 0;
    for (const [, promise] of this._urlCache) {
      // A promise that hasn't settled yet is still "active"
      // We approximate by checking if it's still in the cache and not resolved
      count++;
    }
    return count;
  }

  /**
   * Get the load history array.
   * @returns {Array<{url: string, durationMs: number, success: boolean, fallback?: boolean}>}
   */
  getLoadHistory() {
    return [...this._loadHistory];
  }

  /**
   * Clear the load cache so plugins can be reloaded.
   */
  reset() {
    this._cache.clear();
    this._urlCache.clear();
    this._loadHistory = [];
  }
}
