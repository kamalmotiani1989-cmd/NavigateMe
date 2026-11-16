// "Do you live in this flat?" (Kamal, 16 Nov: "Go and yes to all"; priorities, Teche 0000000). The posting form's count
// of people has always said "including you", so a landlord who entered their two tenants was taken to live there:
// their own answers were copied onto the listing as the household's, their own gender counted in the women-only
// check, and the home said "Listed by a flatmate who lives here". The form now asks, for a room, a bed or a flatmate
// listing, and stores the answer as household.lister_lives_here.
//   Yes: as before.  No: none of that counts the lister; they answer for the people who do live there.
//   No answer (posted before the question, or from an older build): read as before, and the editor asks on the next save.
// Demo mode (the demo's listerLives, listingVibe and homeGender are the app's copies of the server's fm_lister_lives,
// fm_listing_vibe and fm_home_gender, which are tested in tests/db/parties-10-women.sql and parties-15-listing-vibe.sql).
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const listing = (id, kind, hh, extra) => Object.assign({ id, kind, title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:3, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[], household: hh,
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } }, extra);
const two = extra => Object.assign({ residents:2, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }, { type:'working', what:'Nurse', age:'25–30' }], flatmate_genders:['female'], interests:{ music:[], hobbies:[] }, rooms_free:1 }, extra);
// posted before the question: the lister (a man) counted two people, and the listing carries his own answers as the household's
const OLD = listing('mine-o1', 'room', two(vibe), { gender:'female', title:'Room for a woman, HSR' });
const OLD2 = listing('mine-o2', 'flatmate', two({ flatmate_genders:['male'] }), { title:'Flatmate wanted, no answers yet' });
const seeker = extra => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe:{ sleep:0, clean:0, food:0, cook:1, smoke:0, drinks:0, guests:0, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' },
  prefs:{ city:'Bengaluru', areas:[], look:'' }, notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true }, extra);
const owner = (ls, extra) => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true },
  attrClaimed:true, giftSeen:true, myListings: ls, requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3), vibe }, extra);
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
async function demo(b, st, hash){ const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '#' + hash); await p.waitForTimeout(1900); await closeDlgs(p); await p.waitForTimeout(250); return { ctx, p }; }
const say = (p, v) => p.evaluate(v2 => document.querySelector('[name=hLives][value=' + v2 + ']').click(), v).then(() => p.waitForTimeout(300));
const form = p => p.evaluate(() => ({ asked: !$('hLivesF').hidden && !document.querySelector('[name=hLives]').disabled, says: (document.querySelector('[name=hLives]:checked') || {}).value || null, label: $('hCountL').textContent, count: $('hCount').value,
  nobody: $('hCount').options[0].textContent + ($('hCount').options[0].disabled ? ' (off)' : ''), rows: [...document.querySelectorAll('#fmRows .fm-row > b')].map(x => x.textContent).join(' | '),
  what: [...document.querySelectorAll('#fmRows [name^=pwhat]')].map(x => x.value).join(' | '), chips: document.querySelectorAll('#fmRows .fm-g input').length, picked: [...document.querySelectorAll('#fmRows .fm-g input:checked')].map(x => x.name + '=' + x.value).join(),
  quizHidden: $('hQuizBox').hidden, open: $('hQuizBox').open, ticked: document.querySelectorAll('#hQuiz input:checked').length, lead: $('hLead').textContent, note: $('hNoVibe').hidden ? null : $('hNoVibe').textContent }));

