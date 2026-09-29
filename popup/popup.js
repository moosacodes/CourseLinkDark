// CourseLink Dark — popup: a single on/off toggle persisted in chrome.storage.local.
// Content scripts pick up the change live via chrome.storage.onChanged.
'use strict';
const KEY = 'enabled';
const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

function render(on) {
  toggle.checked = on;
  status.textContent = on ? 'On' : 'Off';
}

chrome.storage.local.get({ [KEY]: true }, (res) => render(res[KEY] !== false));

toggle.addEventListener('change', () => {
  const on = toggle.checked;
  render(on);
  chrome.storage.local.set({ [KEY]: on });
});
