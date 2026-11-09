// Less on screen (demo mode, port 8765), 390 wide: long explanations show their first lines and a "More" link that
// opens the rest; the full text stays in the page; short sentences aren't folded; Tribe's rules start folded.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:0, clean:0, food:2, cook:0, smoke:2, drinks:2, guests:2, noise:2, social:2, sharing:0, work:0, pets:2, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  for(const [h, sel] of [['#splits', '.fs-hero p:not(.eyebrow)'], ['#market', '.mk-hero p:not(.eyebrow)'], ['#plans', '.plans-hero > p:not(.eyebrow)'], ['#tribe', '.tribe-hero .lede']]){
    await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    const r = await p.evaluate(sel => { const el = document.querySelector(sel); const more = el && el.nextElementSibling;
      return { packed: el && el.classList.contains('pk'), lines: el && Math.round(el.clientHeight / parseFloat(getComputedStyle(el).lineHeight)), more: more && more.classList.contains('pk-more') && more.textContent,
        full: el && el.textContent.trim().length, h: el && el.clientHeight }; }, sel);
    ok(r.packed && r.lines <= 2 && r.more === 'More' && r.full > 100, `${h}: the panel text shows 2 lines and a More link; the full text is still there: ` + JSON.stringify(r));
    await p.click(sel + ' + .pk-more'); await p.waitForTimeout(200);
    const o = await p.evaluate(sel => { const el = document.querySelector(sel); return { open: el.classList.contains('open'), h: el.clientHeight, label: el.nextElementSibling.textContent, exp: el.nextElementSibling.getAttribute('aria-expanded') }; }, sel);
    ok(o.open && o.h > r.h && o.label === 'Less' && o.exp === 'true', `${h}: More opens the rest in place: ` + JSON.stringify(o));
  }
  await p.screenshot({ path: O + '/p13-tribe.png' });
  ok(await p.evaluate(() => !document.querySelector('.tribe-rules').open), 'Tribe: "How your tribe finds a home" starts folded');
  await p.goto('http://localhost:8765/#account'); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const short = await p.evaluate(() => [...document.querySelectorAll('#view-account p.sub')].filter(e => e.offsetParent).map(e => ({ len: e.textContent.trim().length, packed: e.classList.contains('pk') })));
  ok(short.every(x => x.len >= 100 || !x.packed) && short.some(x => x.len < 100), 'Account: short sentences are never folded: ' + JSON.stringify(short));
  // sign-up: tiles show titles; the picked one's explanation shows under them; screen readers still get all three
  const v = await b.newPage({ viewport:{ width:390, height:844 } }); await v.goto('http://localhost:8765/'); await v.waitForTimeout(1200);
  const s0 = await v.evaluate(() => ({ hint: getComputedStyle($('roleHint'), '::before').content, descs: [...document.querySelectorAll('#loginForm .role > span:last-of-type > span')].map(d => d.getBoundingClientRect().width <= 1 && d.textContent.length > 20) }));
  await v.click('#loginForm input[value=owner]', { force: true });
  const s1 = await v.evaluate(() => ({ hint: $('roleHint').textContent, phone: Math.round($('lgPhone').getBoundingClientRect().bottom), tagline: getComputedStyle(document.querySelector('.tagline')).display }));
  ok(s0.descs.every(Boolean) && /Pick one/.test(s0.hint) && /spare room/.test(s1.hint) && s1.tagline === 'none' && s1.phone < 844,
    'sign-up: titles only on the tiles, the picked one explained underneath, the number box on the first screen: ' + JSON.stringify({ s0, s1 }));
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
