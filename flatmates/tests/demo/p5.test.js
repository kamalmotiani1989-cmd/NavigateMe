// Points 6-10 in demo mode (port 8765): listing strength + edit, reply speed + owner nudge, compare saved
// homes, the share card, the referral prompt after the first yes, and the ?l= deep link.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const listing = { id:'mine-p5a', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }], interests:{ music:['Indie'], hobbies:[] } }, vibe),
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } };
const seekerOf = (name, phone, v) => ({ name, occupation:{ type:'working', what:'Analyst' }, vibe:v, phone, interests:{}, on_time:false });
const requests = [
  // answered 3 hours after it came in -> "Replies within hours"
  { id:'rq1', by:'seeker', listing_id:'mine-p5a', listing_title:listing.title, seeker_phone:'9822011223', seeker: seekerOf('Riya', '9822011223', vibe), status:'declined', message:'Hi',
    match_pct:80, created_at: iso(now - 30 * 36e5), decided_at: iso(now - 27 * 36e5), seen_owner:true, seen_seeker:true },
  // waiting for 5 minutes: more than the demo's 90 seconds
  { id:'rq2', by:'seeker', listing_id:'mine-p5a', listing_title:listing.title, seeker_phone:'9822033445', seeker: seekerOf('Arjun', '9822033445', vibe), status:'pending', message:'Hey',
    match_pct:85, created_at: iso(now - 5 * 60e3), decided_at:null, seen_owner:true, seen_seeker:true },
];
const owner = { user:{ phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents: 1 }, vibe), myListings:[listing], requests, demoIncoming:{}, notified:{ rq2pending:1 }, waitNudged: now };
const seeker = { user:{ phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'x' } }, account:'9811111111', onboarded:{ seeker:true },
  giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, interests:{ music:['Indie'], hobbies:['Gym'] }, prefs:{ city:'Bengaluru', areas:[] }, profilePromoHidden: now + 9e9 };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAC0lEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64');
