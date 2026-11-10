// Messages after a yes (Kamal, 10 Nov; demo mode, port 8765, 390 wide): a room request, a tribe, a FlatMart deal and
// a Flatsplits group each get a chat once both sides have said yes, never before; the top bar shows unread messages.
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
  // a request, still waiting: no chat
  const r = await p.evaluate(async () => { await api.sendRequest('demo-1', 'Hi'); const r = state.requests.find(x => x.listing_id === 'demo-1'); r.created_at = new Date().toISOString(); save();
    return { id: r.id, open: await api.msgOpen('room', r.id) }; });
  ok(r.open.error === 'not-yet', 'room: no chat while the request is waiting');
  ok(await p.evaluate(() => !!document.querySelector('#topActs [data-view="messages"]')), 'the top bar has Messages');
  // the owner says yes
  await p.evaluate(id => { const r = state.requests.find(x => x.id === id); r.status = 'approved'; r.decided_at = new Date().toISOString(); state.unlocked = [...new Set((state.unlocked || []).concat('demo-1'))]; save(); }, r.id);
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500); await closeDlgs(p);
  const btn = await p.evaluate(() => (document.querySelector('#reqList [data-msg^="room:"]') || {}).textContent || '');
  ok(/Message/.test(btn), 'room: an accepted request has a Message button: ' + btn.trim());
  await p.click('#reqList [data-msg^="room:"]'); await p.waitForTimeout(600);
  const d = await p.evaluate(() => ({ open: $('dlgMsg').open, title: $('msgTitle').textContent, sub: $('msgSub').textContent, empty: /Never pay/.test($('msgList').textContent) }));
  ok(d.open && /^Room · /.test(d.sub) && d.empty, 'room: the chat opens, named, with the never-pay line: ' + d.title + ' | ' + d.sub);
  await p.fill('#msgText', 'Hi! When can I come and see the room?'); await p.press('#msgText', 'Enter'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => [...document.querySelectorAll('#msgList .msg.mine p')].map(x => x.textContent).join() === 'Hi! When can I come and see the room?' && $('msgText').value === ''), 'room: Enter sends; it shows on the right');
  await p.waitForTimeout(1700);
  ok(await p.evaluate(() => document.querySelectorAll('#msgList .msg.theirs').length === 1), 'room: the reply comes in on the left');
  await p.screenshot({ path: O + '/p16-chat.png' });
  // unread: close, the owner writes again, badge shows; Messages lists it
  await closeDlgs(p);
  await p.evaluate(() => { const t = Object.values(state.threads)[0]; t.messages.push({ id:'x1', mine:false, name:'Harsh', body:'Also, the deposit is two months.', at:new Date(Date.now() + 1000).toISOString() }); save(); });
  await p.evaluate(() => refreshMsgUnseen()); await p.waitForTimeout(300);
  ok(await p.evaluate(() => /1/.test((document.querySelector('#topActs [data-view="messages"] .badge') || {}).textContent || '')), 'unread messages show on the top-bar icon');
  await p.click('#topActs [data-view="messages"]'); await p.waitForTimeout(800);
  const list = await p.evaluate(() => [...document.querySelectorAll('#msgsList .msg-row')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  ok(list.length === 1 && /Room/.test(list[0]) && /deposit is two months/.test(list[0]), 'Messages lists the chat with its last message: ' + list[0]);
  await p.screenshot({ path: O + '/p16-list.png' });
  await p.click('#msgsList .msg-row'); await p.waitForTimeout(600); await closeDlgs(p); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !document.querySelector('#topActs [data-view="messages"] .badge')), 'reading it clears the badge');
  // tribe: only once bonded
  const tr = await p.evaluate(async () => { const x = demoSeekerPool().find(s => s.city === 'Bengaluru');
    state.tribe = [{ id:'tb1', sid:x.id, match_pct:80, my_yes:true, their_yes:false, status:'open', created_at:new Date().toISOString(), seen:true }]; save();
    const before = await api.msgOpen('tribe', 'tb1'); state.tribe[0].status = 'bonded'; state.tribe[0].their_yes = true; state.tribe[0].bonded_at = new Date().toISOString(); save();
    return { before, after: await api.msgOpen('tribe', 'tb1') }; });
  ok(tr.before.error === 'not-yet' && tr.after.thread, 'tribe: no chat until both said yes, then yes');
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#tribe'); await p.waitForTimeout(1500); await closeDlgs(p);
  ok(await p.evaluate(() => !!document.querySelector('#tribeBonded [data-msg="tribe:tb1"]')), 'tribe: the tribe card has Message');
  // FlatMart: only an accepted offer
  const mk = await p.evaluate(async () => { const i = demoMarketItems()[0]; const m = api.mk(); m.offers.push({ id:'of1', item_id:i.id, buyer_phone:state.user.phone, buyer_name:'Neha', offer:100, message:'', status:'pending', created_at:new Date().toISOString() }); save();
    const before = await api.msgOpen('market', 'of1'); m.offers.find(o => o.id === 'of1').status = 'accepted'; save(); return { before, after: await api.msgOpen('market', 'of1') }; });
  ok(mk.before.error === 'not-yet' && mk.after.thread, 'FlatMart: no chat until the seller accepts, then yes');
  // Flatsplits: a group you're in
  const sp = await p.evaluate(async () => { const g = await api.splitCreate('Flat 4B', '🏠', [{ name:'Riya', phone:'9822222222' }], 'flat'); const id = (g && (g.id || g)) || (await api.splitGroups())[0].id;
    const t = await api.msgOpen('split', id); return { t, other: await api.msgOpen('split', 'nope') , id }; });
  ok(sp.t.thread && sp.other.error === 'not-yet', 'Flatsplits: the group can chat; a group you\'re not in can\'t');
  await p.goto('http://localhost:8765/#splits/' + sp.id); await p.waitForTimeout(1500); await closeDlgs(p);
  ok(await p.evaluate(() => !!document.querySelector('[data-msg^="split:"]')), 'Flatsplits: the group has Group chat');
  // text stays text
  await p.evaluate(async id => { const t = await api.msgOpen('split', id); await api.msgSend(t.thread, '<img src=x onerror=alert(1)>'); }, sp.id);
  await p.evaluate(id => openMsg('split', id), sp.id); await p.waitForTimeout(600);
  ok(await p.evaluate(() => !document.querySelector('#msgList img') && /‹img/.test($('msgList').textContent)), 'a message can\'t carry HTML');
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
