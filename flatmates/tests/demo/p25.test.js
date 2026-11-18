// The login page, website and app (demo mode, port 8765). Kamal, 15 Nov: "Reduce the information on the login page of
// website and app as people might copy the same. Make it more clean". The page a visitor sees is the headline, the
// sign-up card (untouched) and a picture of our cartoon people, in two layers like the home screens; what the app
// does is shown after sign-in, not here. Also what search engines and link previews read.
// Since the look of 17 Nov 2026 the page is one cream: the band under the headline and the sheet that came up over it
// are both the page's own colour, so no edge shows; the card is white, and the headline's key word is orange.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const SITE = 'https://findmeflatmate.com/';
// what the app does, by name: none of it belongs on the page before sign-in (the sign-up card's own choices aside)
const FEATURES = /Flatsplits|FlatMart|Move-in kit|agreement|scam|Tribe|Escape|Vibe Card|flatmate type|12 (quick |lifestyle )?questions|search like|women-only|check-in|part(y|ies)/i;
(async () => {
  const b = await chromium.launch();
  let ctx = await b.newContext({ viewport:{ width:1280, height:860 } }); let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U); await p.waitForTimeout(1300);

  // ---- what search engines and link previews read
  const head = await p.evaluate(() => { const m = s => (document.querySelector(s) || {}).content || '';
    return { title: document.title, desc: m('meta[name=description]'), ogTitle: m('meta[property="og:title"]'), ogDesc: m('meta[property="og:description"]'), ogImg: m('meta[property="og:image"]'),
      ogW: m('meta[property="og:image:width"]'), ogH: m('meta[property="og:image:height"]'), ogAlt: m('meta[property="og:image:alt"]'), card: m('meta[name="twitter:card"]'), twImg: m('meta[name="twitter:image"]'),
      canon: (document.querySelector('link[rel=canonical]') || {}).href, h1: [...document.querySelectorAll('#view-welcome h1')].map(x => x.textContent) }; });
  ok(/^FindMeFlatMate: /.test(head.title) && head.title.length <= 60 && head.ogTitle === head.title, 'the title says what the site is, in 60 characters or fewer: ' + head.title);
  ok(head.desc.length >= 110 && head.desc.length <= 160 && head.ogDesc.length <= 200, 'the description fits a search result (' + head.desc.length + ' characters)');
  ok(head.canon === SITE && head.h1.length === 1 && /match your vibe/.test(head.h1[0]), 'one main heading on the page, and the address search engines should keep: ' + head.canon);
  const pic = await p.evaluate(async () => { const r = await fetch('og-image.png'), a = new Uint8Array(await r.arrayBuffer()), v = new DataView(a.buffer);
    return { ok: r.ok, png: a[0] === 0x89 && a[1] === 0x50 && a[2] === 0x4E && a[3] === 0x47, w: v.getUint32(16), h: v.getUint32(20), kb: Math.round(a.length / 1024) }; });
  ok(head.ogImg === SITE + 'og-image.png' && head.twImg === head.ogImg && head.card === 'summary_large_image' && head.ogW === '1200' && head.ogH === '630' && head.ogAlt.length > 20
    && pic.ok && pic.png && pic.w === 1200 && pic.h === 630 && pic.kb < 300, 'shared links get a picture: 1200 x 630, ' + pic.kb + ' KB');
  const files = await p.evaluate(async () => ({ robots: await (await fetch('robots.txt')).text(), map: await (await fetch('sitemap.xml')).text() }));
  const locs = (files.map.match(/<loc>[^<]+<\/loc>/g) || []).map(x => x.replace(/<\/?loc>/g, ''));
  ok(/^User-agent: \*\nAllow: \/\n/.test(files.robots) && files.robots.includes('Sitemap: ' + SITE + 'sitemap.xml') && locs.length === 2 && locs[0] === SITE && locs[1] === SITE + 'privacy.html',
    'robots.txt lets search engines in; sitemap.xml lists the home page and the privacy policy');
  const ld = await p.evaluate(() => { const g = JSON.parse($('ldSite').textContent)['@graph']; return { types: g.map(x => x['@type']).join(), text: $('ldSite').textContent }; });
  ok(ld.types === 'Organization,WebSite' && !FEATURES.test(ld.text) && !/FAQ|Question/.test(ld.text), 'the data for search engines says who we are and nothing about how the app works: ' + ld.types);

  // ---- the page is short: the band with the words, the card, the picture, one line of small print
  const page = await p.evaluate(() => { const w = $('view-welcome'), kids = [...w.children].map(c => c.tagName.toLowerCase() + '.' + c.className.split(' ')[0]);
    const clone = w.cloneNode(true); clone.querySelectorAll('.w-card, script, style').forEach(x => x.remove());
    return { kids, gone: ['#w-how', '#w-talk', '#w-safe', '#w-more', '#w-faq', '.w-end', '.story', '.w-app', '.w-points', '.w-nav .w-link', '.w-footer'].filter(s => w.querySelector(s)),
      words: clone.textContent.replace(/\s+/g, ' ').trim(), H: document.documentElement.scrollHeight, links: [...w.querySelectorAll('.w-foot-slim a, .w-foot-slim button')].map(x => x.textContent.trim()) }; });
  ok(page.kids.join() === 'div.w-band,footer.w-foot-slim' && !page.gone.length && page.H <= 1000, 'the page is two parts, the sign-up band and one line of small print (' + page.H + 'px tall on a computer); the feature sections are gone');
  ok(!FEATURES.test(page.words) && page.words.split(' ').length < 110, 'outside the sign-up card the page names no feature of the app (' + page.words.split(' ').length + ' words in all): "' + page.words.slice(0, 150) + '…"');
  // the words on the cream page, near-black but for the key word; the card, white, beside them (two layers until 17 Nov: a tinted band and a sheet)
  const look = await p.evaluate(() => { const tok = n => { const d = document.createElement('i'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const r = s => document.querySelector(s).getBoundingClientRect(), sheet = getComputedStyle(document.querySelector('.w-grid'), '::after'), city = r('#city'), card = r('.w-card'), copy = r('.w-copy');
    return { band: getComputedStyle(document.querySelector('.w-band')).backgroundColor, lav: tok('--lav'), page: tok('--bg'), ink: tok('--ink'), text: tok('--text'), orange: tok('--orange'),
      kw: [...document.querySelectorAll('.w-copy h1 .kw')].map(e => e.textContent + ' ' + getComputedStyle(e).color).join(), cardBg: getComputedStyle(document.querySelector('.w-card')).backgroundColor,
      h1: getComputedStyle(document.querySelector('.w-copy h1')).color, em: getComputedStyle(document.querySelector('.w-copy h1 em')).color, lede: getComputedStyle(document.querySelector('.w-copy .lede')).color,
      trust: getComputedStyle(document.querySelector('.w-trust')).color, tag: getComputedStyle(document.querySelector('.tagline')).color,
      sheet: { bg: sheet.backgroundColor, radius: sheet.borderTopLeftRadius }, cardTop: Math.round(card.top), copyBottom: Math.round(copy.bottom), cityTop: Math.round(city.top), cardBottom: Math.round(card.bottom), copyRight: Math.round(copy.right), cardLeft: Math.round(card.left) }; });
  ok(look.band === look.page && look.page === 'rgb(255, 244, 232)' && [look.h1, look.em].every(c => c === look.ink) && look.kw === 'vibe ' + look.orange && [look.lede, look.trust, look.tag].every(c => c === look.text),
    'the headline sits on the cream page, near-black, with its one key word in the logo\'s orange (a tinted band with nothing orange on it until 17 Nov): ' + look.kw);
  ok(look.sheet.bg === look.band && look.cardBg === 'rgb(255, 255, 255)' && look.cardTop < look.copyBottom && look.cardBottom > look.cityTop && look.copyRight <= look.cardLeft,
    'the sign-up card is a white card beside the words, reaching down past them to the picture (the sheet it stood across is the page\'s own cream now, so no edge shows): ' + JSON.stringify({ cardTop: look.cardTop, copyBottom: look.copyBottom, cityTop: look.cityTop, cardBottom: look.cardBottom }));
  // the picture: our cartoon people around a match ring, no photos, no screens of the app
  const art = await p.evaluate(() => { const c = $('city'); return { hidden: c.getAttribute('aria-hidden'), people: c.querySelectorAll('.w-people > span svg').length, ring: (c.querySelector('.w-people > b text') || {}).textContent, imgs: c.querySelectorAll('img').length,
    words: c.textContent.replace(/\d+/g, '').trim(), solid: /^rgb\(/.test(getComputedStyle(c.querySelector('.ring circle')).fill) }; });
  ok(art.hidden === 'true' && art.people === 4 && art.ring === '92' && !art.imgs && !art.words && art.solid, 'the picture is four of our cartoon people around a 92 match ring: no photos, no words, no screens of the app: ' + JSON.stringify(art));
  await p.screenshot({ path: O + '/p25-login-wide.png' });
  // the sign-up card is the one it was: the same four steps and three choices
  const card = await p.evaluate(() => ({ steps: [...document.querySelectorAll('#loginForm .lg-step')].map(f => f.dataset.step + ':' + f.querySelector('h2').textContent), roles: [...document.querySelectorAll('#loginForm input[name=role]')].map(i => i.value),
    have: $('lgHave').textContent, shown: document.querySelector('#loginForm .lg-step:not([hidden])').dataset.step }));
  ok(card.steps.join(' | ') === 'role:Welcome! What brings you here? | name:What should we call you? | sex:A little about you | phone:Verify your number' && card.roles.join() === 'seeker,owner,splits'
    && card.have === 'I already have an account' && card.shown === 'role', 'the sign-up card is unchanged: ' + card.steps.map(x => x.split(':')[1]).join(' → '));
  // the small print
  ok(page.links.join(' | ') === 'Privacy policy | Have a room? See who\'s looking near you | Get the Android app' && await p.evaluate(() => document.querySelector('.w-foot-slim a[href="privacy.html"]') && /Add to Home Screen/.test(document.querySelector('.wfs-ios').textContent)),
    'the small print: ' + page.links.join(' · '));
  await p.click('.w-foot-slim [data-host-open]'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => location.hash === '#host' && !$('view-host').hidden), 'the link for people with a room still opens its page');
  await p.goto(U); await p.waitForTimeout(900);
  // inside the Android app: nothing about downloading the app
  await p.evaluate(() => document.documentElement.classList.add('in-apk')); await p.waitForTimeout(150);
  const apk = await p.evaluate(() => [...document.querySelectorAll('#view-welcome [data-apk], #view-welcome .wfs-ios')].filter(e => e.offsetParent).length);
  ok(apk === 0, 'inside the Android app the download link and the iPhone line are hidden');
  await ctx.close();

  // ---- on a phone: the headline, then the white card close under it; the card's choices on the first screen, nothing sideways
  for(const [w, h] of [[320, 640], [360, 740], [390, 844]]){
    ctx = await b.newContext({ viewport:{ width:w, height:h } }); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(U); await p.waitForTimeout(1100);
    const ph = await p.evaluate(() => { const tok = n => { const d = document.createElement('i'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
      const r = s => document.querySelector(s).getBoundingClientRect(), sheet = getComputedStyle(document.querySelector('.w-card'), '::before');
      return { side: document.documentElement.scrollWidth - innerWidth, band: getComputedStyle(document.querySelector('.w-band')).backgroundColor === tok('--bg'), sheet: sheet.backgroundColor === getComputedStyle(document.querySelector('.w-band')).backgroundColor,
        trustBottom: Math.round(r('.w-trust').bottom), cardTop: Math.round(r('.w-card').top), roles: [...document.querySelectorAll('.w-card .role')].map(e => Math.round(e.getBoundingClientRect().bottom)),
        ledeAfter: r('.w-copy .lede').top > r('.w-card').bottom, people: Math.round(r('.w-people').width), H: document.documentElement.scrollHeight }; });
    // (on the smallest phone, 320 x 640, the first two choices are on the first screen and the third just below)
    ok(ph.side <= 0 && ph.band && ph.sheet && ph.cardTop - ph.trustBottom >= 20 && ph.cardTop - ph.trustBottom <= 36 && (w === 320 ? ph.roles[0] < h : ph.roles.every(y => y < h)) && ph.ledeAfter && ph.people <= w - 30,
      w + ' wide: the headline on the cream, then the card close under it (the room kept for the old sheet\'s edge went on 17 Nov); the choices on the first screen; nothing scrolls sideways: ' + JSON.stringify({ trustBottom: ph.trustBottom, cardTop: ph.cardTop, roles: ph.roles, H: ph.H }));
    if(w === 390) await p.screenshot({ path: O + '/p25-login-phone.png', fullPage: true });
    await ctx.close(); }

  // ---- the opening story on a computer: a card in the middle, not the whole screen
  ctx = await b.newContext({ viewport:{ width:1280, height:900 } }); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '?story'); await p.waitForTimeout(1200);
  const sd = await p.evaluate(() => { const d = $('dlgStory'), r = d.getBoundingClientRect(); return { open: d.open, w: Math.round(r.width), h: Math.round(r.height), mid: Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2, radius: parseFloat(getComputedStyle(d).borderTopLeftRadius) }; });
  ok(sd.open && sd.w <= 480 && sd.h < 900 && sd.mid && sd.radius >= 24, 'on a computer the opening story is a rounded card in the middle: ' + JSON.stringify(sd));
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
