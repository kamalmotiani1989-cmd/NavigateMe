// Match reasons and scam flags (Kamal, 15 Nov, from the competitive teardown; demo mode, port 8765, 390 wide):
// "N things in common" with the reasons on home cards and tribe cards, and a calm warning on a message or a listing
// that asks for money up front.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: Date.now() + 9e9 };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1600); await closeDlgs(p);
  const r = await p.evaluate(() => { const cards = [...document.querySelectorAll('#cards .card.lcard')].map(c => { const l = api.all().find(x => x.id === c.dataset.id);
      return { line: (c.querySelector('.lc-why') || {}).textContent || '', want: matchReasons(state.vibe, l.household || {}) }; });
    return { n: cards.length, withLine: cards.filter(c => c.line).length, right: cards.every(c => !c.want.length ? !c.line : c.line.startsWith(`${c.want.length} thing`) && c.line.includes(c.want[0])), sample: cards.find(c => c.line)?.line }; });
  ok(r.withLine > 0 && r.right, `home cards: "N things in common" with the reasons that matter most (${r.withLine} of ${r.n}): ` + r.sample);
  ok(await p.evaluate(() => matchReasons({ food:0, smoke:0, sleep:2, clean:0 }, { food:0, smoke:0, sleep:2, clean:1 }).length === 3 && matchReasons({}, { food:0 }).length === 0), 'the reasons are only the answers you share');
  await p.evaluate(() => document.querySelector('#cards .lc-why').closest('.card').scrollIntoView({ block:'start' })); await p.evaluate(() => scrollBy(0, -70)); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p23-reasons.png' });
  // scam flags: the rules
  const rules = await p.evaluate(() => [['Please pay 5000 token today to block the room', true], ['Send the booking amount on GPay', true], ['Share the OTP you got', true],
    ['Scan this QR code to pay the advance', true], ['Saturday 11am works for a visit?', false], ['I am being transferred to Pune next month', false], ['The deposit is two months, paid at move-in', false]]
    .map(([t, want]) => ({ t, got: scamFlag(t), want })));
  ok(rules.every(x => x.got === x.want), 'scam flags: money-up-front asks are caught, ordinary chat is not: ' + rules.filter(x => x.got !== x.want).map(x => x.t).join(' | '));
  // in a chat: a warning under their message, never under mine
  const th = await p.evaluate(async () => { await api.sendRequest('demo-1', 'Hi'); const r = state.requests.find(x => x.listing_id === 'demo-1'); r.status = 'approved'; r.decided_at = new Date().toISOString();
    state.unlocked = [...new Set((state.unlocked || []).concat('demo-1'))]; save(); const o = await api.msgOpen('room', r.id); await api.msgSend(o.thread, 'Can I pay the token by UPI?');
    const t = state.threads[o.thread]; t.messages.push({ id: 'm-scam', body: 'Pay 5000 token today on GPay to block the room, many people are asking', mine: false, at: new Date().toISOString(), name: 'Owner' }); save(); return o.thread; });
  await p.evaluate(id => openMsg('room', state.requests.find(x => x.listing_id === 'demo-1').id), th); await p.waitForTimeout(900);
  const msg = await p.evaluate(() => [...document.querySelectorAll('#msgList .msg')].map(m => ({ mine: m.classList.contains('mine'), warn: !!m.querySelector('.msg-warn') })));
  ok(msg.some(m => !m.mine && m.warn) && msg.filter(m => m.mine).every(m => !m.warn), 'chat: their "pay a token" message gets a calm warning; mine never does: ' + JSON.stringify(msg));
  await p.evaluate(() => document.querySelector('#msgList .msg-warn').scrollIntoView({ block:'center' })); await p.screenshot({ path: O + '/p23-chat.png' });
  await closeDlgs(p);
  // a listing that asks for money up front
  const lf = await p.evaluate(async () => { const l = api.all().find(x => x.city === 'Bengaluru' && !x.is_owner); const old = l.description; l.description = 'Lovely room. Pay booking amount of 2000 to confirm.';
    await openListing(l.id); await new Promise(r => setTimeout(r, 700)); const flag = !!document.querySelector('#dlgListing .scam-flag'); l.description = old; return flag; });
  ok(lf, 'a listing that asks for a booking amount shows the warning on its page');
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
