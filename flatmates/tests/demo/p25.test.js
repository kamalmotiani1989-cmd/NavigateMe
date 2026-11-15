// The website (Kamal, 15 Nov: "make the website also better"; demo mode, port 8765): the page a visitor sees before
// signing in. The match-card picture in place of the skyline, how it works for both sides, try-a-search, safety,
// the Move-in kit and flatmate-type cards, the FAQ and the closing band; and what search engines and link previews
// read (title, description, share picture, robots.txt, sitemap.xml, the FAQ as data).
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const SITE = 'https://findmeflatmate.com/';
(async () => {
  const b = await chromium.launch();
  let ctx = await b.newContext({ viewport:{ width:1280, height:900 } }); let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U); await p.waitForTimeout(1300);

  // ---- what search engines and link previews read
  const head = await p.evaluate(() => { const m = s => (document.querySelector(s) || {}).content || '';
    return { title: document.title, desc: m('meta[name=description]'), ogTitle: m('meta[property="og:title"]'), ogDesc: m('meta[property="og:description"]'), ogImg: m('meta[property="og:image"]'),
      ogW: m('meta[property="og:image:width"]'), ogH: m('meta[property="og:image:height"]'), ogAlt: m('meta[property="og:image:alt"]'), card: m('meta[name="twitter:card"]'), twImg: m('meta[name="twitter:image"]'),
      canon: (document.querySelector('link[rel=canonical]') || {}).href, h1: [...document.querySelectorAll('#view-welcome h1')].map(x => x.textContent) }; });
  ok(/^FindMeFlatMate: /.test(head.title) && head.title.length <= 60 && head.ogTitle === head.title, 'the title says what the site does, in 60 characters or fewer: ' + head.title);
  ok(head.desc.length >= 110 && head.desc.length <= 160 && /brokers/i.test(head.desc) && /both say yes/.test(head.desc) && head.ogDesc.length <= 200,
    'the description fits a search result (' + head.desc.length + ' characters) and says the two promises');
  ok(head.canon === SITE && head.h1.length === 1 && /match your vibe/.test(head.h1[0]), 'one main heading on the page, and the address search engines should keep: ' + head.canon);
  const pic = await p.evaluate(async () => { const r = await fetch('og-image.png'), a = new Uint8Array(await r.arrayBuffer()), v = new DataView(a.buffer);
    return { ok: r.ok, png: a[0] === 0x89 && a[1] === 0x50 && a[2] === 0x4E && a[3] === 0x47, w: v.getUint32(16), h: v.getUint32(20), kb: Math.round(a.length / 1024) }; });
  ok(head.ogImg === SITE + 'og-image.png' && head.twImg === head.ogImg && head.card === 'summary_large_image' && head.ogW === '1200' && head.ogH === '630' && head.ogAlt.length > 20
    && pic.ok && pic.png && pic.w === 1200 && pic.h === 630 && pic.kb < 300, 'shared links get a picture: 1200 x 630, ' + pic.kb + ' KB: ' + JSON.stringify(pic));
  const files = await p.evaluate(async () => ({ robots: await (await fetch('robots.txt')).text(), map: await (await fetch('sitemap.xml')).text() }));
  const locs = (files.map.match(/<loc>[^<]+<\/loc>/g) || []).map(x => x.replace(/<\/?loc>/g, ''));
  ok(/^User-agent: \*\nAllow: \/\n/.test(files.robots) && !/Disallow: \/\s*$/m.test(files.robots) && files.robots.includes('Sitemap: ' + SITE + 'sitemap.xml'), 'robots.txt lets search engines in and names the sitemap');
  ok(locs.length === 2 && locs[0] === SITE && locs[1] === SITE + 'privacy.html', 'sitemap.xml lists the home page and the privacy policy: ' + locs.join(' '));
  // the FAQ as data says exactly what the page says
  const faq = await p.evaluate(() => { const t = x => x.textContent.replace(/\s+/g, ' ').trim(), ld = JSON.parse($('ldSite').textContent), g = ld['@graph'];
    return { types: g.map(x => x['@type']), data: g.find(x => x['@type'] === 'FAQPage').mainEntity.map(q => [q.name, q.acceptedAnswer.text]),
      page: [...document.querySelectorAll('#w-faq details')].map(d => [t(d.querySelector('summary')), t(d.querySelector('p'))]), org: g.find(x => x['@type'] === 'Organization') }; });
  ok(faq.types.join() === 'Organization,WebSite,FAQPage' && faq.org.url === SITE && faq.page.length === 10 && JSON.stringify(faq.data) === JSON.stringify(faq.page),
    'the FAQ for search engines has the same 10 questions and answers as the page');

  // ---- the page, top to bottom
  const parts = await p.evaluate(() => { const top = s => { const e = document.querySelector(s); return e && e.offsetParent ? Math.round(e.getBoundingClientRect().top + scrollY) : -1; };
    return ['#view-welcome .w-grid', '#view-welcome .story-grid', '#w-how', '#w-talk', '#w-safe', '#w-more', '#view-welcome .w-app', '#w-faq', '#view-welcome .w-end', '#view-welcome .w-footer'].map(s => [s, top(s)]); });
  ok(parts.every(([, y], i) => y >= 0 && (!i || y > parts[i - 1][1])), 'the parts come in order: hero, why, how it works, try a search, safety, more than a room, the app, FAQ, closing, footer');
  const nav = await p.evaluate(() => [...document.querySelectorAll('#view-welcome .w-nav .w-link')].map(x => x.textContent + '>' + x.dataset.scroll).join(' | '));
  ok(nav === 'How it works>w-how | Safety>w-safe | Flatsplits & FlatMart>w-more | FAQ>w-faq', 'the top links: ' + nav);
  for(const id of ['w-safe', 'w-faq', 'w-how']){
    await p.click(`#view-welcome .w-nav [data-scroll=${id}]`); await p.waitForTimeout(900);
    const y = await p.evaluate(id => Math.round($(id).getBoundingClientRect().top), id);
    ok(y > -40 && y < 200, 'the "' + id + '" link scrolls to its part (top at ' + y + ')'); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);

  // the picture: a match card drawn from our own cartoon people, no photos
  const art = await p.evaluate(() => { const c = $('city'); return { hidden: c.getAttribute('aria-hidden'), avs: c.querySelectorAll('.ha-avs svg').length, ring: (c.querySelector('.ha-ring text') || {}).textContent,
    who: c.querySelector('.ha-who b').textContent, chips: [...c.querySelectorAll('.ha-chips span')].map(x => x.textContent), floats: [...c.querySelectorAll('.ha-float span')].map(x => x.textContent), imgs: c.querySelectorAll('img').length,
    old: document.querySelectorAll('#city .tower, #city .win, #city .float').length,
    solid: /^rgb\(/.test(getComputedStyle(c.querySelector('.ha-ring circle')).fill) }; });
  ok(art.hidden === 'true' && art.avs === 2 && art.ring === '92' && art.chips.length === 3 && art.floats.length === 2 && !art.imgs && !art.old && art.solid,
    'the picture is a match card with two cartoon flatmates, a 92 match and three things in common; no photos, no skyline: ' + JSON.stringify(art));
  await p.screenshot({ path: O + '/p25-top.png' });

  // how it works, for both sides, each with its own way in
  const how = await p.evaluate(() => [...document.querySelectorAll('#w-how .how-card')].map(c => ({ h: c.querySelector('h3').textContent, steps: c.querySelectorAll('li').length, btn: c.querySelector('[data-role-pick]').textContent.trim(), role: c.querySelector('[data-role-pick]').dataset.rolePick })));
  ok(how.length === 2 && how[0].role === 'seeker' && how[1].role === 'owner' && how.every(c => c.steps === 3) && how[0].btn === 'Find my flatmates' && how[1].btn === 'Post my room free',
    'how it works: looking first, then listing, three steps each: ' + JSON.stringify(how));
  await p.click('#w-how .how-own [data-role-pick]'); await p.waitForTimeout(900);
  const picked = await p.evaluate(() => ({ role: document.querySelector('#loginForm input[name=role]:checked').value, step: document.querySelector('#loginForm .lg-step:not([hidden])').dataset.step, inView: (r => r.top >= 0 && r.bottom <= innerHeight + 40)(document.querySelector('.w-card').getBoundingClientRect()) }));
  ok(picked.role === 'owner' && picked.step === 'name' && picked.inView, '"Post my room free" picks owner and goes to the sign-up card, at the name step: ' + JSON.stringify(picked));
  await p.goto(U); await p.waitForTimeout(1000);

  // try a search: what we understood, as you type
  const got = () => p.evaluate(() => [...$('talkGot').querySelectorAll('span')].map(x => x.textContent));
  let g = await got();
  ok(await p.evaluate(() => $('talkQ').value) === 'room near Koramangala under 15k, veg' && g.join() === 'under ₹15,000,Veg kitchen,Private room,Koramangala', 'try a search starts with an example, understood: ' + g.join(' · '));
  await p.click('#talkEg button:nth-child(2)'); g = await got();
  ok(g.join() === 'Women only,Whole flat,Pune' && await p.evaluate(() => $('talkQ').value === 'women only flat in Pune' && document.querySelector('#talkEg [aria-pressed=true]').textContent === $('talkQ').value), 'tapping an example fills the box: ' + g.join(' · '));
  await p.fill('#talkQ', 'shared room near HR College under 9k, no smoking'); await p.waitForTimeout(150); g = await got();
  ok(g.includes('under ₹9,000') && g.includes('No smoking') && g.includes('Shared room') && g.includes('Near HR College') && await p.evaluate(() => !document.querySelector('#talkEg [aria-pressed=true]')),
    'typing your own words works too, and a place we don\'t know is kept as typed: ' + g.join(' · '));
  await p.fill('#talkQ', ''); await p.waitForTimeout(150);
  ok(await p.evaluate(() => /tap an example/.test($('talkGot').textContent)), 'an empty box says what to do');
  await p.fill('#talkQ', 'room near Koramangala under 15k, veg'); await p.waitForTimeout(150);
  await p.evaluate(() => $('w-talk').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p25-talk.png' });
  await p.click('.talk-demo [data-role-pick]'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.querySelector('#loginForm input[name=role]:checked').value === 'seeker'), '"Find my flatmates" under the search leads to sign-up as someone looking');
  await p.goto(U); await p.waitForTimeout(1000);

  // safety: six plain promises, each one something the app does
  const safe = await p.evaluate(() => ({ h: [...document.querySelectorAll('#w-safe .ws-card h3')].map(x => x.textContent), note: document.querySelector('#w-safe .ws-note').textContent, all: $('w-safe').textContent }));
  ok(safe.h.join(' | ') === 'Private until you both say yes | Women-only means women-only | Scam warnings, right in the chat | Block or report in two taps | No brokers | Adults only'
    && /^Never pay before you visit\./.test(safe.note) && !/verified|guarantee|100%|background check/i.test(safe.all), 'safety: ' + safe.h.join(' · ') + '; nothing promised that the app doesn\'t do');
  await p.evaluate(() => $('w-safe').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p25-safe.png' });

  // more than a room: the Move-in kit and the flatmate type join the others
  const more = await p.evaluate(() => ({ h: [...document.querySelectorAll('#w-more .more-card h3')].map(x => x.textContent), type: $('wmType').querySelectorAll('svg').length, typeName: $('wmType').querySelector('b').textContent,
    cols: getComputedStyle(document.querySelector('.more-grid')).gridTemplateColumns.split(' ').length }));
  ok(more.h.join(' | ') === 'Flatsplits | FlatMart | Search together | Move-in kit | Your flatmate type | All of India, on the map' && more.type >= 1 && /^The /.test(more.typeName) && more.cols === 3,
    'more than a room: six cards, three across, with the Move-in kit and a cartoon flatmate type: ' + more.typeName);
  await p.evaluate(() => $('w-more').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p25-more.png' });

  // the FAQ opens, and Help is one tap away
  await p.evaluate(() => $('w-faq').scrollIntoView({ block: 'start' })); await p.click('#w-faq details:nth-of-type(2) summary'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => { const d = document.querySelector('#w-faq details:nth-of-type(2)'); return d.open && d.querySelector('p').offsetHeight > 20 && /Only when you both say yes/.test(d.textContent); }), 'a question opens to its answer');
  await p.screenshot({ path: O + '/p25-faq.png' });
  await p.click('#w-faq [data-help-open]'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => $('dlgHelp').open), '"Ask in Help" opens Help');
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  // the closing band and the footer
  const end = await p.evaluate(() => ({ btns: [...document.querySelectorAll('.w-end [data-role-pick]')].map(x => x.dataset.rolePick + ':' + x.textContent.trim()),
    cols: [...document.querySelectorAll('.w-foot-grid h4')].filter(x => x.offsetParent).map(x => x.textContent), know: [...document.querySelectorAll('.w-foot-grid > div:nth-child(4) > *')].slice(1).map(x => x.textContent + '>' + (x.dataset.scroll || x.getAttribute('href'))) }));
  ok(end.btns.join() === 'seeker:Find a room,owner:Post my room free' && end.cols.join() === 'Get started,Flat life,Good to know,Get the app' && end.know.join() === 'How it works>w-how,Safety>w-safe,FAQ>w-faq,Privacy policy>privacy.html',
    'the page ends with both ways in, and the footer has the new links: ' + end.know.join(' · '));
  await p.click('.w-end [data-role-pick=seeker]');   // a long way up: give the smooth scroll time to arrive
  await p.waitForFunction(() => (r => r.top >= 0 && r.bottom <= innerHeight + 40)(document.querySelector('.w-card').getBoundingClientRect()), null, { timeout: 6000 }).catch(() => {});
  ok(await p.evaluate(() => document.querySelector('#loginForm input[name=role]:checked').value === 'seeker' && (r => r.top >= 0 && r.bottom <= innerHeight + 40)(document.querySelector('.w-card').getBoundingClientRect())), 'the closing "Find a room" goes back up to the sign-up card');
  // inside the Android app: nothing about downloading the app
  await p.evaluate(() => document.documentElement.classList.add('in-apk')); await p.waitForTimeout(150);
  const apk = await p.evaluate(() => ({ faq: [...document.querySelectorAll('#w-faq details')].filter(d => d.offsetParent).length, band: !!document.querySelector('.w-app').offsetParent, get: !!document.querySelector('.w-get').offsetParent }));
  ok(apk.faq === 9 && !apk.band && !apk.get, 'inside the Android app the download band, the Get the app button and the iPhone question are hidden: ' + JSON.stringify(apk));
  await ctx.close();

  // ---- on a phone
  for(const w of [320, 360, 390]){
    ctx = await b.newContext({ viewport:{ width:w, height:800 } }); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(U); await p.waitForTimeout(1100);
    const ph = await p.evaluate(() => { const hit = (a, r) => a.left < r.right - 2 && a.right > r.left + 2 && a.top < r.bottom - 2 && a.bottom > r.top + 2;
      const ring = document.querySelector('.ha-ring').getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(document.querySelector('.ha-who b'));
      const grid = document.querySelector('.more-grid'), panel = document.querySelector('.ha-panel').getBoundingClientRect();
      return { side: document.documentElement.scrollWidth - innerWidth, ringOnWords: [...rg.getClientRects()].some(r => hit(r, ring)), strip: grid.scrollWidth > grid.clientWidth + 40 && /auto|scroll/.test(getComputedStyle(grid).overflowX),
        floats: [...document.querySelectorAll('.ha-float')].every(f => { const r = f.getBoundingClientRect(); return r.left >= panel.left && r.right <= panel.right && r.height < 60; }),
        links: [...document.querySelectorAll('#view-welcome .w-nav .w-link')].filter(x => x.offsetParent).length, get: !!document.querySelector('.w-get').offsetParent }; });
    ok(ph.side <= 0 && !ph.ringOnWords && ph.strip && ph.floats && !ph.links && ph.get, w + ' wide: nothing scrolls sideways, the match ring is clear of the words, the cards swipe: ' + JSON.stringify(ph));
    if(w === 390){ await p.evaluate(() => $('city').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p25-phone-art.png' });
      await p.evaluate(() => $('w-more').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300); await p.screenshot({ path: O + '/p25-phone-more.png' }); }
    await ctx.close(); }

  // ---- the opening story on a computer: a card in the middle, not the whole screen
  ctx = await b.newContext({ viewport:{ width:1280, height:900 } }); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '?story'); await p.waitForTimeout(1200);
  const sd = await p.evaluate(() => { const d = $('dlgStory'), r = d.getBoundingClientRect(); return { open: d.open, w: Math.round(r.width), h: Math.round(r.height), mid: Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2, radius: parseFloat(getComputedStyle(d).borderTopLeftRadius) }; });
  ok(sd.open && sd.w <= 480 && sd.h < 900 && sd.mid && sd.radius >= 24, 'on a computer the opening story is a rounded card in the middle: ' + JSON.stringify(sd));
  await p.screenshot({ path: O + '/p25-story-wide.png' });
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
