// The after-match kit (Kamal, 15 Nov; demo mode, port 8765, 390 wide): after a yes, a room request and a bonded tribe
// get a Move-in kit: a flatmate agreement filled in from the home and the answers (editable, shareable), a move-in
// checklist that's remembered, and Flatsplits for rent and bills.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:2, clean:0, food:0, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: Date.now() + 9e9 };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500); await closeDlgs(p);
  const pending = await p.evaluate(async () => { await api.sendRequest('demo-1', 'Hi'); return !!document.querySelector('[data-kit]'); });
  await p.evaluate(() => { const r = state.requests.find(x => x.listing_id === 'demo-1'); r.status = 'approved'; r.decided_at = new Date().toISOString();
    state.unlocked = [...new Set((state.unlocked || []).concat('demo-1'))]; save(); });
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500); await closeDlgs(p);
  const btn = await p.evaluate(() => (document.querySelector('#reqList [data-kit^="room:"]') || {}).textContent || '');
  ok(!pending && /Move-in kit/.test(btn), 'after a yes, the request has "Move-in kit" (not before): ' + btn);
  await p.click('#reqList [data-kit^="room:"]'); await p.waitForTimeout(800);
  const k = await p.evaluate(() => { const l = api.all().find(x => x.id === 'demo-1'); return { open: $('dlgKit').open, sub: $('kitSub').textContent, text: $('kitPrev').textContent, rent: l.rent,
    sections: [...document.querySelectorAll('#kitBody .kit-card h3')].map(h => h.textContent.replace(/\d+ of \d+/, '').trim()), items: document.querySelectorAll('.kit-item').length }; });
  ok(k.open && k.sections.join('|') === '1 · Flatmate agreement|2 · Move-in checklist|3 · Rent and bills' && k.items === 10, 'the kit: agreement, checklist (10 things), rent and bills: ' + k.sub);
  ok(/FLATMATE AGREEMENT/.test(k.text) && k.text.includes('Neha') && /Rent: ₹[\d,]+ a month each/.test(k.text) && /Signed:/.test(k.text) && /not a rental agreement with the owner/.test(k.text),
    'the agreement is filled in from the home: names, rent, signatures, and says what it is');
  ok(/House rules:/.test(k.text) && /• /.test(k.text), 'house rules come from the home\'s answers: ' + (k.text.match(/House rules:\n([^\n]+)/) || [])[1]);
  await p.screenshot({ path: O + '/p24-kit.png' });
  // edit: the agreement follows, and it's remembered
  await p.fill('#kRent', '12500'); await p.fill('#kRules', 'No smoking anywhere in the flat\nQuiet hours from 10 pm\nShoes off inside'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => /Rent: ₹12,500 a month each/.test($('kitPrev').textContent) && /• Shoes off inside/.test($('kitPrev').textContent)), 'edits show in the agreement straight away');
  await p.check('.kit-item input[data-kit-i="0"]'); await p.check('.kit-item input[data-kit-i="4"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelector('.kit-count').textContent === '2 of 10'), 'ticking the checklist counts');
  await closeDlgs(p); await p.click('#reqList [data-kit^="room:"]'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => $('kRent').value === '12500' && document.querySelector('.kit-item input[data-kit-i="4"]').checked), 'reopened: the edits and ticks are kept');
  // share: Android's share sheet / the phone's / WhatsApp
  const shared = await p.evaluate(async () => { let got = null; window.open = (u) => { got = u; }; navigator.share = undefined; document.querySelector('[data-kit-act="share"]').click(); await new Promise(r => setTimeout(r, 100)); return got; });
  ok(/^https:\/\/wa\.me\/\?text=FLATMATE%20AGREEMENT/.test(shared || ''), 'share: without a share sheet, it opens WhatsApp with the agreement: ' + (shared || '').slice(0, 40));
  // tribe: bonded gets the kit too
  await closeDlgs(p);
  await p.evaluate(async () => { await api.tribeRefresh(); const t = (state.tribe || [])[0]; Object.assign(t, { my_yes: true, their_yes: true, status: 'bonded', bonded_at: new Date().toISOString(), phone: '9800000001' }); save(); });
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#tribe'); await p.waitForTimeout(1500); await closeDlgs(p);
  ok(await p.evaluate(() => !!document.querySelector('[data-kit^="tribe:"]')), 'a bonded tribe has the Move-in kit too');
  await p.click('[data-kit^="tribe:"]'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => $('dlgKit').open && /Rent: shared as agreed with the owner/.test($('kitPrev').textContent)), 'a tribe without a home yet: rent left for when you find it');
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
