/**
 * @module plugins/bundled/emoji
 * @implements {LazyPlugin}
 */
import * as markdownItEmoji from "markdown-it-emoji";

export default {
  id: "emoji",
  provides: ["emoji"],
  bundled: true,
  options: {},
  apply(md, options = {}) {
    md.use(markdownItEmoji.full, options);
  },
  load() {
    return Promise.resolve(markdownItEmoji);
  },
};
