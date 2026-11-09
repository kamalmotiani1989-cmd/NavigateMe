// "Compromise and ask again" (demo mode, port 8765), on a phone-sized screen. A seeker is declined by three homes:
// two rooms in shared flats (household answers that clash with hers) and a whole flat nobody lives in yet (no answers).
// The button shows only where there's something to adjust, is tappable (not under the bottom bar or help button),
// the screen never opens empty, Send works only when the score rises and only once, and the owner sees the banner.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:0, clean:0, food:2, cook:0, smoke:2, drinks:2, guests:2, noise:2, social:2, sharing:0, work:0, pets:2, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  profilePromoHidden:9e15, notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
// Is the element's centre on top (nothing covering it), after scrolling it into view?
const tappable = (p, sel) => p.evaluate(s => { const bt = document.querySelector(s); if(!bt) return null; bt.scrollIntoView({ block:'center' });
  const r = bt.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { on: hit === bt || bt.contains(hit), inView: r.top >= 0 && r.bottom <= innerHeight, hit: hit && (hit.id || hit.className || hit.tagName) }; }, sel);
(async () => {
  const b = await chromium.launch();
  for(const [w, h] of [[360, 800], [390, 844], [412, 915]]){
    const ctx = await b.newContext({ viewport:{ width:w, height:h } });
    await ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, st);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(w + ': ' + e.message));
    await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500); await closeDlgs(p);
    const homes = await p.evaluate(async () => { const out = {};
      for(const id of ['demo-1', 'demo-2', 'demo-3']){ await api.sendRequest(id, 'Hi'); const rq = state.requests.find(x => x.listing_id === id);
        rq.status = 'declined'; rq.decided_at = new Date().toISOString(); out[id] = compromiseOptions((api.all().find(l => l.id === id) || {}).household || {}).length; }
      save(); return out; });
    // Requests list
    await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500); await closeDlgs(p);
    const btns = await p.evaluate(() => [...document.querySelectorAll('#reqList [data-cm]')].map(x => x.dataset.cml));
    const want = Object.keys(homes).filter(k => homes[k] > 0);
    ok(homes['demo-3'] === 0 && btns.sort().join() === want.sort().join(), `${w}: Requests shows the button only for homes with clashes (not the whole flat): ${btns.join()} | ${JSON.stringify(homes)}`);
    const t = await tappable(p, '#reqList [data-cm]');
    ok(t && t.on && t.inView, `${w}: the button is tappable, not under the bottom bar or help button: ${JSON.stringify(t)}`);
    await p.screenshot({ path:`${O}/p11-requests-${w}.png` });
    // Opening it straight on a home with nothing to adjust never shows an empty screen
    const empty = await p.evaluate(async () => { const r = state.requests.find(x => x.listing_id === 'demo-3'); await openCompromise(r.id, 'demo-3');
      return { open: $('dlgCompromise').open, toast: (document.querySelector('.toast') || {}).textContent || '' }; });
    ok(!empty.open, `${w}: a home with nothing to adjust doesn't open an empty screen: ${JSON.stringify(empty)}`);
    // The compromise screen
    const lid = btns[0];
    await p.click(`#reqList [data-cm][data-cml="${lid}"]`); await p.waitForTimeout(1200);
    const d0 = await p.evaluate(() => ({ open: $('dlgCompromise').open, qs: document.querySelectorAll('#cmBody .cm-q').length, send: $('cmSend').disabled, before: cmCtx.before }));
    ok(d0.open && d0.qs > 0 && d0.send, `${w}: the screen lists the clashes, Send is off until something changes: ${JSON.stringify(d0)}`);
    // A change that doesn't help keeps Send off; moving towards the home turns it on with the new score
    await p.click('#cmBody .cm-q .chip.home'); await p.waitForTimeout(400);
    const d1 = await p.evaluate(() => ({ send: !$('cmSend').disabled, text: $('cmSend').textContent, now: vibeMatch(Object.assign({}, state.vibe, cmCtx.changes), cmCtx.hh).pct, before: cmCtx.before }));
    ok(d1.send && d1.now > d1.before && d1.text.includes(d1.now + '%'), `${w}: the live score rises and Send turns on: ${JSON.stringify(d1)}`);
    const s = await tappable(p, '#cmSend');
    ok(s && s.on && s.inView, `${w}: Send is reachable and not covered: ${JSON.stringify(s)}`);
    await p.screenshot({ path:`${O}/p11-dialog-${w}.png` });
    await p.click('#cmSend'); await p.waitForTimeout(1500);
    const sent = await p.evaluate(id => { const r = state.requests.find(x => x.listing_id === id); return { status: r.status, cm: !!r.compromise, orig: r.orig_match_pct, pct: r.match_pct, open: $('dlgCompromise').open }; }, lid);
    ok(sent.status === 'pending' && sent.cm && sent.pct > sent.orig && !sent.open, `${w}: sent; the request is waiting again at the higher score: ${JSON.stringify(sent)}`);
    // Only once per home: no button for it any more, and the api says no
    await closeDlgs(p); await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500); await closeDlgs(p);
    const again = await p.evaluate(async id => { const r = state.requests.find(x => x.listing_id === id); r.status = 'declined'; save();
      const res = await api.compromise(r.id, { sleep:1 }, ''); return { res: res.error, ok: res.error === 'already-compromised' }; }, lid);
    await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500); await closeDlgs(p);
    const left = await p.evaluate(() => [...document.querySelectorAll('#reqList [data-cm]')].map(x => x.dataset.cml));
    ok(again.ok && !left.includes(lid), `${w}: once per home: ${JSON.stringify(again)}, buttons left: ${left.join()}`);
    // A change that doesn't raise the score is refused
    const nb = await p.evaluate(async () => { const r = state.requests.find(x => x.listing_id === 'demo-3'); return (await api.compromise(r.id, { sleep:2 }, '')).error; });
    ok(nb === 'no-better', `${w}: a change that doesn't raise the score is refused: ${nb}`);
    // The owner's side: the request shows "Ready to compromise · X% → Y%" with what changed
    await p.evaluate(id => { const r = state.requests.find(x => x.listing_id === id); r.status = 'pending';
      const l = api.all().find(x => x.id === id), mine = { ...l, id:'mine-cm', owner_phone:state.user.phone, status:'active', created_at:new Date().toISOString(), unlock_count:0, private:{ address:'x', contact_name:'Owner' } };
      state.myListings.push(mine); r.listing_id = 'mine-cm'; state.user.role = 'owner'; state.onboarded.owner = true; save(); }, lid);
    await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1800); await closeDlgs(p);
    const own = await p.evaluate(() => { const bn = document.querySelector('#reqList .cm-banner'); return bn ? { text: bn.querySelector('b').textContent, items: bn.querySelectorAll('li').length } : null; });
    ok(own && /Ready to compromise · \d+% → \d+%/.test(own.text) && own.items > 0, `${w}: the owner sees the banner: ${JSON.stringify(own)}`);
    if(own) await p.evaluate(() => document.querySelector('#reqList .cm-banner').scrollIntoView({ block:'center' }));
    await p.screenshot({ path:`${O}/p11-owner-${w}.png` });
    await ctx.close();
  }
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
