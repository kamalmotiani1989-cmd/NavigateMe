// The blog (Kamal, 18 Nov 2026: "Build the blogs section in website. Only. Make it super cool. Give your best.
// Research and then build"). Website only: plain pages under blog/, made from the articles in marketing/blog/posts by
// marketing/blog/build.js. Nothing of it is in the Android app. The look is the app's (cream page, white cards, the
// logo's orange for buttons, small labels and one key word, near-black text, one dark sheet, serif headings), and
// the cartoon people on the covers are drawn by the app's own avatar module. Port 8765, like the other suites.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/', B = U + 'blog/';
const APP = path.join(__dirname, '..', '..'), SITE = 'https://findmeflatmate.com/';
const read = f => fs.readFileSync(path.join(APP, f), 'utf8');
const watch = p => { p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); }); };
// every piece of text under a root: on the four sizes (or the serif when bigger), and dark enough on what it sits on
const audit = (p, sel) => p.evaluate(sel => { const root = document.querySelector(sel); if(!root) return { n: 0, odd: ['no ' + sel], low: [] };
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number), lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const bgOf = e => { for(let x = e; x; x = x.parentElement){ const c = rgb(getComputedStyle(x).backgroundColor); if(c.length >= 3 && (c[3] === undefined || c[3] > .5)) return c; } return [255, 255, 255]; };
  const texts = [...root.querySelectorAll('*')].filter(e => e.offsetParent && !e.closest('svg, [aria-hidden="true"], [hidden]') && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const odd = [], low = [];
  texts.forEach(e => { const cs = getComputedStyle(e), s = parseFloat(cs.fontSize), serif = /DM Serif/.test(cs.fontFamily);
    if(s < 12.5 || (s < 22 && ![12.5, 14, 16, 21].includes(s)) || (s >= 22 && !serif)) odd.push(s + ' ' + (e.className || e.tagName));
    const a = lum(rgb(cs.color)), c = lum(bgOf(e)), big = s >= 18.5 || (s >= 14 && +cs.fontWeight >= 700), r = (Math.max(a, c) + .05) / (Math.min(a, c) + .05);
    if(r < (big ? 3 : 4.5)) low.push(Math.round(r * 100) / 100 + ' ' + (e.className || e.tagName) + ' "' + e.textContent.trim().slice(0, 20) + '"'); });
  return { n: texts.length, odd: [...new Set(odd)], low: [...new Set(low)] }; }, sel);
const fine = a => a.n > 5 && !a.odd.length && !a.low.length;
const png = f => { const b = fs.readFileSync(f); return { ok: b.slice(1, 4).toString() === 'PNG', w: b.readUInt32BE(16), h: b.readUInt32BE(20), kb: Math.round(b.length / 1024) }; };

