// "Just Flatsplits & FlatMart" sign-up (demo mode, port 8765): the third choice on the sign-in card, a short set-up
// (name, gender, generation), Flatsplits and FlatMart open, rooms / flatmates / parties nearby locked until the vibe
// questions are answered, then unlocking as a seeker.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const head = p => p.evaluate(() => ({ count: $('obCount').textContent, key: ob && !ob.intro && ob.steps[ob.i] ? ob.steps[ob.i].k : null, intro: !!(ob && ob.intro), q: (document.querySelector('#obStage h1') || {}).textContent || '' }));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1800);
  const roles = await p.evaluate(() => [...document.querySelectorAll('#loginForm .role')].map(r => r.querySelector('input').value + ':' + r.querySelector('b').textContent));
  ok(roles.join() === 'seeker:I need a room,owner:Posting a flat or a room,splits:Just Flatsplits & FlatMart', 'sign-in: a third choice, Just Flatsplits & FlatMart: ' + roles.join(' / '));
  await p.screenshot({ path: O + '/p10-signin.png' });
  // sign in exactly as before: number, 18+ tick, the code
  await p.click('#loginForm input[name=role][value=splits]', { force: true });
  await p.fill('#lgPhone', '9876501234'); await p.check('#lgAge', { force: true });
  await p.click('#loginForm [data-channel="whatsapp"]'); await p.waitForTimeout(900);
  const code = await p.evaluate(() => pendingOtp && pendingOtp.code);
  await p.fill('#lgOtp', code); await p.click('#otpForm [type=submit]'); await p.waitForTimeout(1500);
  let h = await head(p);
  ok(h.intro && /3 quick questions/.test(h.q), 'set-up: three quick questions: ' + h.q);
  await p.click('#obGo'); await p.waitForTimeout(500); h = await head(p);
  const keys = await p.evaluate(() => ob.steps.map(s => s.k).join());
  ok(keys === 'name,sex,gen' && h.count === 'About you · 1 of 3', 'set-up: name, gender and generation only, no vibe questions: ' + keys + ' | ' + h.count);
  await p.fill('#obStage input[type=text]', 'Kavya'); await p.press('#obStage input[type=text]', 'Enter'); await p.waitForTimeout(600);
  await p.click('.opt[data-i="0"]'); await p.waitForTimeout(600);   // Female
  const gens = await p.evaluate(() => [...document.querySelectorAll('#obStage .opt b, #obStage .opt .t')].map(x => x.textContent).join());
  await p.click('.opt[data-i="1"]'); await p.waitForTimeout(900);   // Millennial
  ok(/Gen Z/.test(gens) && /Millennial/.test(gens) && /Gen X/.test(gens), 'set-up: the generation choices are Gen Z, Millennial and Gen X: ' + gens);
  const fin = await p.evaluate(() => ({ h1: (document.querySelector('#obStage h1') || {}).textContent, gender: state.user.gender, gen: state.vibe.gen, role: state.user.role, name: state.user.name }));
  ok(fin.role === 'splits' && fin.gender === 'female' && fin.gen === 'm' && fin.name === 'Kavya' && /Split bills/.test(fin.h1), 'set-up: saved as a Flatsplits & FlatMart account: ' + JSON.stringify(fin));
  await p.screenshot({ path: O + '/p10-done.png' });
  await p.click('#obDone'); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const nav = await p.evaluate(() => ({ hash: location.hash, tabs: [...document.querySelectorAll('#nav .tab span')].map(x => x.textContent), tribe: !!document.querySelector('.hd-tribe'), req: !!document.querySelector('#topActs [data-view=requests]') }));
  ok(nav.hash === '#splits' && nav.tabs.join() === 'Splits,Market,Discover,Account' && !nav.tribe && !nav.req, 'lands on Flatsplits; tabs are Splits, Market, Discover, Account (no Tribe, no Requests): ' + JSON.stringify(nav));
  // Flatsplits and FlatMart work
  const gid = await p.evaluate(() => api.splitCreate('Flat 2B', '🏠', [{ name: 'Mira', phone: '9811100009' }], 'flat'));
  await p.goto('http://localhost:8765/#splits/' + gid); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => /Flat 2B/.test(document.body.innerText)), 'Flatsplits works: a flat group is made and opens');
  await p.goto('http://localhost:8765/#market'); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => location.hash === '#market' && !$('view-market').hidden && document.querySelectorAll('#view-market .mk-card, #view-market [data-mk-open]').length > 0), 'FlatMart works: items for sale show');
  // rooms are locked
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1200);
  const lock = await p.evaluate(() => ({ lock: !$('roomLock').hidden && /Answer 12 quick questions/.test($('roomLock').textContent), cards: [...document.querySelectorAll('#cards .card')].filter(c => c.offsetParent).length }));
  ok(lock.lock && !lock.cards, 'Discover shows the lock, no rooms: ' + JSON.stringify(lock));
  await p.screenshot({ path: O + '/p10-lock.png' });
  for(const h2 of ['#tribe', '#requests', '#saved', '#post', '#escape']){ await p.goto('http://localhost:8765/' + h2); await p.waitForTimeout(500); }
  ok(await p.evaluate(() => location.hash !== '#tribe' && location.hash !== '#post' && !$('roomLock').hidden || ['#splits', ''].includes(location.hash)), 'Tribe, Requests, Saved, Post and Escape aren\'t reachable');
  // parties nearby are locked too
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1300);
  const np = await p.evaluate(async () => ({ promo: (document.querySelector('.near-promo') || {}).textContent || '', set: await api.partyNearbySet(true, { lat: 18.559, lng: 73.7868 }, 'Baner').then(() => 'on', e => e.message),
    why: api.partyCantSee(demoNearParties()[0]) }));
  ok(/Answer 12 quick questions/.test(np.promo) && np.set === 'need-vibe' && np.why === 'need-vibe', 'parties nearby are locked until the vibe questions: ' + JSON.stringify(np).slice(0, 160));
  await p.goto('http://localhost:8765/#account'); await p.waitForTimeout(1200);
  const acc = await p.evaluate(() => ({ role: $('accRole').textContent, toggle: $('nearToggle').disabled, why: $('nearWhere').textContent, sw: $('accSwitchT').textContent }));
  ok(acc.role === 'Flatsplits & FlatMart' && acc.toggle && /vibe questions/.test(acc.why) && acc.sw === 'Look for a room or post one', 'Account: the parties switch is locked and there\'s a way to rooms: ' + JSON.stringify(acc));
  // signing in again with "Just Flatsplits" never takes rooms away (checked on a seeker)
  const keep = await p.evaluate(async () => { const r = state.user.role; state.user.role = 'seeker'; await api.setRole('splits'); const out = state.user.role; state.user.role = r; save(); return out; });
  ok(keep === 'seeker', 'a seeker who picks Just Flatsplits at sign-in stays a seeker');
  // unlock: "I need a room" -> the seeker questions, without name, gender or generation again
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1000);
  await p.click('[data-unlock="seeker"]'); await p.waitForTimeout(1200);
  const un = await p.evaluate(() => ({ role: state.user.role, ob: !!ob && ob.role, keys: ob ? ob.steps.map(s => s.k) : [] }));
  ok(un.role === 'seeker' && un.ob === 'seeker' && !un.keys.some(k => ['name', 'sex', 'gen'].includes(k)) && ['sleep', 'clean', 'food', 'smoke'].every(k => un.keys.includes(k)),
    'unlocking asks the vibe questions (and the room ones), not name, gender or generation again: ' + un.keys.slice(0, 6).join(','));
  await p.screenshot({ path: O + '/p10-unlock.png' });
  // once answered: rooms and parties nearby open
  await p.evaluate(() => { state.vibe = Object.assign({ sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1 }, state.vibe);
    state.user.occupation = { type:'working', what:'Designer' }; state.prefs = { city:'Pune', areas:[] }; state.onboarded.seeker = true; ob = null; obForget(); save(); });
  await p.goto('http://localhost:8765/#account'); await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1800);
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const open = await p.evaluate(() => ({ lock: !$('roomLock').hidden, locked: $('view-discover').classList.contains('locked'), cards: document.querySelectorAll('#cards .card').length, why: api.partyCantSee(demoNearParties()[0]) }));
  ok(!open.lock && !open.locked && open.cards > 0 && open.why !== 'need-vibe', 'after the vibe questions, rooms show and parties nearby open: ' + JSON.stringify(open));
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
