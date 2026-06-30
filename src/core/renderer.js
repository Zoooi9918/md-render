/**
 * MarkdownRenderer — the main public API.
 *
 * Constructs a markdown-it instance with configurable custom rules
 * and provides a clean interface for rendering markdown to HTML.
 * Supports both synchronous render (fast path) and async render
 * (with lazy-loaded heavy libraries: mermaid, katex, highlight.js).
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
import { PluginRegistry } from "../plugins/registry.js";
import { getDefaultPack } from "../plugins/default-pack.js";
import { LazyLoader } from "../plugins/lazy-loader.js";

/** Default rule toggles — all enabled */
const DEFAULT_RULES = Object.freeze({
  headingIds: true,
  callouts: true,
  wikilinks: true,
  obsidianEmbed: true,
});

/** Default theme */
const DEFAULT_THEME = "light";
const DEFAULT_CONTAINER_CLASS = "markdown-renderer";

/**
 * High-performance markdown-to-HTML renderer with Obsidian-flavored extensions.
 */
export class MarkdownRenderer {
  /**
   * Creates a new MarkdownRenderer instance.
   *
   * @param {object} [options] - Configuration options
   * @param {object} [options.markdownItOptions] - Options passed to markdown-it
   * @param {object} [options.rules] - Toggle individual custom rules on/off
   * @param {boolean} [options.rules.headingIds] - Enable heading ID generation
   * @param {boolean} [options.rules.callouts] - Enable Obsidian-style callouts
   * @param {boolean} [options.rules.wikilinks] - Enable [[wikilink]] syntax
   * @param {boolean} [options.rules.obsidianEmbed] - Enable ![[embed]] syntax
   * @param {object} [options.callouts] - Options forwarded to applyCallouts
   * @param {object} [options.wikilinks] - Options forwarded to applyWikilinks
   * @param {object} [options.obsidianEmbed] - Options forwarded to applyObsidianEmbed
   * @param {LazyPlugin[]} [options.plugins] - Custom plugin array (overrides default pack)
   * @param {string[]} [options.disablePlugins] - Plugin ids to disable
   * @param {string[]} [options.enablePlugins] - If set, ONLY these plugin ids are kept
   * @param {Object<string, Object>} [options.pluginOptions] - Per-plugin option overrides
   * @param {boolean} [options.injectStyles] - Inject CSS inline (requires build)
   * @param {string} [options.theme] - Theme: "light" | "dark" | "auto"
   * @param {string} [options.containerClass] - Container CSS class
   */
  constructor(options = {}) {
    const {
      markdownItOptions = {},
      rules = {},
      callouts: calloutOptions = {},
      wikilinks: wikilinkOptions = {},
      obsidianEmbed: embedOptions = {},
      plugins: userPlugins,
      disablePlugins = [],
      enablePlugins,
      pluginOptions = {},
      injectStyles = false,
      theme = DEFAULT_THEME,
      containerClass = DEFAULT_CONTAINER_CLASS,
    } = options;

    const enabledRules = { ...DEFAULT_RULES, ...rules };

    // Build the markdown-it instance with user options
    this._md = createMarkdownIt(markdownItOptions);

    // Store theme and style settings
    this._injectStyles = injectStyles;
    this._theme = theme;
    this._containerClass = containerClass;

    // Resolve plugin list
    let resolvedPlugins;
    if (enablePlugins !== undefined) {
      const defaultPack = getDefaultPack();
      resolvedPlugins = defaultPack.filter((p) =>
        enablePlugins.includes(p.id)
      );
    } else if (userPlugins !== undefined) {
      resolvedPlugins = [...userPlugins];
    } else {
      resolvedPlugins = getDefaultPack();
    }
    // Apply disable filter
    if (disablePlugins.length > 0) {
      resolvedPlugins = resolvedPlugins.filter(
        (p) => !disablePlugins.includes(p.id)
      );
    }

    // Apply plugin registry BEFORE custom rules
    this._registry = new PluginRegistry(resolvedPlugins);
    this._registry.applyAll(this._md, pluginOptions);

    // LazyLoader instance for async plugin loading
    this._loader = new LazyLoader();

    // Track which lazy plugins were loaded for this render
    this._loadedPlugins = [];

    // Apply enabled custom rules in dependency order
    if (enabledRules.headingIds) {
      applyHeadingIds(this._md);
    }
    if (enabledRules.callouts) {
      applyCallouts(this._md, calloutOptions);
    }
    if (enabledRules.wikilinks) {
      applyWikilinks(this._md, wikilinkOptions);
    }
    if (enabledRules.obsidianEmbed) {
      applyObsidianEmbed(this._md, embedOptions);
    }
  }

  /**
   * Renders a markdown string to HTML (synchronous, fast path).
   * @param {string} markdownString - The markdown source to render
   * @returns {string} The rendered HTML string
   */
  render(markdownString) {
    return this._md.render(markdownString);
  }

