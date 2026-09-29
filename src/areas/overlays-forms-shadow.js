/* CourseLink Dark — shadow-root rules for area: overlays-forms. Appended to the sheet adopted into every open shadow root (no html.cld-on gating needed). */
globalThis.CLD_SHADOW_CSS = (globalThis.CLD_SHADOW_CSS || "") + `
/* d2l-empty-state-simple (e.g. "No items found." in minibar flyouts) */
.empty-state-container {
  background-color: var(--cld-bg-1) !important;
  border-color: var(--cld-border) !important;
}
.empty-state-container .d2l-empty-state-description {
  color: var(--cld-text-muted) !important;
}
/* Same datalist fade fix in case the flyout list is rendered inside a shadow root */
div.d2l-datalist-container.d2l-datalist-style {
  background-image: none !important;
  background-color: var(--cld-bg-1) !important;
  color: var(--cld-text) !important;
}
`;
