// Report and block (Kamal, 10 Nov; demo mode, port 8765, 390 wide): from a listing, a chat message, a chat and a tribe
// card; a reason is needed to report; blocking hides them and closes the chat ("You can't message this person");
// Account → Blocked people lists them and unblocks.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:0, clean:0, food:2, cook:0, smoke:2, drinks:2, guests:2, noise:2, social:2, sharing:0, work:0, pets:2, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: Date.now() + 9e9 };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500); await closeDlgs(p);
  // a home that isn't a sample
  const lid = await p.evaluate(() => { const l = api.all().find(x => x.city === 'Bengaluru' && !isSample(x)); return l && l.id; });
  await p.evaluate(id => openListing(id), lid); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => /Report or block this lister/.test($('lBody').textContent)), 'listing: "Report or block this lister" on the home\'s page');
  await p.click('#lBody [data-safe^="listing:"]'); await p.waitForTimeout(400);
  const dlg = await p.evaluate(() => ({ open: $('dlgSafe').open, reasons: [...document.querySelectorAll('[name=sfWhy]')].map(x => x.value), also: $('sfAlso').checked, block: !!document.querySelector('[data-sf-block]') }));
  ok(dlg.open && dlg.reasons.join() === 'harassment,scam,fake,inappropriate,safety,other' && dlg.also && dlg.block, 'the step: six reasons, a note, "also block" and "just block": ' + dlg.reasons.join());
  await p.click('#sfForm [type=submit]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => /Pick what's wrong/.test(($('sfForm').querySelector('.form-err') || {}).textContent || '') && !(state.userReports || []).length), 'report: a reason is needed');
  await p.screenshot({ path: O + '/p18-report.png' });
  await p.click('[data-sf-block]'); await p.waitForTimeout(1200);
  const gone = await p.evaluate(async id => ({ search: (await api.search({ city:'Bengaluru' })).some(l => l.id === id), get: !!(await api.get(id)), list: !$('dlgListing').open, blocks: (state.blocks || []).length }), lid);
  ok(!gone.search && !gone.get && gone.list && gone.blocks === 1, 'block: the home is gone from Discover and its link; the page closes: ' + JSON.stringify(gone));
  // Account → Blocked people
  await p.goto('http://localhost:8765/#account'); await p.waitForTimeout(1000); await closeDlgs(p);
  await p.click('#accBlocked'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelectorAll('#blBody [data-unblock]').length === 1), 'Account → Blocked people lists them');
  await p.screenshot({ path: O + '/p18-blocked.png' });
  await p.click('#blBody [data-unblock]'); await p.waitForTimeout(500);
  ok(await p.evaluate(async id => !(state.blocks || []).length && (await api.search({ city:'Bengaluru' })).some(l => l.id === id), lid), 'unblock: the home is back');
  await closeDlgs(p);
  // a chat: an accepted request, a message from them, report it and block
  const rid = await p.evaluate(async () => { await api.sendRequest('demo-1', 'Hi'); const r = state.requests.find(x => x.listing_id === 'demo-1'); r.status = 'approved'; r.decided_at = new Date().toISOString(); save(); return r.id; });
  await p.evaluate(id => openMsg('room', id), rid); await p.waitForTimeout(500);
  await p.fill('#msgText', 'Hello! When can I visit?'); await p.press('#msgText', 'Enter'); await p.waitForTimeout(2000);
  const chat = await p.evaluate(() => ({ tools: !!document.querySelector('#msgTools [data-safe^="thread:"]'), mineReport: !!document.querySelector('.msg.mine [data-safe]'), theirReport: !!document.querySelector('.msg.theirs [data-safe^="message:"]') }));
  ok(chat.tools && !chat.mineReport && chat.theirReport, 'chat: "Report or block" for the chat, and "Report" on their messages (not mine): ' + JSON.stringify(chat));
  await p.screenshot({ path: O + '/p18-chat.png' });
  await p.click('.msg.theirs [data-safe^="message:"]'); await p.waitForTimeout(400);
  await p.click('#sfForm label:has([value=scam])'); await p.fill('#sfNote', 'Asked for a token'); await p.click('#sfForm [type=submit]'); await p.waitForTimeout(800);
  const rep = await p.evaluate(() => ({ r: (state.userReports || [])[0], blocked: (state.blocks || []).length, chatOpen: $('dlgMsg').open }));
  ok(rep.r && rep.r.kind === 'message' && rep.r.reason === 'scam' && rep.r.note === 'Asked for a token' && rep.r.copy && rep.blocked === 1 && !rep.chatOpen,
    'report a message: reason, note, a copy of the message, and blocked in the same step: ' + JSON.stringify(rep).slice(0, 160));
  await p.evaluate(id => openMsg('room', id), rid); await p.waitForTimeout(500);
  ok(await p.evaluate(() => /You can't message this person/.test(document.body.textContent)), 'chat: after blocking, "You can\'t message this person"');
  await closeDlgs(p);
  // tribe card
  await p.evaluate(() => { const x = demoSeekerPool().find(s => s.city === 'Bengaluru'); state.tribe = [{ id:'tb9', sid:x.id, match_pct:80, my_yes:false, their_yes:true, status:'open', created_at:new Date().toISOString(), seen:true }]; save(); });
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#tribe'); await p.waitForTimeout(1500); await closeDlgs(p);
  ok(await p.evaluate(() => !!document.querySelector('[data-safe="tribe:tb9"]')), 'tribe: the card has "Report or block"');
  await p.click('[data-safe="tribe:tb9"]'); await p.waitForTimeout(300); await p.click('[data-sf-block]'); await p.waitForTimeout(1500);
  ok(await p.evaluate(async () => !(await api.tribeList()).some(t => t.id === 'tb9') && !document.querySelector('[data-safe="tribe:tb9"]')), 'tribe: blocked, the match is gone');
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
