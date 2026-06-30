/**
 * iife-entry.js — Entry point for IIFE/UMD builds.
 *
 * Re-exports everything from index.js but wraps it in a single
 * namespace object so esbuild's IIFE format exposes all exports.
 */

export * from "./index.js";
export { default } from "./index.js";
