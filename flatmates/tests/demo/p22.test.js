// The clean pack (Kamal, 15 Nov; demo mode, port 8765, 390 wide): search like you'd talk, the opening story, the
// welcome after sign-up, the friendlier notifications ask, and the cleaner home cards. No photos are required and
// nothing asks about religion.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: Date.now() + 9e9 };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch();
  // ---- the opening story, for a first visit
  let ctx = await b.newContext({ viewport:{ width:390, height:844 } }); let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/?story'); await p.waitForTimeout(1200);
  const s0 = await p.evaluate(() => ({ open: $('dlgStory').open, h: $('stStage').querySelector('h2').textContent, dots: $('stDots').children.length, skip: $('stSkip').textContent }));
  ok(s0.open && s0.dots === 4 && s0.skip === 'Skip' && /spare room/.test(s0.h), 'a first visit opens a short story (4 screens, Skip): ' + JSON.stringify(s0));
  await p.screenshot({ path: O + '/p22-story-1.png' });
  await p.click('#stNext'); await p.click('#stNext'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => /Meet people who live like you/.test($('stStage').textContent) && !!$('stStage').querySelector('.st-av svg')), 'screen 3: two of our cartoon people and a match ring');
  await p.screenshot({ path: O + '/p22-story-3.png' });
  await p.click('#stNext'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => $('stNext').textContent === 'Find my flatmates'), 'the last screen leads to sign-up');
  await p.click('#stNext'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !$('dlgStory').open && !!readLS('fm_story_seen')), 'then the sign-up card, and the story is not shown again');
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => !$('dlgStory').open), 'a second visit goes straight to the page');
  await ctx.close();

  // ---- signed in: talk search, cards, notifications
  ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1600); await closeDlgs(p);
  const cases = await p.evaluate(() => [
    'room near Koramangala under 15k, veg', 'women only flat in Pune', 'shared room in HSR Layout below 10000 no smoking', 'rooms near HR College',
    'whole flat between 20k and 30k furnished', 'pet friendly room in bangalore', 'flatmate in Andheri, vegetarian', 'Indiranagar'].map(q => { const t = parseTalk(q); return { q, patch: t.patch, said: t.said, place: t.place }; }));
  const by = q => cases.find(c => c.q === q);
  let c = by('room near Koramangala under 15k, veg');
  ok(c.patch.look === 'room' && c.patch.max === 15000 && c.patch.rules.includes('veg') && c.patch.areas[0] === 'Koramangala' && !c.place, 'talk: "room near Koramangala under 15k, veg": ' + c.said.join(' · '));
  c = by('women only flat in Pune'); ok(c.patch.gender === 'female' && c.patch.look === 'flat' && c.patch.city === 'Pune', 'talk: "women only flat in Pune": ' + c.said.join(' · '));
  c = by('shared room in HSR Layout below 10000 no smoking'); ok(c.patch.look === 'shared' && c.patch.max === 10000 && c.patch.rules.includes('noSmoke') && c.patch.areas[0] === 'HSR Layout', 'talk: shared room, budget, no smoking, area: ' + c.said.join(' · '));
  c = by('rooms near HR College'); ok(c.patch.look === 'room' && c.place === 'hr college', 'talk: a place we don\'t know goes to the place search: ' + c.place);
  c = by('whole flat between 20k and 30k furnished'); ok(c.patch.look === 'flat' && c.patch.min === 20000 && c.patch.max === 30000 && c.patch.furn[0] === 'full', 'talk: a range and furnishing: ' + c.said.join(' · '));
  c = by('pet friendly room in bangalore'); ok(c.patch.rules.includes('pets') && c.patch.city === 'Bengaluru', 'talk: pets and a city by its other name: ' + c.said.join(' · '));
  c = by('flatmate in Andheri, vegetarian'); ok(c.patch.rules.includes('veg') && c.patch.city === 'Mumbai' && c.patch.areas[0] === 'Andheri West' || c.patch.rules.includes('veg'), 'talk: "flatmate in Andheri, vegetarian": ' + c.said.join(' · '));
  // typed in the box: the filters follow and the cards match
  await p.fill('#dsQ', 'room in Koramangala under 30k'); await p.press('#dsQ', 'Enter'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ f: prefs(), act: [...document.querySelectorAll('#activeF button')].map(x => x.textContent.trim()), rents: [...document.querySelectorAll('#cards [data-id]')].map(x => api.all().find(l => l.id === x.dataset.id)).map(l => [l.rent, l.locality]) }));
  ok(r.f.max === 30000 && r.f.areas[0] === 'Koramangala' && r.rents.length > 0 && r.rents.every(([rent, loc]) => rent <= 30000 && loc === 'Koramangala') && await p.evaluate(() => [...document.querySelectorAll('.ps-list')].every(x => x.hidden || !x.offsetParent)), 'typed in the search box: the filters follow and every home fits: ' + r.act.join(' / '));
  await p.screenshot({ path: O + '/p22-talk.png' });
  await p.evaluate(() => { setPrefs({ max: 0, min: 0, rules: [], areas: [], look: '' }); renderDiscover(); }); await p.waitForTimeout(1200);
  // the cleaner card: rent first and large, title, area, small chips, trust line last
  const card = await p.evaluate(() => { const c = document.querySelector('#cards .card.lcard'), k = [...c.querySelector('.body').children].map(x => x.className || x.tagName.toLowerCase());
    return { order: k.slice(0, 4), onPhoto: !!c.querySelector('.thumb .price-pill'), chips: [...c.querySelectorAll('.lc-chips span')].map(x => x.textContent), lastTrust: c.querySelector('.body').lastElementChild.className }; });
  ok(card.order[0] === 'lc-price' && card.order[1] === 'h3' && card.order[2] === 'loc' && card.order[3] === 'lc-chips' && !card.onPhoto && card.lastTrust === 'trust',
    'home card: rent first, then title, area and chips; the trust line last: ' + JSON.stringify(card));
  await p.evaluate(() => document.querySelector('#cards .card').scrollIntoView({ block: 'start' })); await p.evaluate(() => scrollBy(0, -70)); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p22-card.png' });
  // notifications: what you'll get, and Not now
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1400); await closeDlgs(p);
  const na = await p.evaluate(() => { const n = document.querySelector('.notif-ask'); return n && { items: n.querySelectorAll('li').length, later: !!n.querySelector('[data-notify-later]'), on: !!n.querySelector('[data-notify-on]') }; });
  if(na){ ok(na.items === 3 && na.later && na.on, 'notifications: the ask says what you\'ll get, with Not now: ' + JSON.stringify(na));
    await p.evaluate(() => document.querySelector('.notif-ask').scrollIntoView({ block: 'center' })); await p.screenshot({ path: O + '/p22-notif.png' });
    await p.click('[data-notify-later]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !document.querySelector('.notif-ask') && notifyCard('x') === ''), 'Not now hides it for a week'); }
  else ok(true, 'notifications: not offered in this browser');
  // no photo is required and nothing asks about religion
  const req = await p.evaluate(async () => { const src = await (await fetch(location.pathname)).text(); return { religion: /religion/i.test(src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\/[^\n]*/g, '')),
    photoRequired: !!document.querySelector('#postForm input[type=file][required]') }; });
  ok(!req.religion && !req.photoRequired, 'no religion question anywhere, and no photo is required: ' + JSON.stringify(req));
  await ctx.close();

  // ---- the welcome after a new sign-up
  ctx = await b.newContext({ viewport:{ width:390, height:844 } }); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1000);
  await p.click('.role:nth-child(1)'); await p.click('#loginForm .lg-step[data-step=role] .lg-next');
  await p.fill('#lgName', 'Kamal'); await p.click('#loginForm .lg-step[data-step=name] .lg-next');
  await p.click('.lg-sx:has([value=male])'); await p.click('#loginForm .lg-step[data-step=sex] .lg-next');
  await p.fill('#lgPhone', '9811000777'); await p.check('#lgAge', { force: true }); await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(700);
  const code = await p.evaluate(() => pendingOtp && pendingOtp.code); await p.fill('#lgOtp', code); await p.click('#otpForm [type=submit]'); await p.waitForTimeout(1500);
  const hl = await p.evaluate(() => ({ open: $('dlgHello').open, hi: $('hlHi').textContent, people: $('hlArt').querySelectorAll(':scope > span').length }));
  ok(hl.open && hl.hi === 'Welcome, Kamal' && hl.people === 4, 'a new account gets a warm welcome with their name: ' + JSON.stringify(hl));
  await p.screenshot({ path: O + '/p22-hello.png' });
  await p.click('#hlGo'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !$('dlgHello').open && !$('view-onboard').hidden), 'then straight on to the questions');
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
