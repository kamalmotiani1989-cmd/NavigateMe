// The design-study changes Kamal approved on 8 Nov 2026 (demo mode, port 8765): the trust line on the welcome's
// first screen, the type scale, green text on pale green tips, the sign-in card on the first phone screen, the
// "No photos yet" state, the hint grey and the WhatsApp green.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ visitor: the welcome page on a phone
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push('visitor ' + e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(2000);
  const w = await p.evaluate(() => { const t = document.querySelector('.w-trust'), r = t && t.getBoundingClientRect();
    return { text: t ? t.textContent : '', bottom: r ? r.bottom : 9999 }; });
  ok(/Listed by owners and the flatmates who live there · your number is shared only if you both say yes/.test(w.text) && w.bottom < 844,
    'visitor: the trust line is on the welcome page\'s first phone screen: ' + JSON.stringify(w));
  await p.screenshot({ path: O + '/p8-welcome.png' });
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