const closeDialogs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const seed = (ctx, s) => ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, s);
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ owner
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await seed(ctx, owner);
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push('owner ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#mine'); await p.waitForTimeout(1500); await closeDialogs(p);
  const mine = await p.evaluate(() => ({ nudge: (document.querySelector('#mineList .wait-nudge') || {}).innerText || '', reply: (document.querySelector('#mineList .reply-line') || {}).innerText || '',
    qm: (document.querySelector('.qm-head') || {}).innerText || '', tips: [...document.querySelectorAll('.qm-tips button')].map(b => b.textContent + '@' + b.dataset.step),
    btns: [...document.querySelectorAll('.mine-card button')].map(b => b.textContent.trim()) }));
  ok(/Arjun has been waiting more than a day/.test(mine.nudge) && /Reply now/.test(mine.nudge), 'owner: waiting banner on My flat: ' + mine.nudge.replace(/\s+/g, ' ').slice(0, 70));
  ok(/Replies within hours/.test(mine.reply), 'owner: own reply speed line: ' + mine.reply.slice(0, 60));
  ok(/Listing strength 30%/.test(mine.qm) && mine.tips.length === 3 && /Add photos/.test(mine.tips[0]) && mine.tips[0].endsWith('@1'), 'owner: strength 30% with 3 tips: ' + mine.qm + ' | ' + mine.tips.join(' / '));
  ok(mine.btns.includes('Edit listing') && mine.btns.includes('Share'), 'owner: Edit and Share buttons: ' + mine.btns.join(', '));
  await p.screenshot({ path: `${O}/p5-m-mine.png`, fullPage: true });
  // the "Describe the flat" tip opens the editor at step 2
  await p.click('.qm-tips button[data-step="2"]'); await p.waitForTimeout(1500);
  const ed = await p.evaluate(() => ({ hash: location.hash, h1: $('postH1').textContent, bar: !$('editBar').hidden && $('editTitle').textContent, step2: !document.querySelector('fieldset[data-step="2"]').hidden,
    desc: $('pDesc').value, title: $('pTitle').value, rent: $('pRent').value, city: $('pCity').value, kind: document.querySelector('[name=kind]:checked').value,
    amen: [...document.querySelectorAll('#pAmen input:checked')].map(i => i.value), wifi: document.querySelector('[name=amt_wifi]').value, fmWhat: document.querySelector('[name=pwhat0]').value,
    quiz: document.querySelectorAll('#hQuiz input:checked').length, pNameDisabled: $('pName').disabled, pin: $('aPin').value, submit: $('postSubmit').textContent }));
  ok(ed.hash === '#post' && ed.h1 === 'Edit your listing' && ed.bar === 'Sunny room near the metro' && ed.step2, 'owner: editor opens at step 2: ' + JSON.stringify({ h1: ed.h1, bar: ed.bar, step2: ed.step2 }));
  ok(ed.desc === 'Short.' && ed.title === 'Sunny room near the metro' && ed.rent === '15000' && ed.city === 'Bengaluru' && ed.kind === 'room' && ed.amen.join() === 'Wi-Fi' && ed.wifi === '300'
    && ed.fmWhat === 'Designer at an agency' && ed.quiz === 13, 'owner: form prefilled from the listing: ' + JSON.stringify({ desc: ed.desc, amen: ed.amen, wifi: ed.wifi, fmWhat: ed.fmWhat, quiz: ed.quiz }));
  ok(ed.pNameDisabled && ed.pin === '560102' && ed.submit === 'Save changes', 'owner: private part shown but locked, button says Save changes');
  await p.screenshot({ path: `${O}/p5-m-edit.png`, fullPage: true });
  await p.fill('#pDesc', 'Bright room with a balcony, 5 minutes from the metro. Rent includes maintenance; electricity is split by meter.');
  await p.click('#psSteps li:nth-child(1)'); await p.waitForTimeout(400);
  await p.fill('#pTitle', 'Sunny balcony room near the metro');
  await p.setInputFiles('#pPhotos', { name: 'a.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(500);
  await p.evaluate(() => ['AC', 'Fridge'].forEach(v => { document.querySelector(`#pAmen input[value="${v}"]`).checked = true; }));
  const pv = await p.evaluate(() => document.querySelectorAll('#pPreviews figure').length);
  ok(pv === 1, 'owner: new photo previewed: ' + pv);
  await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(400);
  await p.click('fieldset[data-step="2"] [data-ps="next"]'); await p.waitForTimeout(400);
  ok(await p.isVisible('fieldset[data-step="3"]') && !(await p.isHidden('#privKept')), 'owner: step 3 shows the kept-private note');
  await p.click('#postSubmit'); await p.waitForTimeout(2500);
  const after = await p.evaluate(() => ({ hash: location.hash, title: (document.querySelector('.mine-card h3') || {}).innerText || '', qm: (document.querySelector('.qm-head') || {}).innerText || '',
    tips: [...document.querySelectorAll('.qm-tips button')].map(b => b.textContent), l: state.myListings[0], bar: $('editBar').hidden, h1: $('postH1').textContent, nameOn: !$('pName').disabled }));
  ok(after.hash === '#mine' && /Sunny balcony room/.test(after.title) && after.l.photos.length === 1 && after.l.amenities.length === 3 && /balcony/.test(after.l.description)
    && after.l.private.contact_phone === '9822222222' && after.l.private.address_parts.pin === '560102', 'owner: saved: title, photo, amenities, description changed; private part kept');
  ok(/Listing strength 75%/.test(after.qm) && after.tips.length === 2 && after.bar && after.h1 === 'Describe your room' && after.nameOn, 'owner: strength now 75%, editor reset: ' + after.qm + ' | ' + after.tips.join(' / '));
  await p.screenshot({ path: `${O}/p5-m-mine-after.png`, fullPage: true });
  // Cancel leaves no trace on a fresh post
  await p.click('.mine-card [data-edit]'); await p.waitForTimeout(1200);
  await p.click('#editCancel'); await p.waitForTimeout(800);
  await p.click('#mineList [data-go="post"]'); await p.waitForTimeout(800);
  const fresh = await p.evaluate(() => ({ title: $('pTitle').value, h1: $('postH1').textContent, prev: document.querySelectorAll('#pPreviews figure').length, bar: $('editBar').hidden }));
  ok(fresh.title === '' && fresh.h1 === 'Describe your room' && fresh.prev === 0 && fresh.bar, 'owner: after Cancel the post form is blank: ' + JSON.stringify(fresh));
  // Share (no share sheet here): the card dialog with the image, WhatsApp and the link
  await p.goto('http://localhost:8765/#mine'); await p.waitForTimeout(1200);
  await p.click('.mine-card [data-share]'); await p.waitForTimeout(3000);
  const sh = await p.evaluate(() => ({ open: $('dlgShare').open, img: !!document.querySelector('#shBody .sh-img'), w: (document.querySelector('#shBody .sh-img') || {}).naturalWidth,
    wa: (document.querySelector('#shBody a[href^="https://wa.me"]') || {}).href || '', copy: (document.querySelector('#shBody [data-copy]') || {}).dataset?.copy }));
  ok(sh.open && sh.img && sh.w === 1080 && /l%3Dmine-p5a/.test(sh.wa) && /\?l=mine-p5a$/.test(sh.copy || ''), 'owner: share card drawn (1080 wide) with the listing link: ' + sh.copy);
  await p.screenshot({ path: `${O}/p5-m-share-owner.png` });
  await p.evaluate(() => { const i = document.querySelector('#shBody .sh-img'); const a = document.createElement('a'); a.href = i.src; a.download = 'x'; window.__png = i.src; });
  const dataUrl = await p.evaluate(() => window.__png);
  require('fs').writeFileSync(`${O}/p5-card-owner.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  await closeDialogs(p);
  // Requests page: the waiting banner for owners
  await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1500);
  const rq = await p.evaluate(() => (document.querySelector('#urgentReq .wait-nudge') || {}).innerText || '');
  ok(/waiting more than a day/.test(rq) && !/Reply now/.test(rq), 'owner: waiting banner on Requests (no link to itself)');
  await ctx.close();

  // ------------------------------------------------------------ seeker
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await seed(ctx, seeker);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('seeker ' + e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(2000); await closeDialogs(p);
  // homes before nudges: the vibe-match row starts on the first screen, the profile and type cards come after it
  const order = await p.evaluate(() => { const top = id => Math.round($(id).getBoundingClientRect().top); return { row: top('vibeRow'), rowShown: !$('vibeRow').hidden, promo: top('profilePromo'), extras: top('extrasD') }; });
  ok(order.rowShown && order.row < 844 && order.promo > order.row && order.extras > order.row, 'seeker: vibe matches on the first screen, nudges after them: ' + JSON.stringify(order));
  // with filters that leave no homes, the "no homes match" help comes before the nudges
  const empty = await p.evaluate(async () => { const keep = Object.assign({}, state.prefs); Object.assign(state.prefs, { max: 1000, look: 'room' }); save(); await renderDiscover();
    const top = el => Math.round(el.getBoundingClientRect().top); const r = { help: top(document.querySelector('#cards .empty') || $('cards')), text: ($('cards').querySelector('.empty h3') || {}).textContent, promo: top($('profilePromo')), cards: document.querySelectorAll('#cards .card').length };
    state.prefs = keep; save(); await renderDiscover(); return r; });
  ok(empty.cards === 0 && /No homes match/.test(empty.text) && empty.help < empty.promo, 'seeker: with no homes, the help comes before the nudges: ' + JSON.stringify(empty));
  const disc = await p.evaluate(() => ({ cards: document.querySelectorAll('#cards .card').length, badges: [...document.querySelectorAll('#cards .card .reply')].map(x => x.textContent),
    fast: document.querySelectorAll('#cards .card .reply.fast').length }));
  ok(disc.cards > 3 && disc.badges.length > 0 && disc.badges.length < disc.cards && disc.fast > 0, `seeker: reply-speed lines on some cards (${disc.badges.length} of ${disc.cards}, ${disc.fast} fast): ` + [...new Set(disc.badges)].join(' / '));
  // open a card with a fast reply line: the header says so; share from the header
  const fastId = await p.evaluate(() => document.querySelector('#cards .card:has(.reply.fast)').dataset.id);
  await p.evaluate(id => openListing(id), fastId); await p.waitForTimeout(1200);
  const lhead = await p.evaluate(() => $('lLoc').textContent);
  ok(/⚡ (Replies within hours|Usually replies within a day)/.test(lhead), 'seeker: listing header shows the reply speed: ' + lhead);
  const shareBtn = await p.evaluate(() => ({ label: $('lShare').getAttribute('aria-label'), own: !!$('lShare').querySelector('circle'), back: !!$('lShare').querySelector('.x-back') }));
  ok(shareBtn.label === 'Share this home' && shareBtn.own && !shareBtn.back, 'seeker: the share button keeps its own icon and label: ' + JSON.stringify(shareBtn));
  await p.click('#lShare'); await p.waitForTimeout(3000);
  const sh2 = await p.evaluate(() => ({ open: $('dlgShare').open, img: !!document.querySelector('#shBody .sh-img'), wa: decodeURIComponent((document.querySelector('#shBody a[href^="https://wa.me"]') || {}).href || '') }));
  ok(sh2.open && sh2.img && /vibe match with me/.test(sh2.wa) && /\?l=demo-\d+/.test(sh2.wa), 'seeker: share card with the vibe match and the link: ' + sh2.wa.slice(0, 120));
  await p.screenshot({ path: `${O}/p5-m-share-seeker.png` });
  const dataUrl2 = await p.evaluate(() => document.querySelector('#shBody .sh-img').src);
  require('fs').writeFileSync(`${O}/p5-card-seeker.png`, Buffer.from(dataUrl2.split(',')[1], 'base64'));
  await closeDialogs(p);
  // save three homes, compare them
  const ids = await p.evaluate(() => [...document.querySelectorAll('#cards .card')].slice(0, 3).map(c => c.dataset.id));
  for(const id of ids){ await p.click(`#cards .card[data-id="${id}"] [data-save]`); await p.waitForTimeout(300); }
  await p.goto('http://localhost:8765/#saved'); await p.waitForTimeout(1500);
  const sv = await p.evaluate(() => ({ cards: document.querySelectorAll('#savedCards .card').length, btn: (document.querySelector('[data-compare]') || {}).textContent, table: !!document.querySelector('.cmp') }));
  ok(sv.cards === 3 && /Compare side by side/.test(sv.btn || '') && !sv.table, 'seeker: 3 saved as cards with a Compare button');
  await p.click('[data-compare]'); await p.waitForTimeout(800);
  const cmp = await p.evaluate(() => ({ cols: document.querySelectorAll('.cmp thead th[data-id]').length, rows: [...document.querySelectorAll('.cmp tbody td:first-child')].map(t => t.textContent),
    best: document.querySelectorAll('.cmp td.best').length, cards: document.querySelectorAll('#savedCards .card').length, btn: document.querySelector('[data-compare]').textContent,
    rentBest: (() => { const tr = [...document.querySelectorAll('.cmp tbody tr')].find(r => r.firstChild.textContent === 'Rent / month'); const tds = [...tr.querySelectorAll('td')].slice(1);
      const v = tds.map(t => Number(t.textContent.replace(/[^\d]/g, ''))); const b = tds.findIndex(t => t.classList.contains('best')); return b === v.indexOf(Math.min(...v)); })() }));
  ok(cmp.cols === 3 && cmp.cards === 0 && cmp.rows.includes('Rent / month') && cmp.rows.includes('Vibe match') && cmp.rows.includes('To move in') && cmp.rows.includes('Owner replies') && cmp.best >= 3 && cmp.rentBest,
    'seeker: compare table: 3 columns, rows ' + cmp.rows.length + ', cheapest rent marked, ' + cmp.best + ' best cells');
  await p.screenshot({ path: `${O}/p5-m-compare.png`, fullPage: true });
  await p.click('.cmp thead th[data-id]'); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => $('dlgListing').open), 'seeker: a column heading opens the home');
  await closeDialogs(p);
  await p.click('[data-compare]'); await p.waitForTimeout(600);
  ok((await p.evaluate(() => document.querySelectorAll('#savedCards .card').length)) === 3, 'seeker: back to cards');
  // desktop compare screenshot
  const d = await b.newContext({ viewport: { width: 1366, height: 860 } }); await seed(d, Object.assign({}, seeker, { saved: ids }));
  const dp = await d.newPage(); await dp.goto('http://localhost:8765/#saved'); await dp.waitForTimeout(1500); await closeDialogs(dp);
  await dp.click('[data-compare]'); await dp.waitForTimeout(800); await dp.screenshot({ path: `${O}/p5-d-compare.png`, fullPage: true }); await d.close();
  // referral prompt: a fresh yes (unseen, approved) arrives -> the card on Discover, until dismissed
  await p.evaluate(() => { state.requests.push({ id:'rqx', by:'seeker', listing_id: api.all()[0].id, listing_title: api.all()[0].title, seeker_phone: state.user.phone, seeker:{ name:'Neha' },
    status:'approved', message:'', match_pct:80, created_at:new Date(Date.now() - 36e5).toISOString(), decided_at:new Date().toISOString(), seen_owner:true, seen_seeker:false });
    state.unlocked.push(api.all()[0].id); state.called = { [api.all()[0].id]: Date.now() }; save(); });
  await p.evaluate(() => checkInbox()); await p.waitForTimeout(1500);
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1800); await closeDialogs(p);
  const ref = await p.evaluate(() => ({ ask: !!state.refAsk, card: (document.querySelector('#urgent .ref-card') || {}).innerText || '' }));
  ok(ref.ask && /Your first yes/i.test(ref.card) && /Share my link/.test(ref.card), 'seeker: referral prompt after the first yes: ' + ref.card.replace(/\s+/g, ' ').slice(0, 80));
  await p.screenshot({ path: `${O}/p5-m-referral.png` });
  await p.click('#urgent [data-ref-hide]'); await p.waitForTimeout(600);
  const ref2 = await p.evaluate(() => ({ prompted: !!state.refPrompted, card: !!document.querySelector('#urgent .ref-card') }));
  await p.goto('http://localhost:8765/#requests'); await p.waitForTimeout(1200);
  ok(ref2.prompted && !ref2.card && !(await p.$('#urgentReq .ref-card')), 'seeker: Not now hides it everywhere');
  // deep link opens the home
  const target = await p.evaluate(() => api.all()[2].id);
  await p.goto(`http://localhost:8765/?l=${target}#discover`); await p.waitForTimeout(2500);
  const dl = await p.evaluate(() => ({ open: $('dlgListing').open, id: currentId, url: location.search, ls: localStorage.getItem('fm_open') }));
  ok(dl.open && dl.id === target && dl.url === '' && !dl.ls, 'seeker: ?l= link opens the home and is dropped from the address: ' + JSON.stringify(dl));
  await ctx.close(); await b.close(); console.log('errors', errs);
})();
