// Tribe shows people down to a 30% vibe match (Kamal, 16 Nov: "In tribe show the match upto 30%"; it was 70%).
// The 70%+ matches stay where they were, in the order they always had; the people between 30% and 69% come under
// them. Only the strong matches bring a notice and count on the badge. Demo mode, then the live app against the
// stand-in server (stub/supabase-stub.js; nothing reaches the real server).
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/', LIVE = U + 'live.html';
const STUB = fs.readFileSync(path.join(__dirname, 'stub', 'supabase-stub.js'), 'utf8');
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const seeker = extra => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[], look:'room' },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: now + 9e9 }, extra);
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
async function open(b, st, hash, live, ls){ const ctx = await b.newContext({ viewport:{ width:390, height:844 }, serviceWorkers:'block' });
  await ctx.addInitScript(([s, ls]) => { try{ if(s && !localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); }
    for(const k in ls) localStorage.setItem('__' + k, typeof ls[k] === 'string' ? ls[k] : JSON.stringify(ls[k])); }catch(e){} }, [st, ls || {}]);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push((live ? 'live: ' : 'demo: ') + e.message)); const real = []; p.on('request', r => { if(/supabase\.co/.test(r.url())) real.push(r.url()); });
  if(live){ await p.route('**/vendor/supabase-2.45.4.js', r => r.fulfill({ contentType:'application/javascript', body: STUB })); await p.route(/supabase\.co|googleapis\.com|gstatic\.com|google\.com/, r => r.abort()); }
  await p.goto((live ? LIVE : U) + '#' + hash); await p.waitForTimeout(live ? 2500 : 2300); await closeDlgs(p); await p.waitForTimeout(250); return { ctx, p, real }; }
// the Tribe page as someone reads it: each heading, and under it each person with their score and whether they want the same kind of home
const page = p => p.evaluate(() => { const groups = []; let g = null;
  for(const e of document.querySelectorAll('#tribeWants > *, #tribeMatches > *')){
    if(e.matches('h2')){ g = { h: e.textContent.trim(), people: [] }; groups.push(g); }
    else if(e.matches('.tribe-card') && g) g.people.push({ name: e.querySelector('h3').childNodes[0].textContent.trim(), pct: +e.querySelector('.ring text').textContent, same: !!e.querySelector('.look-tag.same'),
      team: !!e.querySelector('[data-ty]'), compat: !!e.querySelector('[data-tcompat]') }); }
  return { groups, hint: (document.querySelector('.tribe-more-hint') || {}).textContent || '', more: !!document.querySelector('#tribeMatches .pk-more'),
    step1: document.querySelector('#tribeJourney li span').textContent, rules: (document.querySelector('.tribe-rules') || {}).textContent || '', foot: document.querySelector('#view-tribe > p.hint:last-of-type').textContent.replace(/\s+/g, ' ') }; });
const inOrder = a => a.every((x, i) => !i || (a[i - 1].same - x.same || a[i - 1].pct - x.pct) >= 0);   // the same kind of home first, then best vibe
const toasts = p => p.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.textContent).join(' | '));

