/**
 * demo.js — Demo site wiring.
 *
 * Loads the renderer from CDN, wires the editor to preview pipeline,
 * theme toggle, and sample file loader.
 */

(function () {
  "use strict";

  var editor = document.getElementById("editor");
  var preview = document.getElementById("preview");
  var sampleSelect = document.getElementById("sample-select");
  var themeSelect = document.getElementById("theme-select");

  // Handle both namespace and direct global exposure
  var MR = MarkdownRenderer.MarkdownRenderer || MarkdownRenderer;
  var renderer = new MR({ injectStyles: true });

  var debounceTimer = null;

  function render() {
    var md = editor.value;
    renderer.renderInto(preview, md).catch(function (err) {
      preview.innerHTML = "<pre style='color:red'>" + escapeHtml(err.toString()) + "</pre>";
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Debounced render on input
  editor.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, 200);
  });

  // Theme toggle
  themeSelect.addEventListener("change", function () {
    preview.setAttribute("data-theme", this.value);
  });

  // Sample loader
  sampleSelect.addEventListener("change", function () {
    var sample = this.value;
    fetch("samples/" + sample + ".md")
      .then(function (res) { return res.text(); })
      .then(function (text) {
        editor.value = text;
        render();
      })
      .catch(function (err) {
        editor.value = "# Error\n\nCould not load sample: " + err.message;
        render();
      });
  });

  // Initial load
  (function init() {
    var sample = sampleSelect.value;
    fetch("samples/" + sample + ".md")
      .then(function (res) { return res.text(); })
      .then(function (text) {
        editor.value = text;
        render();
      })
      .catch(function () {
        editor.value = "# md-render\n\nStart typing markdown here...";
        render();
      });
  })();
})();
