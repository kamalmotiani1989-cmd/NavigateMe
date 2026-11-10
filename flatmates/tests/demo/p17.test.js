// Party rules for parties nearby (Kamal, 10 Nov; demo mode, port 8765, 390 wide): the rules are on every party's page
// and in the host's form; a guest agrees before the first request to join, a host before opening a party to people
// nearby, once; without agreeing, nothing is sent.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822200002', name:'Asha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Analyst' } }, account:'9822200002',
  onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Pune', areas:['Baner'] }, profilePromoHidden: Date.now() + 9e9, notified:{},
  demoInvites:'done', demoTribeAt:'done', partyNear:{ on:true, pin:{ lat:18.559, lng:73.786 }, label:'Baner' } };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1500); await closeDlgs(p);
  ok(await p.evaluate(() => PARTY_RULES.length === 10 && PARTY_RULES.every(([h, t]) => h && t.length > 30)), 'ten rules, each with a short explanation');
  const code = await p.evaluate(() => demoNearParties().find(x => x.city === 'Pune' && x.who !== 'male').code);
  await p.evaluate(c => openNear(c), code); await p.waitForTimeout(800);
  const pg = await p.evaluate(() => ({ rules: !!document.querySelector('#nearBody .party-rules'), items: document.querySelectorAll('#nearBody .party-rules li').length,
    tick: !!$('nearRulesOk'), req: $('nearRulesOk') && $('nearRulesOk').required }));
  ok(pg.rules && pg.items === 10 && pg.tick && pg.req, 'guest: the party page shows the rules, and Request to join has "I\'ve read the party rules": ' + JSON.stringify(pg));
  // not ticked: nothing goes
  await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(500);
  const no = await p.evaluate(() => ({ err: (document.querySelector('#nearAsk .form-err') || {}).textContent || '', asked: !!(state.partyReqs || []).length, at: state.partyRulesAt }));
  ok(/agree to the party rules/.test(no.err) && !no.asked && !no.at, 'guest: without the tick, no request is sent: ' + no.err);
  ok(await p.evaluate(() => api.partyRequest(demoNearParties()[0].code).then(() => 'sent', e => e.message)) === 'rules-required', 'guest: the request itself is refused without agreeing (as on the server)');
  // the link opens the rules
  await p.click('#nearAsk [data-rules-open]'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelector('#nearBody .party-rules').open), 'guest: "party rules" in the tick opens them');
  await p.screenshot({ path: O + '/p17-rules.png' });
  await p.check('#nearRulesOk'); await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(800);
  const yes = await p.evaluate(() => ({ at: state.partyRulesAt, wait: /Asked to join/.test($('nearAct').textContent) }));
  ok(yes.at && yes.wait, 'guest: ticked, the request goes and the agreement is saved: ' + JSON.stringify(yes));
  await closeDlgs(p);
  const other = await p.evaluate(() => demoNearParties().find(x => x.city === 'Pune' && x.who !== 'male' && !(state.partyReqs || []).some(r => r.party_id === x.id)));
  if(other){ await p.evaluate(c => openNear(c), other.code); await p.waitForTimeout(700);
    ok(await p.evaluate(() => !$('nearRulesOk') && !!document.querySelector('#nearBody .party-rules')), 'guest: asked once; the next party has no tick, the rules are still there to read'); }
  await closeDlgs(p);
  // host: opening a party to people nearby
  await p.evaluate(() => { state.partyRulesAt = null; save(); partyRulesOk = null; });
  const gid = await p.evaluate(() => api.splitCreate('Game night', '🎲', [], 'party'));
  await p.goto('http://localhost:8765/#splits/' + gid); await p.waitForTimeout(1500); await closeDlgs(p);
  await p.click('[data-pt="edit"]'); await p.waitForTimeout(800);
  await p.evaluate(() => { $('ptNear').open = true; $('ptOpen').checked = true; $('ptOpen').dispatchEvent(new Event('change', { bubbles:true })); });
  await p.waitForTimeout(300);
  const host = await p.evaluate(() => ({ rules: !!document.querySelector('#ptOpenBox .party-rules'), tick: !!$('ptRulesOk') }));
  ok(host.rules && host.tick, 'host: opening to people nearby shows the rules and the tick: ' + JSON.stringify(host));
  const err = await p.evaluate(() => { $('ptLimit').value = '6'; $('ptNearAddr').value = '12 Baner Road, Pune'; ptx.nearGeo = { lat:18.56, lng:73.78 }; $('ptArea').value = 'Baner'; return ptNearRead().error || ''; });
  ok(/agree to the party rules/.test(err), 'host: it won\'t open without the tick: ' + err);
  ok(await p.evaluate(() => { $('ptRulesOk').checked = true; const v = ptNearRead(); return !v.error && v.open; }), 'host: with the tick it can open');
  await p.evaluate(() => $('ptRulesOk').closest('label').scrollIntoView({ block:'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p17-host.png' });
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
