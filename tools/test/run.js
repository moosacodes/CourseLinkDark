const { spawn } = require('child_process');
const chrome = spawn('google-chrome', ['--headless=new','--no-sandbox','--user-data-dir=/tmp/cld-test-profile',
  '--remote-debugging-pipe','--enable-unsafe-extension-debugging','--host-resolver-rules=MAP courselink.uoguelph.ca 127.0.0.1',
  '--ignore-certificate-errors','about:blank'], { stdio: ['ignore','ignore','ignore','pipe','pipe'] });
const out = chrome.stdio[3], inp = chrome.stdio[4];
let id = 0, buf = '', pending = new Map();
inp.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\0')) >= 0) { const m = JSON.parse(buf.slice(0,i)); buf = buf.slice(i+1);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } });
const send = (method, params={}, sessionId) => new Promise(res => { const mid = ++id; pending.set(mid, res);
  out.write(JSON.stringify({ id: mid, method, params, sessionId }) + '\0'); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  try {
    const l = await send('Extensions.loadUnpacked', { path: require('path').resolve(__dirname, '../..') });
    console.log('load:', JSON.stringify(l.result || l.error));
    const extId = l.result && l.result.id;
    const t = await send('Target.createTarget', { url: 'https://courselink.uoguelph.ca:8443/test.html' });
    const a = await send('Target.attachToTarget', { targetId: t.result.targetId, flatten: true });
    const s = a.result.sessionId;
    const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true }, s)).result?.result?.value;
    await sleep(5000);
    console.log(await ev("document.getElementById('result').textContent"));
    const p = await send('Target.createTarget', { url: `chrome-extension://${extId}/popup/popup.html` });
    const pa = await send('Target.attachToTarget', { targetId: p.result.targetId, flatten: true });
    const ps = pa.result.sessionId;
    const pev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true }, ps)).result?.result?.value;
    await sleep(800);
    const state = "JSON.stringify({cls:document.documentElement.className, body:getComputedStyle(document.body).backgroundColor, box:getComputedStyle(document.querySelector('x-lit').shadowRoot.querySelector('.box')).backgroundColor, inp:getComputedStyle(document.querySelector('x-lit').shadowRoot.querySelector('.i')).backgroundColor, mirror:localStorage.getItem('__cld_enabled')})";
    console.log('popup initial:', await pev("JSON.stringify({checked:document.getElementById('toggle').checked,status:document.getElementById('status').textContent})"));
    await pev("document.getElementById('toggle').click()");
    await sleep(400);
    console.log('after OFF:', await ev(state));
    await pev("document.getElementById('toggle').click()");
    await sleep(400);
    console.log('after ON :', await ev(state));
  } catch (e) { console.error(e); }
  chrome.kill(); process.exit(0);
})();
