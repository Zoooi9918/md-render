/**
 * @module plugins/default-pack
 * Returns the default array of all plugins (bundled + lazy).
 */
import {
  markPlugin,
  subPlugin,
  supPlugin,
  insPlugin,
  emojiPlugin,
  footnotePlugin,
  taskListsPlugin,
  deflistPlugin,
} from "./bundled/index.js";
import {
  highlightPlugin,
  mermaidPlugin,
  katexPlugin,
} from "./lazy/index.js";

/**
 * Get the default plugin pack (11 plugins: 8 bundled + 3 lazy).
 * @returns {LazyPlugin[]} Array of plugins in deterministic order
 */
export function getDefaultPack() {
  return [
    markPlugin,
    subPlugin,
    supPlugin,
    insPlugin,
    emojiPlugin,
    footnotePlugin,
    taskListsPlugin,
    deflistPlugin,
    highlightPlugin,
    mermaidPlugin,
    katexPlugin,
  ];
}
