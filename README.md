# CourseLink Dark

A dark theme for University of Guelph **CourseLink** (D2L Brightspace, `https://courselink.uoguelph.ca/*`),
packaged as a standalone Chromium **Manifest V3** extension. It uses real CSS colour overrides
(palette variables, targeted rules, and shadow-DOM stylesheets), **never `filter: invert()`**.

> Status: ready to load unpacked in Opera GX and Brave. Checked on a signed-in CourseLink
> session across the homepage, course home, Content, Grades, Dropbox, Quizzes, Discussions,
> Calendar, and the course menu.

## Install (Load unpacked)

You need the `CourseLinkDark` folder (the one containing `manifest.json`) on your computer.

### Opera GX
1. Go to `opera://extensions`.
2. Turn on **Developer mode** (toggle, top right).
3. Click **Load unpacked** and select the `CourseLinkDark` folder.
4. (Optional) Pin it: click the cube/extensions icon in the toolbar and pin **CourseLink Dark**.
5. Opera GX: if you use GX's own "Force Dark Pages" (GX Control / Easy Setup), turn it off for
   CourseLink. It applies an inversion filter that stacks with this theme.

### Brave
1. Go to `brave://extensions`.
2. Turn on **Developer mode** (toggle, top right).
3. Click **Load unpacked** and select the `CourseLinkDark` folder.
4. (Optional) Pin it from the puzzle-piece extensions menu.
5. If `brave://flags/#enable-force-dark` is enabled, disable it so it doesn't fight this theme.

After you edit any file, click the extension's **reload** icon on the extensions page, then refresh CourseLink.

## Use
Click the toolbar icon to open a popup with a single **Dark mode** switch (default **on**). The
setting is saved in `chrome.storage.local` and applies instantly to every open CourseLink tab and frame.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest. Only permission is `storage`. The only host is `https://courselink.uoguelph.ca/*`. Scripts run at `document_start` in all frames, including `about:blank` frames. |
| `src/shadow-hook.js` | MAIN-world script that wraps `Element.prototype.attachShadow` and fires an event for each new open shadow root. It has no chrome.* access and applies no styles. |
| `src/shadow-css.js` | Text of the stylesheet that gets adopted into every open shadow root. Edit this to style d2l-* component internals. |
| `src/content.js` | Isolated-world controller. Handles on/off state, the early `<style>`, shadow-root discovery and adoption, the MutationObserver, and the computed-colour scanner. |
| `src/dark.css` | Light-DOM theme injected by the manifest. Holds the palette and D2L variable overrides, organised into numbered sections by area. |
| `popup/popup.html/.css/.js` | Toolbar popup with one on/off switch. |
| `icons/icon{16,48,128}.png` | Toolbar and store icons. |
| `tools/make_icons.py` | Regenerates the icons using only the Python standard library. |
| `tools/test/` | Optional headless-Chrome sanity test with a mock D2L page. Not loaded by the extension. |

## How it works

1. **Gating class.** `content.js` adds `cld-on` to `<html>`. Every rule in `dark.css` starts with
   `html.cld-on`, and the shadow sheet is switched with `sheet.disabled`, so toggling needs no reload.
   A `localStorage` mirror (`__cld_enabled`) lets the script pick the right state synchronously at
   `document_start`. `chrome.storage.local` is still the source of truth.
2. **No white flash.** The manifest CSS and an early injected `<style>` both paint `html`/`body`
   `#121417` before CourseLink's own CSS loads.
3. **Palette through variables.** `:root.cld-on` overrides the Brightspace `--d2l-color-*` primitives
   and the newer `--d2l-theme-*` semantic variables with `!important`. Custom properties inherit into
   shadow trees, so most Lit `d2l-*` components re-theme with no further work.
4. **Shadow DOM injection.** One constructable `CSSStyleSheet` is shared by every open shadow root
   through `adoptedStyleSheets`. Roots are found in four ways:
   - events from the MAIN-world `attachShadow` hook
   - a MutationObserver on the document and on each shadow root already processed
   - full walks at startup, `DOMContentLoaded`, and `load`
   - rescans when a host is created while detached from the document

   Adoption waits for a microtask, plus a re-check on the next frame, because Lit assigns its own
   `adoptedStyleSheets` right after `attachShadow`. Our sheet is always kept last so it wins ties.
   A `WeakSet` tracks processed roots, and mutation work is batched with a 40 ms debounce.
5. **Computed-colour scanner.** Elements whose computed colours are hard-coded get a
   `data-cld-bg` / `data-cld-fg` / `data-cld-bd` flag, which the CSS then restyles. The scanner flags
   three cases: near-white or light-grey backgrounds, near-black text, and light-grey borders. It runs
   in idle-time chunks and skips media, iframes, SVG, background images, and saturated (intentional)
   colours. Set `SCAN_COLORS = false` in `content.js` to turn it off.

## Extending
- Add page-specific rules in the matching section of `src/dark.css`. Always prefix them with
  `html.cld-on` and use the `--cld-*` variables.
- Rules for component internals go in `src/shadow-css.js`, scoped with `:host(d2l-foo)`.
- Don't use `filter: invert()`, and don't style `img`, `video`, `canvas`, `embed`, `object`, or `iframe`.

## Known limitations
- Per-page selectors are unverified guesses based on D2L class names. Expect to tune each tool
  (Content, Dropbox, Grades, Quizzes, Discussions, Calendar) against the real DOM.
- Closed shadow roots can't be styled from outside. They still pick up the inherited palette variables.
- External-origin iframes (YouTube, LTI tools, publisher content, Office/PDF viewers) are untouched
  by design. Same-origin CourseLink frames and `about:blank` frames (for example rich-text editors)
  are themed.
- Content written by instructors can hard-code colours. Near-black text and white backgrounds are
  neutralised, but coloured text that was meant for a white page may have lower contrast.
- Hover and selected states that only exist in page CSS as hard-coded light colours may still flash
  light. The scanner only sees resting styles.
- Transparent PNG/SVG images with dark artwork (some logos and diagrams) can be hard to see on a
  dark background. Images are never recoloured.
- If you turn the theme off, the first load in a new frame may briefly show the dark background
  before storage is read, but only if the site's `localStorage` is unavailable.
- Requires Chromium 111+ (`"world": "MAIN"` content scripts). Current Opera GX and Brave meet this.
