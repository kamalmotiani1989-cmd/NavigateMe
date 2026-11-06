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
    // a video: a 2-second 1280x960 clip made in the page is re-encoded to 720p on the phone, previewed, then posted
    const vid = await p.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 1280; c.height = 960; const x = c.getContext('2d');
      const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 4e6 }); const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data); const done = new Promise(r => rec.onstop = r); rec.start(200);
      const t0 = performance.now(); let f = 0; await new Promise(res => { const tick = () => { x.fillStyle = 'hsl(' + (f * 4) + ',50%,45%)'; x.fillRect(0, 0, 1280, 960); x.fillStyle = '#fff'; x.fillRect(f * 12 % 1280, 400, 160, 160); f++; if(performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(); }; tick(); });
      rec.stop(); await done; const file = new File(chunks, 'clip.webm', { type: 'video/webm' });
      addVideo(file); const busy = $('vStatus').textContent; const r = await videoPick.work;
      return { busy, status: $('vStatus').textContent, w: r.width, h: r.height, size: r.blob.size, type: r.blob.type, dropHidden: $('vDrop').hidden, preview: !$('vPreview').hidden && $('vPlayer').getAttribute('src').startsWith('blob:') };
    });
    ok(/Making it small/.test(vid.busy) && /^Ready · \d+ s · [\d.]+ MB$/.test(vid.status) && vid.h === 720 && vid.w === 960 && vid.size < 8e6 && /^video\/(mp4|webm)$/.test(vid.type) && vid.dropHidden && vid.preview, tag + ': video re-encoded to 720p and previewed: ' + JSON.stringify(vid));
    if(tag === 'm'){ await p.evaluate(() => $('vPreview').scrollIntoView()); await p.screenshot({ path: `${O}/p3-m-video-pick.png` }); }
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
    ok(await p.evaluate(() => String(state.myListings[0].video).startsWith('data:video/')), tag + ': the video was posted with the listing');
    // the home's page plays it under the photos, sound off; a home without one shows no player
    await p.evaluate(() => openListing(state.myListings[0].id)); await p.waitForTimeout(1200);
    const player = await p.evaluate(async () => { const v = document.querySelector('#dlgListing .l-video video'); if(!v) return { video:false }; await new Promise(r => { if(v.readyState >= 1) r(); else { v.onloadedmetadata = r; v.onerror = r; setTimeout(r, 3000); } }); return { video:true, muted:v.muted, controls:v.controls, h:v.videoHeight, hint:(v.nextElementSibling || {}).textContent }; });
    ok(player.video && player.muted && player.controls && player.h === 720 && /tap to play/.test(player.hint), tag + ': home page shows the walk-through, muted, with controls: ' + JSON.stringify(player));
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); openListing(api.all().find(x => !x.video && !x.is_owner).id); }); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.querySelector('#dlgListing .l-video')), tag + ': a home without a video has no player');
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); openListing(api.all().find(x => x.video === SAMPLE_VIDEO).id); }); await p.waitForTimeout(1500);
    const sample = await p.evaluate(async () => { const v = document.querySelector('#dlgListing .l-video video'); if(!v) return { video:false }; await new Promise(r => { if(v.readyState >= 1) r(); else { v.onloadedmetadata = r; v.onerror = r; setTimeout(r, 4000); } }); try{ await v.play(); }catch(e){ return { playErr: String(e) }; } await new Promise(r => setTimeout(r, 600)); return { src: v.getAttribute('src'), playing: !v.paused && v.currentTime > 0 }; });
    ok(sample.src === 'media/sample-room.mp4' && sample.playing, tag + ': a sample home plays the sample walk-through: ' + JSON.stringify(sample));
    await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    // editing: the posted clip is shown and can be removed; saving drops it
    await p.evaluate(() => startEdit(state.myListings[0].id, 1)); await p.waitForTimeout(1200);
    const ed = await p.evaluate(() => ({ kept: String(keepVideo).startsWith('data:video/'), shown: !$('vPreview').hidden, status: $('vStatus').textContent }));
    await p.click('#vRemove'); await p.waitForTimeout(200);
    const gone = await p.evaluate(() => ({ keep: keepVideo, drop: !$('vDrop').hidden }));
    await p.click('fieldset[data-step="1"] [data-ps="next"]'); await p.waitForTimeout(300); await p.click('fieldset[data-step="2"] [data-ps="next"]'); await p.waitForTimeout(300);
    await p.click('fieldset[data-step="3"] [type=submit]'); await p.waitForTimeout(2000);
    ok(ed.kept && ed.shown && /Remove it/.test(ed.status) && gone.keep === null && gone.drop && await p.evaluate(() => state.myListings[0].video === null && location.hash === '#mine'), tag + ': edit shows the video, Remove video + save drops it: ' + JSON.stringify({ ed, gone }));
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
