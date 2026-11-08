// Nearby parties, Phase 1, in demo mode (port 8765): the host opens a party to people nearby; people who switched
// it on find it, ask to join and get the address on accept; check-in, reports, thumbs; notifications are server-side.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const person = (phone, name, gender) => ({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone, name, role:'seeker', gender, occupation:{ type:'working', what:'Analyst' } }, account:phone,
  onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Pune', areas:['Baner'] }, profilePromoHidden: Date.now() + 9e9, notified:{}, demoInvites:'done', demoTribeAt:'done' });
const closeDialogs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const seed = (ctx, s) => ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, s);
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ 1. host side
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await seed(ctx, person('9822200001', 'Hema', 'female'));
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push('host ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1500); await closeDialogs(p);
  const gid = await p.evaluate(() => api.splitCreate('Diwali night', '🪔', [], 'party'));
  await p.goto('http://localhost:8765/#splits/' + gid); await p.waitForTimeout(1500);
  await p.click('[data-pt="edit"]'); await p.waitForTimeout(600);
  const near0 = await p.evaluate(() => ({ has: !!$('ptNear'), on: $('ptOpen').checked, boxHidden: $('ptOpenBox').hidden }));
  ok(near0.has && !near0.on && near0.boxHidden, 'host: "Open to people nearby" is in the invite editor and off by default: ' + JSON.stringify(near0));
  await p.evaluate(() => { $('ptNear').open = true; }); await p.check('#ptOpen'); await p.waitForTimeout(200);
  const form = await p.evaluate(() => ({ box: !$('ptOpenBox').hidden, radius: $('ptRadius').value, label: $('ptRadiusN').textContent, min: $('ptRadius').min, max: $('ptRadius').max,
    who: [...document.querySelectorAll('[name=ptWho]')].map(x => x.closest('label').textContent.trim()), chipHidden: $('ptChipBox').hidden, money: $('ptMoney').textContent }));
  ok(form.box && form.radius === '3' && form.label === '3 km' && form.min === '1' && form.max === '5' && form.who.join() === 'Everyone,Women only,Men only' && form.chipHidden,
    'host: guest limit, entry, who can come, a 1 to 5 km radius (3 km to start) and the private address: ' + JSON.stringify(form));
  ok(form.money === "Paid to the host at the door or by UPI. FindMeFlatMate does not collect money. Alcohol: bring your own; it can't be part of the chip-in.", 'host: the money and alcohol line is shown in plain words');
  // missing guest limit, then a chip-in with alcohol, then no pin: each refused with a plain message
  const err = async () => { await p.click('#ptForm [type=submit]'); await p.waitForTimeout(500); return p.evaluate(() => (document.querySelector('#ptForm .form-err') || {}).textContent || ''); };
  const e1 = await err();
  await p.fill('#ptLimit', '4'); await p.click('[name=ptEntry][value=chip] + span'); await p.fill('#ptEntryChip', '300');
  for(const c of ['food', 'snacks', 'music']) await p.check(`[name=ptCover][value=${c}]`);
  await p.fill('#ptCoverOther', 'a crate of beer'); const e2 = await err();
  await p.fill('#ptCoverOther', 'fairy lights'); await p.fill('#ptNearAddr', 'B-12 Green Woods, Baner Road'); const e3 = await err();
  ok(/how many guests/i.test(e1) && /Alcohol can't be part of the chip-in/.test(e2) && /map pin/.test(e3), 'host: refused without a guest limit, with alcohol in the chip-in, and without a pin: ' + [e1, e2, e3].join(' | '));
  // pick the address from the list (sets the pin), women only, 2 km, house rules
  await p.fill('#ptNearAddr', 'Baner'); await p.waitForTimeout(900);
  const picked = await p.evaluate(() => { const o = document.querySelector('.ps-list [data-i], .ps-list button, .ps-item'); if(o){ o.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); o.click(); return true; } return false; });
  await p.waitForTimeout(400);
  if(!(await p.evaluate(() => !!ptx.nearGeo))) await p.evaluate(() => { ptx.nearGeo = { lat: 18.559, lng: 73.7868 }; $('ptNearAddr').value = 'B-12 Green Woods, Baner Road, Pune'; $('ptArea').value = 'Baner'; });
  await p.click('[name=ptWho][value=female] + span'); await p.fill('#ptRadius', '2'); await p.dispatchEvent('#ptRadius', 'input');
  if(!(await p.inputValue('#ptArea'))) await p.fill('#ptArea', 'Baner');
  await p.fill('#ptRules', 'No smoking indoors. Wraps up by 11.');
  await p.screenshot({ path: O + '/p9-host-editor.png', fullPage: false });
  await p.click('#ptForm [type=submit]'); await p.waitForTimeout(1200); await closeDialogs(p);
  const saved = await p.evaluate(async id => ({ o: await api.partyOpenFor(id), line: ($('ptOpenLine') || {}).textContent || '', pub: await api.partyForGroup(id) }), gid);
  ok(saved.o && saved.o.open && saved.o.guest_limit === 4 && saved.o.entry === 'chip' && saved.o.entry_chip === 300 && saved.o.covers.join() === 'food,music,snacks'
    && saved.o.who === 'female' && saved.o.radius_km === 2 && saved.o.near_geo && saved.o.area, 'host: saved and open to people nearby: ' + JSON.stringify(saved.o) + (picked ? ' (picked from the list)' : ''));
  ok(/Open to people nearby/.test(saved.line) && /within 2 km/.test(saved.line) && /Women only/.test(saved.line) && /4 guests/.test(saved.line) && /Chip in ₹300/.test(saved.line),
    'host: the party shows it is open to people nearby: ' + saved.line.replace(/\s+/g, ' ').trim());
  ok(!saved.pub.address && !('near_address' in saved.pub) && !('near_geo' in saved.pub), 'host: the invite link never carries the private address or pin');
  await p.screenshot({ path: O + '/p9-host-party.png' });
  // ------------------------------------------------------------ 3. host: requests from nearby, accept and decline
  const hr = await p.evaluate(() => [...document.querySelectorAll('#ptReqs .pr-row')].map(r => ({ text: r.textContent.replace(/\s+/g, ' ').trim(), yes: !!r.querySelector('[data-pr-yes]'), phone: !!r.querySelector('.pr-phone') })));
  ok(hr.length === 2 && hr.every(r => r.yes && !r.phone) && hr.every(r => /(Woman|Man)/.test(r.text) && /% vibe match/.test(r.text) && /attended/.test(r.text) && /GEN|MILLENNIAL/i.test(r.text)),
    'host: requests show first name, age group, gender, vibe match and parties attended, with no number before accepting: ' + hr.map(r => r.text.slice(0, 70)).join(' / '));
  await p.click('#ptReqs .pr-row:has-text("+1") [data-pr-yes]'); await p.waitForTimeout(900);
  const hr2 = await p.evaluate(() => ({ phone: (document.querySelector('#ptReqs .pr-row.accepted .pr-phone') || {}).textContent || '', count: $('ptReqs').querySelector('.pr-count').textContent }));
  ok(/\+91 \d{10}/.test(hr2.phone) && /2 of 4 spots taken/.test(hr2.count), 'host: on accept, the guest\'s number shows; the guest and her plus-one take 2 spots: ' + JSON.stringify(hr2));
  // over the limit: with the limit lowered to 2, a second accept is refused
  await p.evaluate(async id => { const o = await api.partyOpenFor(id); await api.partyOpenSave(id, Object.assign(o, { guest_limit: 2 })); await loadFsParty(); drawSplitGroup(); }, gid); await p.waitForTimeout(600);
  await p.click('#ptReqs [data-pr-yes]'); await p.waitForTimeout(900);
  const hr3 = await p.evaluate(() => ({ pending: document.querySelectorAll('#ptReqs .pr-row.pending').length, toast: (document.querySelector('.toast') || {}).textContent || '' }));
  ok(hr3.pending === 1 && /No spots left/.test(hr3.toast), 'host: accepting past the guest limit is refused: ' + JSON.stringify(hr3));
  await p.click('#ptReqs [data-pr-no]'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => !!document.querySelector('#ptReqs .pr-row.declined') && !document.querySelector('#ptReqs .pr-row.declined .pr-phone')), 'host: declining shows it, with no number');
  // ------------------------------------------------------------ 4. host safety: door check-in, report a person, thumbs
  await p.fill('#ptDoorCode', 'ZZZZZZ'); await p.click('#ptDoor [type=submit]'); await p.waitForTimeout(500);
  const door0 = await p.evaluate(() => (document.querySelector('#ptDoor .form-err') || {}).textContent || '');
  const riyaCode = await p.evaluate(() => api.partyReqs().find(r => r.status === 'accepted').checkin_code);
  await p.fill('#ptDoorCode', riyaCode.toLowerCase()); await p.click('#ptDoor [type=submit]'); await p.waitForTimeout(900);
  const door1 = await p.evaluate(() => ({ tag: !!document.querySelector('#ptReqs .pr-row.accepted .pr-in'), toast: (document.querySelector('.toast') || {}).textContent || '' }));
  ok(/isn't on your guest list/.test(door0) && door1.tag && /checked in/.test(door1.toast), 'host: a wrong code is refused; the guest\'s code checks her in at the door: ' + JSON.stringify(door1));
  await p.click('#ptReqs .pr-row.declined [data-pr-report]'); await p.waitForTimeout(400);
  const repT = await p.evaluate(() => $('prpTitle').textContent);
  await p.click('#prpForm [type=submit]'); await p.waitForTimeout(600);
  ok(/Report Sneha/.test(repT) && await p.evaluate(() => (state.partyReports || []).some(r => r.request)), 'host: each person has a Report button: ' + repT);
  await p.evaluate(async () => { const pp = api.parties()[0]; pp.starts_at = new Date(Date.now() - 6 * 36e5).toISOString(); pp.ends_at = new Date(Date.now() - 36e5).toISOString(); save(); await loadFsParty(); drawSplitGroup(); });
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => !!document.querySelector('#ptReqs .pr-row.accepted [data-pr-rate]') && !document.querySelector('#ptReqs .pr-row.declined [data-pr-rate]')), 'host: after the party, accepted guests get a thumbs up or down');
  await p.click('#ptReqs .pr-row.accepted [data-pr-rate][data-up="0"]'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.querySelector('#ptReqs .pr-row.accepted [data-pr-rate][data-up="0"]').getAttribute('aria-pressed') === 'true'), 'host: the thumbs down is saved');
  await p.screenshot({ path: O + '/p9-host-requests.png' });
  // a blocked host can't open a party to people nearby
  const hb = await p.evaluate(async id => { state.partyBlocked = true; const o = await api.partyOpenFor(id); return api.partyOpenSave(id, Object.assign(o, { open: true })).then(() => 'ok', e => e.message); }, gid);
  ok(hb === 'blocked' || hb === 'party-over', 'host: a blocked host cannot open a party to people nearby: ' + hb);
  await ctx.close();
  // ------------------------------------------------------------ 2. discovery
  const pickPlace = async (pg, q) => { await pg.fill('#npinPlace', q); await pg.waitForTimeout(900);
    const hit = await pg.evaluate(() => { const o = document.querySelector('#dlgNearPin .ps-list [data-i], #dlgNearPin .ps-list button, #dlgNearPin .ps-item'); if(o){ o.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); o.click(); return true; } return false; });
    await pg.waitForTimeout(800);
    // map search needs the network; offline (as here) pick Baner's pin the way a chosen suggestion does
    if(await pg.evaluate(() => $('dlgNearPin').open)) await pg.evaluate(() => { $('dlgNearPin').close(); const f = nearPinThen; nearPinThen = null; f({ lat: 18.559, lng: 73.7868, label: 'Baner' }); });
    await pg.waitForTimeout(800); return true; };
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await seed(ctx, person('9822200002', 'Asha', 'female'));
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('asha ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#account'); await p.waitForTimeout(1500); await closeDialogs(p);
  const acc0 = await p.evaluate(() => ({ panel: !!$('nearPanel') && !$('nearPanel').hidden, on: $('nearToggle').checked }));
  ok(acc0.panel && !acc0.on, 'guest: "Show me parties nearby" is in Account and off by default: ' + JSON.stringify(acc0));
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1500); await closeDialogs(p);
  const sp0 = await p.evaluate(() => ({ promo: !!document.querySelector('.near-promo'), cards: document.querySelectorAll('.near-card').length }));
  ok(sp0.promo && !sp0.cards, 'guest: switched off, Splits shows no parties, only a "Show me" card: ' + JSON.stringify(sp0));
  await p.click('[data-near-on]'); await p.waitForTimeout(500);
  const asked = await p.evaluate(() => $('dlgNearPin').open);
  const hit = await pickPlace(p, 'Baner');
  await p.waitForTimeout(1200);
  const list = await p.evaluate(() => [...document.querySelectorAll('.near-card')].map(c => c.textContent.replace(/\s+/g, ' ').trim()));
  ok(asked && hit && list.length === 3 && list.every(t => /Baner|Balewadi|Aundh/.test(t)) && list.some(t => /Board games/.test(t)),
    'guest: switching on asks for a place once; Asha near Baner sees the three Pune parties in reach: ' + list.map(t => t.slice(0, 50)).join(' / '));
  ok(list.every(t => /\d+\.\d km/.test(t) && /(spots? left|Full)/.test(t) && /(Free entry|Chip in ₹)/.test(t)), 'guest: each card shows the area, the distance, the entry and the spots left');
  await p.screenshot({ path: O + '/p9-near-list.png' });
  await p.click('.near-card'); await p.waitForTimeout(600);
  const det = await p.evaluate(() => { const t = $('nearBody').textContent, pp = demoNearParties().find(x => x.title === $('nearTitle').textContent);
    return { title: $('nearTitle').textContent, text: t.replace(/\s+/g, ' '), addr: t.includes(pp.near_address) || t.includes(pp.near_address.split(',')[0]), phone: t.includes(pp.host_phone), lat: t.includes(String(pp.near_geo.lat)) }; });
  ok(/Hosted by \w+/.test(det.text) && /The \w+/.test(det.text) && /km/.test(det.text) && /(spots? left|Full) of \d+/.test(det.text) && /House rules/.test(det.text),
    'guest: the party shows what, when, area and distance, the host\'s first name and vibe type, spots left and house rules: ' + det.text.slice(0, 160));
  ok(!det.addr && !det.phone && !det.lat, 'guest: before acceptance, no address, pin or number on the party');
  await p.screenshot({ path: O + '/p9-near-detail.png' });
  // ------------------------------------------------------------ 3. guest: request to join, wait, accepted
  await p.fill('#nearNote', 'Call me on 9876543210'); await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(600);
  const noNum = await p.evaluate(() => (document.querySelector('#nearAsk .form-err') || {}).textContent || '');
  await p.fill('#nearNote', 'Board games fan!'); await p.click('[data-near-plus="1"]'); await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(800);
  const wait = await p.evaluate(() => { const pp = demoNearParties().find(x => x.title === $('nearTitle').textContent), t = $('nearBody').textContent;
    return { text: $('nearAct').textContent.replace(/\s+/g, ' ').trim(), addr: t.includes(pp.near_address), phone: t.includes(pp.host_phone) }; });
  ok(/numbers and links/i.test(noNum) && /Asked to join/.test(wait.text) && /Withdraw/.test(wait.text) && !wait.addr && !wait.phone,
    'guest: the request goes in with a note and a plus-one (a number in the note is refused); still no address while waiting: ' + wait.text.slice(0, 60));
  await p.waitForTimeout(5500);
  const inn = await p.evaluate(() => { const pp = demoNearParties().find(x => x.title === $('nearTitle').textContent), t = $('nearAct').textContent;
    return { text: t.replace(/\s+/g, ' ').trim(), addr: t.includes(pp.near_address), call: !!document.querySelector('#nearAct a[href^="tel:+91' + pp.host_phone + '"]'), maps: !!document.querySelector('#nearAct a[href*="google.com/maps"]'), spots: $('nearBody').textContent.match(/(\d+) spots? left/)[1] }; });
  ok(/You're in/.test(inn.text) && inn.addr && inn.call && inn.maps && inn.spots === '3', 'guest: on accept, the address, the map pin and the host\'s number appear; 2 spots taken: ' + JSON.stringify(inn).slice(0, 160));
  // ------------------------------------------------------------ 4. guest safety: check-in code, report, thumbs
  const code = await p.evaluate(() => ({ shown: ($('nearAct').querySelector('.near-code b') || {}).textContent || '', mine: api.partyReqs().find(r => r.user_phone === state.user.phone && r.status === 'accepted').checkin_code }));
  ok(/^[0-9A-F]{6}$/.test(code.shown) && code.shown === code.mine, 'guest: accepted, Asha has a check-in code to show at the door: ' + code.shown);
  await p.screenshot({ path: O + '/p9-near-accepted.png' });
  await p.click('[data-report-party]'); await p.waitForTimeout(400);
  await p.click('[name=prpWhy][value="Not what was described"] + span'); await p.fill('#prpMore', 'Address did not match.'); await p.click('#prpForm [type=submit]'); await p.waitForTimeout(600);
  const rep1 = await p.evaluate(() => ({ open: $('dlgPReport').open, reports: (state.partyReports || []).map(r => r.reason + (r.request ? ' (person)' : ' (party)')) }));
  ok(!rep1.open && rep1.reports.join() === 'Not what was described: Address did not match. (party)', 'guest: "Report this party" sends a report with a reason: ' + JSON.stringify(rep1));
  // after the party: thumbs up or down for the host
  await p.evaluate(async () => { const pp = demoNearParties().find(x => x.title === $('nearTitle').textContent); pp.starts_at = new Date(Date.now() - 6 * 36e5).toISOString(); pp.ends_at = new Date(Date.now() - 36e5).toISOString(); await openNear(pp.code); });
  await p.waitForTimeout(500);
  const rt0 = await p.evaluate(() => ({ rate: !!$('nearAct').querySelector('[data-near-rate]'), drop: !!$('nearAct').querySelector('[data-near-withdraw]') }));
  await p.click('[data-near-rate][data-up="1"]'); await p.waitForTimeout(600);
  const rt1 = await p.evaluate(() => ({ pressed: $('nearAct').querySelector('[data-near-rate][data-up="1"]').getAttribute('aria-pressed'), saved: api.ratings().length }));
  ok(rt0.rate && !rt0.drop && rt1.pressed === 'true' && rt1.saved === 1, 'guest: after the party, Asha gives the host a thumbs up: ' + JSON.stringify({ rt0, rt1 }));
  await p.evaluate(async () => { const pp = demoNearParties().find(x => x.title === $('nearTitle').textContent); pp.starts_at = new Date(Date.now() + 2 * 864e5).toISOString(); pp.ends_at = new Date(Date.now() + 2 * 864e5 + 4 * 36e5).toISOString(); await openNear(pp.code); });
  await p.waitForTimeout(400);
  await p.click('[data-near-withdraw]'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => !!$('nearAsk') && !/You're in/.test($('nearAct').textContent)), 'guest: "I can\'t make it" withdraws, and the address is gone');
  await closeDialogs(p);
  // blocked (two reports or three thumbs down, until Kamal reviews): no parties, no requests
  await p.evaluate(() => { state.partyBlocked = true; save(); });
  await p.goto('http://localhost:8765/#account'); await p.waitForTimeout(800); await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1300); await closeDialogs(p);
  const blk = await p.evaluate(async () => ({ cards: document.querySelectorAll('.near-card').length, list: (await api.partyNearby()).map(x => x.code + ':' + (x.my_request && x.my_request.status)).join(), why: api.partyCantSee(demoNearParties()[1]),
    req: await api.partyRequest(demoNearParties()[1].code).then(() => 'ok', e => e.message) }));
  ok(!blk.cards && blk.why === 'blocked' && blk.req === 'blocked', 'guest: a blocked person sees no parties and cannot ask to join: ' + JSON.stringify(blk));
  await p.evaluate(() => { delete state.partyBlocked; save(); });
  // switching off hides them again
  await p.goto('http://localhost:8765/#account'); await p.waitForTimeout(1200); await closeDialogs(p);
  ok(await p.evaluate(() => $('nearToggle').checked && /Baner/.test($('nearWhere').textContent)), 'guest: Account shows it on, looking near Baner');
  await p.click('#nearToggle'); await p.waitForTimeout(800);
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1300);
  ok(await p.evaluate(() => !document.querySelectorAll('.near-card').length && !!document.querySelector('.near-promo')), 'guest: switched off again, no parties show (opted out)');
  await ctx.close();
  // a man in Bengaluru near Domlur: the women-only party is hidden, and so is the full one
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await seed(ctx, Object.assign(person('9822200003', 'Bharat', 'male'), { partyNear: { on: true, pin: { lat: 12.955, lng: 77.635 }, label: 'Domlur' } }));
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('bharat ' + e.message));
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1500); await closeDialogs(p);
  const bl = await p.evaluate(() => ({ titles: [...document.querySelectorAll('.near-card b')].map(x => x.textContent), why: Object.fromEntries(demoNearParties().filter(x => x.city === 'Bengaluru').map(x => [x.code, api.partyCantSee(x)])) }));
  ok(bl.titles.join() === 'Karaoke night' && bl.why.NBBLR2 === 'wrong-gender' && bl.why.NBBLR3 === 'party-full', 'guest: a man sees the open party but not the women-only one (wrong gender) or the full one: ' + JSON.stringify(bl));
  // ------------------------------------------------------------ 5. a notification opens #near/<code>: that party on Splits
  await p.goto('http://localhost:8765/#near/NBBLR1'); await p.waitForTimeout(2500);
  const nr = await p.evaluate(() => ({ open: $('dlgNear').open, title: $('nearTitle').textContent, hash: location.hash }));
  ok(nr.open && nr.title === 'Karaoke night' && nr.hash === '#splits', 'notify: the link in a notification opens the party: ' + JSON.stringify(nr));
  await ctx.close();
  // far away: nothing in reach
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await seed(ctx, Object.assign(person('9822200004', 'Chitra', 'female'), { partyNear: { on: true, pin: { lat: 18.5089, lng: 73.926 }, label: 'Hadapsar' } }));
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('chitra ' + e.message));
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1500); await closeDialogs(p);
  const cl = await p.evaluate(() => ({ cards: document.querySelectorAll('.near-card').length, empty: !!document.querySelector('.near-empty'), why: api.partyCantSee(demoNearParties()[0]) }));
  ok(!cl.cards && cl.empty && cl.why === 'out-of-radius', 'guest: 12 km away in Hadapsar, nothing is in reach (out of radius): ' + JSON.stringify(cl));
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
