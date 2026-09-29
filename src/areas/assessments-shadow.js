/* CourseLink Dark — shadow-root rules for area: assessments. Appended to the sheet adopted into every open shadow root (no html.cld-on gating needed). */
globalThis.CLD_SHADOW_CSS = (globalThis.CLD_SHADOW_CSS || "") + `
/* Quiz summary / Dropbox sticky action band. Verified: d2l-floating-buttons shadow root,
   div.d2l-floating-buttons-container computed rgba(255,255,255,0.88) on quiz_summary.d2l. */
.d2l-floating-buttons-container {
  background-color: rgba(26, 29, 33, 0.94) !important; /* --cld-bg-1 @ 94% */
  border-top-color: var(--cld-border, #353b42) !important;
  box-shadow: 0 -4px 12px var(--cld-shadow, rgba(0,0,0,0.6)) !important;
}
`;
