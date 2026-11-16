// The look of 16 Nov 2026, and the city step of sign-up (Kamal, 16 Nov, "Fix this also": the phone's own pop-up list
// opened over the chips, the keyboard and Continue). Demo mode, port 8765. The look came in three steps that day:
// "copy style and colors of dwelo. Change the orange color to light red color" and "Do it for the entire app and
// website" (the style); "App and website logo to stay the same as earlier"; then "Also take the app color as the
// color of logo which was earlier and white. Plus check the font color accordingly", and "Audit once done. Spend some
// time on each page and audit the gaps of colors font everything". So: white, the logo's orange, the wordmark's
// near-black, and the checks at the end here hold what that audit found and fixed.
// The logo is not part of the look (Kamal, 16 Nov: "App and website logo to stay the same as earlier", "App and website
// logo color to stay same as earlier"): its files are his own of 9 Nov, and this suite holds them to that, byte for byte.
const { chromium, devices } = require('playwright'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const APP = path.join(__dirname, '..', '..'), RES = 'android/app/src/main/res/mipmap-';
// sha256 (first 16 characters) of every logo and icon file as Kamal's logo went in on 9 Nov (commit b6299bd)
const LOGO_FILES = { 'icons/logo-icon.svg':'06f27c8de2b9591a', 'icons/logo.svg':'54edb8f296e9edca', 'icons/wordmark.svg':'c1b24b819a81d712', 'icons/wordmark-app.svg':'7610f6585ced4043',
  'icons/wordmark-light.svg':'4daa1a4b03ba67c0', 'icons/icon-192.png':'1b8a3ae8fc48b5a9', 'icons/icon-512.png':'2ec0317154cd7e2d', 'icons/maskable-512.png':'944006fc39b1cca9',
  'icons/apple-touch-icon.png':'56edbc9f6435bf7f', [RES + 'hdpi/ic_launcher.png']:'9f3b6ad4904f932b', [RES + 'hdpi/ic_launcher_round.png']:'adc78c70d55cbbc5',
  [RES + 'mdpi/ic_launcher.png']:'d4213b7ef6cf1462', [RES + 'mdpi/ic_launcher_round.png']:'f37a7d57e9590b57', [RES + 'xhdpi/ic_launcher.png']:'226b919e25a4d3d9',
  [RES + 'xhdpi/ic_launcher_round.png']:'b641762c1ef9285b', [RES + 'xxhdpi/ic_launcher.png']:'ad67924770c4d3dd', [RES + 'xxhdpi/ic_launcher_round.png']:'3277d863fbd0a754',
  [RES + 'xxxhdpi/ic_launcher.png']:'1b8a3ae8fc48b5a9', [RES + 'xxxhdpi/ic_launcher_round.png']:'d6db3e86d71c3d73' };
// the colour at a spot of a picture (fractions of its width and height), read in the page: "r,g,b"
const pixelOf = (p, b64, fx, fy) => p.evaluate(([src, fx, fy]) => new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(i, 0, 0); r([...x.getImageData(Math.round(c.width * fx), Math.round(c.height * fy), 1, 1).data].slice(0, 3).join()); }; i.onerror = () => r('none'); i.src = src; }), ['data:image/png;base64,' + b64, fx, fy]);
const O = process.argv[2], U = 'http://localhost:8765/', ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[], look:'room' },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: now + 9e9 };
const listing = { id:'mine-p31', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }] }, vibe), costs:{ wifi:300 }, owner_phone:'9822222222',
  status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0, private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru' } };
const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents:1 }, vibe), myListings:[listing], requests:[], demoIncoming:{}, notified:{}, waitNudged: now };
const open = async (b, state, opts, hash) => { const ctx = await b.newContext(Object.assign({ serviceWorkers:'block' }, opts));
  if(state) await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, state);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(U + (hash ? '#' + hash : '')); await p.waitForTimeout(1700);
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await p.waitForTimeout(250); return { ctx, p }; };
const go = async (p, hash) => { await p.goto(U + '#' + hash); await p.waitForTimeout(1400); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await p.waitForTimeout(250); };
// every text on the page against what is behind it: 4.5:1, or 3:1 for big text (the same reading as p13's)
const audit = () => {
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number); const lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const bgOf = el => { for(let e = el; e; e = e.parentElement){ const cs = getComputedStyle(e); if(cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null; const c = rgb(cs.backgroundColor); if(c.length >= 3 && (c[3] === undefined || c[3] > .5)) return c; } return [255, 255, 255]; };
  const root = document.querySelector('dialog[open]') || document.body, out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while((n = walker.nextNode())){ const t = n.textContent.trim(); if(t.length < 2) continue; const el = n.parentElement; if(!el || !el.offsetParent) continue;
    const r = el.getBoundingClientRect(); if(!r.width || r.bottom < 0) continue; const cs = getComputedStyle(el); if(+cs.opacity < .2 || el.closest('[aria-hidden="true"], .city, svg')) continue;
    const fg = rgb(cs.color), bg = bgOf(el); if(!bg) continue; const a = fg[3] === undefined ? 1 : fg[3]; const mix = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    const L1 = lum(mix), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); const big = parseFloat(cs.fontSize) >= 18.5 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700);
    if(ratio < (big ? 3 : 4.5)) out.push(`${ratio.toFixed(2)} ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${t.slice(0, 40)}"`); }
  return [...new Set(out)];
};
// colours of the older looks still showing: the light red and its shades, the deep aubergine, the cream page and beige,
// the pink and rose tints (all of the first step on 16 Nov), and before them the deeper orange for text, the lavender,
// butter and mint panels, the teal, the beige page and the navy
const OLD = ['rgb(238, 100, 104)', 'rgb(206, 58, 68)', 'rgb(185, 47, 58)', 'rgb(226, 83, 90)', 'rgb(31, 27, 46)', 'rgb(30, 26, 43)', 'rgb(253, 248, 241)', 'rgb(248, 240, 231)', 'rgb(251, 221, 218)', 'rgb(251, 227, 218)',
  'rgb(178, 58, 10)', 'rgb(195, 201, 246)', 'rgb(235, 217, 129)', 'rgb(195, 224, 214)', 'rgb(28, 127, 114)', 'rgb(239, 228, 220)', 'rgb(27, 36, 64)'];
