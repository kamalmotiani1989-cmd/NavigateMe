// Women-only and men-only homes (Kamal, 10 Nov; demo mode, port 8765, 390 wide). "Women only" means only women live
// there and only women are welcome: no "anyone" homes, no mixed homes; homes that haven't said who lives there come
// apart, under the results; the counts match; the badge shows only when the data supports it; and the posting form
// asks Woman / Man for each person.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: Date.now() + 9e9 };
const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Priya', role:'owner', gender:'female' }, account:'9822222222', onboarded:{ owner:true },
  attrClaimed:true, giftSeen:true, vibe, homeDraft: Object.assign({ residents:1 }, vibe), myListings:[], requests:[], demoIncoming:{}, notified:{} };
const seed = (ctx, s) => ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, s);
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch();
  let ctx = await b.newContext({ viewport:{ width:390, height:844 } }); await seed(ctx, seeker);
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1800); await closeDlgs(p);

  // the rule, on the same cases as the database test (parties-10-women.sql)
  const rule = await p.evaluate(() => [
    homeGender('room', 'female', { residents:2, flatmate_genders:['female'] }, 'female'), homeGender('room', 'any', { residents:1 }, 'female'),
    homeGender('room', 'female', { residents:2, flatmate_genders:['male'] }, 'female'), homeGender('flat', 'female', { residents:0 }, 'male'),
    homeGender('room', 'female', { residents:1 }, 'female'), homeGender('room', 'female', { residents:3 }, 'female'),
    homeGender('room', 'male', { residents:2, flatmate_genders:['male'] }, 'male'), homeGender('room', 'female', { residents:1 }, 'male'),
    homeGender('room', 'female', { residents:2, flatmate_genders:['female'] }, null)].map(x => x ?? '-').join(' '));
  ok(rule === 'female - - female female female? male - female?', 'the rule matches the database: ' + rule);

  // the chip, its count, and what you then see
  const chip = await p.evaluate(() => [...document.querySelectorAll('#quickF [data-quick]')].map(b => b.textContent));
  const wc = chip.find(t => /^Women only\d+$/.test(t)), want = wc ? +wc.replace(/\D/g, '') : -1;
  ok(wc && chip.some(t => /^Men only\d+$/.test(t)), 'quick filters say "Women only" and "Men only", with counts: ' + chip.slice(0, 2).join(' / '));
  await p.click('#quickF [data-quick="0"]'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const ids = sel => [...document.querySelectorAll(sel + ' [data-id]')].map(c => c.dataset.id), byId = id => api.all().find(l => l.id === id), hg = id => api.view(byId(id)).home_gender;
    const main = ids('#cards'), vib = ids('#vibeCards'), unc = ids('#uncCards');
    return { main, vib, unc, mainG: main.concat(vib).map(hg), uncG: unc.map(hg), any: main.concat(vib, unc).filter(id => byId(id).gender !== 'female').length,
      head: $('uncH').textContent, hidden: $('cardsUnc').hidden, badges: [...document.querySelectorAll('#cards .card')].filter(c => /Women-only home/.test(c.textContent)).length,
      flats: main.filter(id => byId(id).kind === 'flat').length, act: [...document.querySelectorAll('#activeF button')].map(x => x.textContent.trim()) }; });
  ok(r.main.length > 0 && r.mainG.every(g => g === 'female') && r.any === 0, `Women only: ${r.main.length} homes, every one women-only, none open to anyone: ` + JSON.stringify(r.mainG.slice(0, 5)));
  ok(new Set(r.main).size === r.main.length && r.main.length === want, `the chip's count matches what you see (${want} vs ${r.main.length})`);
  ok(r.flats > 0, 'whole flats for women are included: ' + r.flats);
  ok(r.badges === r.main.length, 'every card in the results says "Women-only home": ' + r.badges);
  ok(!r.hidden && r.unc.length > 0 && r.uncG.every(g => g === 'female?') && /^Open to women; who lives there isn.t confirmed$/.test(r.head), `not-confirmed homes come apart under the results (${r.unc.length}): ` + r.head);
  ok(await p.evaluate(() => [...document.querySelectorAll('#uncCards .card')].every(c => !/Women-only home/.test(c.textContent))), 'no badge on the not-confirmed ones');
  ok(r.act.some(t => /^Women only/.test(t)), 'active filter says "Women only": ' + r.act.join(' / '));
  const mixed = await p.evaluate(() => { const vis = new Set([...document.querySelectorAll('#cards [data-id], #vibeCards [data-id], #uncCards [data-id]')].map(c => c.dataset.id));
    const m = api.all().filter(l => l.city === 'Bengaluru' && l.gender === 'female' && api.view(l).home_gender === null); return { n: m.length, shown: m.filter(l => vis.has(l.id)).length }; });
  ok(mixed.shown === 0, `homes that say "women only" but have a man living there are never shown (${mixed.n} in Bengaluru)`);
  await p.evaluate(() => document.querySelector('#cards .card, #vibeCards .card').scrollIntoView({ block:'start' })); await p.waitForTimeout(400);
  await p.screenshot({ path: O + '/p15-women.png' });
  await p.evaluate(() => $('cardsUnc').scrollIntoView()); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p15-unconfirmed.png' });
  // a home's page
  const first = r.main[0];
  await p.evaluate(id => openListing(id), first); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => /Women-only home/.test(document.querySelector('#dlgListing .kv').textContent)), 'a women-only home\'s page says so');
  await p.evaluate(() => document.querySelector('#dlgListing .kv').scrollIntoView({ block:'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p15-page.png' });
  await closeDlgs(p);
  // Men only, and back to Anyone
  await p.evaluate(() => { setPrefs({ gender:'male' }); renderDiscover(); }); await p.waitForTimeout(1500);
  const m = await p.evaluate(() => [...document.querySelectorAll('#cards [data-id], #vibeCards [data-id]')].map(c => api.view(api.all().find(l => l.id === c.dataset.id)).home_gender));
  ok(m.length > 0 && m.every(g => g === 'male'), 'Men only works the same way: ' + m.length);
  await p.evaluate(() => { setPrefs({ gender:'' }); renderDiscover(); }); await p.waitForTimeout(1500);
  const any = await p.evaluate(() => ({ unc: $('cardsUnc').hidden, anyShown: [...document.querySelectorAll('#cards [data-id]')].some(c => api.all().find(l => l.id === c.dataset.id).gender === 'any') }));
  ok(any.unc && any.anyShown, 'Anyone: as before, no separate block');
  await b.close().catch(() => {});

  // the posting form asks Woman / Man for each person
  const b2 = await chromium.launch(); ctx = await b2.newContext({ viewport:{ width:390, height:844 } }); await seed(ctx, owner);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#post'); await p.waitForTimeout(1500); await closeDlgs(p);
  ok(await p.evaluate(() => /Pick “Women only” only if everyone living here is a woman/.test($('pGenderHint').textContent)), 'the form explains "Women only" in one line');
  await p.evaluate(() => { $('hCount').value = '3'; $('hCount').dispatchEvent(new Event('change')); });
  const rows = await p.evaluate(() => ({ you: document.querySelector('.fm-row[data-i="0"] .fm-g').textContent.trim(), groups: [1, 2].map(i => document.querySelectorAll(`[name=pg${i}]`).length),
    req: document.querySelector('[name=pg1]').required }));
  ok(rows.you === 'Woman, from your profile' && rows.groups.join() === '2,2' && rows.req, 'three people: you from your profile, and a required Woman / Man for each flatmate: ' + JSON.stringify(rows));
  const bad = await p.evaluate(() => { const fs = $('hCount').closest('fieldset.ps'); return stepOk(fs) ? 'passed' : fs.querySelector('.form-err').textContent; });
  ok(/Flatmate 2: woman or man/.test(bad), 'it won\'t go on without them: ' + bad);
  await p.evaluate(() => { document.querySelector('[name=pg1][value=female]').checked = true; document.querySelector('[name=pg2][value=female]').checked = true;
    $('hCount').value = '2'; $('hCount').dispatchEvent(new Event('change')); $('hCount').value = '3'; $('hCount').dispatchEvent(new Event('change')); });
  ok(await p.evaluate(() => document.querySelector('[name=pg1][value=female]').checked), 'answers stay when the number of people changes');
  await p.evaluate(() => { showPostStep(2); }); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.fm-row[data-i="1"]').scrollIntoView({ block:'center' })); await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelector('[name=pg2][value=female]').checked = true; });
  await p.screenshot({ path: O + '/p15-form.png' });
  const hh = await p.evaluate(() => readFmGenders($('fmRows'), 3));
  ok(JSON.stringify(hh) === JSON.stringify({ me:null, others:['female','female'] }), 'saved with the household as flatmate_genders: ' + JSON.stringify(hh));
  await b2.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