(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ 1. the files: made by the script, and website only
  let check = ''; try{ check = execFileSync('node', [path.join(APP, 'marketing', 'blog', 'build.js'), '--check'], { encoding: 'utf8' }); }catch(e){ check = 'FAILED ' + (e.stderr || e.message).slice(0, 400); }
  ok(/^blog: \d+ articles, \d+ files, all up to date/.test(check), 'the pages in blog/ are exactly what the articles in marketing/blog/posts say (build.js --check): ' + check.trim().split('\n')[0]);
  const postFiles = fs.readdirSync(path.join(APP, 'marketing', 'blog', 'posts')).filter(f => f.endsWith('.md'));
  const slugs = postFiles.map(f => f.replace(/^\d{4}-\d{2}-\d{2}-|\.md$/g, ''));
  const pics = slugs.map(s => Object.assign({ s }, png(path.join(APP, 'blog', 'og', s + '.png'))));
  ok(pics.length >= 7 && pics.every(x => x.ok && x.w === 1200 && x.h === 630 && x.kb < 300), 'every article has a picture for shared links, 1200 x 630 and under 300 KB so WhatsApp shows it (' + pics.map(x => x.kb + ' KB').join(', ') + ')');
  const map = read('sitemap.xml'), locs = [...map.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]), mods = [...map.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].length;
  ok(locs[0] === SITE && locs[1] === SITE + 'privacy.html' && locs[2] === SITE + 'blog/' && slugs.every(s => locs.includes(SITE + 'blog/' + s + '/')) && locs.length === slugs.length + 3 && mods === slugs.length + 1,
    'sitemap.xml lists the home page, the privacy policy, the blog and each article with the day it last changed (' + locs.length + ' addresses)');
  const feed = read('blog/feed.xml'), entries = [...feed.matchAll(/<entry>[\s\S]*?<\/entry>/g)].map(m => m[0]);
  ok(/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/.test(feed) && entries.length === slugs.length && entries.every(e => /<title>[^<]+<\/title>/.test(e) && /<id>https:\/\/findmeflatmate\.com\/blog\/[a-z0-9-]+\/<\/id>/.test(e) && /<updated>\d{4}-\d{2}-\d{2}T09:00:00\+05:30<\/updated>/.test(e) && /<summary>[^<]+<\/summary>/.test(e)),
    'blog/feed.xml is a feed of the same articles, each with its title, address, date and summary');
  const gradle = read('android/app/build.gradle'), apk = fs.readFileSync(path.join(APP, '..', '.github', 'workflows', 'flatmates-apk.yml'), 'utf8');
  ok(/include "index\.html", "privacy\.html", "manifest\.webmanifest", "icons\/\*\*", "vendor\/\*\*"/.test(gradle) && !/blog/.test(gradle) && !/flatmates\/blog/.test(apk),
    'website only: the Android app packs the app\'s page, its icons and vendor files, not blog/, and a change to the blog alone starts no Android build');
  const words = slugs.map(s => read('blog/' + s + '/index.html')).concat([read('blog/index.html')]).join('\n').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  ok(/Launching soon/.test(words) && !/download now|sign up now|install the app|get the app/i.test(words), 'until sign-up is open the blog says "Launching soon" and never "download now"');
  ok(!/Flatsplits|FlatMart|Move-in kit|vibe score|\bTribe\b|Empty Room Escape/i.test(words), 'the articles don\'t describe how the app works (Kamal, 15 Nov: keep that for after sign-in); they mention it only as "find flatmates who match your vibe"');
  const sources = slugs.map(s => ({ s, t: fs.readFileSync(path.join(APP, 'marketing', 'blog', 'posts', postFiles[slugs.indexOf(s)]), 'utf8') }));
  const refs = sources.map(x => ({ s: x.s, n: (x.t.match(/^sources:\n((?:- .*\n)+)/m) || ['', ''])[1].split('\n').filter(Boolean).length, used: [...new Set((x.t.match(/\[\^(\d+)\]/g) || []).map(r => +r.slice(2, -1)))] }));
  ok(refs.every(r => r.used.every(n => n >= 1 && n <= r.n)) && refs.filter(r => r.n > 0).length >= 4 && refs.find(r => r.s === 'rent-agreement-basics').n >= 10,
    'facts carry their sources: every numbered mark in an article points at a source listed at its foot (' + refs.map(r => r.s.split('-')[0] + ' ' + r.used.length + '/' + r.n).join(', ') + ')');

  // ------------------------------------------------------------ 2. the way in: one word of small print, on the website only
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(); watch(p);
  await p.goto(U); await p.waitForTimeout(1800); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const way = await p.evaluate(() => { const a = document.querySelector('.w-foot-slim a[href="blog/"]'); if(!a) return null; const shown = getComputedStyle(a).display !== 'none' && !!a.offsetParent;
    document.documentElement.classList.add('in-apk'); const inApp = getComputedStyle(a).display; document.documentElement.classList.remove('in-apk');
    return { text: a.textContent.trim(), webOnly: a.classList.contains('web-only'), shown, inApp, inTopBar: !!document.querySelector('.w-top a[href^="blog"]') }; });
  ok(way && way.text === 'Blog' && way.webOnly && way.shown && way.inApp === 'none' && !way.inTopBar, 'the first page has "Blog" in its small print on the website, and the Android app hides it; nothing was added to the top bar');
  await p.click('.w-foot-slim a[href="blog/"]'); await p.waitForTimeout(900);
  ok(p.url() === B && await p.evaluate(() => document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim()) === 'Sharing a flat, minus the drama.', 'it opens the blog: "Sharing a flat, minus the drama."');

  // ------------------------------------------------------------ 3. the blog's first page, on a phone
  const outside = []; p.on('request', r => { if(!r.url().startsWith(U) && !r.url().startsWith('data:')) outside.push(r.url()); });
  await p.goto(B); await p.waitForTimeout(900);
  const head = await p.evaluate(() => { const m = n => (document.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]') || {}).content, ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    const blog = ld['@graph'].find(x => x['@type'] === 'Blog');
    return { lang: document.documentElement.lang, title: document.title, desc: m('description'), canon: document.querySelector('link[rel=canonical]').href, og: m('og:image'), type: m('og:type'), robots: m('robots'), theme: m('theme-color'),
      feed: (document.querySelector('link[type="application/atom+xml"]') || {}).href, posts: blog && blog.blogPost.length, org: ld['@graph'].some(x => x['@type'] === 'Organization' && x.name === 'FindMeFlatMate') }; });
  ok(head.lang === 'en-IN' && /^Blog · sharing a flat, minus the drama · FindMeFlatMate$/.test(head.title) && head.desc.length > 80 && head.desc.length <= 165 && head.canon === SITE + 'blog/' && head.og === SITE + 'og-image.png' && head.type === 'website'
    && /max-image-preview:large/.test(head.robots) && head.theme === '#FFF4E8' && head.feed === SITE + 'blog/feed.xml' && head.posts === slugs.length && head.org,
    'for search engines and shared links: a title, a description of ' + head.desc.length + ' characters, its own address, the feed, and data naming the blog and its ' + head.posts + ' articles');
  const look = await p.evaluate(async () => { await document.fonts.ready; const cs = e => getComputedStyle(e), h1 = document.querySelector('.b-hero h1'), kw = h1.querySelector('.kw'), card = document.querySelector('.b-feat'), ink = document.querySelector('.ink-sheet');
    return { page: cs(document.body).backgroundColor, body: cs(document.body).fontFamily, serif: /DM Serif/.test(cs(h1).fontFamily), fonts: document.fonts.check('16px "Urbanist"') && document.fonts.check('40px "DM Serif Display"'),
      kw: kw.textContent + ' ' + cs(kw).color, ul: !!kw.querySelector('svg.kw-ul path') && cs(kw.querySelector('path')).stroke, lines: Math.round(h1.getBoundingClientRect().height / parseFloat(cs(h1).lineHeight)),
      lab: cs(document.querySelector('.b-hero .lab')).color + ' ' + cs(document.querySelector('.b-hero .lab')).textTransform, card: cs(card).backgroundColor + ' ' + cs(card).borderRadius, btn: cs(card.querySelector('.btn-primary')).backgroundColor,
      ink: cs(ink).backgroundColor, inkKw: cs(ink.querySelector('.kw')).color, inks: document.querySelectorAll('.ink-sheet').length, logo: [...document.querySelectorAll('.logo img')].map(i => i.getAttribute('src')).join() }; });
  ok(look.page === 'rgb(255, 244, 232)' && /Urbanist/.test(look.body) && look.serif && look.fonts && look.kw === 'drama rgb(194, 65, 12)' && look.ul === 'rgb(194, 65, 12)' && look.lab === 'rgb(194, 65, 12) uppercase'
    && look.card === 'rgb(255, 255, 255) 28px' && look.btn === 'rgb(194, 65, 12)' && look.ink === 'rgb(28, 25, 23)' && look.inkKw === 'rgb(253, 186, 116)' && look.inks === 1 && look.logo === '../icons/logo-icon.svg,../icons/wordmark.svg',
    'the look is the app\'s: a cream page, white cards, the serif headline with its key word "drama" in the orange and the line drawn under it, an orange label and button, one dark sheet with a light-orange word, and the logo as it is');
  ok(look.lines === 3 || look.lines === 2, 'the headline keeps to ' + look.lines + ' lines at 390 wide');
  const list = await p.evaluate(() => { const vis = e => !!e.offsetParent, cards = [...document.querySelectorAll('#bGrid > li')];
    return { feat: document.querySelector('#bFeat h2').textContent.trim(), featKw: (document.querySelector('#bFeat h2 .kw') || {}).textContent, shown: cards.filter(vis).length, all: cards.length, hiddenOne: cards.filter(c => !vis(c)).map(c => c.querySelector('h3').textContent.trim()).join(),
      tools: [...document.querySelectorAll('#bTools a')].map(a => a.getAttribute('href') + ' ' + a.querySelector('b').textContent), count: document.getElementById('bCount').textContent, chips: [...document.querySelectorAll('.b-chips button')].map(x => x.textContent),
      covers: document.querySelectorAll('#bGrid .cv .cv-av svg.fm-av').length, discs: document.querySelectorAll('#bGrid .cv-disc svg').length, imgs: [...document.images].map(i => i.getAttribute('src')).filter(s => !/^\.\.\/icons\//.test(s)).length,
      first: (cards.find(vis).querySelector('.b-meta') || {}).textContent.replace(/\s+/g, ' ').trim() }; });
  ok(list.feat === 'Split the rent without falling out' && list.featKw === 'falling out' && list.all === slugs.length && list.shown === slugs.length - 1 && list.hiddenOne === list.feat && list.count === slugs.length + ' articles',
    'one article leads the page ("' + list.feat + '") and the other ' + list.shown + ' are cards below it; it is not said twice');
  ok(list.chips.join('|') === 'All|Finding a place|Money|Living together|Safety|Paperwork' && list.covers >= 12 && list.discs === list.all && list.imgs === 0 && /^\d+ min read \d{1,2} \w{3} 20\d\d$/.test(list.first),
    'each card has a drawn cover (our cartoon people round a dark disc: no photo anywhere), its topic, how long it takes to read and its date: ' + list.first);
  const toolsOk = []; for(const t of list.tools){ const [href] = t.split(' '), [pg, id] = href.split('#'); const html = read('blog/' + pg + 'index.html'); toolsOk.push(new RegExp('id="' + id + '"').test(html)); }
  ok(list.tools.length === 3 && /Rent split calculator/.test(list.tools[0]) && /Flat-visit checklist/.test(list.tools[1]) && /House rules on one page/.test(list.tools[2]) && toolsOk.every(Boolean),
    '"Things you can use" points at the calculator, the flat-visit checklist and the page of house rules, each at its place inside an article');
  let a = await audit(p, 'body');
  ok(fine(a), 'the first page on a phone: every text on the four sizes or in the serif, and dark enough to read (' + a.n + ' pieces)' + (a.odd.length || a.low.length ? ' ' + JSON.stringify(a) : ''));
  await p.screenshot({ path: O + '/p35-blog-phone.png' });
  // topics and the search
  await p.click('.b-chips [data-topic=money]'); await p.waitForTimeout(250);
  const money = await p.evaluate(() => ({ titles: [...document.querySelectorAll('#bGrid > li')].filter(e => e.offsetParent).map(c => c.querySelector('h3').textContent.trim()), feat: document.getElementById('bFeat').hidden, tools: document.getElementById('bTools').hidden,
    count: document.getElementById('bCount').textContent, on: document.querySelector('.b-chips [aria-pressed=true]').textContent, url: location.search }));
  ok(money.titles.join() === 'Split the rent without falling out' && money.feat && money.tools && /^1 of \d+$/.test(money.count) && money.on === 'Money' && money.url === '?topic=money',
    'a topic filters the list: "Money" leaves ' + money.titles.length + ' (the leading article joins the list), says "' + money.count + '", and the address remembers it');
  await p.click('.b-chips [data-topic=all]'); await p.fill('#bSearch', 'deposit'); await p.waitForTimeout(250);
  const dep = await p.evaluate(() => [...document.querySelectorAll('#bGrid > li')].filter(e => e.offsetParent).map(c => c.querySelector('h3').textContent.trim()));
  await p.fill('#bSearch', 'zzzz'); await p.waitForTimeout(250);
  const none = await p.evaluate(() => ({ shown: [...document.querySelectorAll('#bGrid > li')].filter(e => e.offsetParent).length, box: !document.getElementById('bNone').hidden, text: document.getElementById('bNone').textContent.replace(/\s+/g, ' ').trim() }));
  await p.click('#bNone [data-clear]'); await p.waitForTimeout(250);
  const back = await p.evaluate(() => ({ shown: [...document.querySelectorAll('#bGrid > li')].filter(e => e.offsetParent).length, q: document.getElementById('bSearch').value, feat: !document.getElementById('bFeat').hidden, url: location.search }));
  ok(dep.length >= 2 && dep.some(t => /Rent agreement/.test(t)) && none.shown === 0 && none.box && /^Nothing for that yet/.test(none.text) && back.shown === slugs.length - 1 && back.q === '' && back.feat && back.url === '',
    'the search looks through titles, descriptions and topics ("deposit" finds ' + dep.length + '); a word with nothing says so and offers everything again');
  await p.goto(B + '?topic=safety'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelector('.b-chips [aria-pressed=true]').textContent === 'Safety' && [...document.querySelectorAll('#bGrid > li')].filter(e => e.offsetParent).every(c => c.dataset.topic === 'safety')), 'a link can open the list already on a topic (?topic=safety)');
  ok(outside.length === 0, 'the blog asks no other site for anything: fonts, pictures and scripts all come from findmeflatmate.com' + (outside.length ? ' ' + outside.slice(0, 3).join(' ') : ''));
  await ctx.close();
  // small phone, computer, and with scripts off
  ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); p = await ctx.newPage(); watch(p); await p.goto(B); await p.waitForTimeout(700);
  const small = await p.evaluate(() => { const h1 = document.querySelector('.b-hero h1'); return { over: document.documentElement.scrollWidth > innerWidth, lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)),
    tap: [...document.querySelectorAll('.b-chips button, .b-top .btn, .b-feat-b .btn')].map(e => Math.round(e.getBoundingClientRect().height)) }; });
  ok(!small.over && small.lines <= 3 && small.tap.every(h => h >= 38), 'on a 360 x 640 phone nothing runs off the side, the headline keeps to ' + small.lines + ' lines and the chips and buttons are ' + Math.min(...small.tap) + 'px tall or more');
  await ctx.close();
  ctx = await b.newContext({ viewport: { width: 1280, height: 860 } }); p = await ctx.newPage(); watch(p); await p.goto(B); await p.waitForTimeout(800);
  const wide = await p.evaluate(() => { const g = getComputedStyle(document.getElementById('bGrid')).gridTemplateColumns.split(' ').length, h1 = document.querySelector('.b-hero h1'), st = [...document.querySelectorAll('.b-stick a')];
    return { cols: g, lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)), stickers: st.filter(e => e.offsetParent).map(e => e.lastChild.textContent.trim()), over: document.documentElement.scrollWidth > innerWidth,
      feat: getComputedStyle(document.getElementById('bFeat')).gridTemplateColumns.split(' ').length, vt: [...document.querySelectorAll('[style*="view-transition-name"]')].map(e => e.style.viewTransitionName) }; });
  ok(wide.cols === 3 && wide.lines === 2 && wide.feat === 2 && !wide.over && wide.stickers.join('|') === 'Finding a place|Money|Living together|Safety|Paperwork' && new Set(wide.vt).size === wide.vt.length && wide.vt.length === slugs.length,
    'on a computer: the headline on two lines, the topics as stickers beside it, the leading article across two columns and the cards three to a row');
  await p.click('.b-stick [data-topic-go=paperwork]'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelector('.b-chips [aria-pressed=true]').textContent === 'Paperwork' && document.getElementById('all').getBoundingClientRect().top < innerHeight), 'a sticker is the same filter as its chip: it sets the topic and brings the list into view');
  a = await audit(p, 'body');
  ok(fine(a), 'the first page on a computer: sizes and contrast hold (' + a.n + ' pieces)' + (a.odd.length || a.low.length ? ' ' + JSON.stringify(a) : ''));
  await p.goto(B); await p.waitForTimeout(600); await p.screenshot({ path: O + '/p35-blog-computer.png' });
  await ctx.close();
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }); p = await ctx.newPage(); await p.goto(B); await p.waitForTimeout(500);
  const plain = await p.$$eval('#bFeat h2 a, #bGrid > li:not([hidden]) h3 a', as => as.map(a => a.getAttribute('href')));
  ok(plain.length === slugs.length && new Set(plain).size === slugs.length && await p.$eval('#bGrid > li:not([hidden])', e => getComputedStyle(e).opacity === '1'), 'with scripts off every article is still listed and visible (' + plain.length + ' links)');
  await ctx.close();

  // ------------------------------------------------------------ 4. every article
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Kolkata' }); p = await ctx.newPage(); watch(p);
  const bad = [], facts = [];
  for(const s of slugs){
    await p.goto(B + s + '/'); await p.waitForTimeout(450);
    const x = await p.evaluate(async slug => { const m = n => (document.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]') || {}).content, ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
      const post = ld.find(q => q['@type'] === 'BlogPosting'), crumbs = ld.find(q => q['@type'] === 'BreadcrumbList'), h1 = document.querySelector('h1');
      const inner = [...document.querySelectorAll('main a[href]')].map(e => e.getAttribute('href')).filter(h => !/^https?:/.test(h) && !/^https:\/\/wa\.me/.test(h));
      const linkOk = await Promise.all([...new Set(inner)].map(async h => { const [pg, id] = h.split('#'); if(!pg) return !!document.getElementById(id) || h;
        try{ const r = await fetch(pg.split('?')[0]); if(!r.ok) return h; if(!id) return true; const t = await r.text(); return new RegExp('id="' + id + '"').test(t) || h; }catch(e){ return h; } }));
      const ext = [...document.querySelectorAll('.a-sheet a[href^="http"]')].filter(e => !/^https:\/\/wa\.me\//.test(e.href));
      const marks = [...document.querySelectorAll('.a-body sup a, .a-short sup a')].map(e => e.getAttribute('href').slice(1));
      return { h1s: document.querySelectorAll('h1').length, title: document.title, h1: h1.textContent.replace(/\s+/g, ' ').trim(), kw: (h1.querySelector('.kw') || {}).textContent || '', desc: (m('description') || '').length,
        canon: document.querySelector('link[rel=canonical]').href, og: m('og:image'), type: m('og:type'), pub: m('article:published_time'), ldOk: post && post.headline === h1.textContent.replace(/\s+/g, ' ').trim() && /^\d{4}-\d{2}-\d{2}T/.test(post.datePublished) && post.image[0] === m('og:image') && post.wordCount > 400 && crumbs.itemListElement.length === 3,
        words: post && post.wordCount, mins: parseInt(([...document.querySelectorAll('.a-meta .b-meta > span')].map(e => e.textContent).find(q => /min read/.test(q)) || '0')), meta: document.querySelector('.a-meta').textContent.replace(/\s+/g, ' ').trim(), short: document.querySelectorAll('.a-short li').length, h2: document.querySelectorAll('.a-body h2').length,
        brokenLinks: linkOk.filter(v => v !== true), extBad: ext.filter(e => !/^https:\/\//.test(e.href) || e.target !== '_blank' || !/noopener/.test(e.rel)).length, ext: ext.length, marksBad: marks.filter(id => !document.getElementById(id)).length, marks: marks.length,
        over: document.documentElement.scrollWidth > innerWidth, cover: !!document.querySelector('.a-cover .cv-av svg.fm-av'), ink: document.querySelectorAll('.ink-sheet').length, soon: (document.querySelector('.ink-sheet .soon') || {}).textContent, cta: (document.querySelector('.ink-sheet a') || {}).getAttribute('href'),
        next: document.querySelectorAll('.a-next .b-card').length, by: (document.querySelector('.a-by') || {}).textContent.trim(), imgs: [...document.images].map(i => i.getAttribute('src')).filter(q => !/^\.\.\/\.\.\/icons\//.test(q)).length,
        ids: (() => { const all = [...document.querySelectorAll('[id]')].map(e => e.id); return all.length - new Set(all).size; })(), legal: !!document.querySelector('.a-legal') }; }, s);
    const au = await audit(p, 'main');
    const why = [];
    if(x.h1s !== 1 || !x.title.endsWith(' · FindMeFlatMate blog') || !x.title.startsWith(x.h1)) why.push('title');
    if(x.desc < 80 || x.desc > 165) why.push('description ' + x.desc);
    if(x.canon !== SITE + 'blog/' + s + '/' || x.og !== SITE + 'blog/og/' + s + '.png' || x.type !== 'article' || !/\+05:30$/.test(x.pub || '') || !x.ldOk) why.push('head data');
    if(x.brokenLinks.length) why.push('links ' + x.brokenLinks.join(' '));
    if(x.extBad || x.marksBad) why.push('outside links or source marks');
    if(x.over) why.push('runs off the side');
    if(!x.cover || x.ink !== 1 || !/Launching soon/.test(x.soon || '') || x.cta !== '../../?utm_source=blog&utm_medium=article&utm_campaign=' + s) why.push('cover or closing sheet');
    if(x.next !== 3 || x.by !== 'The FindMeFlatMate team' || x.imgs || x.ids) why.push('next reads, by-line, pictures or repeated ids');
    if(x.short < 3 || x.h2 < 4 || x.mins !== Math.max(2, Math.round(x.words / 200)) || !/^The FindMeFlatMate team \d{1,2} \w{3} 20\d\d \d+ min read$/.test(x.meta)) why.push('short version, headings, reading time or by-line: ' + x.meta);
    if(!fine(au)) why.push('sizes or contrast ' + JSON.stringify(au).slice(0, 300));
    if(why.length) bad.push(s + ': ' + why.join('; '));
    facts.push({ s, kw: x.kw, mins: x.mins, ext: x.ext, marks: x.marks, n: au.n, legal: x.legal });
  }
  ok(!bad.length && facts.length === slugs.length, 'each of the ' + slugs.length + ' articles: one headline with its key word (' + facts.map(f => f.kw).join(', ') + '), its own title, description, address and share picture, a short version, a drawn cover, three next reads, a closing sheet that says "Launching soon", every link going somewhere, and nothing off the side of a phone'
    + (bad.length ? ' ' + bad.join(' | ') : ''));
  ok(!bad.length && facts.every(f => f.n > 60), 'every article\'s text is on the four sizes or in the serif and dark enough to read (' + facts.map(f => f.n).join(', ') + ' pieces)');
  // the smallest phones: the app keeps to 320 wide, so the blog does
  await p.setViewportSize({ width: 320, height: 640 }); const tiny = [];
  for(const s of [''].concat(slugs.map(x => x + '/'))){ await p.goto(B + s); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const h1 = document.querySelector('h1'); return { over: document.documentElement.scrollWidth - innerWidth, lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)),
      tool: [...document.querySelectorAll('.t-room, .a-check, .a-copy, .a-say > div')].filter(e => e.getBoundingClientRect().right > innerWidth).length }; });
    if(r.over > 0 || r.lines > 4 || r.tool) tiny.push((s || 'first page') + ' ' + JSON.stringify(r)); }
  await p.setViewportSize({ width: 390, height: 844 });
  ok(!tiny.length, 'on a 320-wide phone no page of the blog runs off the side, the calculator\'s rooms and the boxes fit, and no headline goes past four lines' + (tiny.length ? ' ' + tiny.join(' | ') : ''));
  ok(facts.find(f => f.s === 'rent-agreement-basics').legal && facts.find(f => f.s === 'rent-agreement-basics').marks >= 10 && facts.find(f => f.s === 'rental-scams-red-flags').marks >= 10 && !facts.find(f => f.s === 'house-rules-that-hold').legal,
    'the article on agreements says it is general information, not legal advice, and it and the one on scams mark their facts with numbered sources');

  // ------------------------------------------------------------ 5. an article's furniture: the reading bar, the contents, sharing
  await p.goto(B + 'rent-agreement-basics/'); await p.waitForTimeout(600);
  const top = await p.evaluate(() => ({ bar: parseFloat((document.querySelector('.b-read i').style.transform.match(/[\d.]+/) || ['9'])[0]), tocm: !!document.querySelector('.a-tocm').offsetParent, toc: !!document.querySelector('.a-toc').offsetParent, crumb: [...document.querySelectorAll('.a-crumb li')].map(e => e.textContent.trim()).join(' > '),
    crumbTo: [...document.querySelectorAll('.a-crumb a')].map(e => e.getAttribute('href')).join(), wa: document.querySelector('[data-share=wa]').href, lede: getComputedStyle(document.querySelector('.a-head .sub')).fontSize }));
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * .5)); await p.waitForTimeout(350);
  const mid = await p.evaluate(() => ({ bar: parseFloat((document.querySelector('.b-read i').style.transform.match(/[\d.]+/) || [0])[0]), scrolled: document.querySelector('.b-top').classList.contains('scrolled') }));
  ok(top.bar === 0 && mid.bar > .3 && mid.bar < .9 && mid.scrolled && top.tocm && !top.toc && top.crumb === 'Blog > Paperwork' && top.crumbTo === '../,../?topic=paperwork#all',
    'on a phone: a bar across the top fills as you read (' + Math.round(mid.bar * 100) + '% half-way down), "In this article" opens from a card, and the trail leads back to the blog and to the topic');
  ok(/^https:\/\/wa\.me\/\?text=/.test(top.wa) && decodeURIComponent(top.wa).includes('Rent agreement basics: what to read before you sign ' + SITE + 'blog/rent-agreement-basics/'), 'the WhatsApp button shares the title and the article\'s own address');
  await ctx.close();
  ctx = await b.newContext({ viewport: { width: 1280, height: 860 } }); await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); p = await ctx.newPage(); watch(p);
  await p.goto(B + 'rent-agreement-basics/'); await p.waitForTimeout(700);
  const desk = await p.evaluate(() => ({ toc: !!document.querySelector('.a-toc').offsetParent, tocm: !!document.querySelector('.a-tocm').offsetParent, items: document.querySelectorAll('.a-toc li').length, h2: document.querySelectorAll('.a-body h2').length,
    cols: getComputedStyle(document.querySelector('.a-head')).gridTemplateColumns.split(' ').length, sheet: getComputedStyle(document.querySelector('.a-sheet')).backgroundColor, note: getComputedStyle(document.querySelector('.a-note')).backgroundColor, measure: Math.round(document.querySelector('.a-body p').getBoundingClientRect().width) }));
  await p.evaluate(() => document.getElementById('names').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(450);
  const spy = await p.evaluate(() => [...document.querySelectorAll('.a-toc a.on')].map(e => e.textContent).join());
  ok(desk.toc && !desk.tocm && desk.items === desk.h2 && desk.cols === 2 && spy === 'Whose name is on it', 'on a computer: the headline sits beside the cover, and "In this article" stays beside the words, marking the part you are reading ("' + spy + '")');
  ok(desk.sheet === 'rgb(255, 255, 255)' && desk.note === 'rgb(255, 244, 232)' && desk.measure <= 700 && desk.measure >= 560, 'the words sit on a white sheet, a note inside it is cream (inside a white card a panel is cream), and a line is ' + desk.measure + 'px wide, a comfortable measure');
  await p.click('.a-share-row [data-share=copy]'); await p.waitForTimeout(250);
  const copied = await p.evaluate(async () => ({ clip: await navigator.clipboard.readText(), toast: (document.querySelector('.toast') || {}).textContent }));
  ok(copied.clip === SITE + 'blog/rent-agreement-basics/' && copied.toast === 'Link copied.', '"Copy link" copies the article\'s own address and says so');
  const table = await p.evaluate(() => { const t = document.querySelector('.a-table'); return { head: getComputedStyle(t.querySelector('thead')).display, th: t.querySelectorAll('th').length, rows: t.querySelectorAll('tbody tr').length }; });
  await p.screenshot({ path: O + '/p35-article-computer.png' });

  // ------------------------------------------------------------ 6. the rent split calculator
  await p.goto(B + 'split-rent-fairly/#split'); await p.waitForTimeout(700);
  const calc = () => p.evaluate(() => { const box = document.querySelector('[data-tool="rent-split"]'), n = s => Number(s.replace(/[^\d]/g, ''));
    return { rooms: [...box.querySelectorAll('.t-room')].map(r => n(r.querySelector('output').textContent)), names: [...box.querySelectorAll('.t-room-h input')].map(i => i.value), sum: box.querySelector('.t-sum p').textContent.replace(/\s+/g, ' ').trim(),
      per: [...box.querySelectorAll('.t-per')].map(e => e.textContent), wa: decodeURIComponent(box.querySelector('[data-act=wa]').href) }; });
  let c = await calc();
  ok(c.rooms.length === 3 && c.rooms.reduce((x, y) => x + y, 0) === 30000 && c.rooms[0] > c.rooms[1] && c.rooms[1] > c.rooms[2] && c.rooms.every(v => v % 10 === 0) && c.sum === '₹30,000 a month between 3 people',
    'the calculator starts with three rooms and ₹30,000: ' + c.rooms.map(v => '₹' + v.toLocaleString('en-IN')).join(', ') + ' (a large room with its own bathroom, a medium one with a balcony, a small one), in whole tens that add up to the rent');
  await p.fill('[data-tool="rent-split"] [data-k=rent]', '45500'); await p.waitForTimeout(150); const c2 = await calc();
  await p.click('[data-tool="rent-split"] .t-room:nth-child(3) [data-k=bath]'); await p.waitForTimeout(150); const c3 = await calc();
  await p.click('[data-tool="rent-split"] .t-room:nth-child(1) [data-k=people]'); await p.waitForTimeout(150); const c4 = await calc();
  ok(c2.rooms.reduce((x, y) => x + y, 0) === 45500 && c3.rooms[2] > c2.rooms[2] && c3.rooms.reduce((x, y) => x + y, 0) === 45500 && c4.sum === '₹45,500 a month between 4 people' && c4.per.length === 1 && /each for the two people in it$/.test(c4.per[0]) && c4.rooms.reduce((x, y) => x + y, 0) === 45500,
    'it follows as you type and tap: a new rent, a bathroom added to a room (its share goes up), a room shared by two (the shared space is split by head, so that room pays more and says what each of the two pays); the amounts always add up to the rent');
  await p.click('[data-tool="rent-split"] [data-k=n][data-v="5"]'); await p.waitForTimeout(150); await p.fill('[data-tool="rent-split"] .t-room:nth-child(5) [data-k=name]', 'The box room'); await p.waitForTimeout(100);
  await p.click('[data-tool="rent-split"] .t-more summary'); await p.fill('[data-tool="rent-split"] [data-k=shared]', '100'); await p.waitForTimeout(150); const c5 = await calc();
  ok(c5.rooms.length === 5 && c5.rooms.reduce((x, y) => x + y, 0) === 45500 && Math.abs(c5.rooms[1] - c5.rooms[4]) <= 20 && c5.rooms[0] > c5.rooms[1] * 1.8 && c5.wa.includes('The box room') && /Rent split · ₹45,500 a month/.test(c5.wa) && c5.wa.includes(SITE + 'blog/split-rent-fairly/#split'),
    'up to five rooms, each with a name of your own; with all the rent counted as shared space every person pays the same; "Send on WhatsApp" carries the split in words');
  await p.click('[data-tool="rent-split"] [data-act=copy]'); await p.waitForTimeout(200);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  await p.reload(); await p.waitForTimeout(700); const c6 = await calc();
  await p.click('[data-tool="rent-split"] [data-act=reset]'); await p.waitForTimeout(200); const c7 = await calc();
  ok(/^Rent split · ₹45,500 a month\n/.test(clip) && clip.split('\n').length >= 7 && c6.rooms.length === 5 && c6.names[4] === 'The box room' && c7.rooms.length === 3 && c7.rooms.reduce((x, y) => x + y, 0) === 30000,
    '"Copy the split" copies it; the numbers are still there when you come back (kept on this phone only); "Start again" goes back to the beginning');
  a = await audit(p, '[data-tool="rent-split"]');
  ok(fine(a), 'the calculator\'s own text keeps to the sizes and reads clearly (' + a.n + ' pieces)' + (a.odd.length || a.low.length ? ' ' + JSON.stringify(a) : ''));
  await p.screenshot({ path: O + '/p35-calculator.png' });
  await ctx.close();
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }); p = await ctx.newPage(); await p.goto(B + 'split-rent-fairly/'); await p.waitForTimeout(400);
  ok(await p.$eval('[data-tool="rent-split"]', e => /Half the rent pays for the space everyone uses and is split by head/.test(e.textContent) && !!e.offsetParent), 'with scripts off the calculator\'s box says how the split is worked out, so nobody gets an empty panel');
  await ctx.close();

  // ------------------------------------------------------------ 7. lists to tick, and words to copy
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); p = await ctx.newPage(); watch(p);
  await p.goto(B + 'flat-visit-checklist/#visit'); await p.waitForTimeout(700);
  const cl0 = await p.evaluate(() => { const box = document.querySelector('.a-check[data-check=visit]'); return { n: box.querySelectorAll('input').length, groups: [...box.querySelectorAll('h4')].map(h => h.textContent), count: box.querySelector('.a-check-n').textContent,
    tap: Math.min(...[...box.querySelectorAll('label')].map(l => Math.round(l.getBoundingClientRect().height))) }; });
  await p.click('.a-check[data-check=visit] li:nth-of-type(1) label'); await p.click('.a-check[data-check=visit] ul:nth-of-type(2) li:nth-of-type(2) label'); await p.waitForTimeout(150);
  const cl1 = await p.evaluate(() => { const box = document.querySelector('.a-check[data-check=visit]'); return { count: box.querySelector('.a-check-n').textContent, bar: box.querySelector('.a-check-bar i').style.width, saved: localStorage.getItem('fmb:check:flat-visit-checklist:visit') }; });
  await p.reload(); await p.waitForTimeout(600);
  const cl2 = await p.evaluate(() => { const box = document.querySelector('.a-check[data-check=visit]'); return { ticked: box.querySelectorAll('input:checked').length, count: box.querySelector('.a-check-n').textContent, wa: decodeURIComponent(box.querySelector('[data-wa]').href) }; });
  await p.click('.a-check[data-check=visit] [data-copy]'); await p.waitForTimeout(200); const listClip = await p.evaluate(() => navigator.clipboard.readText());
  await p.click('.a-check[data-check=visit] [data-reset]'); await p.waitForTimeout(200);
  const cl3 = await p.evaluate(() => ({ ticked: document.querySelectorAll('.a-check[data-check=visit] input:checked').length, count: document.querySelector('.a-check[data-check=visit] .a-check-n').textContent }));
  ok(cl0.n >= 28 && cl0.groups.join('|') === 'The room|Water and power|The kitchen and the common space|The building and the street|The people|The money and the paper' && cl0.count === '0 of ' + cl0.n + ' ticked' && cl0.tap >= 40,
    'the flat-visit checklist: ' + cl0.n + ' things to tick in six groups, in the order you meet them, each row tall enough for a thumb');
  ok(cl1.count === '2 of ' + cl0.n + ' ticked' && parseFloat(cl1.bar) > 0 && /^\[0,\d+\]$/.test(cl1.saved) && cl2.ticked === 2 && cl2.count === '2 of ' + cl0.n + ' ticked',
    'ticks are counted, and are still there when the page is opened again (kept on this phone, sent nowhere)');
  ok(/^The flat-visit checklist\n\nTHE ROOM\n☑ /.test(listClip) && listClip.includes('☐ ') && listClip.trim().endsWith(SITE + 'blog/flat-visit-checklist/') && /^https:\/\/wa\.me\/\?text=The flat-visit checklist/.test(cl2.wa) && cl3.ticked === 0 && /^0 of /.test(cl3.count),
    'the list can be copied or sent on WhatsApp with what is ticked, and "Start again" clears it');
  await p.emulateMedia({ media: 'print' });
  const paper = await p.evaluate(() => ({ top: getComputedStyle(document.querySelector('.b-top')).display, acts: getComputedStyle(document.querySelector('.a-check .a-acts')).display, list: !!document.querySelector('.a-check ul').offsetParent, end: getComputedStyle(document.querySelector('.b-end')).display }));
  await p.emulateMedia({ media: 'screen' });
  ok(paper.top === 'none' && paper.acts === 'none' && paper.end === 'none' && paper.list, 'printed, the page is the words and the boxes to tick: no bar, no buttons, no closing sheet');
  await p.goto(B + 'house-rules-that-hold/#one-page'); await p.waitForTimeout(600);
  await p.click('#one-page [data-copy]'); await p.waitForTimeout(200);
  const rules = await p.evaluate(async () => ({ clip: await navigator.clipboard.readText(), toast: (document.querySelector('.toast') || {}).textContent, wa: decodeURIComponent(document.querySelector('#one-page [data-wa]').href), say: document.querySelectorAll('.a-say').length,
    yes: getComputedStyle(document.querySelector('.a-say .yes .lab')).color, boxes: document.querySelectorAll('.a-copy').length }));
  ok(/^OUR FLAT, ON ONE PAGE\n/.test(rules.clip) && /QUIET HOURS/.test(rules.clip) && /LEAVING/.test(rules.clip) && rules.toast === 'Copied. Paste it where you need it.' && rules.wa.startsWith('https://wa.me/?text=OUR FLAT, ON ONE PAGE') && rules.say === 3 && rules.yes === 'rgb(62, 107, 78)' && rules.boxes === 2,
    'house rules: a one-page agreement to copy or send to the flat\'s group, a message for late rent, and three "instead of / try" pairs (the one to try marked in green)');
  await p.goto(B + 'rental-scams-red-flags/'); await p.waitForTimeout(500);
  const scam = await p.evaluate(() => ({ steps: document.querySelectorAll('.a-steps li').length, first: (document.querySelector('.a-steps li b') || {}).textContent, warn: getComputedStyle(document.querySelector('.a-note.warn .ic')).backgroundColor, quote: document.querySelector('.a-quote').textContent.trim().slice(0, 60),
    text: document.querySelector('.a-body').textContent }));
  ok(scam.steps === 5 && /^Call 1930, now\./.test(scam.first) && scam.warn === 'rgb(190, 18, 60)' && /cybercrime\.gov\.in/.test(scam.text) && /call 112/i.test(scam.text) && /never scan/i.test(scam.quote + scam.text),
    'the article on scams ends with what to do if you paid, in order, starting "' + scam.first + '", and its warning is in the app\'s crimson');
  await p.goto(B + 'pg-flat-or-coliving/'); await p.waitForTimeout(500);
  const stack = await p.evaluate(() => { const t = document.querySelector('.a-table'); return { head: getComputedStyle(t.querySelector('thead')).display, row: getComputedStyle(t.querySelector('tbody tr')).display, label: getComputedStyle(t.querySelector('tbody td:nth-child(2)'), '::before').content, over: document.documentElement.scrollWidth > innerWidth }; });
  ok(table.head !== 'none' && table.th === 3 && stack.head === 'none' && stack.row === 'block' && stack.label === '"PG"' && !stack.over, 'a table is a table on a computer and, on a phone, a stack of cards with each column\'s name over its answer');
  await ctx.close();

  // ------------------------------------------------------------ 8. movement, and less of it
  ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' }); p = await ctx.newPage(); watch(p); await p.goto(B); await p.waitForTimeout(600);
  const still = await p.evaluate(() => ({ ul: getComputedStyle(document.querySelector('.kw-ul path')).animationName, rv: [...document.querySelectorAll('.rv')].every(e => getComputedStyle(e).opacity === '1'), av: getComputedStyle(document.querySelector('.b-feat .fm-av .who') || document.querySelector('.b-feat .fm-av')).animationName,
    chip: getComputedStyle(document.querySelector('.cv-chip.c1')).animationName }));
  await ctx.close();
  ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'no-preference' }); p = await ctx.newPage(); watch(p); await p.goto(B); await p.waitForTimeout(900);
  const moving = await p.evaluate(() => ({ ul: getComputedStyle(document.querySelector('.kw-ul path')).animationName, rv: [...document.querySelectorAll('.rv')].filter(e => e.offsetParent && e.getBoundingClientRect().top < innerHeight * .8).every(e => e.classList.contains('in')) && [...document.querySelectorAll('.rv')].some(e => !e.classList.contains('in')),
    paused: getComputedStyle(document.querySelector('.b-card .fm-av *')).animationPlayState, vt: [...document.styleSheets].some(s => { try{ return [...s.cssRules].some(r => /view-transition/.test(r.cssText)); }catch(e){ return false; } }) }));
  ok(still.ul === 'none' && still.rv && still.av === 'none' && still.chip === 'none' && moving.ul === 'kwdraw' && moving.rv && moving.paused === 'paused',
    'the line under "drama" draws itself, cards come up as they come into view and the cartoon people in the list wait until you point at their card; for anyone who asked for less motion, everything is simply there');
  await ctx.close();

  ok(!errs.length, 'no errors on any page of the blog' + (errs.length ? ' ' + JSON.stringify(errs.slice(0, 4)) : ''));
  await b.close();
})();
