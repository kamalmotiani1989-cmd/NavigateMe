// Escape and FlatMart batches in demo mode (port 8765): invite note + lapse, invite several, why-them, invite stats,
// top matches on My flat, new-seeker alert, the seeker's deadline; wanted posts + matches, saved search, price guide,
// trust line, item share, pick-up + collected, bundle on the sale page, the unsold nudge, ?i= deep link.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const listing = { id:'mine-p6a', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }], interests:{ music:['Indie'], hobbies:[] } }, vibe),
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } };
const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents: 1 }, vibe), myListings:[listing], requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3), passes:{ escape: iso(now + 7 * 864e5) }, saleCredits: 1, boostCredits: 0 };
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'x' } }, account:'9811111111', onboarded:{ seeker:true },
  giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, interests:{ music:['Indie'], hobbies:['Gym'] }, prefs:{ city:'Bengaluru', areas:[], moveIn:'2w' }, profilePromoHidden: now + 9e9, notified:{}, demoInvites:'done', demoTribeAt:'done' };
const closeDialogs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const seed = (ctx, s) => ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, s);
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ owner: the Escape
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await seed(ctx, owner);
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push('owner ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#escape'); await p.waitForTimeout(1800); await closeDialogs(p);
  // two lapsed invites (older than the demo's 60 s) and one fresh one, to pool seekers of this listing
  const seeded = await p.evaluate(() => {
    const l = state.myListings[0], pool = demoSeekerPool().filter(x => x.city === l.city && (!x.areas.length || x.areas.includes(l.locality)));
    const mk = (x, ageMs, status) => ({ id:'i-' + x.id, by:'owner', listing_id:l.id, listing_title:l.title, seeker_phone:x.phone, seeker:{ name:x.name, occupation:x.occupation, vibe:x.vibe, phone:x.phone, interests:x.interests },
      status, message:'old', match_pct: (vibeMatch(x.vibe, l.household) || {}).pct ?? null, created_at:new Date(Date.now() - ageMs).toISOString(), decided_at:null, seen_owner:true, seen_seeker:false, demoDone:true });
    state.requests.push(mk(pool[0], 120e3, 'pending'), mk(pool[1], 130e3, 'pending'), mk(pool[2], 5e3, 'pending'));
    save(); return { a: pool[0].id, b: pool[1].id, c: pool[2].id, names: [pool[0].name, pool[1].name, pool[2].name] };
  });
  await p.goto('http://localhost:8765/#mine'); await p.waitForTimeout(600); await p.goto('http://localhost:8765/#escape'); await p.waitForTimeout(1800); await closeDialogs(p);
  const esc1 = await p.evaluate(ids => ({ inv: $('escInv').innerText.replace(/\s+/g, ' '), why: document.querySelectorAll('.seek-card .why').length, cards: document.querySelectorAll('.seek-card').length,
    movein: [...document.querySelectorAll('.seek-card .meta2')].filter(m => /Moving in/.test(m.textContent)).length, sel: !$('escSelect').hidden,
    a: (() => { const c = [...document.querySelectorAll('.seek-card')].find(c => c.querySelector(`[data-invite="${ids.a}"]`)); return c ? c.querySelector('.acts').innerText.replace(/\s+/g, ' ') : 'no card'; })(),
    c: (() => { const c = [...document.querySelectorAll('.seek-card')].find(c => c.innerText.includes('Invite sent · waiting')); return !!c; })() }), seeded);
  ok(/Your invites: 3 sent/.test(esc1.inv) && /2 lapsed/.test(esc1.inv) && /1 waiting/.test(esc1.inv) && /note/.test(esc1.inv), 'owner: invite stats with lapsed ones: ' + esc1.inv.slice(0, 90));
  ok(esc1.why >= esc1.cards * .6 && esc1.movein >= 1 && esc1.sel, `owner: why-them lines on ${esc1.why} of ${esc1.cards} cards, move-in on ${esc1.movein}, Invite several shown`);
  ok(/Invite lapsed/.test(esc1.a) && /Invite again/.test(esc1.a) && esc1.c, 'owner: a lapsed invite shows Invite again; a fresh one shows waiting: ' + esc1.a);
  await p.screenshot({ path: `${O}/p6-m-escape.png`, fullPage: true });
  // invite again, with a note
  await p.click(`[data-invite="${seeded.a}"]`); await p.waitForTimeout(600);
  const dlg = await p.evaluate(() => ({ open: $('dlgInvite').open, title: $('ivTitle').textContent, msg: $('ivMsg').value, btn: $('ivGo').textContent }));
  ok(dlg.open && dlg.title === 'Invite ' + seeded.names[0].split(' ')[0] && /The room is free from 1 Dec, in HSR Layout/.test(dlg.msg) && dlg.btn === 'Send invite', 'owner: invite dialog with a note: ' + dlg.msg.slice(0, 80));
  await p.screenshot({ path: `${O}/p6-m-invite.png` });
  await p.fill('#ivMsg', 'Hi! The balcony room is free from 1 Dec, come see it this weekend?');
  await p.click('#ivGo'); await p.waitForTimeout(1500);
  const re = await p.evaluate(id => { const r = state.requests.find(x => x.id === 'i-' + id); return { status: r.status, fresh: Date.now() - new Date(r.created_at) < 5000, msg: r.message, n: state.requests.length,
    card: (() => { const c = [...document.querySelectorAll('.seek-card')].find(c => c.innerText.includes('Invite sent · waiting')); return document.querySelectorAll('.seek-card .req-pill.pending').length; })() }; }, seeded.a);
  ok(re.status === 'pending' && re.fresh && /balcony room/.test(re.msg) && re.n === 3 && re.card === 2, 'owner: re-invited: same row, fresh, with the note: ' + JSON.stringify(re));
  // invite several
  await p.click('#escSelect'); await p.waitForTimeout(400);
  const boxes = await p.$$('.seek-card .sel');
  ok(boxes.length >= 2 && !(await p.isHidden('#escBar')), `owner: select mode shows ${boxes.length} checkboxes and the bar`);
  await boxes[0].check(); await boxes[1].check(); await p.waitForTimeout(300);
  ok((await p.textContent('#escBarText')) === '2 selected' && (await p.textContent('#escBarGo')) === 'Invite 2 people', 'owner: bar counts the selection');
  await p.screenshot({ path: `${O}/p6-m-select.png` });
  await p.click('#escBarGo'); await p.waitForTimeout(500);
  ok((await p.textContent('#ivTitle')) === 'Invite 2 people' && (await p.textContent('#ivGo')) === 'Send 2 invites', 'owner: bulk invite dialog');
  await p.click('#ivGo'); await p.waitForTimeout(1800);
  const bulk = await p.evaluate(() => ({ n: state.requests.filter(r => r.by === 'owner' && r.status === 'pending' && Date.now() - new Date(r.created_at) < 8000).length, selecting: escSelecting, bar: $('escBar').hidden }));
  ok(bulk.n === 3 && !bulk.selecting && bulk.bar, 'owner: 2 more invites sent, select mode off: ' + JSON.stringify(bulk));
  // My flat: top matches with Invite
  await p.goto('http://localhost:8765/#mine'); await p.waitForTimeout(1500);
  const me = await p.evaluate(() => ({ rows: document.querySelectorAll('.mine-esc .row').length, btns: document.querySelectorAll('.mine-esc [data-esc-invite]').length, pills: [...document.querySelectorAll('.mine-esc .req-pill')].map(x => x.textContent) }));
  ok(me.rows === 3 && me.btns + me.pills.length === 3, 'owner: My flat lists the top 3 with Invite or their state: ' + JSON.stringify(me));
  await p.screenshot({ path: `${O}/p6-m-mine.png`, fullPage: true });
  if(me.btns){ await p.click('.mine-esc [data-esc-invite]'); await p.waitForTimeout(1200); ok(await p.evaluate(() => $('dlgInvite').open && /^Invite /.test($('ivTitle').textContent)), 'owner: Invite from My flat opens the dialog: ' + await p.textContent('#ivTitle')); await closeDialogs(p); }
  // a sample seeker starts looking here: the owner hears about it
  const alert = await p.evaluate(async () => { (state.demoSeekerAt = {})[state.myListings[0].id] = Date.now() - 1; save(); await checkExtras();
    return { bumped: Object.keys(state.demoBumped || {}).length, ns: Object.keys(state.notified).filter(k => k.startsWith('ns')).length, since: state.seekerSince }; });
  ok(alert.bumped === 1 && alert.ns === 1 && Date.now() - new Date(alert.since) < 10000, 'owner: new-seeker alert fired once and moved the cursor: ' + JSON.stringify(alert));
  const toastTxt = await p.evaluate(() => [...document.querySelectorAll('.toast, #toast, [role=status]')].map(t => t.textContent).join(' | '));
  ok(/just started looking in HSR Layout/.test(toastTxt), 'owner: toast says who just started looking: ' + toastTxt.slice(0, 80));
  // Requests: the lapsed pill
  await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => [...document.querySelectorAll('#reqList .req-pill')].some(x => x.textContent === 'Invite lapsed')), 'owner: Requests shows "Invite lapsed" on the lapsed invite');
  await ctx.close();

  // ------------------------------------------------------------ seeker: the deadline on invites, and FlatMart
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await seed(ctx, seeker);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('seeker ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1800); await closeDialogs(p);
  await p.evaluate(() => { const [a, b2] = api.all().filter(l => l.city === 'Bengaluru');
    const mk = (l, age) => ({ id:'inv-' + l.id, by:'owner', listing_id:l.id, listing_title:l.title, seeker_phone:state.user.phone, seeker:{ name:'Neha' }, status:'pending', message:'Come see it',
      match_pct:80, created_at:new Date(Date.now() - age).toISOString(), decided_at:null, seen_owner:true, seen_seeker:true, demoDone:true });
    state.requests.push(mk(a, 10e3), mk(b2, 120e3)); save(); });
  await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500);
  const sk = await p.evaluate(() => ({ invites: document.querySelectorAll('#reqList .invite').length, deadline: (document.querySelector('#reqList .inv-deadline') || {}).textContent || '' }));
  ok(sk.invites === 1 && /Answer by .* then the invite lapses/.test(sk.deadline), 'seeker: the fresh invite shows a deadline, the lapsed one is gone: ' + JSON.stringify(sk));
  await p.screenshot({ path: `${O}/p6-m-invite-seeker.png` });
  // filters: when do you want to move
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1200); await p.click('#filtersBtn'); await p.waitForTimeout(500);
  ok((await p.inputValue('#fMoveIn')) === '2w', 'seeker: Filters shows the move-in choice');
  await p.selectOption('#fMoveIn', '1m'); await p.click('#filterForm [type=submit]'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => prefs().moveIn === '1m'), 'seeker: move-in saved from Filters');
  // FlatMart: Wanted
  await p.goto('http://localhost:8765/#market'); await p.waitForTimeout(1500);
  await p.click('[data-mk-tab="wanted"]'); await p.waitForTimeout(800);
  const wt = await p.evaluate(() => ({ cards: document.querySelectorAll('#mkWanted .want-card').length, first: (document.querySelector('#mkWanted .want-card h3') || {}).textContent || '' }));
  ok(wt.cards >= 3 && / wants: /.test(wt.first), 'seeker: Wanted tab lists what people are looking for: ' + wt.first);
  await p.screenshot({ path: `${O}/p6-m-wanted.png`, fullPage: true });
  await p.click('#mkWanted [data-mk-want-new]'); await p.waitForTimeout(500);
  await p.fill('#wTitle', 'Single bed with mattress'); await p.evaluate(() => { document.querySelector('[name=wCat][value="beds"]').checked = true; }); await p.fill('#wMax', '3500');
  await p.click('#mkWantForm [type=submit]'); await p.waitForTimeout(1200);
  const w1 = await p.evaluate(() => ({ mine: [...document.querySelectorAll('#mkWanted .want-card.mine h3')].map(h => h.textContent), n: state.market.wants.length, due: Object.keys(state.demoWantAt || {}).length }));
  ok(w1.mine.length === 1 && /You want: Single bed/.test(w1.mine[0]) && w1.n === 1 && w1.due === 1, 'seeker: want posted and listed under Yours: ' + JSON.stringify(w1));
  // a sample seller posts something that fits (fast-forwarded), the app notices once
  const wm = await p.evaluate(async () => { const id = state.market.wants[0].id; state.demoWantAt[id] = Date.now() - 1; save();
    await checkExtras(); const again = await api.marketWantMatches();
    const keys = Object.keys(state.notified).filter(k => k.startsWith('wm')), it = (state.market.extra || [])[0];
    return { n: keys.length, price: it && it.price, cat: it && it.category, again: again.length, extra: (state.market.extra || []).length }; });
  ok(wm.n === 1 && wm.price <= 3500 && wm.cat === 'beds' && wm.again === 0 && wm.extra === 1, 'seeker: a fitting item appears, is notified once and not again: ' + JSON.stringify(wm));
  // saved search from an empty browse
  await p.click('[data-mk-tab="browse"]'); await p.waitForTimeout(600); await p.fill('#mkQ', 'zzzzqq'); await p.waitForTimeout(900);
  ok(!!(await p.$('#mkCards [data-mk-want-new="zzzzqq"]')), 'seeker: empty search offers "Tell me when it appears"');
  await p.click('#mkCards [data-mk-want-new]'); await p.waitForTimeout(500);
  ok((await p.inputValue('#wTitle')) === 'zzzzqq' && !(await p.isChecked('#wPublic')), 'seeker: the saved-search form is prefilled and private');
  await closeDialogs(p); await p.fill('#mkQ', ''); await p.waitForTimeout(600);
  // sell form: price guide + who wants one
  await p.click('#view-market [data-mk="sell"]'); await p.waitForTimeout(600);
  await p.evaluate(() => { const r = document.querySelector('[name=mkCat][value="beds"]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(800);
  const guide = await p.textContent('#mkGuide');
  ok(/sold for ₹[\d,]+–₹[\d,]+ \(\d+ sales\)/.test(guide) && /want(s)? one/.test(guide), 'seeker: price guide and demand under the price: ' + guide);
  const gw = await p.evaluate(() => { const g = $('mkGuide'); return { guide: Math.round(g.getBoundingClientRect().width), form: Math.round(g.closest('form').getBoundingClientRect().width) }; });
  ok(gw.guide >= gw.form - 2, 'seeker: the guide runs the full width of the form, not squeezed under the price box: ' + JSON.stringify(gw));
  await p.screenshot({ path: `${O}/p6-m-sell-guide.png` });
  await closeDialogs(p);
  // an item: trust line + share
  const itemId = await p.evaluate(() => document.querySelector('#mkCards .mk-card').dataset.item);
  await p.evaluate(id => openItem(id), itemId); await p.waitForTimeout(1200);
  const tr = await p.evaluate(() => ({ trust: (document.querySelector('.mk-trust') || {}).innerText || '', share: !$('mkShare').hidden }));
  ok(/on FindMeFlatMate since /.test(tr.trust) && /(sold here|first sale here)/.test(tr.trust) && tr.share, 'seeker: trust line on the item: ' + tr.trust.replace(/\s+/g, ' '));
  await p.click('#mkShare'); await p.waitForTimeout(3000);
  const sh = await p.evaluate(() => ({ open: $('dlgShare').open, img: !!document.querySelector('#shBody .sh-img'), copy: (document.querySelector('#shBody [data-copy]') || {}).dataset?.copy }));
  ok(sh.open && sh.img && sh.copy === 'https://findmeflatmate.com/?i=' + itemId, 'seeker: item share card with the ?i= link: ' + sh.copy);
  await p.screenshot({ path: `${O}/p6-m-share-item.png` });
  require('fs').writeFileSync(`${O}/p6-card-item.png`, Buffer.from((await p.evaluate(() => document.querySelector('#shBody .sh-img').src)).split(',')[1], 'base64'));
  await closeDialogs(p);
  // offer -> accepted -> pick-up -> collected
  await p.evaluate(id => openItem(id), itemId); await p.waitForTimeout(1000);
  await p.click('#mkOfferForm [type=submit]'); await p.waitForTimeout(7500);   // sample sellers answer in ~6 s
  await closeDialogs(p);
  await p.goto('http://localhost:8765/#market'); await p.waitForTimeout(800); await p.click('[data-mk-tab="offers"]'); await p.waitForTimeout(1200);
  const of1 = await p.evaluate(() => ({ acc: /accepted/.test(document.querySelector('#mkOffers .mk-offer .s').textContent), box: !!document.querySelector('#mkOffers .pk-box'), rec: (document.querySelector('#mkOffers .mk-trust') || {}).textContent || '' }));
  ok(of1.acc && of1.box && /since/.test(of1.rec), 'seeker: accepted offer shows the pick-up box and the seller record: ' + of1.rec.replace(/\s+/g, ' '));
  await p.screenshot({ path: `${O}/p6-m-pickup.png`, fullPage: true });
  await p.click('#mkOffers [data-pk-save]'); await p.waitForTimeout(1200);
  const pk = await p.evaluate(async () => { const r = (await api.marketInbox())[0]; return { at: r.pickup_at, by: r.pickup_by, head: document.querySelector('#mkOffers .pk-box b').textContent }; });
  ok(pk.at && pk.by === 'buyer' && /Pick-up: /.test(pk.head), 'seeker: pick-up time saved and shown: ' + pk.head);
  await p.click('#mkOffers [data-pk-done]'); await p.waitForTimeout(1200);
  const done = await p.evaluate(async id => ({ status: (await api.marketGet(id)).status, box: (document.querySelector('#mkOffers .pk-box.done') || {}).textContent || '' }), itemId);
  ok(done.status === 'sold' && /Collected/.test(done.box), 'seeker: collected marks it sold: ' + JSON.stringify(done));
  // deep link ?i=
  const target = await p.evaluate(() => api.mkAll()[4].id);
  await p.goto(`http://localhost:8765/?i=${target}#discover`); await p.waitForTimeout(2500);
  ok(await p.evaluate(t => $('dlgMk').open && mkCurrent && mkCurrent.id === t, target), 'seeker: ?i= link opens the item');
  await ctx.close();

  // ------------------------------------------------------------ owner as a seller: bundle on the sale page, unsold nudge
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await seed(ctx, owner);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('seller ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#market'); await p.waitForTimeout(1500); await closeDialogs(p);
  const sale = await p.evaluate(async () => {
    const a = await api.marketPost({ title:'Queen bed', category:'beds', condition:'good', price:8000, negotiable:true, city:'Bengaluru', locality:'HSR Layout', description:'x', photos:[], moving_by:null });
    const b2 = await api.marketPost({ title:'Fridge', category:'appliances', condition:'good', price:6000, negotiable:true, city:'Bengaluru', locality:'HSR Layout', description:'x', photos:[], moving_by:null });
    state.market.items.find(i => i.id === a.id).bumped_at = new Date(Date.now() - 60e3).toISOString();   // unsold for a while (30 s in the demo)
    const d = new Date(Date.now() + 10 * 864e5), until = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    const r = await api.marketSaleStart(until, 'Rohit moves out', 12000);
    state.mkSale = { code: r.code, title: 'Rohit moves out', ends_at: r.ends_at, bundle_price: 12000 }; save(); return { code: r.code, a: a.id };
  });
  await p.goto('http://localhost:8765/#sale/' + sale.code); await p.waitForTimeout(1500);
  const sb = await p.evaluate(() => ({ box: (document.querySelector('.sale-bundle') || {}).innerText || '', btn: !!document.querySelector('[data-sale-bundle]') }));
  ok(/Take the lot for ₹12,000/.test(sb.box) && !sb.btn, 'seller: the sale page shows the take-the-lot price (no button for the seller): ' + sb.box.replace(/\s+/g, ' '));
  await p.screenshot({ path: `${O}/p6-m-sale.png`, fullPage: true });
  await p.click('[data-sale-share]'); await p.waitForTimeout(3000);
  ok(await p.evaluate(() => $('dlgShare').open && !!document.querySelector('#shBody .sh-img') && /sale\//.test((document.querySelector('#shBody [data-copy]') || {}).dataset.copy)), 'seller: the sale share card');
  require('fs').writeFileSync(`${O}/p6-card-sale.png`, Buffer.from((await p.evaluate(() => document.querySelector('#shBody .sh-img').src)).split(',')[1], 'base64'));
  await closeDialogs(p);
  await p.goto('http://localhost:8765/#market'); await p.waitForTimeout(800); await p.click('[data-mk-tab="mine"]'); await p.waitForTimeout(1500);
  const nd = await p.evaluate(() => ({ n: document.querySelectorAll('#mkMine .mk-nudge').length, txt: (document.querySelector('#mkMine .mk-nudge') || {}).innerText || '', to: (document.querySelector('#mkMine [data-mk-drop]') || {}).dataset?.mkDrop }));
  ok(nd.n === 1 && /Drop to ₹/.test(nd.txt) && nd.to && nd.to.startsWith(sale.a + '|'), 'seller: the unsold item gets a drop nudge: ' + nd.txt.replace(/\s+/g, ' ').slice(0, 90));
  await p.screenshot({ path: `${O}/p6-m-nudge.png`, fullPage: true });
  await p.click('#mkMine [data-mk-drop]'); await p.waitForTimeout(1200);
  const dropped = await p.evaluate(async a => (await api.marketGet(a)).price, sale.a);
  ok(dropped === Number(nd.to.split('|')[1]) && dropped < 8000, 'seller: one tap drops the price to ' + dropped);
  await p.click('[data-sale-edit]'); await p.waitForTimeout(500);
  ok((await p.inputValue('#slBundle')) === '12000', 'seller: the sale form keeps the take-the-lot price');
  // the floating help button steps aside while someone types, and is back when they are done
  await closeDialogs(p); await p.goto('http://localhost:8765/#market'); await p.waitForTimeout(800); await p.click('[data-mk-tab="browse"]'); await p.waitForTimeout(400);
  const fab = () => p.evaluate(() => getComputedStyle($('helpFab')).display !== 'none');
  const fabBefore = await fab(); await p.focus('#mkQ'); const fabTyping = await fab();
  await p.evaluate(() => document.activeElement.blur()); const fabAfter = await fab();
  ok(fabBefore && !fabTyping && fabAfter, `help button shown ${fabBefore}, hidden while typing ${!fabTyping}, back after ${fabAfter}`);
  await ctx.close(); await b.close(); console.log('errors', errs);
})();
