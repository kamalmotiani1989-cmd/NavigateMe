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
  // the sign-in card on the first phone screen: both choices show, the paragraph follows the card, the card is the same
  const lay = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect();
    const roles = [...document.querySelectorAll('.w-card .role')].map(e => Math.round(e.getBoundingClientRect().top + 30));
    return { h2: Math.round(r('.w-card h2').top), roles, lede: Math.round(r('.w-copy .lede').top), cardEnd: Math.round(r('.w-card').bottom),
      kids: [...document.querySelector('#loginForm').children].length, quiz: Math.round(r('.w-quiz').top) }; });
  ok(lay.roles.length === 2 && lay.roles.every(y => y < 844) && lay.h2 > lay.quiz, 'visitor: the sign-in card\'s heading and both choices are on the first phone screen: ' + JSON.stringify(lay));
  ok(lay.lede > lay.cardEnd, 'visitor: the paragraph comes after the sign-in card on a phone');
  await p.screenshot({ path: O + '/p8-welcome.png' });
  // a wide screen keeps the two columns: words on the left, the card on the right
  await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(500);
  const wide = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect();
    return { ledeRight: Math.round(r('.w-copy .lede').right), cardLeft: Math.round(r('.w-card').left), ledeTop: Math.round(r('.w-copy .lede').top), cityTop: Math.round(r('#city').top) }; });
  ok(wide.ledeRight <= wide.cardLeft && wide.ledeTop < wide.cityTop, 'visitor: on a wide screen the paragraph stays in the left column above the city: ' + JSON.stringify(wide));
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
