// Ideas from other rental apps (demo mode, port 8765), at 390 wide: one prompt at most on Discover, one-tap
// dealbreaker filters with counts, "Active N days ago" and the 30-day rule, a phone-verified tick (only when the
// server says the number was confirmed by a delivered code; never a sample),
// and the never-pay-before-you-visit warning on a home's page.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:0, clean:0, food:2, cook:0, smoke:2, drinks:2, guests:2, noise:2, social:2, sharing:0, work:0, pets:2, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1800); await closeDlgs(p);
  // 6. one prompt at most, no Flatsplits / FlatMart shortcuts
  const nud = await p.evaluate(() => ({ shown: ['profilePromo', 'passNudgeD', 'vibePromo'].filter(id => $(id).innerHTML.trim()), extras: $('extrasD').innerHTML.trim() }));
  ok(nud.shown.length <= 1 && !nud.extras, 'Discover: at most one prompt, and no Flatsplits/FlatMart shortcuts: ' + JSON.stringify(nud));
  // 2. quick filters with counts
  const q0 = await p.evaluate(() => ({ chips: [...document.querySelectorAll('#quickF [data-quick]')].map(b => b.textContent), total: document.querySelectorAll('#cards .card').length }));
  ok(q0.chips.length === 5 && q0.chips.every(t => /\d+$/.test(t)) && /^For women\d+/.test(q0.chips[0]), 'quick filters: five dealbreakers, each with a count: ' + q0.chips.join(' / '));
  const veg = q0.chips.find(t => /^Veg kitchen/.test(t)), want = +veg.replace(/\D/g, '');
  await p.click('#quickF [data-quick="2"]'); await p.waitForTimeout(1500);
  const q1 = await p.evaluate(() => ({ rules: prefs().rules, active: [...document.querySelectorAll('#activeF button')].map(b => b.textContent.trim()), chips: document.querySelectorAll('#quickF [data-quick]').length,
    cards: document.querySelectorAll('#cards .card').length, vrow: document.querySelectorAll('#vibeCards .card, #vibeCards article').length }));
  ok(q1.rules.includes('veg') && q1.active.some(t => /Veg-only kitchen/.test(t)) && q1.chips === 4, 'quick filters: one tap turns it on; it moves to the active row: ' + JSON.stringify(q1));
  ok(q1.cards === want || q1.cards + q1.vrow >= want, `quick filters: the count matched what you then see (${want} vs ${q1.cards})`);
  await p.click('#activeF button'); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => !prefs().rules.includes('veg') && document.querySelectorAll('#quickF [data-quick]').length === 5), 'quick filters: removing it brings the chip back');
  await p.screenshot({ path: O + '/p12-discover.png' });
  // 3. active line and the 30-day rule
  const act = await p.evaluate(() => [...document.querySelectorAll('#cards .card .act')].map(x => x.textContent));
  ok(act.length > 0 && act.every(t => /^● Active (today|yesterday|\d+ days ago)$/.test(t)), 'cards say when the owner was last active: ' + act.slice(0, 3).join(' / '));
  const away = await p.evaluate(async () => { const id = api.all().find(l => !isSample(l)).id;
    const keep = api.view; api.view = function(l){ const v = keep.call(this, l); return v.id === id ? Object.assign(v, { owner_active_at: new Date(Date.now() - 40 * 864e5).toISOString() }) : v; };
    const r = { listed: (await api.search({ city: 'Bengaluru' })).some(l => l.id === id), near: (await api.searchNear({ lat: 12.97, lng: 77.6, km: 25, area: '' })).some(l => l.id === id), opens: !!(await api.get(id)) };
    api.view = keep; return r; });
  ok(!away.listed && !away.near && away.opens, 'an owner away 40 days: the home leaves Discover, a link still opens it: ' + JSON.stringify(away));
  // 1. verified tick
  const ver = await p.evaluate(() => ({ cards: [...document.querySelectorAll('#cards .card')].filter(c => c.querySelector('.trust .verified')).length, all: document.querySelectorAll('#cards .card').length,
    sample: !trustLine({ household: { sample: true, residents: 1 }, kind: 'room', owner_verified: true }).includes('verified'),
    testCode: !trustLine({ household: { residents: 1 }, kind: 'room', owner_verified: false }).includes('verified') && verTag({ occupation: {}, verified: false }) === '',
    real: trustLine({ household: { residents: 1 }, kind: 'room', owner_verified: true }).includes('verified') && /Phone verified/.test(verTag({ occupation: {}, verified: true })) }));
  ok(ver.cards === ver.all && ver.all > 0, 'demo homes (owners signed in with a delivered demo code) show phone verified: ' + JSON.stringify(ver));
  ok(ver.sample && ver.testCode && ver.real, 'the tick follows the server flag: none for a test-code sign-in or a sample, shown for a delivered code: ' + JSON.stringify(ver));
  // 4. never pay before you visit, before a request
  await p.evaluate(() => openListing('demo-1')); await p.waitForTimeout(1500);
  const safe = await p.evaluate(() => { const n = document.querySelector('#dlgListing .safe-pay'); const req = document.querySelector('#dlgListing .lock [data-action="request"]');
    return { text: n && n.textContent, after: !!(n && req && (req.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)), loc: $('lLoc').textContent }; });
  ok(safe.text && /Never pay before you visit/.test(safe.text) && safe.after, 'home page: the never-pay warning sits under Send request: ' + (safe.text || '').slice(0, 60));
  ok(/Active (today|yesterday|\d+ days ago)/.test(safe.loc), 'home page: the line under the title says when they were last active: ' + safe.loc);
  await p.evaluate(() => document.querySelector('#dlgListing .safe-pay').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p12-safe.png' });
  // owners see the tick on people who ask
  await closeDlgs(p);
  await p.evaluate(async () => { await api.sendRequest('demo-1', 'Hi'); const r = state.requests.find(x => x.listing_id === 'demo-1');
    const l = api.all().find(x => x.id === 'demo-1'); state.myListings.push({ ...l, id: 'mine-v', owner_phone: state.user.phone, status: 'active', created_at: new Date().toISOString(), unlock_count: 0, private: { address: 'x', contact_name: 'Owner' } });
    r.listing_id = 'mine-v'; state.user.role = 'owner'; state.onboarded.owner = true; save(); });
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1600); await closeDlgs(p);
  ok(await p.evaluate(() => !!document.querySelector('#reqList article .verified')), 'owner Requests: the person who asked shows phone verified');
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
