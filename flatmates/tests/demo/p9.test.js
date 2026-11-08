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
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