(async () => {
  const b = await chromium.launch();
  let ctx, p, real, t, r;

  // =============================================================== demo mode
  ({ ctx, p } = await open(b, seeker(), 'tribe'));
  t = await page(p);
  const top = t.groups.find(g => /^Vibe matches near you/.test(g.h)), more = t.groups.find(g => /^More people looking near you/.test(g.h));
  ok(t.groups.length === 2 && top && top.h === 'Vibe matches near you · 70%+' && more && more.h === 'More people looking near you · 30% to 69%' && t.groups[0] === top,
    'the Tribe page has two groups, the vibe matches first: ' + t.groups.map(g => g.h).join(' / '));
  ok(top.people.length >= 1 && top.people.length <= 6 && top.people.every(x => x.pct >= 70), 'the first group is the people who showed before, 70% and up: ' + top.people.map(x => x.pct).join(' '));
  ok(more.people.length >= 1 && more.people.length <= 4 && more.people.every(x => x.pct >= 30 && x.pct < 70), 'under them, people between 30% and 69% now show too (nobody below 30%): ' + more.people.map(x => x.pct).join(' '));
  ok(inOrder(top.people) && inOrder(more.people) && top.people.some(x => x.same), 'inside each group the order is the one Tribe always had: the same kind of home as you first, then best vibe: '
    + top.people.map(x => (x.same ? 'same ' : '') + x.pct).join(', ') + ' / ' + more.people.map(x => (x.same ? 'same ' : '') + x.pct).join(', '));
  ok(more.people.every(x => x.team && x.compat) && /Not as close a match, but looking in your areas/.test(t.hint) && !t.more, 'each of them has Team up and Compatibility, and a line says they\'re not as close a match');
  ok(t.step1 === '30%+ vibe, same areas' && /at least 30% vibe with you/.test(t.rules) && /30%\+ vibe match/.test(t.foot) && !/70%\+ vibe match see you/.test(t.foot), 'the words on the page say 30%: "' + t.step1 + '"');
  await p.evaluate(() => document.getElementById('tribeMoreH').scrollIntoView({ block: 'start' })); await p.evaluate(() => scrollBy(0, -150)); await p.waitForTimeout(400);
  await p.screenshot({ path: O + '/p30-tribe-more.png' });
  // a score in the second group opens the same compatibility analysis
  r = await p.evaluate(async () => { const c = [...document.querySelectorAll('#tribeMatches .tribe-card')].pop(); c.querySelector('.seek-ring').click(); await new Promise(x => setTimeout(x, 500));
    return { open: $('dlgCompat').open, text: $('dlgCompat').textContent.replace(/\s+/g, ' ').slice(0, 400) }; });
  ok(r.open && /Talk about these|Where you click/.test(r.text), 'tapping a score there opens the compatibility analysis, with what to talk about');
  await closeDlgs(p);
  // only the strong matches are announced and counted
  r = await p.evaluate(async () => { state.tribe.forEach(x => { x.seen = false; x.their_yes = null; x.my_yes = null; x.created_at = new Date().toISOString(); }); state.notified = {}; save(); document.querySelectorAll('.toast').forEach(x => x.remove());
    await checkInbox(); return { strong: state.tribe.filter(x => x.match_pct >= 70).length, all: state.tribe.length, badge: tribeUnseen, toast: (document.querySelector('.toast') || {}).textContent || '' }; });
  ok(r.all > r.strong && r.badge === r.strong && new RegExp('^' + r.strong + ' people near you match your vibe 70%\\+').test(r.toast), `new people: the notice and the Tribe badge count the ${r.strong} strong matches, not all ${r.all}: "${r.toast}"`);
  // (the strong sample people are closed, not removed: removed, the demo would simply bring them back)
  r = await p.evaluate(async () => { state.tribe.forEach(x => { if(x.match_pct >= 70) x.status = 'closed'; x.seen = false; }); state.notified = {}; save(); document.querySelectorAll('.toast').forEach(x => x.remove());
    const weak = () => state.tribe.filter(x => x.status === 'open');
    await checkInbox(); const quiet = { n: weak().length, strongOpen: weak().filter(x => x.match_pct >= 70).length, badge: tribeUnseen, toast: (document.querySelector('.toast') || {}).textContent || '' };
    await renderUrgent(); const banner = !!document.querySelector('.inv-banner.tribe');
    weak()[0].their_yes = true; weak()[0].seen = false; save(); await checkInbox();
    return { quiet, banner, badge: tribeUnseen, toast: (document.querySelector('.toast') || {}).textContent || '' }; });
  ok(r.quiet.n >= 1 && !r.quiet.strongOpen && r.quiet.badge === 0 && !r.quiet.toast && !r.banner, 'someone between 30% and 69% appears quietly: no notice, nothing on the badge, no card on Discover: ' + JSON.stringify(r.quiet) + ' banner ' + r.banner);
  ok(r.badge === 1 && /wants to build a tribe with you/.test(r.toast), 'but when one of them says yes to you, you are told, whatever the score: "' + r.toast + '"');
  await p.evaluate(() => go('tribe')); await p.waitForTimeout(900);
  t = await page(p);
  ok(t.groups[0] && /They want to team up with you/.test(t.groups[0].h) && t.groups[0].people[0].pct < 70, 'and they are at the top of the Tribe page, under "They want to team up with you" (' + (t.groups[0] ? t.groups[0].people[0].pct : '') + '%)');
  // the words elsewhere
  r = await p.evaluate(async () => { hb.log = []; hb.flow = null; openHelp(); $('hbIn').value = 'what is a tribe'; $('hbForm').requestSubmit(); const bot = hb.log.filter(m => m.who === 'bot').pop().html; $('dlgHelp').close();
    go('account'); await new Promise(x => setTimeout(x, 500)); return { bot, acc: $('tribeToggle').closest('label').textContent.replace(/\s+/g, ' ') }; });
  ok(/match your vibe 30% or more, the strongest matches first/.test(r.bot) && /30%\+ vibe match can team up/.test(r.acc), 'the help bot and Account say 30% too');
  await ctx.close();
  // someone new: the sample people arrive, strong ones and others
  ({ ctx, p } = await open(b, seeker({ demoTribeAt: undefined }), 'discover'));
  await p.waitForTimeout(6500);
  r = await p.evaluate(async () => { api.tick(); await new Promise(x => setTimeout(x, 300)); return { strong: (state.tribe || []).filter(x => x.match_pct >= 70).length, more: (state.tribe || []).filter(x => x.match_pct >= 30 && x.match_pct < 70).length, low: (state.tribe || []).filter(x => x.match_pct < 30).length }; });
  ok(r.strong >= 1 && r.strong <= 6 && r.more >= 1 && r.more <= 4 && !r.low, 'a new person in the demo gets up to 6 strong sample matches and up to 4 of the others: ' + JSON.stringify(r));
  await ctx.close();

  // =============================================================== the live app, against the stand-in server
  const person = (id, name, pct, looking, extra) => Object.assign({ id: 'stub-tl-' + id, other_id: 'stub-tp-' + id, name, occupation:{ type:'working', what:'Analyst' }, areas:[], budget: 15000, match_pct: pct, interests:{ music:[], hobbies:[] },
    vibe: Object.assign({}, vibe), my_yes: null, their_yes: null, status: 'open', phone: null, created_at: iso(now - 3600e3), bonded_at: null, unseen: false, kind: 'match', my_size: 1, their_size: 1, on_time: false, looking }, extra);
  const tribe = [person(1, 'Asha', 88, 'shared', { unseen: true }), person(2, 'Dev', 74, 'room'), person(3, 'Zoya', 66, 'flat', { unseen: true }), person(4, 'Kabir', 45, 'room'), person(5, 'Mira', 30, 'room'),
    person(6, 'Ria', 40, 'room', { their_yes: true, unseen: true }), person(7, 'Tara', 41, 'shared', { kind: 'complete' })];
  ({ ctx, p, real } = await open(b, seeker({ prefs:{ city:'Pune', areas:[], look:'room' } }), 'tribe', true, { lat: 120, tribe }));
  t = await page(p);
  r = t.groups.map(g => g.h + ': ' + g.people.map(x => x.name + ' ' + x.pct).join(', ')).join(' / ');
  ok(t.groups.length === 3 && /^They want to team up with you: Ria 40$/.test(t.groups.map(g => g.h + ': ' + g.people.map(x => x.name + ' ' + x.pct).join(', '))[0])
    && t.groups[1].h === 'Vibe matches near you · 70%+' && t.groups[1].people.map(x => x.name).join() === 'Dev,Asha,Tara'
    && t.groups[2].h === 'More people looking near you · 30% to 69%' && t.groups[2].people.map(x => x.name).join() === 'Kabir,Mira,Zoya',
    'live: the server\'s list is shown the same way (a yes on top, then 70%+, then 30% to 69% with exactly 30% included; the same kind of home first in each): ' + r);
  r = await p.evaluate(() => { const c = [...document.querySelectorAll('#tribeMatches .tribe-card')].find(x => /Tara/.test(x.querySelector('h3').textContent)); return (c.querySelector('.wants-line') || {}).textContent || ''; });
  ok(/Complete your tribe of 3/.test(r), 'someone completing your tribe of 3 stays in the first group, where they always were, whatever their score (Tara, 41%)');
  r = await p.evaluate(() => ({ calls: __rpc.filter(e => /fm_tribe_/.test(e.fn)).map(e => e.fn.replace('fm_tribe_', '')).join(' '), badge: tribeUnseen }));
  ok(/refresh/.test(r.calls) && /list/.test(r.calls) && /seen/.test(r.calls) && r.badge === 0, 'opening the page asks the server for new people, reads the list and marks it seen: ' + r.calls);
  await ctx.close();
  ({ ctx, p, real } = await open(b, seeker({ prefs:{ city:'Pune', areas:[], look:'room' } }), 'discover', true, { lat: 120, tribe }));
  r = await p.evaluate(async () => { await checkInbox(); await renderUrgent(); return { badge: tribeUnseen, shown: (document.querySelector('#topActs [data-view=tribe] .badge, #nav [data-view=tribe] .badge') || {}).textContent || '', banner: (document.querySelector('.inv-banner.tribe') || {}).textContent || '' }; });
  ok(r.badge === 2 && /Ria wants to build a tribe with you/.test(r.banner), 'live: of three new people (88%, 66%, and a 40% who said yes) the badge counts two: the strong match and the yes; Discover\'s card is about the yes: ' + r.badge + ' · ' + r.banner.replace(/\s+/g, ' ').slice(0, 50));
  ok(!real.length, 'none of this reached the real server');
  await ctx.close();

  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
