/*
 * CourseLink Dark — content.js  (isolated world, document_start, all frames)
 *
 * Responsibilities
 *   1. On/off state: adds/removes `cld-on` on <html>. Every rule in dark.css is
 *      gated on that class, so toggling is instant. State lives in
 *      chrome.storage.local ("enabled", default true) and is applied live via
 *      storage.onChanged. A tiny mirror in the page's localStorage lets us pick
 *      the right state synchronously at document_start (no flash for users who
 *      turned the theme off).
 *   2. Early paint: injects a <style> that darkens <html> immediately, before
 *      the page's own CSS arrives (the manifest CSS does the same; belt+braces).
 *   3. Shadow DOM: adopts ONE shared constructable CSSStyleSheet (from
 *      shadow-css.js) into every open shadow root. Roots are discovered by
 *        - the MAIN-world attachShadow hook (shadow-hook.js) events,
 *        - a MutationObserver on the document and on each processed root,
 *        - full walks at startup / DOMContentLoaded / load / rescan requests.
 *      A WeakSet tracks processed roots; work is batched and debounced.
 *   4. Colour scanner: flags elements whose COMPUTED colours are hard-coded
 *      light backgrounds / dark text / light borders with data-cld-* attributes
 *      that dark.css & shadow-css.js restyle. Skips media, iframes, SVG and
 *      saturated (intentional) colours. Runs in idle-time chunks.
 */
