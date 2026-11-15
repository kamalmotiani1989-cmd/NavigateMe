// Two layers on the home screens, and the lighter bottom bar (Kamal, 15 Nov, from another app's home screen: "the
// double shade looks super amazing and the bottom bar looks cool"; demo mode, port 8765). On a phone the greeting
// sits on a pastel band that fills the top of the screen, top bar included, and the page below is a sheet with
// round corners; the bottom bar is a frosted pill and the screen you're on is a soft pastel pill. Our colours.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: Date.now() + 9e9 };
const listing = { id:'mine-p26', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }], interests:{ music:['Indie'], hobbies:[] } }, vibe),
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } };
// an owner without a pass: six places in the bottom bar (the tightest case)
const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents: 1 }, vibe), myListings:[listing], requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3) };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const open = async (b, st, w, h, hash) => { const ctx = await b.newContext({ viewport:{ width:w, height:h } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(U + '#' + hash); await p.waitForTimeout(1700); await closeDlgs(p); await p.waitForTimeout(200); return { ctx, p }; };
// what the band, the top bar and the sheet look like right now
const look = p => p.evaluate(() => { const tok = n => { const d = document.createElement('i'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
  const band = document.querySelector('#appMain > section:not([hidden]) > .home-band'), head = $('appHead'), r = e => e.getBoundingClientRect();
  if(!band || !band.offsetParent) return { band: false, onBand: head.classList.contains('on-band'), headBg: getComputedStyle(head).backgroundColor, page: tok('--bg') };
  const cs = getComputedStyle(band), after = getComputedStyle(band, '::after'), next = band.nextElementSibling;
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number), lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const texts = [...band.querySelectorAll('*')].filter(e => e.offsetParent && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const bg = e => { for(let x = e; x && x !== band; x = x.parentElement){ const c = rgb(getComputedStyle(x).backgroundColor); if(c.length >= 3 && (c[3] === undefined || c[3] > .5)) return c; } return rgb(cs.backgroundColor); };
  return { band: true, bandBg: cs.backgroundColor, left: Math.round(r(band).left), right: Math.round(r(band).right), W: innerWidth, gap: Math.round(r(band).top - r(head).bottom),
    onBand: head.classList.contains('on-band'), headBg: getComputedStyle(head).backgroundColor, lav: tok('--lav'), butter: tok('--butter'), page: tok('--bg'), text: tok('--text'), ink: tok('--ink'),
    sheet: { radius: after.borderTopLeftRadius, bg: after.backgroundColor, h: after.height }, toFirst: next ? Math.round(r(next).top - (r(band).bottom - 30)) : -1,
    colours: [...new Set(texts.map(e => getComputedStyle(e).color))], minRatio: Math.min(...texts.map(e => { const a = lum(rgb(getComputedStyle(e).color)), c = lum(bg(e)); return (Math.max(a, c) + .05) / (Math.min(a, c) + .05); })),
    pill: (g => g ? getComputedStyle(g).backgroundColor : null)(band.querySelector('.gift-pill')) }; });
const bar = p => p.evaluate(() => { const tok = n => { const d = document.createElement('i'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
  const nav = $('nav'), cs = getComputedStyle(nav), r = nav.getBoundingClientRect(), tabs = [...nav.querySelectorAll('.tab')].filter(t => t.offsetParent), cur = nav.querySelector('.tab[aria-current=true]');
  return { radius: parseFloat(cs.borderTopLeftRadius), alpha: +(cs.backgroundColor.match(/[\d.]+/g) || [])[3], blur: /blur/.test(cs.backdropFilter || cs.webkitBackdropFilter || ''), left: Math.round(r.left), right: Math.round(innerWidth - r.right), bottom: Math.round(innerHeight - r.bottom),
    n: tabs.length, names: tabs.map(t => t.querySelector('span').textContent), icons: tabs.every(t => t.querySelector('svg') && t.querySelector('svg').getBoundingClientRect().width >= 20),
    cut: tabs.filter(t => { const s = t.querySelector('span'); return s.scrollWidth > s.clientWidth + 1 || !s.offsetWidth; }).map(t => t.dataset.view),
    cur: cur && { view: cur.dataset.view, bg: getComputedStyle(cur).backgroundColor, color: getComputedStyle(cur).color, radius: parseFloat(getComputedStyle(cur).borderTopLeftRadius) },
    idle: (t => t && getComputedStyle(t).color)(tabs.find(t => t !== cur)), tok: { lav: tok('--lav'), butter: tok('--butter'), mint: tok('--mint'), blush: tok('--blush'), text: tok('--text'), text2: tok('--text-2'), ink: tok('--ink') } }; });
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ someone looking for a room, on a phone
  let { ctx, p } = await open(b, seeker, 390, 844, 'discover');
  let L = await look(p);
  ok(L.band && L.bandBg === L.lav && L.left === 0 && L.right === L.W && Math.abs(L.gap) <= 1, 'Discover: the greeting sits on a lavender band, edge to edge, straight under the top bar: ' + JSON.stringify({ bg: L.bandBg, left: L.left, right: L.right, gap: L.gap }));
  ok(L.onBand && L.headBg === L.lav, 'the top bar is part of the band (same colour): ' + L.headBg);
  ok(L.sheet.radius === '30px' && L.sheet.bg === L.page && L.sheet.h === '30px' && L.toFirst >= 20 && L.toFirst <= 44, 'the page comes up over the band as a sheet with round corners; the search starts ' + L.toFirst + 'px below its edge');
  ok(L.colours.every(c => c === L.text || c === L.ink) && L.minRatio >= 4.5 && L.pill === 'rgb(255, 255, 255)', 'words on the band are near-black (lowest contrast ' + L.minRatio.toFixed(2) + ':1), nothing orange; the contacts pill is white');
  const first = await p.evaluate(() => { const v = $('vibeRow'), c = document.querySelector('#cards .card'); return { row: v && !v.hidden ? Math.round(v.getBoundingClientRect().top) : null, card: c ? Math.round(c.getBoundingClientRect().top) : null }; });
  ok((first.row !== null ? first.row : first.card) < 844 - 120, 'homes still start on the first screen: ' + JSON.stringify(first));
  await p.screenshot({ path: O + '/p26-home-seeker.png' });
  // scrolling: the bar keeps the band's colour until the sheet reaches it
  await p.evaluate(() => scrollTo(0, 80)); await p.waitForTimeout(350); L = await look(p);
  ok(L.onBand && L.headBg === L.lav, 'scrolled a little: the top bar still has the band\'s colour');
  await p.evaluate(() => scrollTo(0, 420)); await p.waitForTimeout(450); L = await look(p);
  ok(!L.onBand && L.headBg !== L.lav && /^rgba?\(239, 228, 220/.test(L.headBg), 'scrolled past the band: the top bar is the page\'s beige again: ' + L.headBg);
  await p.screenshot({ path: O + '/p26-home-scrolled.png' });
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(450); L = await look(p);
  ok(L.onBand && L.headBg === L.lav, 'back at the top: the band again');
  // the bottom bar
  let B = await bar(p);
  ok(B.radius >= 30 && B.alpha >= .7 && B.alpha < 1 && B.blur && B.left >= 12 && B.right >= 12 && B.bottom >= 10, 'bottom bar: a frosted pill floating above the edge: ' + JSON.stringify({ radius: B.radius, alpha: B.alpha, blur: B.blur, left: B.left, right: B.right, bottom: B.bottom }));
  ok(B.names.join() === 'Discover,Saved,Splits,Market,Passes' && B.icons && !B.cut.length, 'every place keeps its icon and its name: ' + B.names.join(' · '));
  ok(B.cur.view === 'discover' && B.cur.bg === B.tok.lav && B.cur.color === B.tok.text && B.cur.radius >= 24 && B.idle === B.tok.text2, 'the screen you\'re on is a soft lavender pill with dark words (not a black button): ' + JSON.stringify(B.cur));
  // other screens: their own pastel on the tab, and no band
  for(const [view, name, col] of [['saved', 'Saved', 'blush'], ['splits', 'Splits', 'lav'], ['market', 'Market', 'butter'], ['plans', 'Passes', 'blush']]){
    await p.goto(U + '#' + view); await p.waitForTimeout(1100); await closeDlgs(p); await p.waitForTimeout(250);
    B = await bar(p); L = await look(p);
    ok(B.cur && B.cur.view === view && B.cur.bg === B.tok[col] && B.cur.color === B.tok.text && !L.band && !L.onBand && L.headBg !== B.tok.lav, name + ': the tab is a ' + col + ' pill; no band, and the top bar is back on the page');
    if(view === 'market') await p.screenshot({ path: O + '/p26-bar-market.png' }); }
  await p.goto(U + '#discover'); await p.waitForTimeout(1100); await closeDlgs(p); await p.waitForTimeout(250); L = await look(p);
  ok(L.onBand && L.headBg === L.lav, 'back on Discover: the band and the bar\'s colour return');
  await ctx.close();

  // ------------------------------------------------------------ an owner, on a phone
  ({ ctx, p } = await open(b, owner, 390, 844, 'mine'));
  L = await look(p); B = await bar(p);
  ok(L.band && L.bandBg === L.butter && L.onBand && L.headBg === L.butter && L.left === 0 && L.right === L.W && L.sheet.radius === '30px' && L.colours.every(c => c === L.text || c === L.ink) && L.minRatio >= 4.5,
    'My flat: a butter band with the top bar in it, the sheet over it, dark words (lowest contrast ' + L.minRatio.toFixed(2) + ':1)');
  ok(B.n === 6 && B.names.join() === 'My flat,Escape,Post,Splits,Market,Passes' && !B.cut.length && B.cur.view === 'mine' && B.cur.bg === B.tok.butter, 'owner without a pass: six places fit, My flat is a butter pill: ' + B.names.join(' · '));
  await p.screenshot({ path: O + '/p26-home-owner.png' });
  for(const [view, col] of [['escape', 'mint'], ['post', 'butter']]){
    await p.goto(U + '#' + view); await p.waitForTimeout(1100); await closeDlgs(p); await p.waitForTimeout(250); B = await bar(p); L = await look(p);
    ok(B.cur && B.cur.view === view && B.cur.bg === B.tok[col] && !L.onBand, view + ': the tab is a ' + col + ' pill, no band'); }
  await ctx.close();
  // six places still fit on small phones, names whole
  for(const w of [320, 360]){ ({ ctx, p } = await open(b, owner, w, 700, 'mine')); B = await bar(p);
    const top = await p.evaluate(() => { const W = innerWidth, r = e => e.getBoundingClientRect(); return { side: document.documentElement.scrollWidth - W,
      out: [...document.querySelectorAll('.app-head .bar > *, .top-acts > *')].filter(e => e.offsetParent && r(e).right > W + .5).length, me: [Math.round(r($('meBtn')).width), Math.round(r($('meBtn')).height)] }; });
    ok(B.n === 6 && !B.cut.length && B.left >= 12 && B.right >= 12 && top.side <= 0 && !top.out && top.me[0] === top.me[1], w + ' wide: six places fit with their names whole; the top bar fits and its buttons stay round: ' + JSON.stringify(top));
    await ctx.close(); }
  // a short phone, picking several people on Escape: the "N selected" bar and its button stay clear of the bottom bar and of Help
  ({ ctx, p } = await open(b, Object.assign({}, owner, { passes:{ escape: iso(now + 7 * 864e5) } }), 390, 600, 'escape'));
  await p.evaluate(() => [...document.querySelectorAll('#view-escape button')].find(q => /Invite several/.test(q.textContent)).click()); await p.waitForTimeout(500);
  await p.evaluate(() => { const c = document.querySelectorAll('#view-escape input[type=checkbox], #view-escape [data-pick]'); c[0].click(); c[1].click(); }); await p.waitForTimeout(400);
  const eb = await p.evaluate(() => { const r = e => e.getBoundingClientRect(), bar = r($('escBar')), nav = r($('nav')), fab = r($('helpFab')), go = r($('escBar').querySelector('.btn-accent'));
    const hit = (a, c) => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top;
    return { shown: !$('escBar').hidden, text: $('escBarText').textContent, clearOfNav: Math.round(nav.top - bar.bottom), helpOnBar: hit(fab, bar), goInView: go.right <= innerWidth && go.left >= 0 }; });
  ok(eb.shown && /^2 selected/.test(eb.text) && eb.clearOfNav >= 2 && !eb.helpOnBar && eb.goInView, 'short phone, inviting several on Escape: the bar sits above the bottom bar and Help steps out of its way: ' + JSON.stringify(eb));
  await p.screenshot({ path: O + '/p26-escape-bar.png' });
  await ctx.close();
  // the smallest phones: Tribe is its icon alone, still named for screen readers
  ({ ctx, p } = await open(b, seeker, 320, 640, 'discover'));
  const tr = await p.evaluate(() => { const t = document.querySelector('.hd-tribe'), r = t.getBoundingClientRect(); return { label: t.getAttribute('aria-label'), word: !!t.querySelector('span').offsetParent, w: Math.round(r.width), h: Math.round(r.height), me: Math.round($('meBtn').getBoundingClientRect().width) }; });
  L = await look(p);
  ok(/^Tribe/.test(tr.label) && !tr.word && tr.w === tr.h && tr.me === 44 && L.band && L.left === 0 && L.right === 320, '320 wide: Tribe is a round icon (named "' + tr.label + '"), the account button is round, the band still runs edge to edge');
  await p.screenshot({ path: O + '/p26-home-320.png' });
  await ctx.close();

  // ------------------------------------------------------------ signed up for Flatsplits and FlatMart only: no band on the locked Discover
  ({ ctx, p } = await open(b, Object.assign({}, seeker, { user: Object.assign({}, seeker.user, { role:'splits' }), onboarded:{ splits:true }, vibe: undefined }), 390, 844, 'discover'));
  const lock = await p.evaluate(() => ({ locked: $('view-discover').classList.contains('locked'), view: currentView }));
  L = await look(p);
  ok(!L.onBand && (!lock.locked || !L.band), 'no band where there is no greeting (Flatsplits-only account: ' + JSON.stringify(lock) + ')');
  await ctx.close();

  // ------------------------------------------------------------ a computer keeps the plain greeting
  ({ ctx, p } = await open(b, seeker, 1280, 800, 'discover'));
  const wide = await p.evaluate(() => { const tok = n => { const d = document.createElement('i'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const band = document.querySelector('#view-discover .home-band'), cs = getComputedStyle(band); return { bg: cs.backgroundColor, img: cs.backgroundImage, after: getComputedStyle(band, '::after').content, onBand: $('appHead').classList.contains('on-band'),
      eyebrow: getComputedStyle(band.querySelector('.eyebrow')).color, orange: tok('--orange-text'), navFixed: getComputedStyle($('nav')).position }; });
  ok(wide.bg === 'rgba(0, 0, 0, 0)' && wide.img === 'none' && wide.after === 'none' && !wide.onBand && wide.eyebrow === wide.orange && wide.navFixed !== 'fixed', 'on a computer the greeting is as before (no band, orange greeting line, tabs in the top bar): ' + JSON.stringify(wide));
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