  /**
   * Renders markdown asynchronously, loading lazy plugins on demand.
   * @param {string} markdownString - The markdown source to render
   * @returns {Promise<string>} The rendered HTML string
   */
  async renderAsync(markdownString) {
    this._loadedPlugins = [];

    // Parse tokens to detect lazy needs
    const tokens = this._md.parse(markdownString, {});
    const needs = this._scanTokens(tokens);

    // Load deferred plugins for detected needs
    const loaderOpts = {
      injectScript: (url, fallback) => this._loader.injectScript(url, fallback),
      injectStylesheet: (url, fallback) => this._loader.injectStylesheet(url, fallback),
      injectModule: (url, fallback) => this._loader.injectModule(url, fallback),
    };

    for (const needId of needs) {
      const plugin = this._registry.getById(needId);
      if (plugin) {
        try {
          const factory = await this._loader.loadOnce(plugin, loaderOpts);
          this._md.use(factory, plugin.options || {});
          this._loadedPlugins.push(plugin.id);
        } catch (err) {
          console.warn(`[renderer] Failed to load ${needId}:`, err.message);
        }
      }
    }

    return this._md.render(markdownString);
  }

  /**
   * Scan markdown-it tokens for lazy plugin triggers.
   * @param {Array} tokens - Parsed markdown-it tokens
   * @returns {string[]} Array of plugin ids needed
   */
  _scanTokens(tokens) {
    const needs = new Set();

    for (const token of tokens) {
      if (token.type === "fence") {
        const lang = (token.info || "").trim();
        if (lang === "mermaid") {
          needs.add("mermaid");
        } else if (lang.length > 0) {
          needs.add("highlight");
        }
      }
      if (token.type === "math_inline" || token.type === "math_block") {
        needs.add("katex");
      }
      // Also scan token content for math patterns (chicken-and-egg problem)
      if (token.content) {
        if (/\$\$[\s\S]*?\$\$/.test(token.content) || /\$[^$\n]+\$/.test(token.content)) {
          needs.add("katex");
        }
      }
      // Recurse into child tokens
      if (token.children && token.children.length) {
        for (const child of this._scanTokens(token.children)) {
          needs.add(child);
        }
      }
    }

    return [...needs];
  }

  /**
   * Renders markdown and inserts the HTML into a DOM element (async).
   * @param {string|HTMLElement} elementOrSelector - A CSS selector string or an HTMLElement
   * @param {string} markdownString - The markdown source to render
   * @returns {Promise<HTMLElement>} The target element with rendered content
   */
  async renderInto(elementOrSelector, markdownString) {
    const target = typeof elementOrSelector === "string"
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;

    if (!target) {
      throw new Error(`Target element not found: ${elementOrSelector}`);
    }

    const html = await this.renderAsync(markdownString);

    // Wrap in themed container
    const wrapper = document.createElement("div");
    wrapper.className = this._containerClass;
    wrapper.setAttribute("data-theme", this._theme);
    wrapper.innerHTML = html;
    target.innerHTML = "";
    target.appendChild(wrapper);

    // Inject inline styles if requested
    if (this._injectStyles) {
      await this._injectStylesIntoHead();
    }

    // Post-render hooks
    await this._postRender();

    return target;
  }

  /**
   * Inject baked CSS into document head.
   * Uses build-time generated inline.generated.js if available,
   * otherwise falls back to fetching the CSS file (dev mode).
   * @private
   */
  async _injectStylesIntoHead() {
    if (typeof document === "undefined") return;
    if (document.querySelector('style[data-md-renderer="true"]')) return;
    let cssText;
    try {
      const mod = await import("../styles/inline.generated.js");
      cssText = mod.default;
    } catch {
      try {
        const resp = await fetch("dist/markdown-renderer.css");
        cssText = await resp.text();
      } catch {
        console.warn("[renderer] Could not load CSS for injectStyles");
        return;
      }
    }
    const style = document.createElement("style");
    style.textContent = cssText;
    style.dataset.mdRenderer = "true";
    document.head.appendChild(style);
  }

  /**
   * Run post-render hooks (mermaid diagram rendering, etc.).
   * @private
   */
  async _postRender() {
    if (this._loadedPlugins.includes("mermaid") &&
        typeof window !== "undefined" &&
        window.markdownRendererMermaid) {
      try {
        await window.markdownRendererMermaid.run();
      } catch (err) {
        console.warn("[renderer] mermaid post-render failed:", err.message);
      }
    }
  }

  /**
   * Returns the underlying markdown-it instance.
   * @returns {MarkdownIt} The internal markdown-it instance
   */
  getInstance() {
    return this._md;
  }

  /**
   * Returns the PluginRegistry instance for inspection.
   * @returns {PluginRegistry} The plugin registry
   */
  getRegistry() {
    return this._registry;
  }

  /**
   * Returns the list of deferred plugin ids.
   * @returns {string[]} Array of deferred plugin ids
   */
  getDeferredPlugins() {
    return this._registry.getDeferred();
  }

  /**
   * Returns the LazyLoader instance for observability.
   * @returns {LazyLoader} The lazy loader
   */
  getLoader() {
    return this._loader;
  }

  /**
   * Returns the list of lazy plugins loaded during the last renderAsync call.
   * @returns {string[]} Array of loaded plugin ids
   */
  getLoadedPlugins() {
    return [...this._loadedPlugins];
  }
}
