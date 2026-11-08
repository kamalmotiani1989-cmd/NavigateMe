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
    // easier posting: the extras wait behind "More details", the title is optional and written from the answers
    const easy0 = await p.evaluate(() => ({ closed: !$('pMore').open, titleInMore: $('pMore').contains($('pTitle')), sum: $('pMoreSum').textContent, req: [...document.querySelectorAll('fieldset[data-step="1"] [required]')].map(e => e.id).sort().join(),
      height: document.querySelector('fieldset[data-step="1"]').getBoundingClientRect().height, vh: innerHeight }));
    ok(easy0.closed && easy0.titleInMore && easy0.sum === 'Semi furnished · Anyone · Available now · Bachelors welcome' && easy0.req === 'pCity,pFrom,pLocality,pRent',
      tag + ': More details closed, says what is assumed, title not required: ' + JSON.stringify({ sum: easy0.sum, req: easy0.req }));
    if(tag === 'm') ok(easy0.height / easy0.vh < 1.6, tag + ': step 1 fits in about one and a half phone screens: ' + (easy0.height / easy0.vh).toFixed(2));
    // a gap inside the closed section opens it, so the message points at something visible
    await p.evaluate(() => { $('pFrom').value = ''; }); await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(400);
    const gap = await p.evaluate(() => ({ open: $('pMore').open, msg: document.querySelector('fieldset[data-step="1"] .form-err').textContent }));
    ok(gap.open && /Available from/.test(gap.msg), tag + ': a gap inside More details opens it: ' + gap.msg.slice(0, 80));
    await p.evaluate(() => { $('pFrom').value = new Date().toISOString().slice(0, 10); $('pMore').open = false; });
    await p.selectOption('#pCity', 'Bengaluru'); await p.fill('#pLocality', 'HSR Layout'); await p.fill('#pRent', '15000');
    // photos are beautified on the phone: a dark room gets brighter, a good photo keeps its brightness, the original stays a tap away
    const ph = await p.evaluate(async () => {
      const draw = (dark) => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const x = c.getContext('2d');
        x.fillStyle = '#d9cdb5'; x.fillRect(0, 0, 800, 370); x.fillStyle = '#8a6a48'; x.fillRect(0, 370, 800, 230); x.fillStyle = '#9fd0ea'; x.fillRect(470, 70, 240, 210);
        x.fillStyle = '#5a3b8a'; x.fillRect(60, 300, 400, 180); x.fillStyle = '#f2efe6'; x.fillRect(80, 270, 150, 50); x.fillStyle = '#2f7d4a'; x.fillRect(720, 300, 50, 120);
        const id = x.getImageData(0, 0, 800, 600), d = id.data; for(let i = 0; i < d.length; i += 4){ d[i] *= dark; d[i+1] *= dark; d[i+2] *= dark; } x.putImageData(id, 0, 0); return c; };
      const mean = async (src) => { const img = await decodeImage(src); const k = document.createElement('canvas'); k.width = 200; k.height = 150; const x = k.getContext('2d'); x.drawImage(img, 0, 0, 200, 150); const d = x.getImageData(0, 0, 200, 150).data; let t = 0; for(let i = 0; i < d.length; i += 4) t += (d[i]*299 + d[i+1]*587 + d[i+2]*114) / 1000; return Math.round(t / (d.length / 4)); };
      const file = async (c, name) => new File([await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9))], name, { type: 'image/jpeg' });
      addPhotos([await file(draw(0.3), 'dark.jpg'), await file(draw(0.95), 'good.jpg')]);
      const pending = document.querySelectorAll('#pPreviews .ph-orig').length;
      await Promise.all(photoFiles.map(f => f.enhancing));
      const [dk, gd] = photoFiles;
      return { pending, darkBefore: await mean(dk), darkAfter: await mean(dk.enhanced), goodBefore: await mean(gd), goodAfter: await mean(gd.enhanced), size: dk.enhanced.stats,
        labels: [...document.querySelectorAll('#pPreviews .ph-orig')].map(b => b.textContent), showsEnhanced: document.querySelector('#pPreviews img').src === dk.enhancedUrl };
    });
    ok(ph.darkAfter - ph.darkBefore >= 40 && Math.abs(ph.goodAfter - ph.goodBefore) <= 6 && ph.size.width === 800, tag + ': dark photo brightened, good photo kept: ' + JSON.stringify(ph));
    ok(ph.pending === 2 && ph.labels.join() === 'Use original,Use original' && ph.showsEnhanced, tag + ': previews show the enhanced photo with a Use original switch: ' + ph.labels.join());
    await p.click('#pPreviews [data-orig="0"]'); await p.waitForTimeout(200);
    const sw = await p.evaluate(() => ({ label: document.querySelector('#pPreviews [data-orig="0"]').textContent, original: document.querySelector('#pPreviews img').src === photoFiles[0].preview, sends: photoToSend(photoFiles[0]) === photoFiles[0] && photoToSend(photoFiles[1]) === photoFiles[1].enhanced }));
    ok(sw.label === 'Use enhanced' && sw.original && sw.sends, tag + ': Use original shows and sends the original for that photo only: ' + JSON.stringify(sw));
    if(tag === 'm') await p.screenshot({ path: `${O}/p3-m-photos-enhanced.png` });
    // room details: three one-tap questions for a room, none for a whole flat, nothing sent when unanswered
    const rq0 = await p.evaluate(() => ({ shown: !$('roomQs').hidden, labels: [...document.querySelectorAll('#roomQs .field > label')].map(l => l.textContent), unanswered: roomFromForm() }));
    await p.click('label.chip:has([name=kind][value=flat])'); await p.waitForTimeout(150);
    const rqFlat = await p.evaluate(() => ({ hidden: $('roomQs').hidden, room: roomFromForm() }));
    await p.click('label.chip:has([name=kind][value=room])'); await p.waitForTimeout(150);
    await p.click('label.chip:has([name=rWash][value=attached])'); await p.click('label.chip:has([name=rBalc][value=yes])'); await p.click('label.chip:has([name=rMaster][value=no])');
    const rq1 = await p.evaluate(() => roomFromForm());
    ok(rq0.shown && rq0.labels.join() === 'Washroom,Balcony,Master bedroom' && rq0.unanswered === null && rqFlat.hidden && rqFlat.room === null, tag + ': room questions shown for a room, hidden for a whole flat, nothing sent when unanswered: ' + JSON.stringify({ rq0, rqFlat }));
    ok(JSON.stringify(rq1) === '{"washroom":"attached","balcony":true,"master":false}', tag + ': three taps give the answers: ' + JSON.stringify(rq1));
    if(tag === 'm'){ await p.evaluate(() => $('roomQs').scrollIntoView({ block: 'center' })); await p.screenshot({ path: `${O}/p3-m-room-questions.png` }); }
    await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(600);
    ok(await p.isVisible('fieldset[data-step="2"]') && await p.evaluate(() => $('psSteps').children[0].className === 'done' && $('psSteps').children[1].className === 'now'), tag + ': step 2 after a complete step 1');
    await p.click('fieldset[data-step="2"] [data-ps="back"]'); await p.waitForTimeout(400);
    ok(await p.isVisible('fieldset[data-step="1"]') && (await p.inputValue('#pRent')) === '15000' && (await p.inputValue('#pLocality')) === 'HSR Layout', tag + ': back keeps what was typed');
    ok(await p.evaluate(() => $('pTitleAuto').textContent === 'Leave it empty to use: Private room with attached washroom in a 2BHK in HSR Layout'), tag + ': the title box shows the title that will be used');
    await p.click('#psSteps li:nth-child(1)'); await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(400);
    await p.click('fieldset[data-step="2"] [data-ps="next"]'); await p.waitForTimeout(500);
    ok(await p.isVisible('fieldset[data-step="3"]'), tag + ': step 3');
    await p.fill('#aFlat', 'B-304'); await p.fill('#aBuilding', 'Green Park'); await p.fill('#aPin', '560102');
    if(tag === 'm') await p.screenshot({ path: `${O}/p3-m-post-step3.png`, fullPage: true });
    // publish with a gap in step 1: jumps back there
    await p.evaluate(() => { $('pRent').value = ''; });
    await p.click('fieldset[data-step="3"] [type=submit]'); await p.waitForTimeout(600);
    ok(await p.isVisible('fieldset[data-step="1"]') && await p.evaluate(() => !document.querySelector('fieldset[data-step="1"] .form-err').hidden), tag + ': publish with a gap goes back to step 1');
    await p.fill('#pRent', '15000'); await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(300); await p.click('fieldset[data-step="2"] [data-ps="next"]'); await p.waitForTimeout(300);
    await p.click('fieldset[data-step="3"] [type=submit]'); await p.waitForTimeout(2000);
    const posted = await p.evaluate(() => ({ hash: location.hash, cards: document.querySelectorAll('.mine-card').length, stats: [...document.querySelectorAll('.mine-card .stats.six .stat span')].map(s => s.textContent) }));
    ok(posted.cards === 1 && posted.stats.length === 6, tag + ': published, My flat shows 6 numbers: ' + posted.stats.join(' | '));
    ok(await p.evaluate(() => state.myListings[0].title === 'Private room with attached washroom in a 2BHK in HSR Layout'), tag + ': an empty title is written from the answers: ' + await p.evaluate(() => state.myListings[0].title));
    ok(await p.evaluate(() => !$('pMore').open && !$('pCosts').open), tag + ': after publishing the form starts closed again');
    ok(await p.evaluate(() => state.myListings[0].photos.length === 2 && state.myListings[0].photos.every(u => u.startsWith('data:image/jpeg'))), tag + ': the two photos were posted');
    ok(await p.evaluate(() => JSON.stringify(state.myListings[0].room) === '{"washroom":"attached","balcony":true,"master":false}'), tag + ': the answers were saved on the listing');
    await p.evaluate(() => openListing(state.myListings[0].id)); await p.waitForTimeout(1000);
    const tags = await p.evaluate(() => [...document.querySelectorAll('#dlgListing .room-tags span')].map(x => x.textContent));
    ok(tags.join() === 'Attached washroom,Balcony', tag + ': the home page shows the answers as labels next to the type (a "no" says nothing): ' + tags.join(', '));
    if(tag === 'm'){ await p.evaluate(() => document.querySelector('#dlgListing .kv').scrollIntoView({ block: 'center' })); await p.screenshot({ path: `${O}/p3-m-room-labels.png` }); }
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); openListing(api.all().find(x => !x.room && !x.is_owner).id); }); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.querySelector('#dlgListing .room-tags')), tag + ': a listing with nothing set shows no labels');
    await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    // editing: the answers come back prefilled; changing one and saving keeps the rest
    await p.evaluate(() => startEdit(state.myListings[0].id, 1)); await p.waitForTimeout(1000);
    const pre = await p.evaluate(() => roomFromForm());
    await p.click('label.chip:has([name=rBalc][value=no])'); await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(300); await p.click('fieldset[data-step="2"] [data-ps="next"]'); await p.waitForTimeout(300);
    await p.click('fieldset[data-step="3"] [type=submit]'); await p.waitForTimeout(1500);
    ok(JSON.stringify(pre) === '{"washroom":"attached","balcony":true,"master":false}' && await p.evaluate(() => JSON.stringify(state.myListings[0].room) === '{"washroom":"attached","balcony":false,"master":false}'), tag + ': edit prefills the answers and saves a change: ' + JSON.stringify(pre));
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