const oldLeft = old => { const out = [];
  document.querySelectorAll('body *').forEach(e => { if(!e.getClientRects().length || e.closest('.fm-av, .art, .w-people, svg, .av-tile, .leaflet-container, .hl-art, .st-art')) return; const cs = getComputedStyle(e);
    for(const [k, v] of [['color', cs.color], ['background', cs.backgroundColor], ['border', cs.borderTopColor]]) if(old.includes(v) && (k !== 'border' || parseFloat(cs.borderTopWidth) > 0)) out.push(k + ' ' + v + ' ' + e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]); });
  return [...new Set(out)].slice(0, 6); };
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ a visitor: the first page, on a phone
  let { ctx, p } = await open(b, null, { viewport:{ width:390, height:844 } });
  await p.evaluate(() => document.fonts.ready);
  const T = await p.evaluate(async () => { const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toUpperCase();
    const h1 = document.querySelector('.w-copy h1'), cs = getComputedStyle(h1), go = document.querySelector('#loginForm .btn-primary, .w-card .btn-primary'), g = getComputedStyle(go);
    const lum = rgb => { const c = rgb.match(/[\d.]+/g).slice(0, 3).map(x => x / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    const logo = await (await fetch('icons/logo-icon.svg')).text(), mark = await (await fetch('icons/wordmark.svg')).text();
    const cols = (t, re) => [...new Set((t.match(re) || []).map(c => c.toUpperCase()))].sort().join();   // every colour named in a file, once each
    const px = await new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 192; const x = c.getContext('2d'); x.drawImage(i, 0, 0); r([...x.getImageData(96, 30, 1, 1).data].slice(0, 3).join()); }; i.onerror = () => r('none'); i.src = 'icons/icon-192.png'; });
    return { orange: tok('--orange'), page: tok('--bg'), card: tok('--surface'), ink: tok('--ink'), text: tok('--text'), text2: tok('--text-2'), orangeText: tok('--orange-text'), deep: tok('--orange-deep'), danger: tok('--danger'), fam: cs.fontFamily, weight: cs.fontWeight, spacing: cs.letterSpacing,
      serif: document.fonts.check('400 20px "DM Serif Display"'), usedSerif: [...document.fonts].some(f => /DM Serif/.test(f.family) && f.status === 'loaded'),
      h2: getComputedStyle(document.querySelector('.w-card h2')).fontFamily, body: getComputedStyle(document.querySelector('.w-copy .lede, .w-trust')).fontFamily,
      go: { bg: g.backgroundColor, color: g.color, ratio: Math.round((Math.max(lum(g.color), lum(g.backgroundColor)) + .05) / (Math.min(lum(g.color), lum(g.backgroundColor)) + .05) * 100) / 100 },
      logo: cols(logo, /#[0-9A-F]{6}/gi), mark: cols(mark, /#[0-9A-F]{6}/gi), px,
      theme: document.querySelector('meta[name=theme-color]').content, fav: cols(document.querySelector('link[rel=icon]').href, /%23[0-9A-F]{6}/gi),
      top: [...document.querySelectorAll('.w-top .logo img')].filter(i => i.offsetParent).map(i => i.getAttribute('src')).join(), glow: getComputedStyle(document.querySelector('.w-top .logo img.fm-mark')).boxShadow,
      bodyBg: getComputedStyle(document.body).backgroundColor, prog: (e => e && getComputedStyle(e).backgroundColor)(document.querySelector('.lg-prog i')),
      emW: getComputedStyle(document.querySelector('.w-copy h1 em') || h1).fontWeight }; });
  ok(T.orange === '#C2410C' && T.page === '#FFFFFF' && T.card === '#FFFFFF' && T.ink === '#1C1917' && T.text === '#1C1917' && T.text2 === '#57534E' && T.bodyBg === 'rgb(255, 255, 255)',
    'the palette: a white page and white cards, the orange, near-black text and grey for secondary text: ' + JSON.stringify({ orange: T.orange, page: T.page, ink: T.ink, text2: T.text2 }));
  ok(T.logo.split(',').includes(T.orange) && T.mark.split(',').includes(T.text) && T.mark.split(',').includes(T.text2) && T.orangeText === T.orange,
    'those are the logo\'s own colours: the tile\'s orange is the app\'s orange, and the wordmark\'s near-black and grey are the text colours');
  ok(T.danger === '#BE123C' && T.danger !== T.orange && T.deep === '#9A3412', 'danger is a crimson, a clear step from the orange; small orange text on tints has a deeper shade: ' + JSON.stringify({ danger: T.danger, deep: T.deep }));
  // the logo: Kamal's own, as before the look of 16 Nov
  ok(T.logo === '#C2410C,#FFFFFF' && T.mark === '#1C1917,#57534E,#C2410C' && T.px === '194,65,12' && T.fav === '%23C2410C,%23FFFFFF',
    'the logo keeps its own colours: an orange tile with white "fm", the wordmark in near-black, orange and grey, the app icon and the tab icon in the same orange: ' + JSON.stringify({ logo: T.logo, mark: T.mark, px: T.px, fav: T.fav }));
  ok(T.theme.toUpperCase() === '#FFFFFF', 'the browser bar is white, as the page: ' + T.theme);
  const changed = Object.entries(LOGO_FILES).filter(([f, h]) => { try{ return crypto.createHash('sha256').update(fs.readFileSync(path.join(APP, f))).digest('hex').slice(0, 16) !== h; }catch(e){ return true; } }).map(([f]) => f);
  ok(Object.keys(LOGO_FILES).length === 19 && !changed.length, 'the logo and icon files are the ones that went in with Kamal\'s logo on 9 Nov, byte for byte (5 drawings, 4 web icons, 10 Android launcher icons): ' + JSON.stringify(changed));
  const icons = Object.keys(LOGO_FILES).filter(f => f.endsWith('.png')), tile = {};
  for(const f of icons) tile[f] = await pixelOf(p, fs.readFileSync(path.join(APP, f)).toString('base64'), .2, .5);
  ok(icons.length === 14 && Object.values(tile).every(v => v === '194,65,12'), 'every icon is the orange tile, on the web and on Android: ' + JSON.stringify(Object.entries(tile).filter(([, v]) => v !== '194,65,12')));
  const seen = await pixelOf(p, (await p.locator('.w-top .logo img.fm-mark').screenshot()).toString('base64'), .5, .88);
  ok(T.top === 'icons/logo-icon.svg,icons/wordmark-app.svg' && seen === '194,65,12' && /^rgba\(194, 65, 12, 0\.22\)/.test(T.glow),
    'the first page shows that logo: the tile and the wordmark from the logo\'s files, orange on the screen, with its own soft orange glow: ' + JSON.stringify({ top: T.top, seen, glow: T.glow }));
  ok(await pixelOf(p, fs.readFileSync(path.join(APP, 'og-image.png')).toString('base64'), 447 / 1200, 97 / 630) === '194,65,12', 'the picture shown with a shared link to the website carries the same orange logo');
  ok(/^"?DM Serif Display/.test(T.fam) && T.weight === '400' && (T.spacing === 'normal' || T.spacing === '0px') && /^"?DM Serif Display/.test(T.h2) && T.serif && T.usedSerif && /^"?Urbanist/.test(T.body),
    'headings are in the serif (its one weight, not tightened) and it has loaded; the rest stays Urbanist: ' + JSON.stringify({ h1: T.fam.slice(0, 22), weight: T.weight, spacing: T.spacing, body: T.body.slice(0, 12) }));
  await p.keyboard.press('Tab'); await p.waitForTimeout(150);
  const ring = await p.evaluate(() => { const a = document.activeElement, cs = a && a !== document.body ? getComputedStyle(a) : null; return cs ? cs.outlineStyle + ' ' + cs.outlineColor : 'nothing in focus'; });
  ok(T.prog === 'rgb(194, 65, 12)' && /rgb\(194, 65, 12\)/.test(ring), 'what shows progress or focus is orange: the "1 of 4" bar and the ring round what the keyboard is on: ' + JSON.stringify({ bar: T.prog, ring }));
  ok(T.emW === '400', 'the words picked out inside a heading keep the serif\'s one weight: ' + T.emW);
  ok(T.go.bg === 'rgb(194, 65, 12)' && T.go.color === 'rgb(255, 255, 255)' && T.go.ratio >= 4.5, 'the main button is the logo\'s orange with white words that read at ' + T.go.ratio + ':1');
  ok(!(await p.evaluate(oldLeft, OLD)).length && !(await p.evaluate(audit)).length, 'the first page: nothing in the light red, the aubergine, the cream or the older pastels, and every word reads: ' + (await p.evaluate(oldLeft, OLD)).concat(await p.evaluate(audit)).join(' | '));
  await p.screenshot({ path: O + '/p31-first-page.png' });
  // the page for people with a spare room and the moving-out sale page: their words were white on the band
  await p.goto(U + '#host/Bengaluru/HSR%20Layout'); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const host = await p.evaluate(() => ({ shown: !$('view-host').hidden, h1: getComputedStyle(document.querySelector('.h-copy h1')).color, em: getComputedStyle(document.querySelector('.h-copy h1 em')).color }));
  ok(host.shown && host.h1 === 'rgb(28, 25, 23)' && host.em === 'rgb(154, 52, 18)' && !(await p.evaluate(audit)).length, 'the page for people with a spare room: dark words on the band, the words that matter in the deeper orange, all of it readable: ' + JSON.stringify(host) + ' ' + (await p.evaluate(audit)).slice(0, 4).join(' | '));
  await p.screenshot({ path: O + '/p31-host.png' });
  await ctx.close();
  // ------------------------------------------------------------ the city step of sign-up, on a phone (touch)
  const fresh = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female' }, account:'9811111111', onboarded:{}, giftSeen:true, attrClaimed:true };
  ({ ctx, p } = await open(b, fresh, { ...devices['Pixel 7'] }));
  const h1 = () => p.evaluate(() => (document.querySelector('#obStage h1') || {}).textContent || '');
  await p.evaluate(() => { const g = document.querySelector('#obGo'); if(g) g.click(); }); await p.waitForTimeout(600);
  const discs = await p.evaluate(() => [...document.querySelectorAll('#obStage .opt .dot')].map(d => getComputedStyle(d).backgroundColor + ' ' + getComputedStyle(d).color));
  ok(discs.length >= 3 && new Set(discs).size === 1 && discs[0] === 'rgb(255, 241, 232) rgb(154, 52, 18)', 'sign-up: the letter in front of each answer sits on one quiet orange disc (they were eight different colours): ' + [...new Set(discs)].join(' | '));
  for(let i = 0; i < 12 && !/Which city are you moving to/.test(await h1()); i++){
    await p.evaluate(() => { const t = document.querySelector('#obWhat'), o = document.querySelector('#obStage .opt[data-i]'), g = document.querySelector('#obGo');
      if(t){ t.value = 'Designer'; t.form.requestSubmit(); } else if(o) o.click(); else if(g) g.click(); }); await p.waitForTimeout(550); }
  const back = await p.evaluate(() => { const bk = $('obBack'), cs = getComputedStyle(bk); return { shown: cs.visibility !== 'hidden', bg: cs.backgroundColor, color: cs.color }; });
  ok(back.shown && back.bg === 'rgb(255, 255, 255)' && back.color === 'rgb(28, 25, 23)', 'sign-up: the back button is a white disc with a dark arrow (it was a white arrow on a faint disc): ' + JSON.stringify(back));
  const big = await p.evaluate(() => [...document.querySelectorAll('#obStage .opt')].map(o => o.querySelector('b').textContent));
  ok(/Which city are you moving to/.test(await h1()) && big.includes('Pune') && big[big.length - 1] === 'Other city', 'sign-up: the city question still offers the big cities and "Other city": ' + big.join(', '));
  await p.evaluate(() => [...document.querySelectorAll('#obStage .opt')].find(o => /Other city/.test(o.textContent)).click()); await p.waitForTimeout(500);
  const c0 = await p.evaluate(() => { const i = $('obCity'), go = document.querySelector('#obCityForm .btn-primary'), bk = $('obCityBack');
    return { h1: document.querySelector('#obStage h1').textContent, why: document.querySelector('#obStage .why').textContent, list: i.getAttribute('list'), datalists: document.querySelectorAll('#obStage datalist').length,
      chips: [...document.querySelectorAll('#obCityPick .chip')].map(c => c.textContent), focused: document.activeElement === i, goEnd: Math.round(go.getBoundingClientRect().bottom), backEnd: Math.round(bk.getBoundingClientRect().bottom), vh: innerHeight }; });
  ok(c0.h1 === 'Which city?' && /Pick one or type your city/.test(c0.why) && c0.list === null && c0.datalists === 0, 'the city box has no pop-up list of its own any more (same question, same words): ' + JSON.stringify({ list: c0.list, datalists: c0.datalists }));
  ok(c0.chips.length === 18 && c0.chips[0] === 'Agra' && !c0.focused && c0.goEnd < c0.vh && c0.backEnd < c0.vh, 'on a phone it opens with 18 cities to tap and both buttons on screen, the keyboard not yet open: ' + JSON.stringify({ chips: c0.chips.length, focused: c0.focused, goEnd: c0.goEnd, vh: c0.vh }));
  await p.screenshot({ path: O + '/p31-city.png' });
  const typed = async v => { await p.fill('#obCity', v); await p.waitForTimeout(150); return p.evaluate(() => ({ chips: [...document.querySelectorAll('#obCityPick .chip')].map(c => c.textContent), shown: getComputedStyle($('obCityPick')).display !== 'none',
    go: Math.round(document.querySelector('#obCityForm .btn-primary').getBoundingClientRect().top), pick: Math.round($('obCityPick').getBoundingClientRect().bottom) })); };
  const ag = await typed('Ag'), pur = await typed('pur'), mum = await typed('mum'), none = await typed('Zzz');
  ok(ag.chips.join() === 'Agra' && ag.go >= ag.pick, 'typing "Ag" leaves Agra (names that start with it), and the chips never cover Continue: ' + ag.chips.join(', '));
  ok(pur.chips.length >= 5 && pur.chips.every(c => /pur/i.test(c)) && pur.chips.includes('Nagpur') && pur.chips.includes('Jaipur'), 'three letters also find names that contain them, the big cities included: ' + pur.chips.join(', '));
  ok(mum.chips.join() === 'Mumbai' && !none.chips.length && !none.shown, 'any case works; a name we don\'t list shows no chips: ' + JSON.stringify({ mum: mum.chips, none: none.chips.length }));
  await p.fill('#obCity', 'Na'); await p.waitForTimeout(150); await p.screenshot({ path: O + '/p31-city-typed.png' });
  await p.tap('#obCityPick .chip'); await p.waitForTimeout(600);
  const picked = await p.evaluate(() => ({ city: ob.a.city, h1: (document.querySelector('#obStage h1') || {}).textContent }));
  ok(picked.city === 'Nagpur' && !/city/i.test(picked.h1), 'tapping a chip picks that city and moves on: ' + JSON.stringify(picked));
  await p.evaluate(() => $('obBack').click()); await p.waitForTimeout(400);
  await p.evaluate(() => { const o = [...document.querySelectorAll('#obStage .opt')].find(x => /Other city/.test(x.textContent)); if(o) o.click(); }); await p.waitForTimeout(400);
  await p.fill('#obCity', 'tezpur'); await p.evaluate(() => $('obCityForm').requestSubmit()); await p.waitForTimeout(600);
  const own = await p.evaluate(() => ({ city: ob.a.city, h1: (document.querySelector('#obStage h1') || {}).textContent }));
  ok(own.city === 'Tezpur' && !/city/i.test(own.h1), 'a city we don\'t list can still be typed and continued with: ' + JSON.stringify(own));
  await ctx.close();
  // on a computer the box is ready to type in
  ({ ctx, p } = await open(b, fresh, { viewport:{ width:1280, height:800 } }));
  for(let i = 0; i < 12 && !/Which city are you moving to/.test(await p.evaluate(() => (document.querySelector('#obStage h1') || {}).textContent || '')); i++){
    await p.evaluate(() => { const t = document.querySelector('#obWhat'), o = document.querySelector('#obStage .opt[data-i]'), g = document.querySelector('#obGo');
      if(t){ t.value = 'Designer'; t.form.requestSubmit(); } else if(o) o.click(); else if(g) g.click(); }); await p.waitForTimeout(550); }
  await p.evaluate(() => [...document.querySelectorAll('#obStage .opt')].find(o => /Other city/.test(o.textContent)).click()); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.activeElement === $('obCity')), 'on a computer the city box is ready to type in');
  await ctx.close();
  // ------------------------------------------------------------ someone looking for a room
  ({ ctx, p } = await open(b, seeker, { viewport:{ width:390, height:844 } }, 'discover'));
  const bar = await p.evaluate(() => { const i = [...document.querySelectorAll('.bar .logo img, .app-head .logo img')].find(x => x.offsetParent && /logo-icon|icon-192/.test(x.getAttribute('src')));
    if(!i) return null; i.setAttribute('data-p31-logo', ''); const r = i.getBoundingClientRect(); return { src: i.getAttribute('src'), w: Math.round(r.width), h: Math.round(r.height), glow: getComputedStyle(i).boxShadow }; });
  const barSeen = bar ? await pixelOf(p, (await p.locator('[data-p31-logo]').screenshot()).toString('base64'), .5, .88) : 'none';
  ok(bar && bar.src === 'icons/logo-icon.svg' && bar.w === 42 && bar.h === 42 && barSeen === '194,65,12' && /^rgba\(194, 65, 12, 0\.22\)/.test(bar.glow),
    'signed in: the top bar shows the same orange logo tile, at its size (42px), with its own glow: ' + JSON.stringify({ bar, barSeen }));
  const left = [], low = [];
  for(const v of ['discover', 'saved', 'requests', 'tribe', 'parties', 'splits', 'market', 'account', 'messages']){ await go(p, v);
    left.push(...(await p.evaluate(oldLeft, OLD)).map(x => v + ': ' + x)); low.push(...(await p.evaluate(audit)).map(x => v + ': ' + x)); }
  ok(!left.length, 'someone looking: no screen still shows the light red, the aubergine, the cream or the older pastels: ' + left.slice(0, 5).join(' | '));
  ok(!low.length, 'someone looking: every word reads on every screen: ' + low.slice(0, 5).join(' | '));
  await go(p, 'account');
  const acc = await p.evaluate(() => { const v = document.querySelector('.vt-line'), cs = getComputedStyle(v), out = document.querySelector('.acc-out b'), del = document.querySelector('.acc-del b');
    return { card: cs.backgroundColor, grad: /gradient/.test(cs.backgroundImage), words: getComputedStyle(v.querySelector('b')).color, fam: getComputedStyle(v.querySelector('b')).fontFamily.slice(0, 18),
      out: getComputedStyle(out).color, del: getComputedStyle(del).color, labelOneLine: v.querySelector('small').getClientRects().length === 1 }; });
  ok(acc.card === 'rgb(28, 25, 23)' && acc.grad && acc.words === 'rgb(255, 255, 255)' && /DM Serif/.test(acc.fam) && acc.labelOneLine && acc.out === 'rgb(190, 18, 60)' && acc.del === 'rgb(87, 83, 78)',
    'Profile: "Your flatmate type" is the one dark card, white serif words on it; Sign out is in the danger crimson and Delete my account is quiet grey, neither in the app\'s orange: ' + JSON.stringify(acc));
  // what the audit of 16 Nov found and fixed, so it stays fixed
  const aud = await p.evaluate(() => { const q = s => document.querySelector(s), sw = q('#view-account .switch input:checked');
    const cap = ['.acc-h', '.vt-line small', '.vt-line em'].map(q).filter(Boolean).map(e => { const c = getComputedStyle(e); return [c.fontSize, c.fontWeight, c.letterSpacing, c.textTransform].join(' '); });
    const f = document.createElement('div'); f.className = 'field'; f.innerHTML = '<input type="time"><input type="text"><div class="hb-msg usr"><div>hello</div></div>'; q('#view-account').append(f);
    const tc = getComputedStyle(f.children[0]), xc = getComputedStyle(f.children[1]), time = ['borderTopWidth', 'borderTopLeftRadius', 'fontSize', 'backgroundColor', 'boxShadow', 'paddingLeft'].filter(k => tc[k] !== xc[k]);
    const bub = getComputedStyle(f.querySelector('.hb-msg div')), mine = bub.backgroundColor + ' ' + bub.color; f.remove();
    const sh = q('#filterForm .section-h'), shc = sh && getComputedStyle(sh);
    return { sw: sw ? getComputedStyle(sw).backgroundColor : null, cap, time, mine, label: shc ? shc.paddingLeft + ' ' + shc.textIndent : null }; });
  ok(aud.sw === 'rgb(194, 65, 12)', 'a switch that is on is orange: ' + aud.sw);
  ok(aud.cap.length === 3 && new Set(aud.cap).size === 1 && aud.cap[0] === '12.5px 700 1px uppercase', 'the quiet captions in small capitals (and the card\'s Share) share one size, weight and spacing: ' + JSON.stringify(aud.cap));
  ok(!aud.time.length, 'a time box looks like every other box (it had the browser\'s own grey edge and small type): ' + aud.time.join());
  ok(aud.mine === 'rgb(255, 241, 232) rgb(28, 25, 23)', 'what you wrote in the help chat is the same pale orange bubble with dark words as in a real chat: ' + aud.mine);
  ok(aud.label === '28px -28px', 'a section label that runs to a second line starts it under its words: ' + aud.label);
  await go(p, 'saved');
  const empty = await p.evaluate(() => (e => e && getComputedStyle(e).fontSize)(document.querySelector('#view-saved .empty h3')));
  ok(empty === '21px', 'the title of an empty screen is on the type scale (it took the browser\'s 18.72px): ' + empty);
  await go(p, 'market');
  const sell = await p.evaluate(() => (e => e && getComputedStyle(e).backgroundColor + ' ' + getComputedStyle(e).color)(document.querySelector('.mk-hero .btn:not(.btn-ghost)')));
  ok(sell === 'rgb(194, 65, 12) rgb(255, 255, 255)', 'FlatMart: "Sell something" is the same orange as every other main button (it was the last dark one): ' + sell);
  await go(p, 'discover');
  const hello = await p.evaluate(() => (e => { if(!e) return 'no greeting'; const c = getComputedStyle(e); return [c.fontSize, c.fontWeight, c.letterSpacing, c.textTransform].join(' '); })(document.querySelector('#view-discover .eyebrow')));
  ok(hello === '14px 700 normal none', 'the line over a headline ("Good morning, Neha") is in ordinary letters, not spaced like a capital label: ' + hello);
  const dot = await p.evaluate(() => (e => e ? getComputedStyle(e).backgroundColor : 'no banner')(document.querySelector('.inv-banner .urgent-dot')));
  ok(dot === 'rgb(194, 65, 12)', 'the "live" dot on a banner that invites you somewhere can be seen: orange on the pale panel (it was a pale tint on a pale tint): ' + dot);
  const d = await p.evaluate(async () => { const lab = document.querySelector('#dlgListing .section-h') || null; await openListing(document.querySelector('#cards .card').dataset.id); await new Promise(r => setTimeout(r, 700));
    const l = document.querySelector('#dlgListing .section-h'), cs = getComputedStyle(l), dash = getComputedStyle(l, '::before'), np = document.querySelector('#dlgListing .hero-pic .nophoto'), t = document.querySelector('#dlgListing .hp-title b');
    const ring = document.querySelector('#dlgListing .ring circle'), go = document.querySelector('#dlgListing .l-bar .btn-primary, #dlgListing .btn-primary');
    return { label: cs.color, caps: cs.textTransform, size: cs.fontSize, dash: dash.backgroundColor, dashW: dash.width, hero: np ? getComputedStyle(np).backgroundColor : null, heroGrad: np ? /gradient/.test(getComputedStyle(np).backgroundImage) : null,
      title: t ? getComputedStyle(t).fontFamily.slice(0, 18) : null, ring: ring && getComputedStyle(ring).fill, go: go && getComputedStyle(go).backgroundColor }; });
  ok(d.label === 'rgb(194, 65, 12)' && d.caps === 'uppercase' && d.size === '12.5px' && d.dash === 'rgb(194, 65, 12)' && d.dashW === '18px', 'a home\'s page: the small labels are orange capitals with a short orange line in front: ' + JSON.stringify({ label: d.label, size: d.size, dash: d.dash }));
  ok(d.hero === 'rgb(28, 25, 23)' && d.heroGrad && /DM Serif/.test(d.title || '') && d.ring === 'rgb(28, 25, 23)' && d.go === 'rgb(194, 65, 12)', 'a home with no photo: the dark card as its header, the name in the serif, the score on a dark disc, Send request in the orange: ' + JSON.stringify(d));
  ok(!(await p.evaluate(audit)).length, 'a home\'s page: every word reads: ' + (await p.evaluate(audit)).slice(0, 4).join(' | '));
  await p.screenshot({ path: O + '/p31-home.png' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(x => x.close()));
  // the pictures people share: a card in the logo's orange with white panels, nothing aubergine, light red, navy or teal
  const pics = await p.evaluate(async () => { const hex = d => '#' + [...d].slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    const l = api.all().find(x => x.city === 'Bengaluru'), c1 = await drawListingCard(l, { pct: 87 }), x1 = c1.getContext('2d');
    const t = vibeType(state.vibe), c2 = await drawVibeCard(t, 'Neha', '', null), x2 = c2.getContext('2d');
    return { top: hex(x1.getImageData(4, 4, 1, 1).data), bottom: hex(x1.getImageData(c1.width - 4, c1.height - 4, 1, 1).data), card: CARD.top, vibeBg: hex(x2.getImageData(6, 900, 1, 1).data), want: VC_PALETTE.bg[t.rhythm] || VC_PALETTE.bg[''],
      pal: JSON.stringify([CARD, VC_PALETTE]), fonts: document.fonts.check('400 54px "DM Serif Display"') && document.fonts.check('800 60px "Urbanist"') }; });
  const near = (a, b) => [1, 3, 5].every(i => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 3);   // a corner of a gradient is a shade off its first colour
  ok(near(pics.top, pics.card) && near(pics.top, '#C2410C') && pics.top !== pics.bottom && pics.vibeBg === pics.want.toUpperCase() && pics.fonts && !/#1F1B2E|#4B303B|#EE6468|#CE3A44|#1B2440|#253360|#10264F|#0B7C82|#1C7F72|#C3C9F6|#EBD981|#C3E0D6/i.test(pics.pal),
    'the pictures people share (a home, the Vibe Card) are drawn in the new colours and lettering: ' + JSON.stringify({ top: pics.top, bottom: pics.bottom, vibeBg: pics.vibeBg }));
  // the compatibility chart's four areas: each name is written in its own colour, so each must read on white
  const cg = await p.evaluate(() => { const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    return COMPAT_GROUPS.map(g => [g.name, g.color, Math.round(1.05 / (lum(g.color) + .05) * 100) / 100]).concat(AV_COLORS.map(c => ['dot', c, Math.round(1.05 / (lum(c) + .05) * 100) / 100])); });
  ok(cg.every(x => x[2] >= 4.5) && new Set(cg.slice(0, 4).map(x => x[1])).size === 4, 'the compatibility chart\'s four colours and the people dots read at 4.5:1 with white: ' + cg.filter(x => x[2] < 4.5).map(x => x.join(' ')).join(' | '));
  await ctx.close();
  // ------------------------------------------------------------ someone with a room
  ({ ctx, p } = await open(b, owner, { viewport:{ width:390, height:844 } }, 'mine'));
  const left2 = [], low2 = [];
  for(const v of ['mine', 'requests', 'escape', 'post', 'account']){ await go(p, v);
    left2.push(...(await p.evaluate(oldLeft, OLD)).map(x => v + ': ' + x)); low2.push(...(await p.evaluate(audit)).map(x => v + ': ' + x)); }
  ok(!left2.length && !low2.length, 'someone with a room: no old colours left, every word reads: ' + left2.concat(low2).slice(0, 5).join(' | '));
  await ctx.close();
  // ------------------------------------------------------------ Passes on a computer
  ({ ctx, p } = await open(b, seeker, { viewport:{ width:1280, height:800 } }, 'discover'));
  const pass = await p.evaluate(async () => { await openPay(null); await new Promise(r => setTimeout(r, 800)); const d = $('dlgPay'), cards = [...d.querySelectorAll('.plan')];
    const over = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    return { n: cards.length, rows: new Set(cards.map(c => Math.round(c.getBoundingClientRect().top))).size, names: cards.map(c => c.querySelector('.plan-top h3').getClientRects().length),
      terms: cards.map(c => c.querySelector('.plan-top small').getClientRects().length), buttons: cards.map(c => Math.round(c.querySelector('.btn').getBoundingClientRect().height)),
      tagOnName: cards.filter(c => { const t = c.querySelector('.plan-tag'); return t && over(t.getBoundingClientRect(), c.querySelector('.plan-top h3').getBoundingClientRect()); }).length }; });
  ok(pass.n === 3 && pass.rows === 1 && pass.names.every(x => x === 1) && pass.terms.every(x => x === 1) && pass.buttons.every(h => h <= 56) && pass.tagOnName === 0,
    'Passes on a computer: the three passes stand side by side, each name, term and button on one line, no tag over a name (they stood in a box too narrow for them): ' + JSON.stringify(pass));
  await p.screenshot({ path: O + '/p31-passes-wide.png' });
  await ctx.close();
  // ------------------------------------------------------------ the pages beside the app
  ({ ctx, p } = await open(b, null, { viewport:{ width:390, height:844 } }));
  await p.goto(U + 'privacy.html'); await p.waitForTimeout(900); await p.evaluate(() => document.fonts.ready);
  const pv = await p.evaluate(() => { const cs = e => getComputedStyle(document.querySelector(e)); return { h1: cs('h1').fontFamily.slice(0, 18), body: cs('body').fontFamily.slice(0, 12), bg: cs('body').backgroundColor, link: cs('main a, .wrap a:not(.logo):not(.back)').color,
    logo: document.querySelector('.logo img').getAttribute('src'), src: document.documentElement.outerHTML }; });
  ok(/DM Serif/.test(pv.h1) && /Urbanist/.test(pv.body) && pv.bg === 'rgb(255, 255, 255)' && pv.link === 'rgb(194, 65, 12)' && !/#1C7F72|#156358|#DCEFE9|#EE6468|#CE3A44|#1F1B2E|Plus Jakarta/i.test(pv.src) && !(await p.evaluate(audit)).length,
    'the privacy policy page wears the same look, and reads: ' + JSON.stringify({ h1: pv.h1, body: pv.body, bg: pv.bg, link: pv.link }) + ' ' + (await p.evaluate(audit)).slice(0, 3).join(' | '));
  const pl = await p.evaluate(() => ({ srcs: [...document.querySelectorAll('.logo img')].map(i => i.getAttribute('src')).join(), glow: getComputedStyle(document.querySelector('.logo img')).boxShadow,
    word: getComputedStyle(document.querySelectorAll('.logo img')[1]).boxShadow, tab: document.querySelector('link[rel=icon]').getAttribute('href') }));
  const pvSeen = await pixelOf(p, (await p.locator('.logo img').first().screenshot()).toString('base64'), .5, .88);   // under the letters, where the tile is plain
  ok(pl.srcs === 'icons/icon-192.png,icons/wordmark.svg' && /^rgba\(194, 65, 12, 0\.22\)/.test(pl.glow) && pl.word === 'none' && pl.tab === 'icons/icon-192.png'
    && pvSeen === '194,65,12', 'the privacy policy page shows the same logo: the orange tile and the wordmark, and the tile as its tab icon: ' + JSON.stringify(Object.assign(pl, { seen: pvSeen })));
  await p.screenshot({ path: O + '/p31-privacy.png' });
  const hold = fs.readFileSync(path.join(APP, 'hold.html'), 'utf8');
  ok(/fill='%23C2410C'/.test(hold) && !/%23EE6468|#EE6468|#1F1B2E|#FDF8F1/i.test(hold) && /--orange:#C2410C/.test(hold) && /src="icons\/logo-icon\.svg"/.test(hold) && /src="icons\/wordmark\.svg"/.test(hold),
    'the Coming soon page (kept for a hold) has the same logo, the same orange tab icon and the app\'s colours');
  const man = await p.evaluate(async () => (await fetch('manifest.webmanifest')).json());
  ok(man.theme_color.toUpperCase() === '#FFFFFF' && man.background_color.toUpperCase() === '#FFFFFF', 'the installed app opens on the white page: ' + man.theme_color);
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
