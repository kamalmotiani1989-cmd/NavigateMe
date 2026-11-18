// Parties as a section of its own, and the two-layer top on every main screen (Kamal, 15 Nov; demo mode, port 8765):
// "Make parties near by a seperate section all together and an amazing one. Also work on the entire design and UI…
// The double color shade looks super amazing and the bottow bar looks cool". The rules for parties are the ones they
// had: off until you switch it on, 21 and over, the address and number only after the host says yes (p9 walks those).
// Since the look of 17 Nov 2026 (the reels') the band at the top of every screen is the page's own cream, flat, with no
// sheet coming up over it (each screen had its own tint until then); the top bar is still part of it.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const person = (phone, name, gender, more) => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone, name, role:'seeker', gender, occupation:{ type:'working', what:'Analyst' } }, account:phone,
  onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Pune', areas:['Baner'] }, profilePromoHidden: Date.now() + 9e9, partyRulesAt:'2026-11-01T00:00:00.000Z', partyRulesV:2,
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true }, more || {});
const listing = { id:'mine-p27', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }], interests:{ music:['Indie'], hobbies:[] } }, vibe),
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } };
const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents: 1 }, vibe), myListings:[listing], requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3), passes:{ escape: iso(now + 7 * 864e5) } };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const open = async (b, st, w, h, hash) => { const ctx = await b.newContext({ viewport:{ width:w, height:h } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => {})); await p.goto(U + '#' + hash); await p.waitForTimeout(1700); await closeDlgs(p); await p.waitForTimeout(250); return { ctx, p }; };
// the band of the screen that's showing: its colour, that it joins the top bar, that it is flat with no sheet over it, how dark its words are
const band = p => p.evaluate(() => { const tok = n => { const d = document.createElement('i'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
  const el = [...document.querySelectorAll('#appMain > section:not([hidden]) .home-band')].find(e => e.offsetParent), head = $('appHead'), r = e => e.getBoundingClientRect();
  const T = { lav: tok('--lav'), butter: tok('--butter'), mint: tok('--mint'), blush: tok('--blush'), page: tok('--bg'), soft: tok('--orange-soft') };
  if(!el) return { band: false, onBand: head.classList.contains('on-band'), headBg: getComputedStyle(head).backgroundColor, T };
  const cs = getComputedStyle(el), after = getComputedStyle(el, '::after'), rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const bgOf = e => { for(let x = e; x && x !== el; x = x.parentElement){ const c = rgb(getComputedStyle(x).backgroundColor); if(c.length >= 3 && (c[3] === undefined || c[3] > .5)) return c; } return rgb(cs.backgroundColor); };
  const texts = [...el.querySelectorAll('*')].filter(e => e.offsetParent && !e.closest('svg, [aria-hidden="true"]') && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const low = texts.map(e => { const a = lum(rgb(getComputedStyle(e).color)), c = lum(bgOf(e)), big = parseFloat(getComputedStyle(e).fontSize) >= 18.5 || (parseFloat(getComputedStyle(e).fontSize) >= 14 && +getComputedStyle(e).fontWeight >= 700);
    return { ratio: (Math.max(a, c) + .05) / (Math.min(a, c) + .05), need: big ? 3 : 4.5, t: e.textContent.trim().slice(0, 24) }; }).filter(x => x.ratio < x.need);
  return { band: true, colour: cs.backgroundColor === T.page ? 'page' : cs.backgroundColor, flat: cs.backgroundImage === 'none', tints: ['lav', 'butter', 'mint', 'blush', 'soft'].every(k => T[k] === T.page), left: Math.round(r(el).left), right: Math.round(innerWidth - r(el).right), gap: Math.round(r(el).top - r(head).bottom),
    onBand: head.classList.contains('on-band'), headSame: getComputedStyle(head).backgroundColor === cs.backgroundColor, sheet: after.display !== 'none' && after.content !== 'none', low, T }; });
const tab = p => p.evaluate(() => { const c = document.querySelector('#nav .tab[aria-current=true]'); return c && { view: c.dataset.view, bg: getComputedStyle(c).backgroundColor }; });
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ Parties: its own tab and screen
  let { ctx, p } = await open(b, person('9822200011', 'Asha', 'female'), 390, 844, 'parties');
  let B = await band(p), t = await tab(p);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('#nav .tab')].filter(x => x.offsetParent).map(x => x.textContent.trim()));
  ok(tabs.join() === 'Discover,Tribe,Parties,Splits,Market' && t.view === 'parties' && t.bg === B.T.soft && B.T.soft === 'rgb(255, 244, 232)', 'Parties has its own place in the bottom bar, the cream pill when you\'re on it: ' + tabs.join(' · '));
  ok(B.band && B.colour === 'page' && B.flat && B.tints && !B.left && !B.right && Math.abs(B.gap) <= 1 && B.onBand && B.headSame && !B.sheet && !B.low.length, 'the Parties screen opens on the page\'s cream band, flat (butter until 17 Nov), the top bar part of it, no sheet over it, words dark: ' + JSON.stringify({ colour: B.colour, gap: B.gap }));
  // off until you switch it on: what it is, in three lines, and the switch; nothing listed
  const off = await p.evaluate(() => ({ intro: !!document.querySelector('#pnBody .pn-intro'), points: document.querySelectorAll('#pnBody .pn-points li').length, btn: (document.querySelector('#pnBody [data-near-on]') || {}).textContent,
    cards: document.querySelectorAll('#pnBody .pn-card').length, hint: (document.querySelector('#pnBody .pn-intro .hint') || {}).textContent, where: $('pnWhere').textContent, host: !!document.querySelector('#pnBody [data-host-party]'), rules: !!document.querySelector('#pnBody .party-rules') }));
  ok(off.intro && off.points === 3 && off.btn === 'Show me parties near me' && !off.cards && /Off until you switch it on\. 21 and over\./.test(off.hint) && !off.where && off.host && off.rules,
    'off by default: three lines on what it is, the switch, "21 and over", the rules and "Host a party"; no parties listed');
  await p.screenshot({ path: O + '/p27-parties-off.png' });
  await p.goto(U + '#splits'); await p.waitForTimeout(1200); await closeDlgs(p);
  ok(await p.evaluate(() => !document.querySelector('#view-splits .pn-card, #view-splits .near-card, #view-splits .near-promo, #view-splits [data-near-on]')), 'Splits no longer lists parties nearby');
  // switched on (the place is picked once: p9 walks the picker): the parties in reach, as cards
  await p.goto(U + '#parties'); await p.waitForTimeout(1200); await closeDlgs(p);
  await p.evaluate(async () => { await api.partyNearbySet(true, { lat: 18.559, lng: 73.7868 }, 'Baner'); await renderParties(); }); await p.waitForTimeout(600);
  const on = await p.evaluate(() => { const all = demoNearParties(), cards = [...document.querySelectorAll('#pnBody .pn-card')];
    return { where: $('pnWhere').textContent.replace(/\s+/g, ' ').trim(), count: (document.querySelector('#pnBody .pn-h span') || {}).textContent, filters: [...document.querySelectorAll('#pnBody [data-pn-filter]')].map(x => x.textContent).join(),
      cards: cards.map(c => ({ when: c.querySelector('.pn-when').textContent.trim(), title: c.querySelector('.pn-title').textContent, kind: (c.querySelector('.pn-kind') || { textContent: '' }).textContent.replace('Sample', '').trim(), text: c.textContent.replace(/\s+/g, ' ').trim(),
        leak: all.some(x => c.textContent.includes(x.near_address.split(',')[0]) || c.textContent.includes(x.host_phone)) })) }; });
  ok(on.where === 'Near Baner · Change Host a party' && on.count === '3 parties' && on.filters === 'All,Today,This weekend,Free entry,🎲 Game night,🏏 Match screening,🍲 Potluck' && on.cards.length === 3,
    'switched on: "' + on.where + '", ' + on.count + ', with Today / This weekend / Free entry and the kinds that are on: ' + on.filters);
  ok(on.cards.every(c => /^(Tonight|Today|Tomorrow|[A-Z]\w+day|\w{3},? \d{1,2} \w{3}) · \d{1,2}(:\d\d)? [ap]m$/.test(c.when) && /\d\.\d km/.test(c.text) && /4 hours/.test(c.text) && /(Free entry|Chip in ₹)/.test(c.text) && /(spots? left|Full)/.test(c.text)
      && /(\d+ going|Be the first to ask)/.test(c.text) && /Hosted by \w+/.test(c.text) && !c.leak),
    'each card shows when (the way people say it), what it is, how far and how long, what it costs, who\'s going, the spots and the host; never an address or a number: ' + on.cards.map(c => c.when + ' ' + c.title).join(' / '));
  ok(on.cards.every(c => c.kind.toLowerCase() !== c.title.toLowerCase()) && on.cards.some(c => c.kind === 'Game night'), 'the kind of party is named when the title doesn\'t already say it');
  const type = await p.evaluate(() => { const odd = new Set(); document.querySelectorAll('#view-parties *').forEach(e => { if(!e.offsetParent || e.closest('svg') || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const s = parseFloat(getComputedStyle(e).fontSize); if(s >= 12 && s <= 21 && ![12.5, 14, 16, 21].includes(s)) odd.add(s + ' ' + e.className); }); return [...odd]; });
  ok(!type.length, 'the Parties screen keeps to the four text sizes: ' + type.join(', '));
  await p.screenshot({ path: O + '/p27-parties-on.png', fullPage: true });
  // filters
  await p.click('#pnBody [data-pn-filter=free]'); await p.waitForTimeout(400);
  const free = await p.evaluate(() => [...document.querySelectorAll('#pnBody .pn-card')].map(c => c.textContent.replace(/\s+/g, ' ')));
  await p.click('#pnBody [data-pn-filter=today]'); await p.waitForTimeout(400);
  const today = await p.evaluate(() => ({ cards: document.querySelectorAll('#pnBody .pn-card').length, empty: (document.querySelector('#pnBody .pn-empty h3') || {}).textContent, all: !!document.querySelector('#pnBody .pn-empty [data-pn-filter=all]') }));
  ok(free.length === 1 && /Free entry/.test(free[0]) && !today.cards && today.empty === 'Nothing for that' && today.all, '"Free entry" keeps the free one; "Today" has none and offers "See all"');
  await p.click('#pnBody .pn-empty [data-pn-filter=all]'); await p.waitForTimeout(400);
  // ask to join one: back on the list it sits under "Your parties"
  await p.click('#pnBody .pn-card'); await p.waitForTimeout(700);
  const dlg = await p.evaluate(() => ({ open: $('dlgNear').open, title: $('nearTitle').textContent }));
  await p.fill('#nearNote', 'Board games fan!'); await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(700);
  await p.evaluate(() => $('dlgNear').close()); await p.waitForTimeout(900);
  const mine = await p.evaluate(() => { const hs = [...document.querySelectorAll('#pnBody .pn-h h2')].map(x => x.textContent), first = document.querySelector('#pnBody .pn-list .pn-card');
    return { hs, title: first.querySelector('.pn-title').textContent, st: (first.querySelector('.nc-st') || {}).textContent, rest: (document.querySelectorAll('#pnBody .pn-h span')[0] || {}).textContent }; });
  ok(dlg.open && mine.hs[0] === 'Your parties' && mine.hs[1] === 'Near you' && mine.title === dlg.title && /Asked to join|You're in/.test(mine.st) && mine.rest === '2 parties',
    'ask to join "' + dlg.title + '": back on the list it is first, under "Your parties", marked "' + mine.st + '"');
  // host one: the button opens the one-screen form (p34 walks it); a party you're hosting shows with how many asked
  await p.click('#pnBody .pn-hostcta [data-host-party]'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => $('dlgFs').open && $('fsdTitle').textContent === 'Host a party' && !!$('hpForm')), '"Host a party" opens the host\'s form');
  await closeDlgs(p);
  await p.evaluate(async () => { const gid = await api.splitCreate('Game night at mine', '🎲', [], 'party'), d = new Date(Date.now() + 3 * 864e5); d.setHours(19, 0, 0, 0);
    await api.partySave(gid, { occasion:'games', title:'Game night at mine', starts_at: d.toISOString(), ends_at: new Date(d.getTime() + 4 * 36e5).toISOString() });
    await api.partyOpenSave(gid, { open:true, guest_limit:6, entry:'free', who:'all', radius_km:3, area:'Baner', near_address:'B-12 Green Woods, Baner Road, Pune', near_geo:{ lat:18.559, lng:73.7868 } }); await renderParties(); });
  await p.waitForTimeout(700);
  const host = await p.evaluate(() => { const h = [...document.querySelectorAll('#pnBody .pn-h h2')].map(x => x.textContent), c = document.querySelector('#pnBody a.near-card'); return { h, text: c && c.textContent.replace(/\s+/g, ' ').trim(), href: c && c.getAttribute('href') }; });
  ok(host.h.includes("You're hosting") && /Game night at mine/.test(host.text) && /Open to people nearby · 2 asked to join/.test(host.text) && /^#splits\//.test(host.href), 'a party you\'re hosting shows with how many asked, and opens its group: ' + host.text);
  // switch it off from here: the invitation is back, and Account agrees
  await p.click('#pnBody [data-near-off]'); await p.waitForTimeout(700);
  const offAgain = await p.evaluate(() => ({ intro: !!document.querySelector('#pnBody .pn-intro'), cards: document.querySelectorAll('#pnBody .pn-card').length }));
  await p.goto(U + '#account'); await p.waitForTimeout(1200); await closeDlgs(p);
  ok(offAgain.intro && !offAgain.cards && await p.evaluate(() => !$('nearToggle').checked), '"Stop showing me parties" switches it off; Account shows the same switch, off');
  await ctx.close();
  // an account for Flatsplits and FlatMart only: locked until the 12 questions
  ({ ctx, p } = await open(b, person('9822200012', 'Dev', 'male', { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822200012', name:'Dev', role:'splits', gender:'male' }, onboarded:{ splits:true }, vibe: undefined }), 390, 844, 'parties'));
  const lock = await p.evaluate(() => ({ text: ($('pnBody').textContent || '').replace(/\s+/g, ' ').trim(), btn: !!document.querySelector('#pnBody [data-go-rooms]'), on: !!document.querySelector('#pnBody [data-near-on]') }));
  ok(/Answer 12 quick questions first/.test(lock.text) && lock.btn && !lock.on, 'a Flatsplits-only account sees Parties locked until the 12 questions');
  await ctx.close();
  // on a computer: in the top bar, cards two across
  ({ ctx, p } = await open(b, person('9822200013', 'Isha', 'female', { partyNear:{ on:true, pin:{ lat:18.559, lng:73.7868 }, label:'Baner' } }), 1280, 860, 'parties'));
  const wide = await p.evaluate(() => { const c = [...document.querySelectorAll('#pnBody .pn-card')].map(x => x.getBoundingClientRect()); return { tab: !!document.querySelector('#nav .tab[data-view=parties]'), n: c.length, sameRow: c.length > 1 && Math.abs(c[0].top - c[1].top) < 2 && c[1].left > c[0].right,
    bandBg: getComputedStyle(document.querySelector('#view-parties .home-band')).backgroundColor }; });
  ok(wide.tab && wide.n === 3 && wide.sameRow && wide.bandBg === 'rgba(0, 0, 0, 0)', 'on a computer Parties is in the top bar and the cards sit two across (no band there)');
  await p.screenshot({ path: O + '/p27-parties-wide.png' });
  await ctx.close();

  // ------------------------------------------------------------ the two-layer top on every main screen (phones)
  ({ ctx, p } = await open(b, person('9822200014', 'Neha', 'female'), 390, 844, 'discover'));
  for(const [view, colour] of [['discover', 'lav'], ['saved', 'blush'], ['requests', 'lav'], ['tribe', 'mint'], ['splits', 'lav'], ['market', 'butter'], ['messages', 'mint'], ['account', 'lav']]){
    await p.goto(U + '#' + view); await p.waitForTimeout(1250); await closeDlgs(p); await p.waitForTimeout(250); B = await band(p);
    ok(B.band && B.colour === 'page' && B.flat && !B.left && !B.right && Math.abs(B.gap) <= 1 && B.onBand && B.headSame && !B.sheet && !B.low.length, view + ': the band is the page\'s cream from the top of the screen (its own ' + colour + ' tint until 17 Nov), flat, no sheet over it, words dark' + (B.low && B.low.length ? ' ' + JSON.stringify(B.low) : ''));
    if(view === 'market' || view === 'tribe') await p.screenshot({ path: O + '/p27-band-' + view + '.png' }); }
  // inside a Splits group there is no band: the top bar is back on the page
  await p.goto(U + '#splits'); await p.waitForTimeout(1000); await closeDlgs(p);
  const gid = await p.evaluate(() => api.splitCreate('Our flat', '🏠', [], 'flat')); await p.goto(U + '#splits/' + gid); await p.waitForTimeout(1300); B = await band(p);
  ok(!B.band && !B.onBand && B.headBg === B.T.page, 'inside a Splits group there is no band: the top bar is not part of one, and sits on the page in the page\'s cream: ' + B.headBg);
  await ctx.close();
  ({ ctx, p } = await open(b, owner, 390, 844, 'mine'));
  for(const [view, colour] of [['mine', 'butter'], ['escape', 'mint'], ['post', 'butter'], ['requests', 'butter'], ['parties', 'butter']]){
    await p.goto(U + '#' + view); await p.waitForTimeout(1250); await closeDlgs(p); await p.waitForTimeout(250); B = await band(p);
    ok(B.band && B.colour === 'page' && B.flat && !B.left && !B.right && Math.abs(B.gap) <= 1 && B.onBand && B.headSame && !B.sheet && !B.low.length, 'owner, ' + view + ': the band is the page\'s cream (' + colour + ' until 17 Nov), flat, no sheet over it, words dark' + (B.low && B.low.length ? ' ' + JSON.stringify(B.low) : '')); }
  await ctx.close();
  // a computer keeps the rounded panels inside the page
  ({ ctx, p } = await open(b, person('9822200015', 'Tara', 'female'), 1280, 860, 'splits'));
  const panel = await p.evaluate(() => { const h = document.querySelector('.fs-hero'), r = h.getBoundingClientRect(), cs = getComputedStyle(h); return { radius: parseFloat(cs.borderTopLeftRadius), left: Math.round(r.left), onBand: $('appHead').classList.contains('on-band'), bg: cs.backgroundColor, page: getComputedStyle(document.body).backgroundColor }; });
  ok(panel.radius >= 20 && panel.left > 40 && !panel.onBand && panel.bg === 'rgb(255, 255, 255)' && panel.page === 'rgb(255, 244, 232)', 'on a computer the panels stay rounded and inside the page, white on the cream: ' + JSON.stringify(panel));
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
