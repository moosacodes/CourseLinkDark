/*
 * CourseLink Dark — shadow-css.js  (isolated world, loaded before content.js)
 *
 * The stylesheet adopted into EVERY open shadow root (via a single shared
 * constructable CSSStyleSheet, see content.js). It is enabled/disabled as a
 * whole (sheet.disabled), so no `html.cld-on` gating is needed in here.
 *
 * Most D2L components already follow the palette because --d2l-color-* and
 * --cld-* custom properties (set on :root in dark.css) inherit into shadow
 * trees. This sheet covers what variables cannot: hard-coded whites inside
 * components, native form controls rendered in shadow DOM, and a few
 * components that use a dark gray (ferrite) as a BACKGROUND with white text,
 * which the gray re-mapping would otherwise turn light-on-light.
 *
 * Sections mirror dark.css: generic > forms > tables > modals/dropdowns >
 * per-component fixes. Selectors marked VERIFY need checking on the live site.
 *
 * Note: adopted sheets come after a shadow root's own styles, so on equal
 * specificity these rules win. Use !important only where component rules are
 * more specific or set via :host.
 */
globalThis.CLD_SHADOW_CSS = String.raw`
/* ---------- Generic ---------------------------------------------------- */
:host { color-scheme: dark; }

/* Flags set by content.js's computed-colour scanner (same as dark.css §2). */
[data-cld-bg="1"] { background-color: var(--cld-bg-1) !important; }
[data-cld-bg="2"] { background-color: var(--cld-bg-2) !important; }
[data-cld-fg]     { color: var(--cld-text) !important; }
a[data-cld-fg]    { color: var(--cld-link) !important; }
[data-cld-bd]     { border-color: var(--cld-border) !important; }

:focus-visible { outline-color: var(--cld-focus); }
::selection { background-color: #2f5f96; color: #ffffff; }

/* Media guard: never recolour real media inside components either. */
img, video, canvas, picture, embed, object, iframe { filter: none !important; }

/* ---------- Forms ------------------------------------------------------ */
input:not([type="checkbox"], [type="radio"], [type="range"], [type="color"],
          [type="file"], [type="image"], [type="submit"], [type="button"],
          [type="reset"], [type="hidden"]),
textarea,
select,
.d2l-input {
  background-color: var(--cld-bg-input) !important;
  color: var(--cld-text) !important;
  border-color: var(--cld-border-strong) !important;
}
input:hover:not(:disabled), textarea:hover:not(:disabled), select:hover:not(:disabled),
.d2l-input:hover:not(:disabled) {
  border-color: #6b737c !important;
}
input:focus, textarea:focus, select:focus, .d2l-input:focus {
  border-color: var(--cld-focus) !important;
}
input:disabled, textarea:disabled, select:disabled, .d2l-input:disabled {
  background-color: var(--cld-bg-2) !important;
  color: var(--cld-text-faint) !important;
}
::placeholder { color: var(--cld-text-faint) !important; opacity: 1; }
select option, select optgroup { background-color: var(--cld-bg-2); color: var(--cld-text); }
input[type="checkbox"], input[type="radio"], input[type="range"], progress {
  accent-color: var(--cld-accent);
}

/* ---------- Tables ----------------------------------------------------- */
th, td { border-color: var(--cld-border); }

/* ---------- Modals / dropdowns / menus (VERIFY class names) ------------ */
:host(d2l-dropdown-content), :host(d2l-dropdown-menu), :host(d2l-dropdown-tabs) {
  --d2l-dropdown-background-color: var(--cld-bg-2);
  --d2l-dropdown-border-color: var(--cld-border);
}
.d2l-dropdown-content-width,
.d2l-dropdown-content-container,
.d2l-dropdown-content-pointer > div,
.d2l-dropdown-content-top,
.d2l-dropdown-content-bottom {
  background-color: var(--cld-bg-2) !important;
  border-color: var(--cld-border) !important;
  color: var(--cld-text);
}
.d2l-dialog-outer, .d2l-dialog-inner, .d2l-dialog-header, .d2l-dialog-footer, dialog {
  background-color: var(--cld-bg-2) !important;
  color: var(--cld-text) !important;
  border-color: var(--cld-border) !important;
}
dialog::backdrop { background-color: rgba(0, 0, 0, 0.7); }
:host(d2l-menu-item) [role="menuitem"]:hover,
:host(d2l-menu-item:hover), :host(d2l-menu-item-link:hover) {
  background-color: var(--cld-hover);
}

/* ---------- Buttons ---------------------------------------------------- */
/* celestine is lightened for link readability; primary buttons need a
   deeper blue so white label text keeps contrast. (d2l-button, VERIFY) */
:host([primary]) .d2l-button,
:host([primary]) button {
  background-color: var(--cld-accent) !important;
  border-color: var(--cld-accent) !important;
  color: var(--cld-on-accent) !important;
}
:host([primary]) .d2l-button:hover:not(:disabled),
:host([primary]) .d2l-button:focus:not(:disabled),
:host([primary]) button:hover:not(:disabled) {
  background-color: var(--cld-accent-hover) !important;
}

/* ---------- Components whose BACKGROUND is ferrite (dark gray) --------- */
/* ferrite is re-mapped to light text colour, so give these a dark bg back. */
:host(d2l-tooltip) {
  --d2l-tooltip-background-color: #2f353c !important;
  --d2l-tooltip-border-color: var(--cld-border-strong) !important;
  --d2l-tooltip-outline-color: rgba(0, 0, 0, 0.4) !important;
}
:host(d2l-tooltip) .d2l-tooltip-content,
:host(d2l-tooltip) .d2l-tooltip-pointer > div {
  color: var(--cld-text) !important;
}
:host(d2l-alert-toast) .d2l-alert-toast-container,
:host(d2l-alert-toast) d2l-alert {
  background-color: #2f353c !important;
  color: var(--cld-text) !important;
  border-color: var(--cld-border-strong) !important;
}

/* ---------- Cards / tiles ---------------------------------------------- */
:host(d2l-card) {
  background-color: var(--cld-bg-1) !important;
  border-color: var(--cld-border) !important;
}
/* ---------- Logo & Web Tools icons (GLOBAL, verified 2026-09-28) ------- */
/* No filters. Logo chain: d2l-labs-navigation-link-image.d2l-navigation-s-logo
   > #shadow > a > span > img. Web Tools: div.d2l-widget.d2l-custom-widget >
   d2l-html-block > #shadow > img (4 PNGs, matched by exact URL).
   - Logo is two-colour (black "Course" + teal "Link"), so a mask can't keep
     the teal: we swap in a pre-recoloured copy of the same artwork.
   - Office 365 icon is black disc + white glyph (a mask would fill the disc
     solid), so it also gets a pre-recoloured copy.
   - The 3 glyphicons are monochrome: the image is blanked (same intrinsic
     size) and repainted with a palette colour through a CSS mask. */
img[src*="/theme/viewimage/20585313/"] { content: url("data:image/png;base64,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"); }
img[src$="/shared/widgets/icons/office365_icon.png"] { content: url("data:image/png;base64,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"); }
img[src$="/shared/widgets/icons/glyphicons-46-calendar.png"] {
  content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='23' height='24'/%3E");
  background-color: var(--cld-text-muted);
  -webkit-mask: url("https://courselink.uoguelph.ca/shared/widgets/icons/glyphicons-46-calendar.png") center / contain no-repeat;
  mask: url("https://courselink.uoguelph.ca/shared/widgets/icons/glyphicons-46-calendar.png") center / contain no-repeat;
}
img[src$="/shared/widgets/icons/glyphicons-72-book.png"] {
  content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='24'/%3E");
  background-color: var(--cld-text-muted);
  -webkit-mask: url("https://courselink.uoguelph.ca/shared/widgets/icons/glyphicons-72-book.png") center / contain no-repeat;
  mask: url("https://courselink.uoguelph.ca/shared/widgets/icons/glyphicons-72-book.png") center / contain no-repeat;
}
img[src$="/shared/widgets/icons/glyphicons-151-edit.png"] {
  content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='21'/%3E");
  background-color: var(--cld-text-muted);
  -webkit-mask: url("https://courselink.uoguelph.ca/shared/widgets/icons/glyphicons-151-edit.png") center / contain no-repeat;
  mask: url("https://courselink.uoguelph.ca/shared/widgets/icons/glyphicons-151-edit.png") center / contain no-repeat;
}

/* ---------- D2L monochrome UI glyphs (tier1/2/3 SVGs) ------------------ */
/* content.js tags ONLY elements whose icon URL is a D2L /tier1|2|3/ SVG
   (never course images / instructor content) and sets --cld-mask-url.
   data-cld-mask="before": span.d2l-icon-custom-style ::before content:url()
   data-cld-mask="img":    <img src=".../tierN/x.svg">
   data-cld-mask="bg":     text-less element painting the SVG as background */
[data-cld-mask="before"]::before {
  content: "" !important;
  display: inline-block;
  width: var(--cld-mask-size, 18px);
  height: var(--cld-mask-size, 18px);
  background: var(--cld-text-muted) !important;
  -webkit-mask: var(--cld-mask-url) center / contain no-repeat;
  mask: var(--cld-mask-url) center / contain no-repeat;
}
img[data-cld-mask="img"] {
  content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E");
  width: var(--cld-mask-w, 18px); height: var(--cld-mask-h, 18px);
  background-color: var(--cld-text-muted);
  -webkit-mask: var(--cld-mask-url) center / contain no-repeat;
  mask: var(--cld-mask-url) center / contain no-repeat;
}
[data-cld-mask="bg"] {
  background-image: none !important;
  background-color: var(--cld-text-muted) !important;
  -webkit-mask: var(--cld-mask-url) var(--cld-mask-pos, center) / var(--cld-mask-bsize, contain) no-repeat;
  mask: var(--cld-mask-url) var(--cld-mask-pos, center) / var(--cld-mask-bsize, contain) no-repeat;
}
/* Nav bar links that end up inside navigation shadow roots (overflow menu). */
a.d2l-navigation-s-link, .d2l-navigation-s-item a { color: var(--cld-text) !important; }
a.d2l-navigation-s-link:hover, .d2l-navigation-s-item a:hover { color: var(--cld-link-hover) !important; }
/* ---------- Hard-coded light bits inside components (verified) --------- */
/* d2l-breadcrumbs: :host::after is a 10px overflow fade to rgb(251,252,252)
   at the inline end; on dark it shows as a thin white bar (e.g. next to
   Settings on discussion thread pages). Fade to the page background instead. */
:host(d2l-breadcrumbs)::after {
  background: linear-gradient(to var(--d2l-inline-end, right), rgba(18, 20, 23, 0), var(--cld-bg-0)) !important;
}
/* d2l-status-indicator bold/none: background is tungsten (re-mapped light)
   with white text. Give it a mid-dark gray so white text keeps contrast. */
:host(d2l-status-indicator[bold][state="none"]),
:host(d2l-status-indicator[bold][state="null"]) {
  background-color: #4f565e !important;
  border-color: #4f565e !important;
  color: #ffffff !important;
}
:host(d2l-status-indicator[state="none"]:not([bold])),
:host(d2l-status-indicator[state="null"]:not([bold])) {
  border-color: var(--cld-border-strong) !important;
  color: var(--cld-text-muted) !important;
}
/* Nav band custom scrollbar thumb uses galena (re-mapped light-ish). */
.d2l-labs-navigation-scroll[data-custom-scroll]::-webkit-scrollbar-thumb {
  background-color: #4a515a !important;
  border-color: var(--cld-bg-1) !important;
}
[data-cld-bg="3"] { background-color: #4f565e !important; }
/* Classic d2l-table rendered inside component shadow roots (Discussions
   List): page CSS has .d2l-table > tbody > tr > td { background:#ffffff }. */
table.d2l-table > tbody > tr > td { background-color: transparent; }
`;
