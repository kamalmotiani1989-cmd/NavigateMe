// Parties: the feed, a party's page, hosting in one screen, and the map (Kamal, 17 Nov; demo mode, port 8765).
// "Take the idea for parties nearby dont copy but make it awesome", "Also check how the party is created", and, with a
// recording of a hangouts app's map, "Check how the search happens on parties own discover page through maps. Can we
// build this also". The rules stay the ones parties had (p9, p17): 21 and over, off until you switch it on, and the
// address and numbers only after the host says yes. On the map that means a circle about a kilometre across, never a
// pin on the flat.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const person = (phone, name, gender, more) => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone, name, role:'seeker', gender, occupation:{ type:'working', what:'Analyst' } }, account:phone,
  onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Pune', areas:['Baner'] }, profilePromoHidden: Date.now() + 9e9, partyRulesAt:'2026-11-01T00:00:00.000Z', partyRulesV:2,
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, partyNear:{ on:true, pin:{ lat:18.559, lng:73.7868 }, label:'Baner' } }, more || {});
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const open = async (b, st, w, h) => { const ctx = await b.newContext({ viewport:{ width:w, height:h } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  // no map pictures or outside search in these checks: the marks, circles and cards are ours
  await p.route(/googleapis\.com|gstatic\.com|google\.com|openstreetmap\.org|komoot\.io/, r => r.abort());
  await p.goto(U + '#parties'); await p.waitForTimeout(1900); await closeDlgs(p); await p.waitForTimeout(250); return { ctx, p }; };
// every piece of text under a root: on the four sizes, and dark enough on what it sits on
const audit = (p, sel) => p.evaluate(sel => { const root = document.querySelector(sel); if(!root) return { n: 0, odd: ['no ' + sel], low: [] };
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number), lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const bgOf = e => { for(let x = e; x; x = x.parentElement){ const c = rgb(getComputedStyle(x).backgroundColor); if(c.length >= 3 && (c[3] === undefined || c[3] > .5)) return c; } return [255, 255, 255]; };
  const texts = [...root.querySelectorAll('*')].filter(e => e.offsetParent && !e.closest('svg, [aria-hidden="true"], .leaflet-container, .smp, [hidden]') && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const odd = [], low = [];
  texts.forEach(e => { const cs = getComputedStyle(e), s = parseFloat(cs.fontSize); if(s >= 12 && s <= 21 && ![12.5, 14, 16, 21].includes(s)) odd.push(s + ' ' + e.className);
    const a = lum(rgb(cs.color)), c = lum(bgOf(e)), big = s >= 18.5 || (s >= 14 && +cs.fontWeight >= 700), r = (Math.max(a, c) + .05) / (Math.min(a, c) + .05);
    if(r < (big ? 3 : 4.5)) low.push(Math.round(r * 100) / 100 + ' ' + e.className + ' "' + e.textContent.trim().slice(0, 20) + '"'); });
  return { n: texts.length, odd: [...new Set(odd)], low: [...new Set(low)] }; }, sel);
const fine = a => a.n > 5 && !a.odd.length && !a.low.length;
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ 1. the feed
  let { ctx, p } = await open(b, person('9822200031', 'Asha', 'female'), 390, 844);
  const card = await p.evaluate(() => { const c = document.querySelector('#pnBody .pn-card'), cs = getComputedStyle(c.querySelector('.pn-title')), bar = c.querySelector('.pn-bar i');
    const o = c.querySelector('.pn-open'), at = (x, y) => document.elementFromPoint(x, y), r = c.getBoundingClientRect(), hr = c.querySelector('.pn-save').getBoundingClientRect();
    return { tag: c.tagName, role: c.getAttribute('role'), open: o && o.tagName + ' ' + o.dataset.near + ' ' + o.textContent, inTitle: !!o && o.parentNode.classList.contains('pn-title'), nested: !!c.querySelector('button button, [role=button] button'),
      whole: at(r.left + 20, r.top + 150) === o && at(r.left + r.width / 2, r.top + 60) === o && at(r.right - 20, r.top + 170) === o, heartOnTop: !!at(hr.left + hr.width / 2, hr.top + hr.height / 2).closest('.pn-save'), cover: !!c.querySelector('.pn-cover .pc'), bulbs: c.querySelectorAll('.pc-lights circle').length, emoji: c.querySelector('.pc-emoji').textContent,
      coverHidden: c.querySelector('.pc').getAttribute('aria-hidden'), when: c.querySelector('.pn-when').textContent.trim(), heart: c.querySelector('.pn-save').getAttribute('aria-pressed'), heartLabel: c.querySelector('.pn-save').getAttribute('aria-label'),
      kind: c.querySelector('.pn-kind').textContent.replace('Sample', '').trim(), kindCaps: getComputedStyle(c.querySelector('.pn-kind')).textTransform, title: c.querySelector('.pn-title').textContent, serif: /DM Serif/.test(cs.fontFamily), size: cs.fontSize,
      meta: c.querySelector('.pn-meta').textContent.replace(/\s+/g, ' ').trim(), chips: [...c.querySelectorAll('.pn-chips i')].map(x => x.textContent), going: c.querySelector('.pn-going b').textContent, spots: c.querySelector('.pn-going > span:last-child').textContent,
      bar: Math.round(bar.getBoundingClientRect().width / bar.parentNode.getBoundingClientRect().width * 100), host: c.querySelector('.pn-host b').textContent, see: c.querySelector('.pn-go').textContent,
      photos: c.querySelectorAll('img').length, coverH: Math.round(c.querySelector('.pn-cover').getBoundingClientRect().height) }; });
  ok(card.tag === 'ARTICLE' && !card.role && card.open === 'BUTTON NBPUN1 Board games and chai' && card.inTitle && card.whole && card.heartOnTop && !card.nested,
    'a party is a card; its title is the button and reaches over the whole card, with the heart a button of its own on top (none inside another)');
  ok(card.cover && card.bulbs === 9 && card.emoji === '🎲' && card.coverHidden === 'true' && !card.photos && card.coverH >= 120, 'its cover is drawn (a string of lights and the kind\'s emoji), no photo needed, and is decoration only');
  ok(/^[A-Z]\w+day · 7 pm$/.test(card.when) && card.heart === 'false' && card.heartLabel === 'Keep this party for later', 'on the cover: when it is, the way people say it ("' + card.when + '"), and a heart to keep it');
  ok(card.kind === 'Game night' && card.kindCaps === 'uppercase' && card.title === 'Board games and chai' && card.serif && card.size === '21px', 'under it: the kind in small capitals and the title in the serif');
  ok(card.meta === 'Baner, 0.5 km 4 hours' && card.chips.join() === 'Chip in ₹250,Women only' && card.going === '1 going' && card.spots === '5 spots left' && card.bar === 17 && card.host === 'Hosted by Ananya' && card.see === 'See',
    'then where and how far, how long, what it costs and who it\'s for, how full it is (' + card.going + ', ' + card.spots + ', the bar at ' + card.bar + '%) and who\'s hosting');
  // when, in words
  const whens = await p.evaluate(() => { const at = (days, h, m) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m || 0, 0, 0); return d.toISOString(); }, now = new Date();
    const four = new Date(); four.setHours(16, 0, 0, 0); const late = new Date(); late.setHours(23, 59, 0, 0);
    return { today4: nearWhenChip({ starts_at: at(0, 16) }), want4: four > now ? 'Today · 4 pm' : 'On now', tonight: nearWhenChip({ starts_at: at(0, 23, 59) }), wantTonight: late > now ? 'Tonight · 11:59 pm' : 'On now',
      tomorrow: nearWhenChip({ starts_at: at(1, 19, 30) }), in3: nearWhenChip({ starts_at: at(3, 20) }), day3: new Date(at(3, 20)).toLocaleDateString('en-IN', { weekday: 'long' }), in9: nearWhenChip({ starts_at: at(9, 20) }),
      ended: nearWhenChip({ starts_at: at(-2, 20), ended: true }), off: nearWhenChip({ starts_at: at(2, 20), cancelled: true }), long: nearLong({ starts_at: at(1, 19), ends_at: at(1, 21, 30) }), one: nearLong({ starts_at: at(1, 19), ends_at: at(1, 20) }), none: nearLong({ starts_at: at(1, 19) }) }; });
  ok(whens.today4 === whens.want4 && whens.tonight === whens.wantTonight && whens.tomorrow === 'Tomorrow · 7:30 pm' && whens.in3 === whens.day3 + ' · 8 pm' && /^\w{3},? \d{1,2} \w{3} · 8 pm$/.test(whens.in9)
    && /^Ended \d{1,2} \w{3}$/.test(whens.ended) && whens.off === 'Called off', 'when: "' + [whens.today4, whens.tonight, whens.tomorrow, whens.in3, whens.in9, whens.ended, whens.off].join('", "') + '"');
  ok(whens.long === '2.5 hours' && whens.one === '1 hour' && whens.none === '', 'how long: "2.5 hours", "1 hour", and nothing when the host gave no end');
  let a = await audit(p, '#view-parties');
  ok(fine(a), 'the feed: every text on the four sizes and dark enough to read (' + a.n + ' pieces)' + (a.odd.length || a.low.length ? ' ' + JSON.stringify(a) : ''));
  await p.screenshot({ path: O + '/p34-feed.png', fullPage: true });
  // the lenses: each kind that is on near you
  const titles = () => p.evaluate(() => [...document.querySelectorAll('#pnBody .pn-card .pn-title')].map(x => x.textContent));
  await p.click('#pnLenses [data-pn-filter="k:games"]'); await p.waitForTimeout(350);
  const games = await titles(), pressed = await p.evaluate(() => [...document.querySelectorAll('#pnLenses [aria-pressed=true]')].map(x => x.textContent).join());
  ok(games.join() === 'Board games and chai' && pressed === '🎲 Game night', 'a lens for each kind of party that is on: "Game night" keeps the game night');
  await p.click('#pnLenses [data-pn-filter=all]'); await p.waitForTimeout(300);
  // the search: what, where, who; the box keeps the cursor while the cards change
  await p.click('#pnSearch'); await p.keyboard.type('potl', { delay: 40 }); await p.waitForTimeout(350);
  const s1 = { t: await titles(), focus: await p.evaluate(() => document.activeElement.id), val: await p.inputValue('#pnSearch'), line: await p.evaluate(() => (document.querySelector('.pn-sortline span') || {}).textContent) };
  await p.fill('#pnSearch', 'balewadi'); await p.waitForTimeout(350); const s2 = await titles();
  await p.fill('#pnSearch', 'meera'); await p.waitForTimeout(350); const s3 = await titles();
  await p.fill('#pnSearch', 'zzz'); await p.waitForTimeout(350);
  const s4 = await p.evaluate(() => ({ cards: document.querySelectorAll('#pnBody .pn-card').length, h: (document.querySelector('.pn-empty h3') || {}).textContent, t: (document.querySelector('.pn-empty p') || {}).textContent }));
  await p.click('.pn-empty [data-pn-filter=all]'); await p.waitForTimeout(350);
  const s5 = { t: await titles(), val: await p.inputValue('#pnSearch') };
  ok(s1.t.join() === 'Sunday potluck brunch' && s1.focus === 'pnSearch' && s1.val === 'potl' && s1.line === '1 of 3', 'search: "potl" finds the potluck as you type, the cursor stays in the box, and it says "1 of 3"');
  ok(s2.join() === 'India vs Australia on the big screen' && s3.join() === 'Sunday potluck brunch', 'search also looks at the area ("balewadi") and the host ("meera")');
  ok(!s4.cards && s4.h === 'Nothing for that' && /another word/.test(s4.t) && s5.t.length === 3 && s5.val === '', 'nothing found says so; "See all" clears the search');
  // the order
  await p.selectOption('#pnSort', 'fill'); await p.waitForTimeout(350); const fill = await titles();
  await p.evaluate(async () => { const all = demoNearParties(), x = all[0].near_geo, y = all[2].near_geo; await api.partyNearbySet(true, { lat: x.lat * .25 + y.lat * .75, lng: x.lng * .25 + y.lng * .75 }, 'Aundh side'); await renderParties(); });
  await p.waitForTimeout(600); await p.selectOption('#pnSort', 'near'); await p.waitForTimeout(350);
  const near = await p.evaluate(() => [...document.querySelectorAll('#pnBody .pn-card')].map(c => ({ t: c.querySelector('.pn-title').textContent, km: +c.querySelector('.pn-meta').textContent.match(/([\d.]+) km/)[1] })));
  await p.selectOption('#pnSort', 'soon'); await p.waitForTimeout(350); const soon = await titles();
  ok(fill[0] === 'India vs Australia on the big screen' && near.length >= 2 && near[0].t === 'Sunday potluck brunch' && near.every((x, i) => !i || x.km >= near[i - 1].km) && soon[0] === 'Board games and chai',
    'order: "Filling up" starts with the fullest, "Nearest first" with the nearest (' + near.map(x => x.km).join(', ') + ' km), "Soonest first" with the soonest');
  await p.evaluate(async () => { await api.partyNearbySet(true, { lat: 18.559, lng: 73.7868 }, 'Baner'); await renderParties(); }); await p.waitForTimeout(600);
  // the heart: kept on this phone, a lens of its own, and it never opens the party
  await p.click('#pnBody .pn-card .pn-save'); await p.waitForTimeout(450);
  const sv = await p.evaluate(() => ({ pressed: document.querySelector('#pnBody .pn-card .pn-save').getAttribute('aria-pressed'), page: $('dlgNear').open, saved: (state.partySaved || []).join(), lens: (document.querySelector('[data-pn-filter=saved]') || {}).textContent,
    toast: (document.querySelector('.toast') || {}).textContent }));
  await p.click('#pnLenses [data-pn-filter=saved]'); await p.waitForTimeout(350); const kept = await titles();
  await p.click('#pnBody .pn-card .pn-title'); await p.waitForTimeout(800);
  const svPage = await p.evaluate(() => ({ open: $('dlgNear').open, pressed: (document.querySelector('.near-hero .pn-save') || { getAttribute(){} }).getAttribute('aria-pressed') }));
  await p.click('.near-hero .pn-save'); await p.waitForTimeout(450);
  const unsv = await p.evaluate(() => ({ pressed: document.querySelector('.near-hero .pn-save').getAttribute('aria-pressed'), saved: (state.partySaved || []).length, open: $('dlgNear').open })); await closeDlgs(p); await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({ lens: !!document.querySelector('[data-pn-filter=saved]'), on: [...document.querySelectorAll('#pnLenses [aria-pressed=true]')].map(x => x.textContent).join(), cards: document.querySelectorAll('#pnBody .pn-card').length }));
  ok(sv.pressed === 'true' && !sv.page && sv.saved === 'NBPUN1' && sv.lens === '♥ Saved' && /Kept/.test(sv.toast) && kept.join() === 'Board games and chai', 'the heart keeps a party (on this phone) without opening it, and "Saved" becomes a lens: ' + sv.toast);
  ok(svPage.open && svPage.pressed === 'true' && unsv.pressed === 'false' && !unsv.saved && unsv.open && !after.lens && after.on === 'All' && after.cards === 3, 'the party\'s page has the same heart; taking it off there takes the lens away and shows them all again');
  // the keyboard
  await p.focus('#pnBody .pn-card .pn-open'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  const kb = await p.evaluate(() => ({ open: $('dlgNear').open, title: $('nearTitle').textContent }));
  ok(kb.open && kb.title === 'Board games and chai', 'with the keyboard: Enter on a card\'s title opens the party, as a tap does');

  // ------------------------------------------------------------ 2. a party's page
  const pg = await p.evaluate(() => { const b = $('nearBody'), q = s => b.querySelector(s), t = s => (q(s) || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(), bar = $('nearBar');
    return { hero: !!q('.near-hero .pc.big'), when: t('.near-hero .pn-when'), heart: !!q('.near-hero .pn-save'), kind: t('.near-kind').replace('Sample', '').trim(), line: t('.near-line'), going: t('.near-meter b'), spots: t('.near-meter p span'),
      meterW: Math.round(q('.near-meter .pn-bar i').getBoundingClientRect().width / q('.near-meter .pn-bar').getBoundingClientRect().width * 100), host: t('.near-host'), rows: [...b.querySelectorAll('.pt-details .pt-row b')].map(x => x.textContent),
      rowText: t('.pt-details'), steps: [...b.querySelectorAll('.near-steps li b')].map(x => x.textContent), actLast: q('#nearAct').previousElementSibling.classList.contains('near-steps'), form: !!$('nearAsk'),
      bar: bar && { hidden: bar.hidden, text: bar.textContent.replace(/\s+/g, ' ').trim(), sticky: getComputedStyle(bar).position, atFoot: Math.round($('dlgNear').getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom) }, order: [...b.children].map(x => x.id || x.className.split(' ')[0]).join(' > ') }; });
  ok(pg.hero && /^[A-Z]\w+day · 7 pm$/.test(pg.when) && pg.heart && pg.kind === 'Game night' && pg.line === 'Board games, cards and friendly fights over the rules.', 'the page opens on the party\'s cover, with when, the heart, the kind and what to expect: "' + pg.line + '"');
  ok(pg.going === '1 going' && pg.spots === '5 spots left of 6' && pg.meterW === 17 && /Hosted by Ananya/.test(pg.host) && /The \w+/.test(pg.host), 'then how full it is (' + pg.going + ', ' + pg.spots + ') and who\'s hosting');
  ok(pg.rows.length === 5 && pg.rows[1] === 'Baner, 0.5 km' && pg.rows[2] === 'Chip in ₹250' && pg.rows[3] === 'Women only' && pg.rows[4] === 'House rules' && /7:00 pm – 11:00 pm · 4 hours/.test(pg.rowText) && /The address is shared when the host accepts you/.test(pg.rowText)
    && /21\+ only · plus-ones count towards the spots/.test(pg.rowText), 'the facts: when and how long, the area (the address comes later), the entry, who it\'s for and 21+, the house rules');
  ok(pg.steps.join(' / ') === 'Ask to join / Ananya says yes / You get the address' && pg.actLast && pg.form, 'how joining works, in three steps, then the request form: ' + pg.steps.join(' → '));
  ok(pg.bar && !pg.bar.hidden && /^Chip in ₹250\s?5 spots left Ask to join$/.test(pg.bar.text) && pg.bar.sticky === 'sticky' && Math.abs(pg.bar.atFoot) <= 1, 'a bar at the foot of the page says the entry and the spots, with "Ask to join"');
  a = await audit(p, '#dlgNear');
  ok(fine(a), 'the party\'s page: every text on the four sizes and dark enough to read (' + a.n + ' pieces)' + (a.odd.length || a.low.length ? ' ' + JSON.stringify(a) : ''));
  await p.screenshot({ path: O + '/p34-page.png' });
  await p.click('#nearBar [data-near-jump]'); await p.waitForTimeout(1100);
  const jump = await p.evaluate(() => ({ focus: document.activeElement.id, hidden: $('nearBar').hidden, seen: (r => r.top >= 0 && r.bottom <= innerHeight)($('nearNote').getBoundingClientRect()) }));
  ok(jump.focus === 'nearNote' && jump.hidden && jump.seen, 'the bar takes you to the form with the cursor in the note, and steps aside once the form is in view');
  await p.evaluate(() => { window.__said = []; const say = window.toast; window.toast = m => { window.__said.push(m); say(m); }; });   // every short message from here on
  await p.fill('#nearNote', 'Board games fan!'); await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(800);
  const wait = await p.evaluate(() => ({ said: window.__said.join(' | '), tag: (document.querySelector('.near-hero .pn-st') || {}).textContent, top: $('nearAct').previousElementSibling.classList.contains('near-line'), steps: document.querySelectorAll('#nearBody .near-steps li').length, bar: !!$('nearBar'),
    last: $('nearBody').lastElementChild.className, text: $('nearAct').textContent.replace(/\s+/g, ' ').trim() }));
  ok(wait.tag === 'Asked to join' && wait.top && !wait.steps && !wait.bar && wait.last === 'near-report' && /^Asked to join/.test(wait.text) && /Withdraw my request/.test(wait.text),
    'once you\'ve asked, where you stand moves up under the cover ("' + wait.tag + '"); the steps and the bar go, and "Report this party" stays at the end');
  ok(wait.said === 'Asked! Ananya will let you know.', 'while the host has not answered, the short message says so: "' + wait.said + '"');
  await p.waitForTimeout(5600);
  const inn = await p.evaluate(() => { const pp = demoNearParties()[0]; return { said: window.__said.slice(1).join(' | '), hint: ($('nearAct').querySelector('.hint') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(), tag: (document.querySelector('.near-hero .pn-st.accepted') || {}).textContent, top: $('nearAct').previousElementSibling.classList.contains('near-line'), addr: $('nearAct').textContent.includes(pp.near_address),
    code: ($('nearAct').querySelector('.near-code b') || {}).textContent, going: document.querySelector('.near-meter b').textContent, spots: document.querySelector('.near-meter p span').textContent }; });
  ok(inn.tag === "You're in" && inn.top && inn.addr && /^[0-9A-F]{6}$/.test(inn.code) && inn.going === '2 going' && inn.spots === '4 spots left of 6', 'when the host says yes: "You\'re in", the address and your door code right under the cover, and the count moves to ' + inn.going);
  ok(inn.said === 'Ananya accepted you. The address is below.' && /^Ananya has your number too\. Can't make it after all\? Let them know\.$/.test(inn.hint),
    'and the short message then says "' + inn.said + '"; under the door code: "' + inn.hint + '"');

  // ------------------------------------------------------------ 3. "How was it?"
  await p.evaluate(() => { const pp = demoNearParties()[0]; pp.starts_at = new Date(Date.now() - 6 * 36e5).toISOString(); pp.ends_at = new Date(Date.now() - 36e5).toISOString(); $('dlgNear').close(); });
  await p.waitForTimeout(1200);
  const past = await p.evaluate(() => ({ hs: [...document.querySelectorAll('#pnBody .pn-h h2')].map(x => x.textContent), row: (document.querySelector('#pnBody .pn-past') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
    thumbs: document.querySelectorAll('#pnBody .pn-past .th').length, cards: [...document.querySelectorAll('#pnBody .pn-card .pn-title')].map(x => x.textContent), count: $('pnCount').textContent }));
  ok(past.hs.join() === 'Near you,How was it?' && /^🎲 Board games and chai\s?\w{3}, \d{1,2} \w{3}, .+ · hosted by Ananya$/.test(past.row) && past.thumbs === 2 && past.cards.length === 2 && !past.cards.includes('Board games and chai') && past.count === '2 parties',
    'a party you went to moves to "How was it?" when it ends, with the thumbs; it is no longer among the parties to join: ' + past.row);
  await p.click('#pnBody .pn-past [data-up="1"]'); await p.waitForTimeout(900);
  const rated = await p.evaluate(() => ({ n: api.ratings().length, up: api.ratings()[0] && api.ratings()[0].up, pressed: document.querySelector('#pnBody .pn-past [data-up="1"]').getAttribute('aria-pressed'), page: $('dlgNear').open }));
  await p.click('#pnBody .pn-past .nc-main'); await p.waitForTimeout(800);
  const pastPage = await p.evaluate(() => ({ open: $('dlgNear').open, rate: !!document.querySelector('#nearAct .near-rate'), when: document.querySelector('.near-hero .pn-when').textContent.trim() })); await closeDlgs(p); await p.waitForTimeout(700);
  await p.evaluate(async () => { const pp = demoNearParties()[0]; pp.starts_at = new Date(Date.now() - 5 * 864e5).toISOString(); pp.ends_at = new Date(Date.now() - 4 * 864e5).toISOString(); await renderParties(); }); await p.waitForTimeout(500);
  const gone = await p.evaluate(() => !document.querySelector('#pnBody .pn-past'));
  ok(rated.n === 1 && rated.up === true && rated.pressed === 'true' && !rated.page && pastPage.open && pastPage.rate && /^Ended /.test(pastPage.when) && gone,
    'a thumbs up there is saved without opening the party; the row opens its page ("' + pastPage.when + '"); three days on it leaves the list');
  await ctx.close();

  // ------------------------------------------------------------ 3b. a sample host whose yes comes back at once
  // On the live site the database answers for a sample host (Kamal's 15 sample parties, 18 Nov): the request comes
  // back accepted, with a door code and no number. The short message used to say "Asked! ... will let you know."
  // over a page that already said "You're in!" (Kamal, 18 Nov: "F8x wrong short message"). The demo's own sample
  // hosts take a few seconds, so this stands the live answer in for one of them.
  ({ ctx, p } = await open(b, person('9822200035', 'Lata', 'female'), 390, 844));
  await p.evaluate(() => { window.__said = []; const say = window.toast; window.toast = m => { window.__said.push(m); say(m); };
    const ask = api.partyRequest; api.partyRequest = async function(...a){ await ask.apply(this, a);
      this.partyReqs().forEach(r => { if(r.sampleDecideAt) r.sampleDecideAt = 1; }); this.sampleDecide();   // due already
      const pp = this.nearFind(a[0]); pp.host_phone = null; return this.partyNearJson(pp); }; });
  await p.evaluate(() => openNear('NBPUN2')); await p.waitForTimeout(900);
  await p.fill('#nearNote', 'See you there'); await p.click('[data-near-plus="1"]'); await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(800);
  const once = await p.evaluate(() => ({ said: window.__said.join(' | '), onScreen: (document.querySelector('.toast') || {}).textContent, tag: (document.querySelector('.near-hero .pn-st.accepted') || {}).textContent,
    text: $('nearAct').textContent.replace(/\s+/g, ' ').trim(), hint: ($('nearAct').querySelector('.hint') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
    code: ($('nearAct').querySelector('.near-code b') || {}).textContent, call: !!$('nearAct').querySelector('.near-call'), sample: !!$('dlgNear').querySelector('.smp'), form: !!$('nearAsk') }));
  ok(once.said === 'Kabir accepted you. The address is below.' && once.onScreen === once.said && once.tag === "You're in" && /^You're in! Kabir accepted you\./.test(once.text) && /^[0-9A-F]{6}$/.test(once.code) && !once.form,
    'a sample host that says yes at once: the short message is "' + once.said + '", never "will let you know", over the page that says "' + once.tag + '"');
  ok(once.sample && !once.call && once.hint === "A sample host, so no numbers are shared. You're bringing 1 more. Can't make it after all? Let them know." && !/has your number/.test(once.text),
    'and with no number to call, the line under the door code no longer says the host has yours: "' + once.hint + '"');
  await p.waitForTimeout(5200);
  const later = await p.evaluate(() => ({ said: window.__said.length, tag: (document.querySelector('.near-hero .pn-st.accepted') || {}).textContent }));
  ok(later.said === 1 && later.tag === "You're in", 'nothing more is said afterwards: one short message for one answer');
  await closeDlgs(p); await ctx.close();

  // ------------------------------------------------------------ 4. host a party, in one screen
  ({ ctx, p } = await open(b, person('9822200032', 'Isha', 'female', { partyRulesAt: undefined, partyRulesV: undefined }), 390, 844));
  await p.click('#pnWhere [data-host-party]'); await p.waitForTimeout(800);
  const prev = () => p.evaluate(() => { const c = document.querySelector('#hpPrev .pn-card'), t = s => (c.querySelector(s) || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim();
    return { title: t('.pn-title'), kind: t('.pn-kind'), when: t('.pn-when'), meta: t('.pn-meta'), chips: [...c.querySelectorAll('.pn-chips i')].map(x => x.textContent).join(), going: t('.pn-going'), host: t('.pn-host b'), emoji: t('.pc-emoji'),
      sum: $('hpSumT').textContent + ' | ' + $('hpSumS').textContent, field: $('hpTitle').value }; });
  const h0 = await p.evaluate(() => ({ open: $('dlgFs').open, title: $('fsdTitle').textContent, sub: $('fsdSub').textContent, cap: document.querySelector('.hp-cap').textContent, still: !document.querySelector('#hpPrev [data-near], #hpPrev button, #hpPrev [tabindex], #hpPrev a'),
    hidden: $('hpPrev').getAttribute('aria-hidden'), days: [...document.querySelectorAll('[data-hp-day]')].map(x => x.textContent), kinds: document.querySelectorAll('[data-hp-occ]').length, lens: [...document.querySelectorAll('[data-hp-len]')].map(x => x.textContent).join(),
    tick: !!$('hpRulesOk'), rules: !!document.querySelector('#hpForm .party-rules'), bar: getComputedStyle(document.querySelector('.hp-bar')).position, btn: document.querySelector('#hpForm [type=submit]').textContent, firstIsPrev: $('hpForm').children[1].id })), p0 = await prev();
  ok(h0.open && h0.title === 'Host a party' && h0.cap === 'How people nearby will see it' && h0.firstIsPrev === 'hpPrev' && h0.still && h0.hidden === 'true', '"Host a party" opens one sheet, and at its top the card people nearby will see (a picture of it: nothing on it can be tapped)');
  ok(p0.title === "House party at Isha's" && p0.field === p0.title && p0.kind === 'House party' && / · 8 pm$/.test(p0.when) && p0.meta === 'Your area 4 hours' && p0.chips === 'Free entry' && /Be the first to ask 6 spots left/.test(p0.going) && p0.host === 'Hosted by Isha'
    && p0.sum === p0.title + ' | ' + p0.when + ' · 6 spots', 'it starts filled in: "' + p0.title + '", ' + p0.when + ', 4 hours, 6 guests, free; the line by the button says the same');
  ok(h0.days.length === 8 && h0.days[0] === 'Today' && h0.days[1] === 'Tomorrow' && /^\w{3} \d{1,2}$/.test(h0.days[2]) && h0.days[7] === 'Another day' && h0.kinds === 15 && h0.lens === '2 hours,3 hours,4 hours,5 hours,Open end' && h0.tick && h0.rules && h0.bar === 'sticky' && h0.btn === 'Open the party',
    'the day is a tap (Today, Tomorrow, the week ahead, or another day), so are the 15 kinds and how long; the party rules and the 21+ tick are there');
  // the card follows what you fill in
  await p.click('[data-hp-occ=games]'); await p.waitForTimeout(200); const p1 = await prev();
  await p.fill('#hpTitle', 'Catan and chai'); await p.click('[data-hp-occ=potluck]'); await p.waitForTimeout(200); const p2 = await prev();
  await p.click('[data-hp-day] >> nth=1'); await p.fill('#hpStart', '19:30'); await p.click('[data-hp-len="2"]'); await p.waitForTimeout(200); const p3 = await prev();
  await p.click('[data-hp-len="0"]'); await p.waitForTimeout(200); const p4 = await prev(); await p.click('[data-hp-len="3"]');
  await p.click('[data-hp-limit="1"]'); await p.click('[data-hp-limit="1"]'); await p.evaluate(() => { document.querySelector('[name=hpWho][value=female]').click(); document.querySelector('[name=hpEntry][value=chip]').click(); });
  await p.fill('#hpChip', '200'); await p.fill('#hpArea', 'Baner'); await p.waitForTimeout(250);
  const p5 = await prev(), chipBox = await p.evaluate(() => !$('hpChipBox').hidden);
  ok(p1.title === "Game night at Isha's" && p1.kind === 'Game night' && p1.emoji === '🎲' && p2.title === 'Catan and chai' && p2.kind === 'Potluck' && p2.emoji === '🍲', 'picking a kind names the party and redraws the cover; a title you typed is left alone when the kind changes');
  ok(p3.when === 'Tomorrow · 7:30 pm' && /2 hours/.test(p3.meta) && !/hours/.test(p4.meta), 'the day, the time and how long show on the card as you set them ("' + p3.when + '", 2 hours; "Open end" shows no length)');
  ok(chipBox && p5.chips === 'Chip in ₹200,Women only' && /8 spots left/.test(p5.going) && /^Baner 3 hours$/.test(p5.meta) && p5.sum === 'Catan and chai | Tomorrow · 7:30 pm · 8 spots', 'and so do the guests (8), who it\'s for, the chip-in and the area: ' + p5.chips);
  a = await audit(p, '#dlgFs');
  ok(fine(a), 'the host\'s sheet: every text on the four sizes and dark enough to read (' + a.n + ' pieces)' + (a.odd.length || a.low.length ? ' ' + JSON.stringify(a) : ''));
  await p.evaluate(() => { $('dlgFs').scrollTop = 0; }); await p.screenshot({ path: O + '/p34-host.png' });
  // what is missing is said in words, one thing at a time, and nothing is saved until it is all there
  const submit = async () => { await p.click('#hpForm [type=submit]'); await p.waitForTimeout(500); return p.evaluate(() => ({ err: (document.querySelector('#hpForm .form-err') || {}).textContent || '', open: $('dlgFs').open })); };
  await p.fill('#hpLimit', '1'); const e1 = await submit();
  await p.fill('#hpLimit', '8'); await p.fill('#hpCoverOther', 'two beer crates'); const e2 = await submit();
  await p.fill('#hpCoverOther', ''); const e3 = await submit();
  await p.evaluate(() => { hpx.nearGeo = { lat: 18.5634, lng: 73.7841 }; $('hpAddr').value = 'B-12 Green Woods, Baner Road, Pune'; hpPinNote(); hpDraw(); }); const e4 = await submit();
  const none = await p.evaluate(async () => (await api.splitGroups()).filter(g => g.kind === 'party').length);
  ok(/2 to 50/.test(e1.err) && /Alcohol can't be part of the chip-in/.test(e2.err) && /pick it from the list/.test(e3.err) && /21 or older/.test(e4.err) && e4.open && !none,
    'what is missing is said in words: the guest limit, no alcohol in the chip-in, the address from the list, the 21+ tick; nothing is made until then');
  await p.evaluate(() => $('hpRulesOk').click()); await p.click('#hpForm [type=submit]'); await p.waitForTimeout(1500);
  const made = await p.evaluate(async () => { const g = (await api.splitGroups()).find(x => x.name === 'Catan and chai'), party = g && await api.partyForGroup(g.id), o = g && await api.partyOpenFor(g.id), tm = new Date(); tm.setDate(tm.getDate() + 1); tm.setHours(19, 30, 0, 0);
    const row = document.querySelector('#pnBody a.near-card');
    return { open: $('dlgFs').open, toast: (document.querySelector('.toast') || {}).textContent, kind: g && g.kind, emoji: g && g.emoji, occ: party && party.occasion, starts: party && party.starts_at === tm.toISOString(), hours: party && (new Date(party.ends_at) - new Date(party.starts_at)) / 36e5,
      plus: party && party.plus_ones, place: party && party.place, o: o && { open: o.open, guest_limit: o.guest_limit, entry: o.entry, entry_chip: o.entry_chip, who: o.who, radius_km: o.radius_km, area: o.area, pin: !!o.near_geo, addr: o.near_address },
      rules: (await api.partyNearbyMe()).rules_ok, hs: [...document.querySelectorAll('#pnBody .pn-h h2')].map(x => x.textContent), row: row && row.textContent.replace(/\s+/g, ' ').trim(), href: row && row.getAttribute('href'), underline: row && getComputedStyle(row).textDecorationLine,
      mine: (await api.partyNearby()).some(x => x.title === 'Catan and chai'), groups: (await api.splitGroups()).filter(x => x.kind === 'party').length }; });
  ok(!made.open && /open to people nearby/.test(made.toast) && made.kind === 'party' && made.emoji === '🍲' && made.occ === 'potluck' && made.starts && made.hours === 3 && made.plus === true && made.place === 'home' && made.groups === 1,
    'with everything there the party is made (its group in Splits, the party, then opened): ' + made.toast);
  ok(made.o && made.o.open && made.o.guest_limit === 8 && made.o.entry === 'chip' && made.o.entry_chip === 200 && made.o.who === 'female' && made.o.radius_km === 3 && made.o.area === 'Baner' && made.o.pin && /Green Woods/.test(made.o.addr) && made.rules === true,
    'it is open to people nearby the way the sheet said, and the party rules are agreed: ' + JSON.stringify(made.o));
  ok(made.hs[0] === "You're hosting" && /Catan and chai/.test(made.row) && /Open to people nearby/.test(made.row) && /^#splits\//.test(made.href) && made.underline === 'none' && !made.mine,
    'it shows under "You\'re hosting" (a card, not underlined) and leads to its group; your own party is not among the ones to join');
  await p.click('#pnBody .pn-hostcta [data-host-party]'); await p.waitForTimeout(700);
  const again = await p.evaluate(() => ({ title: $('hpTitle').value, tick: !!$('hpRulesOk') }));
  await p.click('#hpForm [data-fs-event=party]'); await p.waitForTimeout(700);
  ok(again.title === "House party at Isha's" && !again.tick && await p.evaluate(() => $('dlgFs').open && $('fsdTitle').textContent === 'New house party'),
    'the next time the sheet starts fresh and the tick is not asked again; "Make an invite card instead" leads to a party for friends and flatmates only');
  await closeDlgs(p); await ctx.close();

  // ------------------------------------------------------------ 5. the map
  ({ ctx, p } = await open(b, person('9822200033', 'Mira', 'female'), 390, 844));
  const osm = () => p.evaluate(() => { Geo.google = false; });   // the bundled map; Google's needs its own servers
  await osm();
  const view0 = await p.evaluate(() => ({ list: document.querySelector('[data-pn-view=list]').getAttribute('aria-pressed'), map: document.querySelector('[data-pn-view=map]').getAttribute('aria-pressed') }));
  await p.click('[data-pn-view=map]'); await p.waitForTimeout(2600);
  const mp = await p.evaluate(() => { const all = demoNearParties(), list = pnData.list, json = JSON.stringify(list), r = document.querySelector('#pnBody .pn-h-near').getBoundingClientRect();
    return { pressed: document.querySelector('[data-pn-view=map]').getAttribute('aria-pressed'), view: state.pnView, pins: [...document.querySelectorAll('#pnMapEl .pn-pin')].map(x => x.textContent), me: (document.querySelector('#pnMapEl .pn-me') || {}).textContent,
      rings: document.querySelectorAll('#pnMapEl .leaflet-overlay-pane path').length, ring: (document.querySelector('#pnMapEl .leaflet-overlay-pane path') || { getAttribute(){} }).getAttribute('stroke'), hint: $('pnMapHint').textContent, cards: document.querySelectorAll('#pnBody .pn-card').length,
      card: $('pnMapCard').hidden, lenses: document.querySelectorAll('#pnLenses [data-pn-filter]').length, top: Math.round(r.top), h: Math.round($('pnMapEl').getBoundingClientRect().height),
      zones: list.map(x => x.zone && x.zone.lat + ',' + x.zone.lng).join(' '), rounded: list.every(x => { const g = all.find(y => y.code === x.code).near_geo; return x.zone.lat === Math.round(g.lat * 100) / 100 && x.zone.lng === Math.round(g.lng * 100) / 100 && (x.zone.lat !== g.lat || x.zone.lng !== g.lng); }),
      leak: list.some(x => 'near_geo' in x || 'geo' in x || 'address' in x || 'near_address' in x || 'host_phone' in x) || all.some(y => json.includes(String(y.near_geo.lat)) || json.includes(String(y.near_geo.lng)) || json.includes(y.host_phone)) }; });
  ok(view0.list === 'true' && view0.map === 'false' && mp.pressed === 'true' && mp.view === 'map' && !mp.cards && mp.lenses === 7, 'List or Map by "Near you": the map takes the place of the cards, under the same lenses');
  ok(mp.pins.join() === '🎲,🏏,🍲' && mp.me === 'You' && mp.rings === 3 && /^#C2410C$/i.test(mp.ring) && mp.card && mp.h >= 320, 'on the map: a mark for each party (its kind\'s emoji) in the middle of an orange circle, and "You" where you measure from');
  ok(/Each circle is an area about a kilometre across, not the flat\. The address comes when the host says yes\./.test(mp.hint), 'the line under the map says what a circle is: ' + mp.hint);
  ok(mp.rounded && !mp.leak, 'what the app holds for the map is each party\'s spot rounded to two decimals (' + mp.zones + '), never its pin, address or number');
  ok(mp.top >= 60 && mp.top <= 110, 'on a phone, picking Map brings the map up under the top bar (the "Near you" line at ' + mp.top + 'px)');
  a = await audit(p, '#view-parties');
  ok(fine(a), 'the map view: every text on the four sizes and dark enough to read (' + a.n + ' pieces)' + (a.odd.length || a.low.length ? ' ' + JSON.stringify(a) : ''));
  await p.screenshot({ path: O + '/p34-map.png' });
  // tap a mark: its card over the map; tap the card: the party
  await p.click('#pnMapEl .pn-pin'); await p.waitForTimeout(400);
  const mc = await p.evaluate(() => { const c = $('pnMapCard'), r = c.getBoundingClientRect(), m = $('pnMapEl').getBoundingClientRect(); return { hidden: c.hidden, text: c.textContent.replace(/\s+/g, ' ').trim(), on: document.querySelectorAll('.pn-pin.on').length,
    inside: r.top >= m.top && r.bottom <= m.bottom && r.left >= m.left && r.right <= m.right, atTop: Math.round(r.top - m.top), rows: c.querySelectorAll('button[data-near]').length }; });
  ok(!mc.hidden && mc.rows === 1 && /Board games and chai\s?[A-Z]\w+day · 7 pm · Baner, 0\.5 km\s?Chip in ₹250 · 5 spots left See$/.test(mc.text) && mc.on === 1 && mc.inside && mc.atTop <= 16, 'tap a mark: its party on a card over the top of the map, the mark picked out: ' + mc.text);
  await p.click('#pnMapCard [data-pn-unpin]'); await p.waitForTimeout(300);
  const closed = await p.evaluate(() => $('pnMapCard').hidden && !document.querySelector('.pn-pin.on'));
  await p.click('#pnMapEl .pn-pin'); await p.waitForTimeout(300); await p.click('#pnMapCard [data-near]'); await p.waitForTimeout(800);
  const opened = await p.evaluate(() => ({ open: $('dlgNear').open, title: $('nearTitle').textContent })); await closeDlgs(p); await p.waitForTimeout(1500);
  const back = await p.evaluate(() => ({ map: !!$('pnMapEl'), pins: document.querySelectorAll('#pnMapEl .pn-pin').length, card: !$('pnMapCard').hidden }));
  ok(closed && opened.open && opened.title === 'Board games and chai' && back.map && back.pins === 3 && back.card, 'the × puts the card away; tapping the card opens the party, and closing it brings you back to the map with the same mark picked');
  // the lenses and the search work on the map
  await p.click('#pnLenses [data-pn-filter=free]'); await p.waitForTimeout(500);
  const mFree = await p.evaluate(() => ({ pins: [...document.querySelectorAll('#pnMapEl .pn-pin')].map(x => x.textContent).join(), rings: document.querySelectorAll('#pnMapEl .leaflet-overlay-pane path').length, card: $('pnMapCard').hidden }));
  await p.click('#pnLenses [data-pn-filter=all]'); await p.fill('#pnSearch', 'potluck'); await p.waitForTimeout(500);
  const mFind = await p.evaluate(() => [...document.querySelectorAll('#pnMapEl .pn-pin')].map(x => x.textContent).join());
  await p.fill('#pnSearch', 'zzz'); await p.waitForTimeout(500);
  const mNone = await p.evaluate(() => ({ pins: document.querySelectorAll('#pnMapEl .pn-pin').length, hint: $('pnMapHint').textContent, me: !!document.querySelector('#pnMapEl .pn-me') }));
  await p.fill('#pnSearch', ''); await p.waitForTimeout(500);
  ok(mFree.pins === '🏏' && mFree.rings === 1 && mFree.card && mFind === '🍲' && !mNone.pins && mNone.me && /Nothing for that on the map/.test(mNone.hint), 'the lenses and the search work on the map too: "Free entry" leaves the match screening, "potluck" the potluck, and nothing found says so');
  // parties in the same square share a mark
  await p.evaluate(async () => { const all = demoNearParties(); all[1].near_geo = { lat: all[0].near_geo.lat + .001, lng: all[0].near_geo.lng + .001 }; await renderParties(); }); await p.waitForTimeout(1800);
  const two = await p.evaluate(() => ({ pins: [...document.querySelectorAll('#pnMapEl .pn-pin')].map(x => x.textContent.replace(/\s+/g, '')), rings: document.querySelectorAll('#pnMapEl .leaflet-overlay-pane path').length }));
  await p.click('#pnMapEl .pn-pin:has(i)'); await p.waitForTimeout(400);
  const twoCard = await p.evaluate(() => [...document.querySelectorAll('#pnMapCard [data-near] b')].map(x => x.textContent));
  ok(two.pins.length === 2 && two.pins.some(x => /2$/.test(x)) && two.rings === 2 && twoCard.length === 2 && twoCard.includes('Board games and chai') && twoCard.includes('India vs Australia on the big screen'),
    'two parties in the same square share one mark with a "2", and its card lists both: ' + twoCard.join(' / '));
  // a party the server sends no spot for (an older server) stays off the map, and the line says so
  await p.evaluate(async () => { const orig = api.partyNearby.bind(api); api.partyNearby = async () => (await orig()).map(x => x.code === 'NBPUN3' ? Object.assign({}, x, { zone: null }) : x); await renderParties(); }); await p.waitForTimeout(1500);
  const noZone = await p.evaluate(() => ({ pins: document.querySelectorAll('#pnMapEl .pn-pin').length, hint: $('pnMapHint').textContent }));
  ok(noZone.pins === 1 && /1 party isn't on the map yet: switch to List to see it\./.test(noZone.hint), 'a party with no spot for the map stays off it, and the line under the map says to look in the List');
  // back to the list; the choice is remembered; if the map can't load, it says so and the list still works
  await p.click('[data-pn-view=list]'); await p.waitForTimeout(500);
  const list = await p.evaluate(() => ({ cards: document.querySelectorAll('#pnBody .pn-card').length, map: !!$('pnMapEl'), view: state.pnView }));
  await p.click('[data-pn-view=map]'); await p.waitForTimeout(600);
  await p.reload(); await p.waitForTimeout(2800); await closeDlgs(p); await p.waitForTimeout(400);   // a fresh load: Google's map, which cannot be reached here
  const fail = await p.evaluate(() => ({ view: state.pnView, map: !!$('pnMapEl'), hint: ($('pnMapHint') || {}).textContent, pins: document.querySelectorAll('#pnMapEl .pn-pin').length }));
  await p.click('[data-pn-view=list]'); await p.waitForTimeout(500);
  const listAgain = await p.evaluate(() => document.querySelectorAll('#pnBody .pn-card').length);
  ok(list.cards === 3 && !list.map && list.view === 'list' && fail.view === 'map' && fail.map && /Couldn't load the map\. Check your connection and try again, or switch to List\./.test(fail.hint) && listAgain === 3,
    'List brings the cards back; Map is remembered next time; and when the map can\'t load it says so and the List still works');
  await ctx.close();
  // on a computer: the map is in the page, the card clear of the zoom buttons
  ({ ctx, p } = await open(b, person('9822200034', 'Tara', 'female'), 1280, 860));
  await osm(); await p.click('[data-pn-view=map]'); await p.waitForTimeout(2600); await p.click('#pnMapEl .pn-pin'); await p.waitForTimeout(400);
  const wide = await p.evaluate(() => { const m = $('pnMapEl').getBoundingClientRect(), c = $('pnMapCard').getBoundingClientRect(), z = document.querySelector('#pnMapEl .leaflet-control-zoom').getBoundingClientRect();
    return { h: Math.round(m.height), w: Math.round(m.width), pins: document.querySelectorAll('#pnMapEl .pn-pin').length, clear: c.left >= z.right, y: Math.round(scrollY), search: Math.round($('pnSearch').closest('.pn-search').getBoundingClientRect().width) }; });
  ok(wide.h === 520 && wide.w > 900 && wide.pins === 3 && wide.clear && !wide.y && wide.search <= 460, 'on a computer the map is 520px tall across the page, the card sits clear of the zoom buttons, and the page doesn\'t jump: ' + JSON.stringify(wide));
  await p.screenshot({ path: O + '/p34-map-wide.png' });
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
