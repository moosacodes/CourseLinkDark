/* CourseLink Dark — shadow-root rules for area: content. Appended to the sheet adopted into every open shadow root (no html.cld-on gating needed).
 * Class names/attributes below come from BrightspaceUI source for the exact
 * build CourseLink loads (s.brightspace.com/lib/bsi/2026.9.217/unbundled). */
globalThis.CLD_SHADOW_CSS = (globalThis.CLD_SHADOW_CSS || "") + String.raw`
/* ---------- content: d2l-html-block (module descriptions, HTML topics,
   announcements bodies). Authored HTML is rendered into
   .d2l-html-block-rendered inside the component's shadow root, so dark.css
   inline-style catch-alls never reach it. ------------------------------- */
:host(d2l-html-block) { color: var(--cld-text); }
.d2l-html-block-rendered :is(
  [style*="color: #000" i], [style*="color:#000" i],
  [style*="color: black" i], [style*="color:black" i],
  [style*="color: rgb(0, 0, 0)"], [style*="color: #333" i], [style*="color:#333" i],
  [style*="color: rgb(51, 51, 51)"]
):not([style*="background"]) {
  color: var(--cld-text) !important;
}
.d2l-html-block-rendered :is(
  [style*="background-color: #fff" i], [style*="background-color:#fff" i],
  [style*="background-color: white" i], [style*="background-color:white" i],
  [style*="background-color: rgb(255, 255, 255)"],
  [style*="background: #fff" i], [style*="background:#fff" i],
  [style*="background: white" i], [style*="background:white" i],
  [bgcolor="#ffffff" i], [bgcolor="#fff" i], [bgcolor="white" i]
):not(img, video, canvas, picture, embed, object, iframe) {
  background-color: var(--cld-bg-1) !important;
}
.d2l-html-block-rendered :is(table, th, td) { border-color: var(--cld-border-strong); }
.d2l-html-block-rendered th { background-color: var(--cld-bg-2); color: var(--cld-text); }
.d2l-html-block-rendered hr { border-color: var(--cld-border); }
.d2l-html-block-rendered blockquote { border-color: var(--cld-border-strong); }
.d2l-html-block-rendered :is(code, kbd, samp):not([class*="language-"]),
.d2l-html-block-rendered pre:not([class*="language-"]) {
  background-color: var(--cld-bg-2);
  color: var(--cld-text);
}

/* Code snippets: light prism token set -> D2L's own dark values. */
:is(pre, code)[class*="language-"].d2l-code {
  --d2l-code-background: #202122 !important;
  --d2l-code-language: #90989d !important;
  --d2l-code-line-numbers: #9ea5a9 !important;
  --d2l-code-line-numbers-background: #303133 !important;
  --d2l-code-token-default: #cdd5dc !important;
  --d2l-code-token-comment: #90989d !important;
  --d2l-code-token-punctuation: #cdd5dc !important;
  --d2l-code-token-number: #cdd5dc !important;
  --d2l-code-token-url: #cdd5dc !important;
  --d2l-code-token-operator: #cdd5dc !important;
  --d2l-code-token-interpolation: #92d1ff !important;
  --d2l-code-token-attribute-name: #92d1ff !important;
  --d2l-code-token-constant: #00d2ed !important;
  --d2l-code-token-property: #92d1ff !important;
  --d2l-code-token-tag: #2899e9 !important;
  --d2l-code-token-boolean: #2896e4 !important;
  --d2l-code-token-entity: #29a6ff !important;
  --d2l-code-token-interpolation-punctuation: #29a6ff !important;
  --d2l-code-token-function: #fff9d6 !important;
  --d2l-code-token-class-name: #2ccfb0 !important;
  --d2l-code-token-symbol: #2de2c0 !important;
  --d2l-code-token-builtin: #fd4e9d !important;
  --d2l-code-token-keyword: #e94a92 !important;
  --d2l-code-token-atrule: #fd4e9d !important;
  --d2l-code-token-selector: #fff9d6 !important;
  --d2l-code-token-important: #ff575a !important;
  --d2l-code-token-regex: #29a6ff !important;
  --d2l-code-token-string: #e9ba79 !important;
  --d2l-code-token-char: #e9ba79 !important;
  --d2l-code-token-attribute-value: #e9ba79 !important;
  --d2l-code-token-combinator: #cdd5dc !important;
}

/* ---------- content: d2l-list-item (new-style content/TOC lists).
   Selected rows hard-code #f3fbff; drag image & add-button hard-code white. */
:host([selected]:not([selection-disabled]):not([skeleton])) [slot="outside-control-container"] {
  background-color: var(--cld-selected) !important;
  border-color: var(--cld-accent) !important;
}
:host([_hovering-control]) [slot="outside-control-container"],
:host([_hovering-primary-action]) [slot="outside-control-container"],
:host([_hovering-selection]) [slot="outside-control-container"] {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5) !important;
}
:host(d2l-list-item-drag-image) :is(.first, .second, .third) {
  background-color: var(--cld-bg-2) !important;
  border-color: var(--cld-border) !important;
}
:host(d2l-button-add) button:is(:hover, :focus-visible) d2l-button-add-icon-text {
  background-color: var(--cld-bg-2) !important;
}
`;