(async () => {
  const b = await chromium.launch();
  // =============================================================== a new listing: the question on the form
  let { ctx, p } = await demo(b, owner([], { homeDraft: Object.assign({ residents:2, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }, { type:'student', what:'Law student', age:'18–24' }], interests:{ music:[], hobbies:[] } }, vibe) }), 'post');
  await p.evaluate(() => showPostStep(2)); await p.waitForTimeout(400);
  let t = await form(p);
  ok(t.asked && t.says === null && t.label === 'People living there now' && t.nobody === 'Nobody yet', 'a new room: "Do you live in this flat?" is asked, with nothing picked for you: ' + JSON.stringify({ label: t.label, nobody: t.nobody }));
  let q = await p.evaluate(() => { const l = $('hLivesF'), c = $('hCount').closest('.field'), r = e => e.getBoundingClientRect(); return { above: r(l).bottom <= r(c).top + 1, near: r(c).top - r(l).bottom < 30, text: l.querySelector('label').textContent, opts: [...l.querySelectorAll('.chip')].map(x => x.textContent.trim()).join(' | ') }; });
  ok(q.above && q.near && q.text === 'Do you live in this flat?' && q.opts === 'Yes, I live there | No, I don\'t', 'it sits right above "People living there now", with two answers: ' + q.opts);
  t = await p.evaluate(() => { const fs = $('hCount').closest('fieldset.ps'); return stepOk(fs) ? 'passed' : fs.querySelector('.form-err').textContent; });
  ok(/Do you live in this flat\?/.test(t), 'it has to be answered: going on without it is refused: ' + t);
  await p.screenshot({ path: O + '/p33-form-asks.png' });
  await say(p, 'yes'); t = await form(p);
  ok(t.says === 'yes' && t.label === 'People living there now (including you)' && / \(off\)$/.test(t.nobody) && t.rows === 'You | Flatmate 2' && t.what === 'Designer at an agency | Law student',
    'Yes: the count includes you (so it can\'t be nobody), and the first person listed is you: ' + JSON.stringify({ label: t.label, rows: t.rows }));
  ok(!t.quizHidden && t.ticked === 13 && /^From your answers earlier/.test(t.lead) && t.note === null, 'Yes: the living-style questions are filled in from your own answers, as before (' + t.ticked + ' ticked)');
  await say(p, 'no'); t = await form(p);
  ok(t.says === 'no' && t.label === 'People living there now (not counting you)' && !/off/.test(t.nobody) && t.rows === 'Person 1 | Person 2' && t.what === 'Law student | ' && t.chips === 4,
    'No: the count is the people who do live there, none of them is "You", and each has a Woman / Man to pick; your own row is gone, the other person stays: ' + JSON.stringify({ label: t.label, rows: t.rows, what: t.what }));
  ok(!t.quizHidden && t.open && t.ticked === 0 && !/From your answers/.test(t.lead) && /You don't live there/.test(t.note || '') && /Answer for them/.test(t.note || ''),
    'No: your own answers are taken out of the living-style questions, which open for you to answer for the people who live there: ' + (t.note || ''));
  await p.evaluate(() => $('hLivesF').scrollIntoView({ block:'start' })); await p.evaluate(() => scrollBy(0, -90)); await p.waitForTimeout(250); await p.screenshot({ path: O + '/p33-form-no.png' });
  await say(p, 'yes'); t = await form(p);
  ok(t.rows === 'You | Flatmate 2' && t.what === 'Designer at an agency | Law student' && t.ticked === 13, 'back to Yes: your row and your answers come back');
  // answers given by hand are not "your own answers": a No keeps them
  await say(p, 'no'); await p.evaluate(() => { document.querySelectorAll('#hQuiz fieldset').forEach(f => { const i = f.querySelectorAll('input')[1] || f.querySelector('input'); i.checked = true; i.dispatchEvent(new Event('change', { bubbles:true })); }); });
  await say(p, 'yes'); await say(p, 'no'); t = await form(p);
  ok(t.ticked === 13, 'answers you ticked yourself for the household stay when the answer changes (only the automatic copy of your own is taken out): ' + t.ticked);
  // nobody yet, and a whole flat
  await p.selectOption('#hCount', '0'); await p.waitForTimeout(300); t = await form(p);
  ok(t.count === '0' && t.rows === '' && t.quizHidden && /Nobody lives there now/.test(t.note || ''), 'No, and nobody lives there yet: no people to list and no living-style questions');
  await say(p, 'yes'); t = await form(p);
  ok(t.count === '1' && t.rows === 'You' && !t.quizHidden, 'Yes again: at least you live there, so the count becomes 1');
  await p.evaluate(() => document.querySelector('#postForm [name=kind][value=flat]').click()); await p.waitForTimeout(300); t = await form(p);
  ok(!t.asked && t.quizHidden && t.nobody === 'Nobody, it\'s a whole flat' && t.label === 'People living there now (including you)', 'a whole flat is not asked (nothing about it depends on the answer)');
  q = await p.evaluate(() => { const fs = $('hCount').closest('fieldset.ps'); document.querySelectorAll('[name=hLives]').forEach(i => { i.checked = false; }); return stepOk(fs) ? 'passed' : fs.querySelector('.form-err').textContent; });
  ok(q === 'passed', 'and can go on without it: ' + q);
  await ctx.close();

  // =============================================================== an older listing: no answer, then No
  ({ ctx, p } = await demo(b, owner([OLD, OLD2]), 'mine'));
  t = await p.evaluate(() => { const l = state.myListings[0], l2 = state.myListings[1]; return { lives: listerLives(l.kind, l.household), trust: trustLine(l).replace(/<[^>]+>/g, ''), women: homeGender(l.kind, l.gender, l.household, 'male'), womenIfWoman: homeGender(l.kind, l.gender, l.household, 'female'),
    ask2: (noScoreAsk(l2) || {}).b, trust2: trustLine(l2).replace(/<[^>]+>/g, '') }; });
  ok(t.lives && /Listed by a flatmate who lives here/.test(t.trust) && t.women === null && t.womenIfWoman === 'female' && t.ask2 === 'Add them now',
    'no answer (posted before the question): read as before. The lister counts as living there: "Listed by a flatmate who lives here", his gender decides women-only, his answers stand in: ' + JSON.stringify(t));
  await p.evaluate(() => startEdit('mine-o1', 2)); await p.waitForTimeout(1500); t = await form(p);
  ok(t.asked && t.says === null && t.rows === 'You | Flatmate 2' && t.ticked === 13 && t.picked === 'pg1=female', 'its editor asks the question with nothing picked; the rest is as it was posted: ' + JSON.stringify({ rows: t.rows, ticked: t.ticked, picked: t.picked }));
  await say(p, 'no'); t = await form(p);
  ok(t.rows === 'Person 1 | Person 2' && t.what === 'Nurse | ' && t.picked === 'pg0=female' && t.ticked === 0 && t.open,
    'No on that listing: the tenant he had listed becomes Person 1, still a woman; and the answers it carried, which were his own word for word, are taken out: ' + JSON.stringify({ what: t.what, picked: t.picked, ticked: t.ticked }));
  q = await p.evaluate(() => { const fs = $('hCount').closest('fieldset.ps'); return stepOk(fs) ? 'passed' : fs.querySelector('.form-err').textContent; });
  ok(/Person 2: woman or man/.test(q), 'each person who lives there needs a Woman / Man (the women-only check now rests on them alone): ' + q);
  await p.evaluate(() => { document.querySelector('[name=pg1][value=female]').click(); document.querySelector('[name=pwhat1]').value = 'Teacher'; document.querySelector('[name=ptype1][value=working]').click(); });
  await p.evaluate(() => $('postForm').requestSubmit()); await p.waitForTimeout(2300); await closeDlgs(p);
  t = await p.evaluate(() => { const l = state.myListings.find(x => x.id === 'mine-o1'), h = l.household, a = noScoreAsk(l) || {}; return { flag: h.lister_lives_here, residents: h.residents, n: answered(h), gen: h.gen ?? null, genders: (h.flatmate_genders || []).join(), mates: (h.flatmates || []).map(m => m.what).join(),
    lives: listerLives(l.kind, h), lived: livedIn(l.kind, h), trust: trustLine(l).replace(/<[^>]+>/g, ''), women: homeGender(l.kind, l.gender, h, 'male'), askH: a.h, askB: a.b, askP: a.p || '', tips: listingScore(l).tips.map(x => x.t).join(' | ') }; });
  ok(t.flag === false && t.residents === 2 && t.genders === 'female,female' && t.mates === 'Nurse,Teacher', 'saved: the listing says the lister doesn\'t live there, and lists the two people who do, each with her gender: ' + JSON.stringify({ flag: t.flag, genders: t.genders, mates: t.mates }));
  ok(t.n === 0 && t.gen === null && t.lived && !t.lives, 'saved: his own answers are NOT on the listing any more (people live there, but he is not one of them)');
  ok(/Owner-listed/.test(t.trust) && !/flatmate who lives here/.test(t.trust), 'it now says "Owner-listed", not "Listed by a flatmate who lives here": ' + t.trust);
  ok(t.women === 'female', 'women only: two women live there and the lister, a man, doesn\'t, so it is a women-only home (his gender no longer counts): ' + t.women);
  ok(t.askH === 'No vibe scores for this room yet' && t.askB === 'Answer for the household' && /your own answers aren't used/.test(t.askP) && /Answer the living-style questions/.test(t.tips),
    'My flat tells him why there are no scores and offers "Answer for the household": ' + t.askP.slice(0, 90));
  await p.evaluate(() => { location.hash = 'mine'; }); await p.waitForTimeout(1300);
  await p.evaluate(() => document.querySelector('.mine-card .esc-noscore').scrollIntoView({ block:'center' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p33-my-flat-no.png' });
  const saved = await p.evaluate(() => state.myListings.find(x => x.id === 'mine-o1'));
  // he answers for the household
  await p.evaluate(() => document.querySelector('.mine-card .esc-noscore button').click()); await p.waitForTimeout(1500); t = await form(p);
  ok(t.says === 'no' && t.rows === 'Person 1 | Person 2' && t.picked === 'pg0=female,pg1=female' && !t.quizHidden && t.open && t.ticked === 0, '"Answer for the household" opens the listing on the questions, empty and unfolded, with his No remembered');
  await p.evaluate(() => { document.querySelectorAll('#hQuiz fieldset').forEach(f => { const i = f.querySelector('input'); i.checked = true; i.dispatchEvent(new Event('change', { bubbles:true })); }); });
  await p.evaluate(() => $('postForm').requestSubmit()); await p.waitForTimeout(2300); await closeDlgs(p);
  t = await p.evaluate(v => { const l = state.myListings.find(x => x.id === 'mine-o1'), h = l.household; return { n: answered(h), flag: h.lister_lives_here, sleep: h.sleep, his: v.sleep, same: VIBE_QS.every(x => h[x.k] === v[x.k]), ask: !!noScoreAsk(l) }; }, vibe);
  ok(t.n === 12 && t.flag === false && t.sleep === 0 && t.his === 2 && !t.same && !t.ask, 'answered for the household: the listing carries THOSE answers (not his own), and My flat stops asking: ' + JSON.stringify(t));
  // the other older listing: Yes, saved without answers
  await p.evaluate(() => { location.hash = 'mine'; }); await p.waitForTimeout(1200);
  await p.evaluate(() => startEdit('mine-o2', 2)); await p.waitForTimeout(1500); await say(p, 'yes'); t = await form(p);
  ok(t.rows === 'You | Flatmate 2' && t.ticked === 13 && t.picked === 'pg1=male', 'Yes on a listing without answers: your own are filled in (' + t.ticked + ' ticked), and the people stay as they were');
  await p.evaluate(() => $('postForm').requestSubmit()); await p.waitForTimeout(2300); await closeDlgs(p);
  t = await p.evaluate(() => { const l = state.myListings.find(x => x.id === 'mine-o2'), h = l.household; return { flag: h.lister_lives_here, n: answered(h), gen: h.gen, genders: (h.flatmate_genders || []).join(), trust: trustLine(l).replace(/<[^>]+>/g, ''), ask: !!noScoreAsk(l) }; });
  ok(t.flag === true && t.n === 12 && t.gen === 'z' && t.genders === 'male' && /Listed by a flatmate who lives here/.test(t.trust) && !t.ask, 'saved with Yes: everything as before, and the answer is on the listing: ' + JSON.stringify(t));
  // the rule itself, in the demo's copies of the server functions
  t = await p.evaluate(async v => { const own = state.vibe, hand = { sleep:0, clean:0, food:0, cook:0, smoke:2 };
    const no = listingVibe('room', { residents:2, lister_lives_here:false }, own), noHand = listingVibe('shared', Object.assign({ residents:2, lister_lives_here:false }, hand), own), yes = listingVibe('room', { residents:2, lister_lives_here:true }, own),
      none = listingVibe('flatmate', { residents:2 }, own), empty = listingVibe('room', Object.assign({ residents:0, lister_lives_here:true }, v), own);
    const src = state.myListings.find(x => x.id === 'mine-o2');
    const made = await api.post({ listing: Object.assign({}, src, { id: undefined, household: { residents:2, lister_lives_here:false, flatmates:[], interests:{ music:[], hobbies:[] } } }), private: Object.assign({}, src.private, { address_parts: Object.assign({}, src.private.address_parts, { flat:'C-9' }) }) });
    const l = state.myListings.find(x => x.id === made.id);
    return { no: answered(no), noFlag: no.lister_lives_here, noHand: answered(noHand), handKept: noHand.smoke === 2, yes: answered(yes), none: answered(none), empty: answered(empty), posted: answered(l.household), postedFlag: l.household.lister_lives_here,
      lives: [listerLives('room', { residents:2, lister_lives_here:true }), listerLives('room', { residents:2 }), listerLives('room', { residents:2, lister_lives_here:false }), listerLives('room', { residents:2, lister_lives_here:'false' }),
        listerLives('room', { residents:0, lister_lives_here:true }), listerLives('flat', { residents:2, lister_lives_here:true }), livedIn('shared', { residents:1, lister_lives_here:false }), livedIn('flat', { residents:1 })].join(),
      g: [homeGender('room', 'female', { residents:2, lister_lives_here:false, flatmate_genders:['female', 'female'] }, 'male'), homeGender('room', 'female', { residents:2, lister_lives_here:false, flatmate_genders:['female'] }, 'female'),
        homeGender('room', 'female', { residents:2, lister_lives_here:false, flatmate_genders:['female', 'male'] }, 'female'), homeGender('room', 'female', { residents:2, lister_lives_here:true, flatmate_genders:['female'] }, 'male'),
        homeGender('room', 'female', { residents:2, lister_lives_here:true, flatmate_genders:['female'] }, 'female'), homeGender('room', 'female', { residents:2, flatmate_genders:['female'] }, 'male'), homeGender('room', 'female', { residents:1, lister_lives_here:false, flatmate_genders:['female'] }, null)].map(String).join() }; }, vibe);
  ok(t.lives === 'true,true,false,false,false,false,true,false', 'who counts: the lister lives there on a Yes or with no answer, not on a No, and never where nobody lives or in a whole flat; people can live there without him: ' + t.lives);
  ok(t.no === 0 && t.noFlag === false && t.noHand === 5 && t.handKept && t.yes === 12 && t.none === 12 && t.empty === 0, 'the answers on a listing: never the lister\'s own on a No; what he gave for the household is kept; his own on a Yes or with no answer; none where nobody lives: ' + JSON.stringify({ no: t.no, noHand: t.noHand, yes: t.yes, none: t.none, empty: t.empty }));
  ok(t.posted === 0 && t.postedFlag === false, 'a new room posted with No and no answers stays without (the lister\'s 12 are not copied onto it)');
  ok(t.g === 'female,female?,null,null,female,null,female', 'women only: on a No every person living there is checked and the lister is not; on a Yes, or with no answer, the lister counts first, as before: ' + t.g);
  await ctx.close();

  // =============================================================== someone looking at that home
  ({ ctx, p } = await demo(b, seeker({ myListings:[Object.assign({}, saved, { owner_gender:'male' })] }), 'discover'));
  t = await p.evaluate(() => { const c = document.querySelector('.card[data-id="mine-o1"]'); return c ? { trust: c.querySelector('.trust').textContent, line: (c.querySelector('.lc-noscore') || {}).textContent || null, ring: !!c.querySelector('.ring'), badge: (c.querySelector('.ghome') || {}).textContent || null } : null; });
  ok(t && /Owner-listed/.test(t.trust) && !/lives here/.test(t.trust) && t.line === 'Vibe score after the household answers' && !t.ring, 'on Discover it says "Owner-listed", and "Vibe score after the household answers" instead of a score from the lister\'s own answers: ' + JSON.stringify(t));
  ok(t && /women/i.test(t.badge || ''), 'and it carries the women-only mark, from the two women who live there: ' + (t && t.badge));
  await p.evaluate(() => document.querySelector('.card[data-id="mine-o1"]').scrollIntoView({ block:'center' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p33-card-owner-listed.png' });
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
