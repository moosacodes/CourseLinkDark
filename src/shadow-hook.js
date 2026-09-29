/*
 * CourseLink Dark — shadow-hook.js  (runs in the page's MAIN world)
 *
 * Why this file exists:
 *   Content scripts normally run in an "isolated world", which has its own copy
 *   of Element.prototype. Patching attachShadow there would never see shadow
 *   roots created by the page's own Lit/D2L custom elements. So this tiny script
 *   runs in the MAIN world (manifest "world": "MAIN") at document_start, wraps
 *   Element.prototype.attachShadow, and announces each new shadow root with a DOM
 *   event. DOM events are shared between worlds, so the isolated content script
 *   (content.js) hears them and adopts the dark stylesheet into the new root.
 *
 *   This script has NO access to chrome.* APIs, applies no styles itself and
 *   stores nothing. It only emits events.
 */
(() => {
  'use strict';
  if (window.__cldShadowHookInstalled) return;
  Object.defineProperty(window, '__cldShadowHookInstalled', { value: true });

  const EVT_ATTACHED = 'cld-shadow-attached'; // dispatched on the host element
  const EVT_RESCAN = 'cld-shadow-rescan';     // dispatched on document (fallback)

  const native = Element.prototype.attachShadow;
  if (typeof native !== 'function') return;

  let rescanQueued = false;
  const queueRescan = () => {
    if (rescanQueued) return;
    rescanQueued = true;
    setTimeout(() => {
      rescanQueued = false;
      document.dispatchEvent(new CustomEvent(EVT_RESCAN));
    }, 50);
  };

  function attachShadow(init) {
    const root = native.call(this, init);
    // Only open roots can be styled from outside; closed roots are left alone.
    if (init && init.mode === 'open') {
      try {
        if (this.isConnected) {
          // composed:true lets the event cross shadow boundaries so a document
          // listener still hears it when the host is itself inside a shadow root.
          // The listener uses event.composedPath()[0] to recover the host.
          this.dispatchEvent(new CustomEvent(EVT_ATTACHED, { bubbles: true, composed: true }));
        } else {
          // Host not in the document yet (e.g. created via createElement and
          // appended later). The content script's MutationObserver will usually
          // catch it on insertion; the rescan is a cheap safety net.
          queueRescan();
        }
      } catch (_) { /* never break the page */ }
    }
    return root;
  }

  // Keep the patched function looking native-ish to page code.
  Object.defineProperty(attachShadow, 'name', { value: 'attachShadow' });
  Element.prototype.attachShadow = attachShadow;
})();
