const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const owner = { user:{ phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents: 1 }, vibe) };
const seeker = { user:{ phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'x' } }, account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:['HSR Layout'], look:'room' }, demoTribeAt:'done', demoInvites:'done', saved:[] };
const png = (c) => `https://img.test/${c.slice(1)}.svg`;
const svgOf = c => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#${c}"/></svg>`;
(async () => {
  const b = await chromium.launch();
  for(const [w, h, tag] of [[390, 844, 'm'], [1366, 860, 'd']]){
    // ---- owner: post in three steps
    let ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
    await ctx.addInitScript(s => { localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); }, owner);
    let p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/#post'); await p.waitForTimeout(1200);
    await p.evaluate(() => { const d = $('dlgGender'); if(d && d.open) d.close(); });
    ok(await p.isVisible('fieldset[data-step="1"]') && !(await p.isVisible('fieldset[data-step="2"]')), tag + ': step 1 shown alone');
    if(tag === 'm') await p.screenshot({ path: `${O}/p3-m-post-step1.png` });
    await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(500);
    const err1 = await p.evaluate(() => { const e = document.querySelector('fieldset[data-step="1"] .form-err'); return e && !e.hidden ? e.textContent : ''; });
    ok(/Please check/.test(err1) && await p.isVisible('fieldset[data-step="1"]'), tag + ': empty step 1 stays with a message: ' + err1.slice(0, 60));
    await p.fill('#pTitle', 'Sunny room near the metro'); await p.selectOption('#pCity', 'Bengaluru'); await p.fill('#pLocality', 'HSR Layout'); await p.fill('#pRent', '15000');
    await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(600);
    ok(await p.isVisible('fieldset[data-step="2"]') && await p.evaluate(() => $('psSteps').children[0].className === 'done' && $('psSteps').children[1].className === 'now'), tag + ': step 2 after a complete step 1');
    await p.click('fieldset[data-step="2"] [data-ps="back"]'); await p.waitForTimeout(400);
    ok(await p.isVisible('fieldset[data-step="1"]') && (await p.inputValue('#pTitle')) === 'Sunny room near the metro', tag + ': back keeps what was typed');
    await p.click('#psSteps li:nth-child(1)'); await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(400);
    await p.click('fieldset[data-step="2"] [data-ps="next"]'); await p.waitForTimeout(500);
    ok(await p.isVisible('fieldset[data-step="3"]'), tag + ': step 3');
    await p.fill('#aFlat', 'B-304'); await p.fill('#aBuilding', 'Green Park'); await p.fill('#aPin', '560102');
    if(tag === 'm') await p.screenshot({ path: `${O}/p3-m-post-step3.png`, fullPage: true });
    // publish with a gap in step 1: jumps back there
    await p.evaluate(() => { $('pTitle').value = ''; });
    await p.click('fieldset[data-step="3"] [type=submit]'); await p.waitForTimeout(600);
    ok(await p.isVisible('fieldset[data-step="1"]') && await p.evaluate(() => !document.querySelector('fieldset[data-step="1"] .form-err').hidden), tag + ': publish with a gap goes back to step 1');
    await p.fill('#pTitle', 'Sunny room near the metro'); await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(300); await p.click('fieldset[data-step="2"] [data-ps="next"]'); await p.waitForTimeout(300);
    await p.click('fieldset[data-step="3"] [type=submit]'); await p.waitForTimeout(2000);
    const posted = await p.evaluate(() => ({ hash: location.hash, cards: document.querySelectorAll('.mine-card').length, stats: [...document.querySelectorAll('.mine-card .stats.six .stat span')].map(s => s.textContent) }));
    ok(posted.cards === 1 && posted.stats.length === 6, tag + ': published, My flat shows 6 numbers: ' + posted.stats.join(' | '));
    await p.screenshot({ path: `${O}/p3-${tag}-mine.png`, fullPage: tag === 'm' });
    await ctx.close();
    // ---- seeker: gallery dots on a listing with photos
    ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
    await ctx.addInitScript(s => { localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); }, seeker);
    await ctx.route('https://img.test/**', r => r.fulfill({ contentType: 'image/svg+xml', body: svgOf(r.request().url().split('/').pop().replace('.svg', '')) }));
    p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + e.message));
    await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500);
    await p.evaluate(() => { const d = $('dlgGender'); if(d && d.open) d.close(); });
    await p.evaluate(([a, b2, c]) => { const l = api.all().find(x => x.city === 'Bengaluru'); l.photos = [a, b2, c]; openListing(l.id); }, [png('#F7B53B'), png('#1E6FD9'), png('#14C08A')]);
    await p.waitForTimeout(1200);
    const g = await p.evaluate(() => ({ imgs: document.querySelectorAll('#lBody .gallery img:not(.gal-clone)').length, copies: document.querySelectorAll('#lBody .gallery img.gal-clone').length, dots: document.querySelectorAll('#lBody .gal-dots button').length, n: document.querySelector('#lBody .gal-n').textContent, prevHidden: document.querySelector('#lBody .gal-arr.prev').hidden }));
    ok(g.imgs === 3 && g.copies === 2 && g.dots === 3 && g.n === '1 / 3' && !g.prevHidden, tag + ': gallery has 3 photos, 2 loop copies, 3 dots and a counter: ' + JSON.stringify(g));
    await p.click('#lBody .gal-dots button:nth-child(3)'); await p.waitForTimeout(900);
    const g2 = await p.evaluate(() => ({ n: document.querySelector('#lBody .gal-n').textContent, on: [...document.querySelectorAll('#lBody .gal-dots button')].map(d => d.getAttribute('aria-selected')).join(','), nextHidden: document.querySelector('#lBody .gal-arr.next').hidden }));
    ok(g2.n === '3 / 3' && g2.on === 'false,false,true' && !g2.nextHidden, tag + ': tapping the third dot goes to photo 3: ' + JSON.stringify(g2));
    // the loop: next from the last photo is the first; back from the first is the last
    await p.click('#lBody .gal-arr.next'); await p.waitForTimeout(1200);
    const g3 = await p.evaluate(() => { const g = document.querySelector('#lBody .gallery'); return { n: document.querySelector('#lBody .gal-n').textContent, on: [...document.querySelectorAll('#lBody .gal-dots button')].map(d => d.getAttribute('aria-selected')).join(','), pos: Math.round(g.scrollLeft / g.clientWidth) }; });
    ok(g3.n === '1 / 3' && g3.on === 'true,false,false' && g3.pos === 1, tag + ': next after the last photo loops to the first (and sits on the real one): ' + JSON.stringify(g3));
    await p.click('#lBody .gal-arr.prev'); await p.waitForTimeout(1200);
    const g4 = await p.evaluate(() => { const g = document.querySelector('#lBody .gallery'); return { n: document.querySelector('#lBody .gal-n').textContent, pos: Math.round(g.scrollLeft / g.clientWidth) }; });
    ok(g4.n === '3 / 3' && g4.pos === 3, tag + ': back from the first photo loops to the last: ' + JSON.stringify(g4));
    // a swipe (scroll) past the end does the same
    await p.evaluate(() => { const g = document.querySelector('#lBody .gallery'); g.scrollTo({ left: 4 * g.clientWidth, behavior: 'smooth' }); }); await p.waitForTimeout(1200);
    const g5 = await p.evaluate(() => { const g = document.querySelector('#lBody .gallery'); return { n: document.querySelector('#lBody .gal-n').textContent, pos: Math.round(g.scrollLeft / g.clientWidth) }; });
    ok(g5.n === '1 / 3' && g5.pos === 1, tag + ': swiping past the last photo lands on the first: ' + JSON.stringify(g5));
    await p.screenshot({ path: `${O}/p3-${tag}-gallery.png` });
    await ctx.close();
  }
  await b.close(); console.log('errors', errs);
})();
