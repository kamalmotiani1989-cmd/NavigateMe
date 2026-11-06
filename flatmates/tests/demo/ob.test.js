// Onboarding: intro card, chapter header, autofocus + Enter, keyboard answers, live match count, resume after a
// reload, swipe back, the half-way reveal, then the finale. Demo mode (port 8765).
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const fresh = { user:{ phone:'9833333333', name:'Asha', role:'seeker', gender:'female' }, account:'9833333333', onboarded:{}, attrClaimed:true };
const ownerFresh = { user:{ phone:'9844444444', name:'Omi', role:'owner', gender:'male' }, account:'9844444444', onboarded:{}, attrClaimed:true };
const head = p => p.evaluate(() => ({ count: $('obCount').textContent, segs: [...document.querySelectorAll('#obSegs i')].map(i => i.className + ':' + i.firstChild.style.width), q: (document.querySelector('#obStage h1') || {}).textContent, i: ob && ob.i, key: ob && ob.steps[ob.i] && ob.steps[ob.i].k, intro: ob && ob.intro, reveal: ob && ob.reveal }));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, fresh);
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1200);
  let h = await head(p);
  ok(h.intro && /quick questions, about \d minutes?\./.test(h.q) && /questions$/.test(h.count), 'intro card: ' + h.q + ' | ' + h.count);
  await p.screenshot({ path: `${O}/ob-1-intro.png` });
  const plan = await p.$$eval('.ob-plan li', li => li.map(x => x.innerText.replace(/\s+/g, ' ')));
  ok(plan.length === 3 && /About you/.test(plan[0]) && /How you live 12 questions/.test(plan[1]), 'three chapters listed: ' + plan.join(' / '));
  await p.click('#obGo'); await p.waitForTimeout(500); h = await head(p);
  ok(h.key === 'occType' && h.count === 'About you · 1 of 4' && h.segs[0].startsWith('now'), 'chapter header: ' + h.count + ' ' + h.segs.join(' '));
  await p.screenshot({ path: `${O}/ob-2-q1.png` });
  // keyboard: "1" answers
  await p.keyboard.press('1'); await p.waitForTimeout(500); h = await head(p);
  ok(h.key === 'occWhat' && await p.evaluate(() => document.activeElement && document.activeElement.id === 'obWhat'), 'key 1 answered; the text step is focused');
  await p.keyboard.type('Analyst at a bank'); await p.keyboard.press('Enter'); await p.waitForTimeout(500); h = await head(p);
  ok(h.key === 'gen' && h.count === 'About you · 3 of 4', 'Enter continued: ' + h.count);
  await p.click('.opt[data-i="0"]'); await p.waitForTimeout(500);
  await p.click('.opt[data-i="0"]'); await p.waitForTimeout(500); h = await head(p);   // Bengaluru
  ok(h.key === 'sleep' && h.count === 'How you live · 1 of 12' && h.segs[0] === 'done:100%' , 'chapter 2 starts: ' + h.count + ' ' + h.segs[0]);
  for(let k = 0; k < 4; k++){ await p.keyboard.press('2'); await p.waitForTimeout(450); }
  h = await head(p);
  const live = await p.evaluate(() => { const e = $('obLive'); return e && !e.hidden ? e.innerText : ''; });
  ok(h.count === 'How you live · 5 of 12' && /\d+ homes in Bengaluru match you so far/.test(live), 'live count after 4 answers: "' + live + '"');
  await p.screenshot({ path: `${O}/ob-3-live.png` });
  // resume: reload mid-way
  const before = await head(p);
  await p.reload(); await p.waitForTimeout(1500); h = await head(p);
  ok(!h.intro && h.i === before.i && h.key === before.key && await p.evaluate(() => ob.a.occWhat === 'Analyst at a bank' && ob.a.city === 'Bengaluru' && ob.a.sleep === 1), 'after a reload it resumes at the same question with the answers kept: ' + h.count);
  // swipe right = back
  await p.evaluate(() => { const el = $('obStage'); const t = (type, x) => el.dispatchEvent(new TouchEvent(type, { bubbles: true, touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 })], changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 })] })); t('touchstart', 60); t('touchend', 260); });
  await p.waitForTimeout(500); h = await head(p);
  ok(h.i === before.i - 1 && h.count === 'How you live · 4 of 12', 'swipe right goes back: ' + h.count);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(450); h = await head(p);
  ok(h.i === before.i, 'ArrowRight goes forward on an answered question');
  // finish "How you live" → reveal
  for(let k = 0; k < 8; k++){ await p.keyboard.press('1'); await p.waitForTimeout(400); }
  h = await head(p);
  const type = await p.evaluate(() => (document.querySelector('.ob-intro .ob-type b') || {}).textContent);
  ok(h.reveal && /^The /.test(type || ''), 'reveal after How you live: ' + type);
  await p.screenshot({ path: `${O}/ob-4-reveal.png` });
  await p.keyboard.press('Enter'); await p.waitForTimeout(500); h = await head(p);
  ok(h.key === 'areas' && h.count === "What you're looking for · 1 of 6", 'chapter 3: ' + h.count);
  await p.click('#obAnyArea'); await p.waitForTimeout(400);
  await p.keyboard.press('1'); await p.waitForTimeout(400);   // look
  await p.keyboard.press('2'); await p.waitForTimeout(400);   // budget
  await p.keyboard.press('1'); await p.waitForTimeout(400);   // move in: as soon as possible
  await p.click('#obIntForm [type=submit]'); await p.waitForTimeout(400);   // music
  await p.click('#obIntForm [type=submit]'); await p.waitForTimeout(2500);  // hobbies -> finale
  const fin = await p.evaluate(() => ({ finale: !!document.querySelector('.finale'), onboarded: state.onboarded.seeker, saved: 'obSave' in state, segs: [...document.querySelectorAll('#obSegs i')].map(i => i.className).join(','), moveIn: prefs().moveIn }));
  ok(fin.finale && fin.onboarded && !fin.saved && fin.segs === 'done,done,done' && fin.moveIn === 'asap', 'finale reached, progress cleared, move-in saved: ' + JSON.stringify(fin));
  const ring = await p.evaluate(() => ({ ring: !!$('obRing'), strong: /match your vibe/.test($('obStage').innerText), go: $('obDone').getBoundingClientRect().height >= 52 }));
  ok(ring.ring === ring.strong && ring.go, 'finale shows the match ring only with a strong match, and a thumb-sized button: ' + JSON.stringify(ring));
  await p.hover('#obCard'); await p.waitForTimeout(200);
  const ghost = await p.evaluate(() => { const c = getComputedStyle($('obCard')); return c.color + ' on ' + c.backgroundColor; });
  ok(!/rgb\(247, 249, 251\)/.test(ghost) && /rgba?\(255, 255, 255, 0\./.test(ghost), 'the Vibe Card button stays readable under a finger: ' + ghost);
  await p.screenshot({ path: `${O}/ob-5-finale.png` });
  await ctx.close();
  // owner: two chapters
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await c2.addInitScript(s => { localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); }, ownerFresh);
  p = await c2.newPage(); p.on('pageerror', e => errs.push('owner ' + e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1200);
  const oplan = await p.$$eval('.ob-plan li', li => li.map(x => x.innerText.replace(/\s+/g, ' ')));
  ok(oplan.length === 2 && /About your home 2 questions/.test(oplan[0]) && /How your home lives 12/.test(oplan[1]), 'owner intro lists two chapters: ' + oplan.join(' / '));
  await p.click('#obGo'); await p.waitForTimeout(400); await p.click('.opt[data-i="1"]'); await p.waitForTimeout(400); await p.click('.opt[data-i="0"]'); await p.waitForTimeout(400);
  h = await head(p); ok(h.count === 'How your home lives · 1 of 12' && !(await p.$('#obLive')), 'owner chapter 2, no live count: ' + h.count);
  await c2.close(); await b.close(); console.log('errors', errs);
})();
