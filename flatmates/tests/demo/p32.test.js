// The vibe score only where there is a household to score against (Kamal, 16 Nov: "Fix the vibe fill-in when the
// lister doesn't live in the flat"). Since 15 Nov a listing without living-style answers took the lister's own, whoever
// lived there, so a room in a flat nobody lives in, and a whole flat, showed a score against a person the seeker would
// never share with. Now: the lister's answers stand in only where the lister lives there (a room, a bed or a flatmate
// listing with 1 or more people living there); any other home carries no answers and shows no score. A room or bed
// without one says "Vibe score after the household answers" and sorts after the scored ones; its lister is told why
// in My flat and in the Escape, with the way to a score; the posting form asks the questions only where someone lives.
// Demo mode (the demo's listingVibe is the app's copy of the server's fm_listing_vibe; the server rule itself is
// tested in tests/db/parties-15-listing-vibe.sql).
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const listing = (id, kind, hh, extra) => Object.assign({ id, kind, title: kind === 'flat' ? 'Whole 2BHK near the lake' : 'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[], household: hh,
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } }, extra);
const noHh = n => ({ residents: n, flatmates: n ? [{ type:'working', what:'Nurse', age:'25–30' }] : [], interests:{ music:[], hobbies:[] } });
// three homes from one lister: a room in a flat nobody lives in, a bed where people live but nobody has answered, a whole flat
const EMPTY = listing('mine-e1', 'room', noHh(0)), BED = listing('mine-e2', 'shared', noHh(2), { title:'Bed in a shared room, HSR', rent:8000 }), FLAT = listing('mine-e3', 'flat', noHh(0), { rent:32000 });
const seeker = extra => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[], look:'' },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true }, extra);
const owner = (ls, extra) => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true },
  attrClaimed:true, giftSeen:true, myListings: ls, requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3) }, extra);
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
async function demo(b, st, hash, w){ const ctx = await b.newContext({ viewport:{ width: w || 390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '#' + hash); await p.waitForTimeout(1900); await closeDlgs(p); await p.waitForTimeout(250); return { ctx, p }; }
const cards = p => p.evaluate(() => [...document.querySelectorAll('#cards .card')].map(c => ({ id: c.dataset.id, score: (t => t ? +t.textContent : null)(c.querySelector('.ring text')), line: (e => e ? e.textContent : null)(c.querySelector('.lc-noscore')) })));
const LINE = 'Vibe score after the household answers';

(async () => {
  const b = await chromium.launch();
  // =============================================================== someone looking
  let { ctx, p } = await demo(b, seeker({ myListings:[EMPTY, BED, FLAT] }), 'discover');
  let list = await cards(p); const by = id => list.find(x => x.id === id) || {}, scored = list.filter(x => x.score !== null);
  ok(scored.length > 3 && scored.every(x => x.line === null), `homes with a household's answers show their score as before, and no extra line (${scored.length} of ${list.length})`);
  ok(by('mine-e1').score === null && by('mine-e1').line === LINE, 'a room in a flat nobody lives in: no score, and the card says "' + LINE + '": ' + JSON.stringify(by('mine-e1')));
  ok(by('mine-e2').score === null && by('mine-e2').line === LINE, 'a bed where people live but nobody has answered: the same line');
  ok(by('mine-e3').id === 'mine-e3' && by('mine-e3').score === null && by('mine-e3').line === null, 'a whole flat has no household: no score and no line, as before');
  const lastScored = Math.max(...list.map((x, i) => x.score !== null ? i : -1)), firstNone = list.findIndex(x => x.score === null);
  ok(firstNone > lastScored && ['mine-e1', 'mine-e2', 'mine-e3'].every(id => list.findIndex(x => x.id === id) > lastScored), 'homes without a score come after every home with one: ' + list.map(x => x.score ?? '-').join(' '));
  let t = await p.evaluate(() => { const e = document.querySelector('.card[data-id="mine-e1"] .lc-noscore'), c = getComputedStyle(e); e.scrollIntoView({ block:'center' }); return { size: c.fontSize, color: c.color, oneLine: e.getClientRects().length === 1 && e.getBoundingClientRect().height < 24 }; });
  ok(t.size === '12.5px' && t.color === 'rgb(79, 84, 92)' && t.oneLine, 'the line is small quiet text on one line of the card: ' + JSON.stringify(t));
  await p.waitForTimeout(300); await p.screenshot({ path: O + '/p32-card-no-score.png' });
  // the home's own page
  await p.evaluate(() => openListing('mine-e1')); await p.waitForTimeout(1200);
  t = await p.evaluate(() => { const n = document.querySelector('#dlgListing .l-noscore'); return { title: n ? n.querySelector('b').textContent : null, text: n ? n.textContent : '', ring: !!document.querySelector('#dlgListing .hero-pic .ring'),
    match: /% match/.test(document.querySelector('#lBody').textContent), ask: !![...document.querySelectorAll('#dlgListing button')].find(x => /Send request/.test(x.textContent)) }; });
  ok(t.title === LINE && /no living-style answers yet/.test(t.text) && /still ask to meet/.test(t.text), 'its page says the same, and why: ' + t.text.slice(0, 120));
  ok(!t.ring && !t.match && t.ask, 'no score ring and no "% match" anywhere on the page; Send request is still there');
  await p.screenshot({ path: O + '/p32-page-no-score.png' }); await closeDlgs(p);
  await p.evaluate(() => openListing('mine-e3')); await p.waitForTimeout(1100);
  ok(await p.evaluate(() => !document.querySelector('#dlgListing .l-noscore') && !document.querySelector('#dlgListing .hero-pic .ring')), 'a whole flat\'s page: no score and no note');
  await closeDlgs(p);
  const first = scored[0].id; await p.evaluate(id => openListing(id), first); await p.waitForTimeout(1100);
  ok(await p.evaluate(() => !document.querySelector('#dlgListing .l-noscore') && !!document.querySelector('#dlgListing .hero-pic .ring')), 'a home with a score: its ring, and no note');
  await ctx.close();
  // someone who hasn't answered their own questions: the missing score is theirs to fix, so no home is blamed
  ({ ctx, p } = await demo(b, seeker({ myListings:[EMPTY, BED, FLAT], vibe:{} }), 'discover'));
  list = await cards(p);
  ok(list.length > 5 && list.every(x => x.score === null && x.line === null), 'someone with no answers of their own sees no scores and no such line on any home');
  await ctx.close();

  // =============================================================== the lister
  const ANSWERED = listing('mine-e4', 'room', Object.assign(noHh(1), vibe), { title:'Room with its own answers' });
  ({ ctx, p } = await demo(b, owner([EMPTY, BED, FLAT, ANSWERED], { vibe }), 'mine'));
  t = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.mine-card')].map(c => { const a = c.querySelector('.esc-noscore'); return [c.querySelector('[data-edit]').dataset.edit,
    { h: a ? a.querySelector('b').textContent : null, p: a ? a.querySelector('p').textContent : '', btn: a ? a.querySelector('button').textContent : null, tips: [...c.querySelectorAll('.qm-tips button')].map(x => x.textContent).join(' | ') }]; })));
  ok(t['mine-e1'].h === 'No vibe scores for this room' && /nobody lives there now/.test(t['mine-e1'].p) && /say how many and answer for them/.test(t['mine-e1'].p) && t['mine-e1'].btn === 'Say who lives there',
    'My flat, the room nobody lives in: it says why there are no scores, and offers "Say who lives there": ' + JSON.stringify(t['mine-e1']).slice(0, 200));
  ok(t['mine-e2'].h === 'No vibe scores for this room yet' && /12 quick questions/.test(t['mine-e2'].p) && t['mine-e2'].btn === 'Add them now', 'My flat, the bed where people live but nobody has answered: "Add them now"');
  ok(t['mine-e3'].h === null && t['mine-e4'].h === null, 'My flat: a whole flat is asked nothing, and neither is a room that has its answers');
  const strength = await p.evaluate(() => Object.fromEntries(state.myListings.map(l => [l.id, listingScore(l).tips.map(x => x.t).join(' | ')])));
  ok(!/living-style/.test(strength['mine-e1']) && !/living-style/.test(strength['mine-e3']) && /Answer the living-style questions/.test(strength['mine-e2']) && !/living-style/.test(strength['mine-e4']),
    'listing strength asks for the living-style answers only where there is a household to answer for');
  await p.evaluate(() => document.querySelector('.mine-card .esc-noscore').scrollIntoView({ block:'center' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p32-my-flat.png' });
  // "See it as seekers do" shows the lister what seekers see
  await p.evaluate(() => document.querySelector('.mine-card [data-preview="mine-e1"]').click()); await p.waitForTimeout(1200);
  t = await p.evaluate(() => (n => n ? n.textContent : '')(document.querySelector('#dlgListing .l-noscore')));
  ok(t.startsWith(LINE) && /what people looking see/.test(t), '"See it as seekers do" on that room shows the lister the same line: ' + t.slice(0, 110));
  await closeDlgs(p);
  await p.evaluate(() => document.querySelector('.mine-card [data-preview="mine-e4"]').click()); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => !document.querySelector('#dlgListing .l-noscore')), 'and nothing of the kind on a room that has its answers');
  await closeDlgs(p);
  // "Say who lives there": the editor, on the household step
  await p.evaluate(() => document.querySelector('.mine-card [data-edit="mine-e1"][data-step="2"]').click()); await p.waitForTimeout(1500);
  const form = () => p.evaluate(() => ({ post: !$('view-post').hidden, step: postStep, count: $('hCount').value, kind: document.querySelector('#postForm [name=kind]:checked').value, quizHidden: $('hQuizBox').hidden, open: $('hQuizBox').open,
    seen: !!$('hQuiz').offsetParent, note: $('hNoVibe').hidden ? null : $('hNoVibe').textContent, ticked: document.querySelectorAll('#hQuiz input:checked').length, rows: document.querySelectorAll('#fmRows .fm-row').length }));
  t = await form();
  ok(t.post && t.step === 2 && t.count === '0' && t.quizHidden && !t.seen && /Nobody lives there now/.test(t.note || '') && /pick how many and answer for them/.test(t.note || ''),
    'it opens the listing on "Your household": nobody lives there, so the living-style questions are put away and a line says why: ' + JSON.stringify(t));
  await p.screenshot({ path: O + '/p32-form-nobody.png' });
  await p.selectOption('#hCount', '2'); await p.waitForTimeout(350); t = await form();
  ok(!t.quizHidden && t.open && t.seen && t.note === null && t.rows === 2, 'say two people live there: the questions appear, unfolded, with a row for each person, and the line goes: ' + JSON.stringify(t));
  await p.evaluate(() => { document.querySelector('#postForm [name=kind][value=flat]').click(); }); await p.waitForTimeout(350); t = await form();
  ok(t.kind === 'flat' && t.quizHidden && /whole flat has no household/.test(t.note || ''), 'make it a whole flat: put away again, and the line says a whole flat has no household: ' + (t.note || ''));
  await p.evaluate(() => { document.querySelector('#postForm [name=kind][value=room]').click(); }); await p.waitForTimeout(350); t = await form();
  ok(t.kind === 'room' && !t.quizHidden && t.note === null, 'back to a room with two people: the questions are there again');
  // save it with one person and nothing ticked: the lister lives there now, so their own answers stand in (the server's rule, in the demo's copy)
  await p.selectOption('#hCount', '1'); await p.waitForTimeout(250);
  await p.evaluate(() => document.querySelector('[name=hLives][value=yes]').click()); await p.waitForTimeout(250);   // "Do you live in this flat?" (p33)
  await p.evaluate(() => $('postForm').requestSubmit()); await p.waitForTimeout(2300); await closeDlgs(p);
  t = await p.evaluate(() => { const l = state.myListings.find(x => x.id === 'mine-e1'); return { residents: l.household.residents, n: answered(l.household), gen: l.household.gen, ask: !!noScoreAsk(l) }; });
  ok(t.residents === 1 && t.n === 12 && t.gen === 'z' && !t.ask, 'saved saying the lister lives there, without answers: the listing takes the lister\'s own, and My flat stops asking: ' + JSON.stringify(t));
  // and the other way: a listing with a household's answers, edited to say nobody lives there, keeps none
  await p.evaluate(() => { location.hash = 'mine'; }); await p.waitForTimeout(1300);
  await p.evaluate(() => startEdit('mine-e4', 2)); await p.waitForTimeout(1500); t = await form();
  ok(t.count === '1' && !t.quizHidden && t.ticked >= 12, 'a room with its own answers opens with them ticked (' + t.ticked + ')');
  await p.evaluate(() => document.querySelector('[name=hLives][value=no]').click()); await p.waitForTimeout(250);   // with a yes the count can't be nobody
  await p.selectOption('#hCount', '0'); await p.waitForTimeout(300);
  await p.evaluate(() => $('postForm').requestSubmit()); await p.waitForTimeout(2300); await closeDlgs(p);
  t = await p.evaluate(() => { const l = state.myListings.find(x => x.id === 'mine-e4'); return { residents: l.household.residents, n: answered(l.household), gen: l.household.gen ?? null, other: Array.isArray(l.household.flatmates) && !!l.household.interests, ask: (noScoreAsk(l) || {}).b }; });
  ok(t.residents === 0 && t.n === 0 && t.gen === null && t.other && t.ask === 'Say who lives there', 'edited to say nobody lives there: the answers and the generation go, the rest of the listing stays: ' + JSON.stringify(t));
  // the rule itself (the demo's copy of fm_listing_vibe), and an older app that still sends the lister's answers
  t = await p.evaluate(async v => { const own = state.vibe, sent = Object.assign({ residents:0, flatmates:[], interests:{ music:['Indie'], hobbies:[] }, rooms_free:1 }, v);
    const a = listingVibe('room', sent, own), f = listingVibe('flat', Object.assign({ residents:2 }, v), own), c = listingVibe('shared', { residents:1 }, own), k = listingVibe('flatmate', { residents:3, sleep:0, clean:0, food:0, cook:0 }, own), z = listingVibe('room', { residents:0 }, own);
    const src = state.myListings.find(x => x.id === 'mine-e2');
    const made = await api.post({ listing: Object.assign({}, src, { household: sent, id: undefined }), private: Object.assign({}, src.private, { address_parts: Object.assign({}, src.private.address_parts, { flat:'C-9' }) }) });
    const l = state.myListings.find(x => x.id === made.id);
    return { a: answered(a), aGen: 'gen' in a, aKeeps: a.residents === 0 && a.rooms_free === 1 && a.interests.music[0] === 'Indie', sentUntouched: answered(sent) === 12, f: answered(f), fRes: f.residents, c: answered(c), cGen: c.gen, k: answered(k), kOwn: k.sleep === 0, z: answered(z),
      lives: [listerLives('room', { residents:1 }), listerLives('shared', { residents:'4' }), listerLives('flatmate', { residents:2 }), listerLives('room', { residents:0 }), listerLives('flat', { residents:3 }), listerLives('room', {}), listerLives('room', null)].join(),
      posted: answered(l.household), postedGen: 'gen' in l.household, postedRes: l.household.residents }; }, vibe);
  ok(t.lives === 'true,true,true,false,false,false,false', 'who counts as living there: a room, a bed or a flatmate listing with 1 or more people; never a whole flat or a home nobody lives in: ' + t.lives);
  ok(t.a === 0 && !t.aGen && t.aKeeps && t.sentUntouched && t.f === 0 && t.fRes === 2 && t.z === 0, 'where the lister doesn\'t live there the listing keeps no living-style answers and no generation, and everything else it says: ' + JSON.stringify({ a: t.a, f: t.f, z: t.z }));
  ok(t.c === 12 && t.cGen === 'z' && t.k === 4 && t.kOwn, 'where the lister does: the lister\'s own stand in for a listing with none, and a listing with 4 of its own keeps them');
  ok(t.posted === 0 && !t.postedGen && t.postedRes === 0, 'a new room in a flat nobody lives in, sent with the lister\'s answers as an older app does: posted without them');
  await ctx.close();
  // The Empty Room Escape for a room nobody lives in: people, no scores, and the way to one
  ({ ctx, p } = await demo(b, owner([EMPTY], { vibe }), 'escape'));
  t = await p.evaluate(() => ({ people: document.querySelectorAll('#escList .seek-card').length, rings: document.querySelectorAll('#escList .seek-ring').length, h: (document.querySelector('.esc-noscore b') || {}).textContent || '', btn: (document.querySelector('.esc-noscore [data-esc-answers]') || {}).textContent || '' }));
  ok(t.people > 0 && t.rings === 0 && t.h === 'No vibe scores for this room' && t.btn === 'Say who lives there', 'the Escape for a room nobody lives in: the people looking, no scores, and "Say who lives there": ' + JSON.stringify(t));
  await p.click('.esc-noscore [data-esc-answers]'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !$('view-post').hidden && postStep === 2 && $('hQuizBox').hidden && !$('hNoVibe').hidden), 'which opens the listing on "Your household", the same as from My flat');
  await ctx.close();
  ({ ctx, p } = await demo(b, owner([FLAT], { vibe }), 'escape'));
  t = await p.evaluate(() => ({ people: document.querySelectorAll('#escList .seek-card').length, ask: !!document.querySelector('.esc-noscore') }));
  ok(!t.ask, 'the Escape for a whole flat asks for no answers (it has no household to answer for): ' + JSON.stringify(t));
  await ctx.close();
  // a new listing: the form follows the count of people from the start
  ({ ctx, p } = await demo(b, owner([], { vibe, homeDraft: Object.assign({ residents:0, flatmates:[], interests:{ music:[], hobbies:[] } }, vibe) }), 'post'));
  await p.evaluate(() => showPostStep(2)); await p.waitForTimeout(400);
  t = await p.evaluate(() => ({ count: $('hCount').value, quizHidden: $('hQuizBox').hidden, note: $('hNoVibe').hidden ? null : $('hNoVibe').textContent }));
  ok(t.count === '0' && t.quizHidden && /Nobody lives there now/.test(t.note || ''), 'a new listing from someone who said at sign-up that nobody lives in the flat: no living-style questions, and the line says why');
  await p.selectOption('#hCount', '1'); await p.waitForTimeout(300);
  t = await p.evaluate(() => ({ quizHidden: $('hQuizBox').hidden, ticked: document.querySelectorAll('#hQuiz input:checked').length }));
  ok(!t.quizHidden && t.ticked >= 12, 'say you live there and the questions come back, filled in from your answers earlier (' + t.ticked + ' ticked)');
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
