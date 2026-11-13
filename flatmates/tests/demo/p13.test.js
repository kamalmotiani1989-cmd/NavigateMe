// Less on screen (demo mode, port 8765), 390 wide: long explanations show their first lines and a "More" link that
// opens the rest; the full text stays in the page; short sentences aren't folded; Tribe's rules start folded.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:0, clean:0, food:2, cook:0, smoke:2, drinks:2, guests:2, noise:2, social:2, sharing:0, work:0, pets:2, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true };
const audit = () => {
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number); const lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const bgOf = el => { for(let e = el; e; e = e.parentElement){ const cs = getComputedStyle(e); if(cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null; const c = rgb(cs.backgroundColor); if(c.length >= 3 && (c[3] === undefined || c[3] > .5)) return c; } return [255, 255, 255]; };
  const root = document.querySelector('dialog[open]') || document.body, out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while((n = walker.nextNode())){ const t = n.textContent.trim(); if(t.length < 2) continue; const el = n.parentElement; if(!el || !el.offsetParent) continue;
    const r = el.getBoundingClientRect(); if(!r.width || r.bottom < 0) continue; const cs = getComputedStyle(el); if(+cs.opacity < .2 || el.closest('[aria-hidden="true"], .city, svg')) continue;
    const fg = rgb(cs.color), bg = bgOf(el); if(!bg) continue; const a = fg[3] === undefined ? 1 : fg[3]; const mix = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    const L1 = lum(mix), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); const big = parseFloat(cs.fontSize) >= 18.5 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700);
    if(ratio < (big ? 3 : 4.5)) out.push(`${ratio.toFixed(2)} ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${t.slice(0, 40)}"`); }
  return [...new Set(out)];
};
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
  // a home's page always opens at the top: scroll down one home, go back, open another
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const sc = await p.evaluate(async () => { const ids = api.all().filter(l => l.city === 'Bengaluru').slice(0, 2).map(l => l.id), d = $('dlgListing');
    await openListing(ids[0]); await new Promise(r => setTimeout(r, 600)); d.scrollTop = 900; const down = d.scrollTop;
    d.close(); await openListing(ids[1]); await new Promise(r => setTimeout(r, 600)); const next = d.scrollTop;
    d.scrollTop = 500; await openListing(ids[1]); const same = d.scrollTop; return { down, next, same }; });
  ok(sc.down > 300 && sc.next === 0 && sc.same > 300, 'a home\'s page: another home opens at the top; the same home redrawn keeps its place: ' + JSON.stringify(sc));
  // Tribe: take back a yes they haven't answered
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1200);
  const tid = await p.evaluate(async () => { await api.tribeRefresh(); const t = state.tribe.find(x => x.status === 'open' && !x.their_yes); t.my_yes = true; t.yesAt = Date.now(); save(); return t.id; });
  await p.goto('http://localhost:8765/#tribe'); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const tw0 = await p.evaluate(id => { const b = document.querySelector(`[data-tw="${id}"]`); if(!b) return null; b.scrollIntoView({ block: 'center' });
    const card = b.closest('article'); return { pill: card.querySelector('.req-pill').textContent, btn: b.textContent }; }, tid);
  await p.click(`[data-tw="${tid}"]`); await p.waitForTimeout(1200);
  const tw1 = await p.evaluate(id => { const t = state.tribe.find(x => x.id === id); const b = document.querySelector(`[data-ty="${id}"]`);
    return { mine: t.my_yes, status: t.status, again: b && b.textContent, toast: (document.querySelector('.toast') || {}).textContent || '' }; }, tid);
  ok(tw0 && /You said yes · waiting for/.test(tw0.pill) && tw0.btn === 'Take back' && tw1.mine == null && tw1.status === 'open' && /^Team up with/.test(tw1.again || '') && /won't see a request from you/.test(tw1.toast),
    'Tribe: Take back next to a yes they haven\'t answered; it goes back to "Team up": ' + JSON.stringify({ tw0, tw1 }));
  // every text readable on its background (pastel panels used to keep white text from the navy days)
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1200);
  await p.evaluate(async () => { await api.tribeRefresh(); const t = (state.tribe || [])[0]; if(t){ Object.assign(t, { my_yes: true, their_yes: true, status: 'bonded', bonded_at: new Date().toISOString(), phone: '9800000001' }); save(); } });
  const low = [];
  for(const h of ['#discover', '#tribe', '#splits', '#market', '#account', '#plans', '#requests']){ await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1400);
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.querySelectorAll('.pk-more').forEach(b => b.click()); });
    low.push(...(await p.evaluate(audit)).map(x => h + ' ' + x)); }
  ok(!low.length && await p.evaluate(() => [...document.querySelectorAll('.bond-avs .av:not(.fm-avh)')].every(e => getComputedStyle(e).color === 'rgb(255, 255, 255)') && !!document.querySelector('.bond-avs .av')),
    'contrast: all text reads at 4.5:1 (3:1 for big text), including a tribe card\'s WhatsApp and Leave tribe: ' + low.slice(0, 5).join(' | '));
  // the Vibe Card (a picture, drawn on a canvas): every text colour on every background it sits on
  const vc = await p.evaluate(() => { const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const lum = c => { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
    const ratio = (f, b) => { const L1 = lum(hex(f)), L2 = lum(hex(b)); return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); };
    const P = VC_PALETTE, low = [];
    for(const bg of Object.values(P.bg).concat(P.panel)) for(const fg of [P.ink, P.ink2]){ const r = ratio(fg, bg); if(r < 4.5) low.push(`${fg} on ${bg}: ${r.toFixed(2)}`); }
    for(const bg of P.tints){ const r = ratio(P.ink, bg); if(r < 4.5) low.push(`${P.ink} on ${bg}: ${r.toFixed(2)}`); }
    return low; });
  ok(!vc.length, 'contrast: the Vibe Card\'s text reads at 4.5:1 on its pastel panel, the white panel and every chip: ' + vc.join(' | '));
  // sign-up: tiles show titles; the picked one's explanation shows under them; screen readers still get all three
  const v = await b.newPage({ viewport:{ width:390, height:844 } }); await v.goto('http://localhost:8765/'); await v.waitForTimeout(1200);
  const s0 = await v.evaluate(() => ({ hint: getComputedStyle($('roleHint'), '::before').content, descs: [...document.querySelectorAll('#loginForm .role > span:last-of-type > span')].map(d => d.getBoundingClientRect().width <= 1 && d.textContent.length > 20) }));
  await v.click('#loginForm input[value=owner]', { force: true });
  const s1 = await v.evaluate(() => ({ hint: $('roleHint').textContent, phone: Math.round($('lgPhone').getBoundingClientRect().bottom), tagline: getComputedStyle(document.querySelector('.tagline')).display }));
  ok(!(await v.evaluate(audit)).length, 'contrast: the welcome page reads everywhere');
  ok(s0.descs.every(Boolean) && /Pick one/.test(s0.hint) && /spare room/.test(s1.hint) && s1.tagline === 'none' && s1.phone < 844,
    'sign-up: titles only on the tiles, the picked one explained underneath, the number box on the first screen: ' + JSON.stringify({ s0, s1 }));
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