(() => {
  'use strict';

  if (window.__cldContentLoaded) return;
  window.__cldContentLoaded = true;

  const CLASS_ON = 'cld-on';
  const STORAGE_KEY = 'enabled';
  const MIRROR_KEY = '__cld_enabled';        // page localStorage mirror ('1'/'0')
  const EVT_ATTACHED = 'cld-shadow-attached'; // from shadow-hook.js
  const EVT_RESCAN = 'cld-shadow-rescan';     // from shadow-hook.js
  // pdf.js viewer frames: huge text-layer DOM, nothing of ours to fix there.
  // (Unverified which URL CourseLink uses; we detect pdf.js by path or DOM.)
  const IS_PDFJS = /pdfjs|pdf\.js|\/web\/viewer\.html/i.test(location.pathname);
  const SCAN_COLORS = !IS_PDFJS;               // set false to disable the scanner
  const CHUNK = 400;                           // elements per scanner slice

  let enabled = true;

  // ---------------------------------------------------------------------
  // 1. State (synchronous best guess first, then authoritative storage)
  // ---------------------------------------------------------------------
  try {
    if (window.localStorage.getItem(MIRROR_KEY) === '0') enabled = false;
  } catch (_) { /* storage may be blocked in sandboxed frames */ }

  const whenRoot = (fn) => {
    if (document.documentElement) { fn(document.documentElement); return; }
    const mo = new MutationObserver(() => {
      if (document.documentElement) { mo.disconnect(); fn(document.documentElement); }
    });
    mo.observe(document, { childList: true });
  };

  // ---------------------------------------------------------------------
  // 2. Early <style> — paints html dark before any page CSS loads.
  // ---------------------------------------------------------------------
  whenRoot((root) => {
    const early = document.createElement('style');
    early.id = 'cld-early-style';
    early.textContent =
      'html.cld-on{background-color:#121417 !important;color-scheme:dark;}' +
      'html.cld-on body{background-color:#121417 !important;color:#e4e7eb;}';
    (document.head || root).appendChild(early);
  });

  // ---------------------------------------------------------------------
  // 3. Shared shadow stylesheet
  // ---------------------------------------------------------------------
  let sheet = null;
  try {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(globalThis.CLD_SHADOW_CSS || '');
  } catch (e) {
    sheet = null; // very old engine: palette variables still theme components
  }

  const processedRoots = new WeakSet();
  const knownRoots = new Set();   // strong refs are fine: roots die with page
  const pendingRoots = new Set();

  function adopt(root) {
    if (!sheet) return;
    try {
      const list = root.adoptedStyleSheets;
      if (list[list.length - 1] === sheet) return;         // already last
      const rest = list.filter((s) => s !== sheet);
      root.adoptedStyleSheets = [...rest, sheet];            // keep ours last
    } catch (_) { /* ignore */ }
  }

  function processRoot(root, collect) {
    adopt(root);
    if (processedRoots.has(root)) return;
    processedRoots.add(root);
    knownRoots.add(root);
    try { observer.observe(root, OBS_OPTS); } catch (_) {}
    walk(root, collect);
  }

  // Defer adoption to a microtask: Lit assigns root.adoptedStyleSheets right
  // after attachShadow(), which would drop a sheet we added synchronously.
  let rootFlushQueued = false;
  function queueRoot(root) {
    pendingRoots.add(root);
    if (rootFlushQueued) return;
    rootFlushQueued = true;
    queueMicrotask(() => {
      rootFlushQueued = false;
      const roots = [...pendingRoots];
      pendingRoots.clear();
      const collect = enabled && SCAN_COLORS ? [] : null;
      roots.forEach((r) => processRoot(r, collect));
      if (collect) queueScan(collect);
      // Second pass next frame in case a framework reassigned its sheets.
      requestAnimationFrame(() => roots.forEach(adopt));
    });
  }

  // Walk a subtree (Document, ShadowRoot or Element) for open shadow roots,
  // optionally collecting elements for the colour scanner.
  function walk(start, collect) {
    const first = start.nodeType === 1 ? start : null;
    if (first) visit(first, collect);
    const tw = document.createTreeWalker(start, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = tw.nextNode())) visit(el, collect);
  }
  // Elements already colour-scanned. Full rescans (DOMContentLoaded, load,
  // rescan events) only queue NEW elements; attribute changes un-mark an
  // element so it gets re-checked. Keeps repeat scans O(new nodes).
  let scanned = new WeakSet();
  function visit(el, collect) {
    if (collect && !scanned.has(el)) collect.push(el);
    const sr = el.shadowRoot;
    if (!sr) return;
    if (!processedRoots.has(sr)) {
      processRoot(sr, collect);           // first time: observe + walk
    } else {
      adopt(sr);                          // make sure our sheet is still there
      if (collect) walk(sr, collect);     // re-walk only when scanning colours
    }
  }

  // ---------------------------------------------------------------------
  // MutationObserver (document + every processed shadow root)
  // ---------------------------------------------------------------------
  const OBS_OPTS = { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] };
  const pendingNodes = new Set();
  const pendingAttr = new Set();
  let flushTimer = 0;

  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList') {
        for (const n of r.addedNodes) if (n.nodeType === 1) pendingNodes.add(n);
      } else if (r.target.nodeType === 1) {
        pendingAttr.add(r.target);
      }
    }
    scheduleFlush();
  });

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 40);
  }

  function flush() {
    flushTimer = 0;
    const nodes = [...pendingNodes];
    const attrs = [...pendingAttr];
    pendingNodes.clear();
    pendingAttr.clear();
    const collect = enabled && SCAN_COLORS ? [] : null;
    for (const n of nodes) {
      if (n.isConnected) walk(n, collect);
    }
    if (collect) {
      // Attribute changes: re-check the element and its direct children only
      // (cheap; avoids re-walking big subtrees on every class flip).
      for (const el of attrs) {
        if (!el.isConnected) continue;
        scanned.delete(el);
        collect.push(el);
        for (const c of el.children) { scanned.delete(c); collect.push(c); }
      }
      queueScan(collect);
    }
  }

  function fullScan() {
    const collect = enabled && SCAN_COLORS ? [] : null;
    walk(document, collect);
    knownRoots.forEach(adopt);
    if (collect) queueScan(collect);
  }

  let fullScanTimer = 0;
  function scheduleFullScan(delay = 60) {
    clearTimeout(fullScanTimer);
    fullScanTimer = setTimeout(fullScan, delay);
  }

  // Events from the MAIN-world hook. composedPath()[0] is the host even when
  // it lives inside another (open) shadow root.
  document.addEventListener(EVT_ATTACHED, (e) => {
    const host = e.composedPath()[0];
    if (host && host.shadowRoot) queueRoot(host.shadowRoot);
  }, true);
  document.addEventListener(EVT_RESCAN, () => scheduleFullScan(30), true);

  observer.observe(document, OBS_OPTS);
  document.addEventListener('DOMContentLoaded', () => scheduleFullScan(0), { once: true });
  // After load (and once more later) forget what was scanned: component
  // styles that arrive late can turn an already-scanned element white.
  const rescanAll = () => { scanned = new WeakSet(); scheduleFullScan(0); };
  window.addEventListener('load', () => { setTimeout(rescanAll, 100); setTimeout(rescanAll, 2000); }, { once: true });

  // ---------------------------------------------------------------------
  // 4. Colour scanner
  // ---------------------------------------------------------------------
  const SKIP_TAGS = new Set([
    'IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'SOURCE', 'IFRAME', 'FRAME', 'EMBED',
    'OBJECT', 'SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'BR',
    'HEAD', 'TITLE', 'HTML', 'BODY', 'AUDIO', 'TRACK', 'MAP', 'AREA', 'WBR'
  ]);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SELECTED_RE = /selected|active|current|highlight/i;

  const scanQueue = [];
  let scanScheduled = false;
  const idle = window.requestIdleCallback
    ? (fn) => window.requestIdleCallback(fn, { timeout: 200 })
    : (fn) => setTimeout(fn, 16);

  function queueScan(list) {
    if (!list.length) return;
    for (const el of list) scanQueue.push(el);
    if (!scanScheduled) { scanScheduled = true; idle(runScan); }
  }

  function parseRGB(str) {
    // Computed colours are "rgb(r, g, b)" or "rgba(r, g, b, a)".
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(str);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }
  function lum({ r, g, b }) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  const chroma = ({ r, g, b }) => Math.max(r, g, b) - Math.min(r, g, b);

  function runScan() {
    scanScheduled = false;
    if (!enabled) { scanQueue.length = 0; return; }
    const batch = scanQueue.splice(0, CHUNK);

    // Read phase (one style recalc), then write phase.
    const writes = [];
    if (document.querySelector('#viewerContainer .pdfViewer')) { scanQueue.length = 0; return; }
    for (const el of batch) {
      if (scanned.has(el)) continue;
      scanned.add(el);
      if (!el.isConnected) continue;
      if (el.tagName === 'IMG') { checkImgIcon(el, writes); continue; }
      if (SKIP_TAGS.has(el.tagName)) continue;
      if (el.namespaceURI === SVG_NS) continue;
      if (el.closest && el.closest('svg')) continue;
      let cs;
      try { cs = getComputedStyle(el); } catch (_) { continue; }
      checkIcon(el, cs, writes);

      // Background
      if (!el.hasAttribute('data-cld-bg') && cs.backgroundImage === 'none') {
        const bg = parseRGB(cs.backgroundColor);
        if (bg && bg.a > 0.5 && chroma(bg) < 30) {
          const L = lum(bg);
          const selectedish = el.getAttribute('aria-selected') === 'true' ||
            el.hasAttribute('aria-current') || SELECTED_RE.test(typeof el.className === 'string' ? el.className : '');
          if (!selectedish) {
            if (L > 0.85) writes.push([el, 'data-cld-bg', '1']);
            else if (L > 0.6) writes.push([el, 'data-cld-bg', '2']);
            else if (L > 0.25) {
              // Mid/light gray under light text: a D2L dark gray (tungsten,
              // ferrite) used as a background that our palette lightened.
              const fg0 = parseRGB(cs.color);
              if (fg0 && lum(fg0) > 0.6) writes.push([el, 'data-cld-bg', '3']);
            }
          }
        }
      }

      // Text: near-black / dark-grey, low chroma. By the time we see it, the
      // palette and body colour are already light, so anything still dark was
      // hard-coded. Only flag if the element's own background isn't light
      // (i.e. not a deliberate light badge we left alone).
      if (!el.hasAttribute('data-cld-fg')) {
        const fg = parseRGB(cs.color);
        if (fg && fg.a > 0.5 && chroma(fg) < 40 && lum(fg) < 0.2) {
          const ownBg = parseRGB(cs.backgroundColor);
          const ownBgLight = ownBg && ownBg.a > 0.5 && lum(ownBg) > 0.6 && chroma(ownBg) >= 30;
          if (!ownBgLight) writes.push([el, 'data-cld-fg', '']);
        }
      }

      // Borders: light-grey borders look glaring on dark.
      if (!el.hasAttribute('data-cld-bd') && parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) +
          parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) > 0) {
        const bd = parseRGB(cs.borderTopColor) || parseRGB(cs.borderLeftColor);
        if (bd && bd.a > 0.5 && chroma(bd) < 30 && lum(bd) > 0.45) writes.push([el, 'data-cld-bd', '']);
      }
    }
    for (const w of writes) {
      if (typeof w === 'function') w(); else w[0].setAttribute(w[1], w[2]);
    }

    if (scanQueue.length) { scanScheduled = true; idle(runScan); }
  }

  // ---------------------------------------------------------------------
  // 4b. D2L monochrome UI glyphs -> CSS mask (see dark.css "tier1/2/3 SVGs")
  //     Only D2L's own /tier1|2|3/*.svg icon URLs; never course images.
  // ---------------------------------------------------------------------
  const TIER_RE = /url\(["']?([^"')]*\/tier([123])\/[^"')]+\.svg[^"')]*)["']?\)/i;
  const CDN_SVG_RE = /url\(["']?(https:\/\/s\.brightspace\.com\/[^"')]+\.svg[^"')]*)["']?\)/i;
  const TIER_SIZE = { 1: '18px', 2: '24px', 3: '30px' };
  function tagMask(el, kind, url, tier, extra, writes) {
    writes.push(() => {
      el.style.setProperty('--cld-mask-url', 'url("' + url + '")');
      el.style.setProperty('--cld-mask-size', TIER_SIZE[tier]);
      if (extra) for (const k in extra) el.style.setProperty(k, extra[k]);
      el.setAttribute('data-cld-mask', kind);
    });
  }
  function checkIcon(el, cs, writes) {
    if (el.hasAttribute('data-cld-mask')) return;
    // background-image icon on an element with no text of its own
    if (cs.backgroundImage !== 'none') {
      const m = TIER_RE.exec(cs.backgroundImage);
      if (m && !el.textContent.trim()) {
        tagMask(el, 'bg', m[1], m[2], {
          '--cld-mask-pos': cs.backgroundPosition,
          '--cld-mask-bsize': cs.backgroundSize === 'auto' ? TIER_SIZE[m[2]] : cs.backgroundSize,
        }, writes);
        return;
      }
    }
    // ::before content:url(...) icons (e.g. span.d2l-icon-custom*)
    const cls = typeof el.className === 'string' ? el.className : '';
    if (cls.indexOf('icon') === -1) return;
    let b;
    try { b = getComputedStyle(el, '::before').content; } catch (_) { return; }
    if (!b || b === 'none') return;
    const m = TIER_RE.exec(b);
    if (m) { tagMask(el, 'before', m[1], m[2], null, writes); return; }
    // Also D2L's own CDN SVG glyphs in known UI toolbars (e.g. Grades
    // "Add to ePortfolio": .d2l-action-buttons .d2l-icon-custom::before).
    const m2 = CDN_SVG_RE.exec(b);
    if (m2 && el.closest('.d2l-action-buttons')) tagMask(el, 'before', m2[1], 1, null, writes);
  }
  function checkImgIcon(el, writes) {
    if (el.hasAttribute('data-cld-mask')) return;
    const src = el.currentSrc || el.src || '';
    const m = /\/tier([123])\/[^?#]+\.svg/i.exec(src);
    if (!m) return;
    const w = el.width || parseInt(TIER_SIZE[m[1]], 10), h = el.height || w;
    tagMask(el, 'img', src, m[1], { '--cld-mask-w': w + 'px', '--cld-mask-h': h + 'px' }, writes);
  }

  // ---------------------------------------------------------------------
  // Apply / toggle
  // ---------------------------------------------------------------------
  function apply(on) {
    enabled = !!on;
    whenRoot((root) => root.classList.toggle(CLASS_ON, enabled));
    if (sheet) sheet.disabled = !enabled;
    try { window.localStorage.setItem(MIRROR_KEY, enabled ? '1' : '0'); } catch (_) {}
    if (enabled) scheduleFullScan(0);
  }

  apply(enabled); // synchronous best guess at document_start

  try {
    chrome.storage.local.get({ [STORAGE_KEY]: true }, (res) => {
      if (chrome.runtime.lastError) return;
      const on = res[STORAGE_KEY] !== false;
      if (on !== enabled) apply(on);
      else try { window.localStorage.setItem(MIRROR_KEY, on ? '1' : '0'); } catch (_) {}
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && STORAGE_KEY in changes) {
        apply(changes[STORAGE_KEY].newValue !== false);
      }
    });
  } catch (_) {
    // Extension context invalidated (e.g. extension reloaded): keep current state.
  }
})();
