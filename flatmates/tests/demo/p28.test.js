// Speed, every home in one list, and the vibe score in the Escape (Kamal, 15 Nov: "the app is slow... whether the vibe
// matches or not all properties should be shown. Starting with highest vibescore to lowest. Also in escape the room
// vibe score should be visible").
// The speed checks run the real page with the live backend on (live.html, port 8765) against a stand-in for the
// server client (stub/supabase-stub.js): every call takes 300 ms, like a phone network, and is written down, so the
// order and the number of calls can be checked. Nothing reaches the real server. The rest runs in demo mode.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/', LIVE = U + 'live.html';
const STUB = fs.readFileSync(path.join(__dirname, 'stub', 'supabase-stub.js'), 'utf8'), LAT = 300;
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true };
const listing = (id, hh) => ({ id, kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[], household: hh,
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } });
const answeredHome = Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }], interests:{ music:['Indie'], hobbies:[] } }, vibe);
const owner = (l, extra) => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true },
  attrClaimed:true, giftSeen:true, myListings: l ? [l] : [], requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3) }, extra);
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
// what the page did when: the app's frame, the welcome page, the grey placeholders, the first homes
const marks = () => { window.__m = {}; const mark = k => { if(!(k in __m)) __m[k] = Math.round(performance.now()); };
  const tick = () => { const d = document; if(d.body){ const m = d.getElementById('appMain'), w = d.getElementById('view-welcome');
      if(m && !m.hidden) mark('frame'); if(w && !w.hidden) mark('welcome'); if(d.querySelector('#cards .skel-card')) mark('skeleton'); if(d.querySelector('#cards .card')) mark('homes'); }
    requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
// the page with the live backend on and the stand-in server; ls: the stand-in's settings; slowClient: ms the server client takes to arrive
async function live(b, st, o = {}){
  const ctx = await b.newContext({ viewport:{ width:390, height:844 }, serviceWorkers:'block' });
  await ctx.addInitScript(([s, ls]) => { try{ if(s && !localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); }
    for(const k in ls) localStorage.setItem('__' + k, String(ls[k])); }catch(e){} }, [st, o.ls || {}]);
  await ctx.addInitScript(marks);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('live: ' + e.message)); const real = []; p.on('request', r => { if(/supabase\.co/.test(r.url())) real.push(r.url()); });
  await p.route('**/vendor/supabase-2.45.4.js', async r => { if(o.slowClient) await new Promise(x => setTimeout(x, o.slowClient)); r.fulfill({ contentType:'application/javascript', body: STUB }); });
  await p.route(/supabase\.co|googleapis\.com|gstatic\.com|google\.com/, r => r.abort());
  return { ctx, p, real };
}
const calls = (p, fn) => p.evaluate(fn => (window.__rpc || []).filter(e => e.fn === fn).length, fn);
async function demo(b, st, hash, w){ const ctx = await b.newContext({ viewport:{ width: w || 390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('demo: ' + e.message)); const urls = []; p.on('request', r => urls.push(r.url()));
  await p.goto(U + '#' + hash); await p.waitForTimeout(1900); await closeDlgs(p); await p.waitForTimeout(250); return { ctx, p, urls }; }
// the homes on Discover: where each card is, and its score (null when the home has none)
const homes = p => p.evaluate(() => { const row = c => { const t = c.querySelector('.ring text'); return { id: c.dataset.id, score: t ? +t.textContent : null, kind: (api.all().find(l => l.id === c.dataset.id) || {}).kind, rent: (api.all().find(l => l.id === c.dataset.id) || {}).rent }; };
  const of = sel => [...document.querySelectorAll(sel + ' .card')].map(row);
  return { list: of('#cards'), more: of('#moreCards'), unc: of('#uncCards'), label: $('count').textContent, moreShown: !$('cardsMore').hidden, moreH: $('moreH').textContent, moreSub: $('moreSub').textContent }; });
const falling = a => a.every((x, i) => !i || (a[i - 1].score ?? -1) >= (x.score ?? -1));

(async () => {
  const b = await chromium.launch();
  // =============================================================== start-up, someone who has used the app before
  const pune = Object.assign({}, seeker, { prefs:{ city:'Pune', areas:[] } });
  let { ctx, p, real } = await live(b, pune, { ls:{ lat: LAT, auth: 200 } });
  await p.goto(LIVE + '#discover'); await p.waitForTimeout(2600);          // an earlier day: the phone now remembers what the server said
  await p.goto('about:blank'); await p.goto(LIVE + '#discover', { waitUntil:'commit' }); await p.waitForTimeout(3200);
  let s = await p.evaluate(() => ({ m: __m, rpc: __rpc.map(e => ({ fn: e.fn, at: e.at, end: e.ms === null ? null : e.at + e.ms })), cards: document.querySelectorAll('#cards .card').length, user: state.user && state.user.name }));
  const first = fn => s.rpc.find(e => e.fn === fn), firstAnswer = Math.min(...s.rpc.filter(e => e.end !== null).map(e => e.end)), n = fn => s.rpc.filter(e => e.fn === fn && e.at < first('fm_me').at + 2500).length;
  ok(s.m.frame < firstAnswer && s.m.skeleton < firstAnswer, `the app's own frame and the grey placeholders show before the server has answered anything (frame ${s.m.frame} ms, first answer ${firstAnswer} ms)`);
  ok(n('fm_me') === 1, 'at start the server is asked "who am I" once (it was three times): ' + n('fm_me'));
  ok(Math.abs(first('fm_search').at - first('fm_me').at) <= 80, `the homes are asked for at the same moment as "who am I", not after it (${first('fm_me').at} and ${first('fm_search').at} ms)`);
  ok(s.cards > 0 && s.m.homes < first('fm_me').at + 2 * LAT, `so the homes are on screen after one round of calls, not two (${s.m.homes} ms; one round ends at ${first('fm_search').end})`);
  const dup = ['fm_search', 'fm_inbox', 'fm_tribe_list', 'fm_tribe_saves', 'fm_thread_list'].map(f => f + ' ' + n(f));
  ok(dup.every(t => +t.split(' ')[1] <= 1), 'nothing is asked twice at start: ' + dup.join(', '));
  ok(real.length === 0, 'the stand-in answered everything: no request went to the real server (' + real.length + ')');
  // ------------------------------------------------------------ going back to a tab
  const n0 = await calls(p, 'fm_search'); await p.evaluate(() => { window.__card = document.querySelector('#cards .card'); });
  await p.evaluate(() => { location.hash = 'parties'; }); await p.waitForTimeout(700); await p.evaluate(() => { location.hash = 'discover'; }); await p.waitForTimeout(900);
  let t = await p.evaluate(() => ({ same: document.querySelector('#cards .card') === window.__card, cards: document.querySelectorAll('#cards .card').length }));
  ok(await calls(p, 'fm_search') === n0 && t.cards > 0, 'back on Discover a moment later: the homes are there without asking the server again');
  ok(t.same, 'and the list is left as it was (the same cards, not drawn a second time)');
  // a change: the next read is new
  await p.evaluate(() => api.saveListing(document.querySelector('#cards .card').dataset.id, true)); await p.evaluate(() => { location.hash = 'parties'; }); await p.waitForTimeout(600);
  await p.evaluate(() => { location.hash = 'discover'; }); await p.waitForTimeout(900);
  ok(await calls(p, 'fm_search') === n0 + 1, 'after a change (a home saved) the homes are read anew: ' + (await calls(p, 'fm_search') - n0));
  // 20 seconds on: read anew
  await p.evaluate(() => { const real = Date.now; Date.now = () => real() + 21000; location.hash = 'parties'; }); await p.waitForTimeout(600);
  await p.evaluate(() => { location.hash = 'discover'; }); await p.waitForTimeout(900);
  ok(await calls(p, 'fm_search') === n0 + 2, 'after 20 seconds an answer is no longer kept: ' + (await calls(p, 'fm_search') - n0 - 1));
  // the same thing asked three times at once: one call; each asker gets a copy of its own
  t = await p.evaluate(async () => { api.fresh(); const c0 = __rpc.filter(e => e.fn === 'fm_inbox').length; await Promise.all([api.inbox(), api.inbox(), api.inbox()]);
    const a = await api.search({ city:'Pune' }); a[0].title = 'scribbled'; const b2 = await api.search({ city:'Pune' });
    const c1 = __rpc.filter(e => e.fn === 'fm_inbox').length; await checkInbox(); return { shared: c1 - c0, own: b2[0].title !== 'scribbled', poll: __rpc.filter(e => e.fn === 'fm_inbox').length - c1 }; });
  ok(t.shared === 1, 'three screens asking for your requests at the same moment share one call: ' + t.shared);
  ok(t.own, 'each gets its own copy (changing one leaves the next untouched)');
  ok(t.poll === 1, 'the 30-second check for news always asks the server: ' + t.poll);
  await ctx.close();
  // =============================================================== start-up, a new visitor on a slow connection
  ({ ctx, p, real } = await live(b, null, { ls:{ lat: LAT, session:'none' }, slowClient: 1500 }));
  await p.goto(LIVE, { waitUntil:'commit' }); await p.waitForFunction(() => window.__m && __m.welcome, null, { timeout: 1300 }).catch(() => {});
  t = await p.evaluate(() => ({ welcome: __m.welcome, card: !!document.querySelector('#loginForm') && !!document.querySelector('#loginForm').offsetParent, client: typeof window.supabase, live: api.live === true }));
  ok(t.welcome < 1300 && t.card && t.client === 'undefined', `the welcome page and its sign-up card show without waiting for the server client (${t.welcome} ms; the client took 1500 ms)`);
  const early = await p.evaluate(async () => { const before = typeof window.supabase; const rows = await api.search({ city:'Pune' }); return { before, ids: rows.slice(0, 2).map(l => l.id), asked: __rpc.filter(e => e.fn === 'fm_search').length }; });
  ok(t.live && early.before === 'undefined' && early.ids.every(i => /^stub-home-/.test(i)) && early.asked === 1, 'a call made before the client arrived waits for it and reaches the server, never the demo data: ' + JSON.stringify(early));
  await ctx.close();
  // the phone remembers someone, the server says nobody is signed in: the welcome page
  ({ ctx, p } = await live(b, pune, { ls:{ lat: LAT, session:'none' } }));
  await p.goto(LIVE + '#discover'); await p.waitForTimeout(2200);
  t = await p.evaluate(() => ({ welcome: !$('view-welcome').hidden, app: !$('appMain').hidden, user: state.user }));
  ok(t.welcome && !t.app && t.user === null, 'signed out on the server: the app ends on the welcome page: ' + JSON.stringify(t));
  await ctx.close();
  // the server knows something the phone didn't: the screen follows the server
  ({ ctx, p } = await live(b, pune, { ls:{ lat: LAT, name:'Anita' } }));
  await p.goto(LIVE + '#discover'); await p.waitForTimeout(2600);
  t = await p.evaluate(() => ({ greet: $('greetTime').textContent, cards: document.querySelectorAll('#cards .card').length }));
  ok(/Anita/.test(t.greet) && t.cards > 0, 'the server\'s answer differs from the phone\'s copy: the screen is drawn again from the server\'s: ' + t.greet);
  await ctx.close();
  // the one-time "18 or older" question waits for the server (the phone's copy may be older)
  const noAge = JSON.parse(JSON.stringify(pune)); delete noAge.user.adultAt;
  ({ ctx, p } = await live(b, noAge, { ls:{ lat: 900 } }));
  await p.goto(LIVE + '#discover'); await p.waitForTimeout(800); const mid = await p.evaluate(() => $('dlgAge').open); await p.waitForTimeout(2600);
  ok(!mid && !(await p.evaluate(() => $('dlgAge').open)), 'the "18 or older" box is not shown from the phone\'s old copy when the server already has the answer');
  await ctx.close();

  // =============================================================== the typeface comes with the app
  let urls; ({ ctx, p, urls } = await demo(b, seeker, 'discover'));
  t = await p.evaluate(async () => { await document.fonts.ready; return { ok: document.fonts.check('500 16px Urbanist'), fam: getComputedStyle(document.body).fontFamily, link: !!document.querySelector('link[href*="fonts.googleapis"], link[href*="gstatic"]'),
    rupee: [...document.fonts].filter(f => f.family.replace(/"/g, '') === 'Urbanist' && f.status === 'loaded').length }; });
  ok(!urls.some(u => /fonts\.googleapis|fonts\.gstatic/.test(u)) && !t.link, 'nothing is fetched from Google Fonts');
  ok(t.ok && /^"?Urbanist/.test(t.fam) && urls.some(u => /vendor\/fonts\/urbanist-latin-wght-normal\.woff2/.test(u)), 'Urbanist loads from the app\'s own files: ' + t.fam.slice(0, 30));
  ok(t.rupee >= 2, 'both parts of it are in use (the second holds the rupee sign): ' + t.rupee);
  const priv = await (await ctx.request.get(U + 'privacy.html')).text();
  ok(!/fonts\.googleapis|Google Fonts/.test(priv) && /vendor\/fonts\/urbanist/.test(priv) && /vendor\/fonts\/dm-serif-display/.test(priv), 'the privacy page uses the bundled typefaces too (Urbanist and the serif), and no longer lists Google Fonts');

  // =============================================================== Discover: every home, highest vibe score first
  const all = await p.evaluate(async () => (await api.search({ city:'Bengaluru' })).map(l => l.id));
  let h = await homes(p);
  ok(await p.evaluate(() => !$('vibeRow') && !document.querySelector('.vrow')) && h.label === 'Highest vibe score first', 'one list, no separate "Your vibe matches" row; the line above it says: ' + h.label);
  ok(h.list.length === all.length && !h.moreShown, `every home in the city is in it (${h.list.length} of ${all.length})`);
  ok(falling(h.list) && h.list[0].score >= h.list[h.list.length - 1].score, 'from the highest vibe score to the lowest; homes without a score come last: ' + h.list.map(x => x.score ?? '-').join(' '));
  ok(h.list.some(x => x.score !== null && x.score < 60), 'low scores are shown too, not just the good matches: lowest ' + Math.min(...h.list.filter(x => x.score !== null).map(x => x.score)));
  // the first home on the first screen, the nudge after the first row
  t = await p.evaluate(() => { const c = [...document.querySelectorAll('#cards .card')], pr = $('profilePromo'); const pos = (a, b2) => Boolean(a.compareDocumentPosition(b2) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { top: Math.round(c[0].getBoundingClientRect().top), nudge: pr.innerHTML.trim().length > 0, afterFirst: pos(c[0], pr), beforeSecond: pos(pr, c[1]) }; });
  ok(t.top < 844 - 120 && t.afterFirst && t.beforeSecond, 'the first home starts on the first screen; the reminder card comes after it, before the rest: ' + JSON.stringify(t));
  await p.screenshot({ path: O + '/p28-discover.png' });
  // filters hide nothing for good: what they leave out comes under the list
  const area = await p.evaluate(async () => { const rows = await api.search({ city:'Bengaluru' }); const by = {}; rows.forEach(l => by[l.locality] = (by[l.locality] || 0) + 1); return Object.keys(by).sort((a, c) => by[c] - by[a])[0]; });
  await p.evaluate(a => { setPrefs({ areas:[a] }); renderDiscover(); }, area); await p.waitForTimeout(1200); h = await homes(p);
  const ids = x => x.map(y => y.id).sort().join();
  ok(h.list.length > 0 && h.list.length < all.length && h.moreShown && h.moreH === 'More homes in Bengaluru' && /outside your filters/.test(h.moreSub), `with one area picked: ${h.list.length} fit; the other ${h.more.length} come under "${h.moreH}" (${h.moreSub})`);
  ok(ids(h.list.concat(h.more)) === [...all].sort().join(), 'between the two, every home in the city is still on the page');
  ok(falling(h.more) && falling(h.list), 'both parts run from the highest score to the lowest');
  await p.evaluate(() => $('cardsMore').scrollIntoView({ block:'start' })); await p.evaluate(() => scrollBy(0, -90)); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p28-more-homes.png' });
  // nothing fits at all: the help, then every home all the same
  await p.evaluate(a => { setPrefs({ areas:[a], max: 3000 }); renderDiscover(); }, area); await p.waitForTimeout(1200); h = await homes(p);
  ok(h.list.length === 0 && h.moreH === 'Homes in Bengaluru' && h.more.length === all.length && await p.evaluate(() => /No homes match all of that yet/.test($('cardsA').textContent)), 'filters that fit no home: the "no homes match" help, then every home under it');
  // the kind of home picked: the other kinds come under the list too
  await p.evaluate(() => { setPrefs({ areas:[], max:0, look:'room' }); renderDiscover(); }); await p.waitForTimeout(1200); h = await homes(p);
  ok(h.list.every(x => x.kind !== 'shared') && h.more.length > 0 && h.more.every(x => x.kind === 'shared') && /kind of home you picked/.test(h.moreSub) && ids(h.list.concat(h.more)) === [...all].sort().join(),
    `"Private room" picked: private rooms and whole flats first, the ${h.more.length} shared rooms under them (${h.moreSub})`);
  // Women only stays a dealbreaker
  await p.evaluate(() => { setPrefs({ look:'', gender:'female', max: 12000 }); renderDiscover(); }); await p.waitForTimeout(1200);
  t = await p.evaluate(() => { const g = sel => [...document.querySelectorAll(sel + ' .card')].map(c => api.view(api.all().find(l => l.id === c.dataset.id)).home_gender); return { list: g('#cards'), more: g('#moreCards'), unc: g('#uncCards') }; });
  ok(t.more.length > 0 && t.list.concat(t.more).every(g => g === 'female') && t.unc.every(g => g === 'female?'), `Women only with a budget: the homes over budget come back under the list (${t.more.length}), but only women-only ones; a home that isn't never does`);
  // no filter on the score; an old saved one is ignored
  await p.evaluate(() => { setPrefs({ gender:'', max:0, minMatch: 85 }); renderDiscover(); }); await p.waitForTimeout(1200); h = await homes(p);
  await p.evaluate(() => $('filtersBtn').click()); await p.waitForTimeout(500);
  t = await p.evaluate(() => ({ field: !!document.querySelector('[name=fMatch]'), text: /Minimum match/.test($('filterForm').textContent), chips: [...document.querySelectorAll('#activeF button')].map(x => x.textContent.trim()) }));
  ok(h.list.length === all.length && !t.field && !t.text && !t.chips.some(c => /match/i.test(c)), 'Filters has no "Minimum match", and one saved by an older version hides nothing: ' + h.list.length + ' of ' + all.length);
  await closeDlgs(p);
  // the other orders still work
  await p.evaluate(() => { setPrefs({ minMatch: 0 }); $('fSort').value = 'cost'; renderDiscover(); }); await p.waitForTimeout(1200); h = await homes(p);
  ok(h.label === 'Lowest rent first' && h.list.every((x, i) => !i || h.list[i - 1].rent <= x.rent), 'Sort still works (lowest rent first), and the line says so');
  await p.evaluate(() => { $('fSort').value = 'match'; renderDiscover(); }); await p.waitForTimeout(900);
  // scrolling leaves the top bar alone
  t = await p.evaluate(async () => { scrollTo(0, 700); await new Promise(r => setTimeout(r, 300)); let n = 0; const mo = new MutationObserver(l => { n += l.length; }); mo.observe($('appHead'), { attributes:true });
    for(let y = 700; y <= 1900; y += 60){ scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); } await new Promise(r => setTimeout(r, 150)); mo.disconnect(); return n; });
  ok(t === 0, 'while the page scrolls, the top bar is not written to unless something changes: ' + t + ' writes');
  await ctx.close();
  // on a computer the first row is as many homes as fit across
  ({ ctx, p } = await demo(b, seeker, 'discover', 1280));
  t = await p.evaluate(() => { const a = [...document.querySelectorAll('#cardsA .card')], r = e => e.getBoundingClientRect(); return { n: a.length, oneRow: a.every(c => Math.abs(r(c).top - r(a[0]).top) < 2), rest: document.querySelectorAll('#cardsB .card').length }; });
  ok(t.n >= 2 && t.oneRow && t.rest > 0, 'on a computer the first row holds as many homes as fit across (' + t.n + '), then the reminders, then the rest');
  await ctx.close();

  // =============================================================== The Empty Room Escape: the vibe score
  ({ ctx, p } = await demo(b, owner(listing('mine-p28', answeredHome), { vibe, homeDraft: Object.assign({ residents:1 }, vibe) }), 'escape'));
  t = await p.evaluate(() => [...document.querySelectorAll('#escList .seek-card')].map(c => { const r = c.querySelector('.seek-ring'); return { score: r ? +r.querySelector('.ring text').textContent : null, cap: r ? r.querySelector('small').textContent : '', label: r ? r.getAttribute('aria-label') : '' }; }));
  ok(t.length > 2 && t.every(x => x.score !== null && x.cap === 'vibe match' && /^\d+% vibe match with /.test(x.label)), `every person has their score, with "vibe match" under it (${t.length} people): ` + t.map(x => x.score).join(' '));
  ok(falling(t) && !(await p.evaluate(() => !!document.querySelector('.esc-noscore'))), 'best vibe match first');
  await p.evaluate(() => document.querySelector('#escList .seek-card').scrollIntoView({ block:'start' })); await p.evaluate(() => scrollBy(0, -80)); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p28-escape.png' });
  await ctx.close();
  // a room the lister lives in, posted without the home's answers (and a lister with none of their own): nobody can be scored, and the screen says so
  // (a room nobody lives in is another matter: p32)
  ({ ctx, p } = await demo(b, owner(listing('mine-p28b', { residents:1, flatmates:[], interests:{ music:[], hobbies:[] } })), 'escape'));
  t = await p.evaluate(() => ({ people: document.querySelectorAll('#escList .seek-card').length, rings: document.querySelectorAll('#escList .seek-ring').length, ask: (document.querySelector('.esc-noscore') || {}).textContent || '', btn: !!document.querySelector('[data-esc-answers]') }));
  ok(t.people > 0 && t.rings === 0 && /No vibe scores for this room yet/.test(t.ask) && t.btn, 'a room without the home\'s living-style answers: the screen says why there are no scores and offers "Add them now"');
  await p.screenshot({ path: O + '/p28-escape-no-answers.png' });
  await p.click('[data-esc-answers]'); await p.waitForTimeout(1500);
  t = await p.evaluate(() => ({ post: !$('view-post').hidden, step: postStep, open: $('hQuiz').closest('details').open, shown: !!$('hQuiz').offsetParent, title: $('postH1').textContent }));
  ok(t.post && t.step === 2 && t.open && t.shown && /Edit/.test(t.title), '"Add them now" opens the listing on the questions, already unfolded: ' + JSON.stringify(t));
  // answer them and save: the scores are there
  await p.evaluate(() => { document.querySelectorAll('#hQuiz fieldset').forEach(f => { const i = f.querySelector('input'); if(i) i.checked = true; }); });
  await p.evaluate(() => $('postForm').requestSubmit()); await p.waitForTimeout(2200); await closeDlgs(p);
  await p.evaluate(() => { location.hash = 'escape'; }); await p.waitForTimeout(1600);
  t = await p.evaluate(() => ({ rings: document.querySelectorAll('#escList .seek-ring').length, people: document.querySelectorAll('#escList .seek-card').length, ask: !!document.querySelector('.esc-noscore') }));
  ok(t.people > 0 && t.rings === t.people && !t.ask, 'once answered, every person has a score: ' + JSON.stringify(t));
  await ctx.close();
  // posting from a phone that has no household draft: the form takes your own answers, and so does the listing
  ({ ctx, p } = await demo(b, owner(null, { vibe }), 'post'));
  t = await p.evaluate(() => ({ ticked: document.querySelectorAll('#hQuiz input:checked').length, draft: answered(state.homeDraft) }));
  ok(t.draft === 0 && t.ticked >= 12, 'a new listing on a phone with no saved household: the living-style answers are filled in from your own (' + t.ticked + ' ticked)');
  t = await p.evaluate(() => { const a = listingVibe('room', { residents:1 }, state.vibe), c = listingVibe('room', { residents:1, sleep:0, clean:0, food:0, cook:0 }, state.vibe), d = listingVibe('shared', { residents:2 }, {}); return { a: answered(a), gen: a.gen, kept: c.sleep === 0 && answered(c) === 4, none: answered(d) }; });
  ok(t.a === 12 && t.gen === 'z' && t.kept && t.none === 0, 'a listing the lister lives in, saved without answers, takes the lister\'s own; one that has its own keeps them; no answers anywhere stays empty: ' + JSON.stringify(t));
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
