// The look of 16 Nov 2026, and the city step of sign-up (Kamal, 16 Nov, "Fix this also": the phone's own pop-up list
// opened over the chips, the keyboard and Continue). Demo mode, port 8765. The look came in three steps that day:
// "copy style and colors of dwelo. Change the orange color to light red color" and "Do it for the entire app and
// website" (the style); "App and website logo to stay the same as earlier"; then "Also take the app color as the
// color of logo which was earlier and white. Plus check the font color accordingly", and "Audit once done. Spend some
// time on each page and audit the gaps of colors font everything". So: white, the logo's orange, the wordmark's
// near-black, and the checks at the end here hold what that audit found and fixed.
// The look of 17 Nov 2026, over it (Kamal, of the feature reels King made that day: "The colors are so amazing of the reels
// wht dont we use these for our app. Put your best efforts to pull these colors and font size and font colors and make
// the app and website awesome"): a cream page with white cards, one key word of a main headline in the logo's orange
// (underlined by hand on the first page and the story), bigger serif headlines on a phone, rent in the serif, one ink
// sheet on a home's page with light-orange ticks, and a deep warm brown inside a thin orange frame for a home's header
// with no photo and for the pictures people share. The checks below hold both: what 16 Nov fixed, in 17 Nov's colours.
// King's review of 18 Nov is held here too: the score rings keep the colours that say how strong a match is, the top
// bar is cream once you scroll (p26), and the first page's headline keeps to two lines at 390 wide.
// Tribe's two white cards are held here as well (Kamal, 19 Nov, two places circled on a screenshot of his phone: "This
// area should have white backgroud which matches the app color"): the people around you, and the four steps.
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
// butter and mint panels, the teal, the beige page and the navy; and the seven peach tints of 16 Nov's last step
// (panels, bands, the bottom bar's pill), which are all the one cream since 17 Nov
const OLD = ['rgb(238, 100, 104)', 'rgb(206, 58, 68)', 'rgb(185, 47, 58)', 'rgb(226, 83, 90)', 'rgb(31, 27, 46)', 'rgb(30, 26, 43)', 'rgb(253, 248, 241)', 'rgb(248, 240, 231)', 'rgb(251, 221, 218)', 'rgb(251, 227, 218)',
  'rgb(178, 58, 10)', 'rgb(195, 201, 246)', 'rgb(235, 217, 129)', 'rgb(195, 224, 214)', 'rgb(28, 127, 114)', 'rgb(239, 228, 220)', 'rgb(27, 36, 64)',
  'rgb(255, 241, 232)', 'rgb(255, 228, 211)', 'rgb(255, 235, 221)', 'rgb(255, 241, 220)', 'rgb(253, 238, 226)', 'rgb(255, 245, 238)', 'rgb(255, 243, 234)', 'rgb(255, 239, 228)', 'rgb(255, 241, 230)'];
// a panel that has melted into what it sits on: it has a shape (padding, round corners) but its colour is, to the eye,
// the colour behind it, and it has no outline or shadow. The rule since 17 Nov: on cream a panel is white; inside a
// white card a panel is cream or the quiet off-white. See-through layers are blended down before comparing.
const melted = () => { const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const raw = e => { const c = rgb(getComputedStyle(e).backgroundColor); return c.length >= 3 && (c[3] === undefined || c[3] > .02) ? c : null; };
  const behind = e => { const layers = []; for(let x = e.parentElement; x; x = x.parentElement){ const c = raw(x); if(c){ layers.push(c); if(c[3] === undefined || c[3] >= .999) break; } }
    let base = [255, 244, 232]; if(layers.length && (layers[layers.length - 1][3] === undefined || layers[layers.length - 1][3] >= .999)) base = layers.pop().slice(0, 3);
    for(let i = layers.length - 1; i >= 0; i--){ const a = layers[i][3]; base = base.map((v, k) => Math.round(layers[i][k] * a + v * (1 - a))); } return base; };
  const own = e => { const c = raw(e); if(!c) return null; const a = c[3] === undefined ? 1 : c[3]; if(a >= .999) return c.slice(0, 3); const b = behind(e); return b.map((v, k) => Math.round(c[k] * a + v * (1 - a))); };
  const root = document.querySelector('dialog[open]') || document.querySelector('#appMain > section:not([hidden])') || document.body, out = new Set();
  root.querySelectorAll('*').forEach(e => { if(!e.offsetParent || e.closest('svg, .leaflet-container, .fm-av, [aria-hidden="true"]') || /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName) || e.classList.contains('empty')) return;
    const cs = getComputedStyle(e), r = e.getBoundingClientRect(), c = own(e); if(!c || r.width <= 60 || r.height <= 28 || parseFloat(cs.borderTopLeftRadius) < 8 || cs.boxShadow !== 'none' || (cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0)) return;
    const la = lum(c), lb = lum(behind(e)); if((Math.max(la, lb) + .05) / (Math.min(la, lb) + .05) < 1.035) out.add(e.tagName.toLowerCase() + '.' + String(e.className).trim().split(/\s+/).slice(0, 2).join('.')); });
  return [...out]; };
// the key word of the headline on the band of the screen that is showing, with its colour ("" when the headline has none)
const keyWord = () => [...document.querySelectorAll('#appMain > section:not([hidden]) .home-band h1 .kw')].filter(e => e.offsetParent).map(e => e.textContent + ' ' + getComputedStyle(e).color).join(' + ');
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
    return { tints: ['--cream', '--band', '--lav', '--butter', '--mint', '--blush', '--orange-soft', '--accent-soft', '--brand-soft', '--hi', '--orange-tint', '--wash', '--teal-95', '--purple-97'].map(tok), lt: tok('--orange-lt'), brown: tok('--brown'), chip: tok('--ink-chip'),
      orange: tok('--orange'), page: tok('--bg'), card: tok('--surface'), ink: tok('--ink'), text: tok('--text'), text2: tok('--text-2'), orangeText: tok('--orange-text'), deep: tok('--orange-deep'), danger: tok('--danger'), fam: cs.fontFamily, weight: cs.fontWeight, spacing: cs.letterSpacing,
      serif: document.fonts.check('400 20px "DM Serif Display"'), usedSerif: [...document.fonts].some(f => /DM Serif/.test(f.family) && f.status === 'loaded'),
      h2: getComputedStyle(document.querySelector('.w-card h2')).fontFamily, body: getComputedStyle(document.querySelector('.w-copy .lede, .w-trust')).fontFamily,
      go: { bg: g.backgroundColor, color: g.color, ratio: Math.round((Math.max(lum(g.color), lum(g.backgroundColor)) + .05) / (Math.min(lum(g.color), lum(g.backgroundColor)) + .05) * 100) / 100 },
      logo: cols(logo, /#[0-9A-F]{6}/gi), mark: cols(mark, /#[0-9A-F]{6}/gi), px,
      theme: document.querySelector('meta[name=theme-color]').content, fav: cols(document.querySelector('link[rel=icon]').href, /%23[0-9A-F]{6}/gi),
      top: [...document.querySelectorAll('.w-top .logo img')].filter(i => i.offsetParent).map(i => i.getAttribute('src')).join(), glow: getComputedStyle(document.querySelector('.w-top .logo img.fm-mark')).boxShadow,
      bodyBg: getComputedStyle(document.body).backgroundColor, prog: (e => e && getComputedStyle(e).backgroundColor)(document.querySelector('.lg-prog i')),
      emW: getComputedStyle(document.querySelector('.w-copy h1 em') || h1).fontWeight }; });
  ok(T.orange === '#C2410C' && T.page === '#FFF4E8' && T.card === '#FFFFFF' && T.ink === '#1C1917' && T.text === '#1C1917' && T.text2 === '#57534E' && T.bodyBg === 'rgb(255, 244, 232)',
    'the palette: a cream page (white until 17 Nov) and white cards, the orange, near-black text and grey for secondary text: ' + JSON.stringify({ orange: T.orange, page: T.page, card: T.card, ink: T.ink, text2: T.text2 }));
  ok(T.tints.length === 14 && T.tints.every(v => v === '#FFF4E8') && T.lt === '#FDBA74' && T.brown === '#5C2408' && T.chip === '#2B2928',
    'one cream: the old tint tokens (bands, pale panels, the bottom bar\'s pill) are all #FFF4E8 now; light orange #FDBA74 is for ticks and rings on ink, and the brown #5C2408 for pictures: ' + JSON.stringify([...new Set(T.tints)]));
  ok(T.logo.split(',').includes(T.orange) && T.mark.split(',').includes(T.text) && T.mark.split(',').includes(T.text2) && T.orangeText === T.orange,
    'those are the logo\'s own colours: the tile\'s orange is the app\'s orange, and the wordmark\'s near-black and grey are the text colours');
  ok(T.danger === '#BE123C' && T.danger !== T.orange && T.deep === '#9A3412', 'danger is a crimson, a clear step from the orange; small orange text on tints has a deeper shade: ' + JSON.stringify({ danger: T.danger, deep: T.deep }));
  // the logo: Kamal's own, as before the look of 16 Nov
  ok(T.logo === '#C2410C,#FFFFFF' && T.mark === '#1C1917,#57534E,#C2410C' && T.px === '194,65,12' && T.fav === '%23C2410C,%23FFFFFF',
    'the logo keeps its own colours: an orange tile with white "fm", the wordmark in near-black, orange and grey, the app icon and the tab icon in the same orange: ' + JSON.stringify({ logo: T.logo, mark: T.mark, px: T.px, fav: T.fav }));
  ok(T.theme.toUpperCase() === '#FFF4E8', 'the browser bar is the page\'s cream: ' + T.theme);
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
  const K = await p.evaluate(() => { const h1 = document.querySelector('.w-copy h1'), k = h1.querySelector('.kw.ul'), svg = k && k.querySelector('svg.kw-ul'), path = svg && svg.querySelector('path'), kr = k && k.getBoundingClientRect(), sr = svg && svg.getBoundingClientRect();
    return { words: h1.textContent.replace(/\s+/g, ' ').trim(), kw: k && k.textContent, n: h1.querySelectorAll('.kw').length, colour: k && getComputedStyle(k).color, line: path && getComputedStyle(path).stroke, draws: path && getComputedStyle(path).animationName,
      under: !!sr && sr.top > kr.top + kr.height * .6 && sr.width >= kr.width, hidden: svg && svg.getAttribute('aria-hidden'), size: parseFloat(getComputedStyle(h1).fontSize), lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) }; });
  ok(K.words === 'Find flatmates who match your vibe.' && K.kw === 'vibe' && K.n === 1 && K.colour === 'rgb(194, 65, 12)' && K.line === 'rgb(194, 65, 12)' && K.under && K.hidden === 'true' && K.draws === 'kwdraw',
    'the first page\'s headline says what it said, with one key word ("vibe") in the logo\'s orange and a line under it that draws itself once (a picture to a screen reader, not a word): ' + JSON.stringify(K));
  ok(K.size >= 38 && K.size <= 48 && K.lines === 2, 'on a phone that headline is the serif at ' + K.size + 'px (between 38 and 48: a step under the story\'s), on two lines at 390 wide: ' + K.lines);
  const first = await p.evaluate(() => { const r = e => e.getBoundingClientRect(), go = r(document.querySelector('.w-card .btn-primary')), have = r([...document.querySelectorAll('.w-card button, .w-card a')].find(e => /already have an account/i.test(e.textContent))), fab = r($('helpFab'));
    return { card: Math.round(r(document.querySelector('.w-card')).top), goEnd: Math.round(go.bottom), haveEnd: Math.round(have.bottom), vh: innerHeight, helpOnGo: fab.left < go.right && fab.right > go.left && fab.top < go.bottom && fab.bottom > go.top }; });
  ok(first.card <= 276 && first.goEnd <= 749 && first.haveEnd <= 799 && first.haveEnd < first.vh && !first.helpOnGo,
    'so on a 390 x 844 phone the sign-up card, Continue and "I already have an account" sit no lower than they did on 16 Nov (276, 749, 799), and the help button is clear of Continue: ' + JSON.stringify(first));
  ok(!(await p.evaluate(oldLeft, OLD)).length && !(await p.evaluate(audit)).length, 'the first page: nothing in the light red, the aubergine, the cream or the older pastels, and every word reads: ' + (await p.evaluate(oldLeft, OLD)).concat(await p.evaluate(audit)).join(' | '));
  await p.screenshot({ path: O + '/p31-first-page.png' });
  // the page for people with a spare room and the moving-out sale page: their words were white on the band
  await p.goto(U + '#host/Bengaluru/HSR%20Layout'); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const host = await p.evaluate(() => ({ shown: !$('view-host').hidden, h1: getComputedStyle(document.querySelector('.h-copy h1')).color, em: getComputedStyle(document.querySelector('.h-copy h1 em')).color }));
  ok(host.shown && host.h1 === 'rgb(28, 25, 23)' && host.em === 'rgb(154, 52, 18)' && !(await p.evaluate(audit)).length, 'the page for people with a spare room: dark words on the band, the words that matter in the deeper orange, all of it readable: ' + JSON.stringify(host) + ' ' + (await p.evaluate(audit)).slice(0, 4).join(' | '));
  await p.screenshot({ path: O + '/p31-host.png' });
  // the story a first visit opens with: four screens, one key word each, the line under it; your line in its little chat is an ink bubble
  await p.goto(U + '?story'); await p.waitForTimeout(1300);
  const st = [];
  for(let i = 0; i < 4; i++){ st.push(await p.evaluate(() => { const h = document.querySelector('#stStage .st-slide h2'), k = h && h.querySelector('.kw.ul');
      return h ? { h: h.textContent.replace(/\s+/g, ' ').trim(), kw: k && k.textContent, n: h.querySelectorAll('.kw').length, colour: k && getComputedStyle(k).color, line: !!(k && k.querySelector('svg.kw-ul path')),
        size: parseFloat(getComputedStyle(h).fontSize), lines: Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)) } : {}; }));
    if(i < 3){ await p.click('#stNext'); await p.waitForTimeout(550); } }
  ok(st.map(x => x.kw).join() === 'easy,live,like you,yes' && st.every(x => x.n === 1 && x.colour === 'rgb(194, 65, 12)' && x.line && x.size >= 40 && x.size <= 48 && x.lines <= 3),
    'the story: each of its four headlines has one key word in the orange with the hand-drawn line (easy, live, like you, yes), 40 to 48px, on at most three lines: ' + JSON.stringify(st.map(x => [x.h, x.lines])));
  const mine = await p.evaluate(() => (e => e ? { bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color, w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null)(document.querySelector('.st-chat p.me')));
  ok(mine && mine.bg === 'rgb(28, 25, 23)' && mine.color === 'rgb(255, 255, 255)' && mine.w > 120 && mine.h < 60, 'the story\'s last screen: your line in the little chat is an ink bubble as wide as its words, on one line (it was 38px wide and broke one word to a line): ' + JSON.stringify(mine));
  await p.screenshot({ path: O + '/p31-story-4.png' });
  await ctx.close();
  // someone who asked their phone for less motion: the line is simply there, it does not draw
  ({ ctx, p } = await open(b, null, { viewport:{ width:390, height:844 }, reducedMotion:'reduce' }));
  const calm = await p.evaluate(() => { const path = document.querySelector('.w-copy h1 .kw-ul path'), cs = getComputedStyle(path); return { anim: cs.animationName, offset: cs.strokeDashoffset, shown: path.getBoundingClientRect().width > 40 }; });
  ok(calm.anim === 'none' && parseFloat(calm.offset) === 0 && calm.shown, 'less motion asked for: the line under the key word is there, whole, and does not draw: ' + JSON.stringify(calm));
  await ctx.close();
  // ------------------------------------------------------------ the city step of sign-up, on a phone (touch)
  const fresh = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female' }, account:'9811111111', onboarded:{}, giftSeen:true, attrClaimed:true };
  ({ ctx, p } = await open(b, fresh, { ...devices['Pixel 7'] }));
  const h1 = () => p.evaluate(() => (document.querySelector('#obStage h1') || {}).textContent || '');
  await p.evaluate(() => { const g = document.querySelector('#obGo'); if(g) g.click(); }); await p.waitForTimeout(600);
  const discs = await p.evaluate(() => [...document.querySelectorAll('#obStage .opt .dot')].map(d => getComputedStyle(d).backgroundColor + ' ' + getComputedStyle(d).color));
  const obBg = await p.evaluate(() => { const o = document.querySelector('#obStage .opt'); return { page: getComputedStyle(document.body).backgroundColor, card: getComputedStyle(o).backgroundColor }; });
  ok(discs.length >= 3 && new Set(discs).size === 1 && discs[0] === 'rgb(255, 244, 232) rgb(154, 52, 18)' && obBg.card === 'rgb(255, 255, 255)',
    'sign-up: each answer is a white card, and the letter in front of it sits on one quiet cream disc in the deeper orange (they were eight different colours): ' + [...new Set(discs)].join(' | ') + ' ' + JSON.stringify(obBg));
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
  const left = [], low = [], gone = [], kws = {};
  for(const v of ['discover', 'saved', 'requests', 'tribe', 'parties', 'splits', 'market', 'account', 'messages']){ await go(p, v);
    left.push(...(await p.evaluate(oldLeft, OLD)).map(x => v + ': ' + x)); low.push(...(await p.evaluate(audit)).map(x => v + ': ' + x)); gone.push(...(await p.evaluate(melted)).map(x => v + ': ' + x)); kws[v] = await p.evaluate(keyWord); }
  ok(!left.length, 'someone looking: no screen still shows the light red, the aubergine, the older cream, the pastels or the peach tints of 16 Nov: ' + left.slice(0, 5).join(' | '));
  ok(!low.length, 'someone looking: every word reads on every screen: ' + low.slice(0, 5).join(' | '));
  ok(!gone.length, 'someone looking: no panel has melted into what it sits on (on cream a panel is white; in a white card, cream or off-white): ' + gone.slice(0, 5).join(' | '));
  const O1 = ' rgb(194, 65, 12)';
  ok(JSON.stringify(kws) === JSON.stringify({ discover: 'get along' + O1, saved: '', requests: '', tribe: 'people' + O1, parties: 'round the corner.' + O1, splits: 'Stay friends.' + O1, market: 'nearby.' + O1, account: '', messages: '' }),
    'one key word in the orange in the headline of Discover, Tribe, Parties, Flatsplits and FlatMart, and none on Saved, Requests, Profile and Messages: ' + JSON.stringify(kws));
  await go(p, 'market');
  const tiles = await p.evaluate(() => { const t = document.querySelector('#mkStats div'); return t ? getComputedStyle(t).backgroundColor + ' / ' + getComputedStyle(t).boxShadow : 'no tiles'; });
  ok(/^rgb\(255, 255, 255\) \/ rgb\(238, 232, 226\) 0px 0px 0px 1px/.test(tiles), 'FlatMart: the three number tiles on the band are white with a hairline (they were a see-through white and melted into the cream): ' + tiles);
  // Tribe (Kamal, 19 Nov, two places circled on a screenshot: "This area should have white backgroud which matches the app
  // color"): the people around you, and the four steps, each on a white card
  await go(p, 'tribe');
  const tw = await p.evaluate(() => { const card = e => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { bg: c.backgroundColor, radius: c.borderRadius, hair: /^rgb\(238, 232, 226\) 0px 0px 0px 1px/.test(c.boxShadow), l: Math.round(r.left), r: Math.round(r.right) }; };
    const o = $('tribeOrbit'), j = $('tribeJourney'), or = o.getBoundingClientRect(), h1 = document.querySelector('.tribe-hero h1').getBoundingClientRect(), nodes = [...o.querySelectorAll('.node')];
    return { orbit: card(o), steps: card(j), band: getComputedStyle(document.querySelector('.tribe-hero')).backgroundColor, h1: [Math.round(h1.left), Math.round(h1.right)], nodes: nodes.length,
      inside: nodes.every(n => { const r = n.getBoundingClientRect(); return r.left >= or.left && r.right <= or.right && r.top >= or.top && r.bottom <= or.bottom; }),
      labels: [...new Set(nodes.map(n => getComputedStyle(n.querySelector(':scope > rect')).fill))].join(), me: getComputedStyle(o.querySelector('.me > circle')).fill,
      faces: [...new Set(nodes.map(n => { const r = n.querySelector('foreignObject svg').getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }))].join(),
      todo: getComputedStyle(j.querySelector('li:not(.now):not(.done) i')).backgroundColor, now: getComputedStyle(j.querySelector('li.now i')).backgroundColor }; });
  ok(tw.orbit.bg === 'rgb(255, 255, 255)' && tw.orbit.radius === '28px' && tw.orbit.hair && tw.band === 'rgb(255, 244, 232)' && tw.orbit.l === tw.h1[0] && tw.orbit.r === tw.h1[1] && tw.nodes >= 3 && tw.inside,
    'Tribe on a phone: the people around you sit on a white card (28px corners, the hairline) inside the cream band, in line with the headline, and every person and label is inside it: ' + JSON.stringify(tw.orbit) + ' ' + tw.nodes + ' people, inside ' + tw.inside);
  ok(tw.labels === 'rgb(255, 244, 232)' && tw.me === 'rgb(255, 244, 232)' && tw.faces === '42x42',
    'Tribe: inside that white card the match labels and the disc behind your letter are cream, and the cartoon people keep their own colours and size: ' + JSON.stringify({ labels: tw.labels, me: tw.me, faces: tw.faces }));
  ok(tw.steps.bg === 'rgb(255, 255, 255)' && tw.steps.radius === '28px' && tw.steps.hair && tw.steps.l === tw.h1[0] && tw.steps.r === tw.h1[1] && tw.todo === 'rgb(247, 243, 239)' && tw.now === 'rgb(194, 65, 12)',
    'Tribe: the four steps sit on a white card too; the step you are on is orange and the ones to come are the quiet off-white, which shows on white (on the cream it could hardly be seen): ' + JSON.stringify(tw.steps) + ' ' + tw.todo);
  await p.screenshot({ path: O + '/p31-tribe-cards.png' });
  const twEmpty = await p.evaluate(() => { const o = $('tribeOrbit'), j = $('tribeJourney'), keep = [o.innerHTML, j.innerHTML]; o.innerHTML = ''; j.innerHTML = '';
    const d = [getComputedStyle(o).display, getComputedStyle(j).display].join(); o.innerHTML = keep[0]; j.innerHTML = keep[1]; return d + ' / ' + getComputedStyle(o).display + ',' + getComputedStyle(j).display; });
  ok(twEmpty === 'none,none / block,grid', 'Tribe: until the list has come in the two cards are not there at all (an empty one would show as a white pill), and they show once filled: ' + twEmpty);
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
  ok(aud.mine === 'rgb(255, 244, 232) rgb(28, 25, 23)', 'what you wrote in the help chat is the same cream bubble with dark words as in a real chat: ' + aud.mine);
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
  const hc = await p.evaluate(() => { const c = document.querySelector('#cards .card'), cs = e => getComputedStyle(e), pp = c.querySelector('.price-pill'), sm = pp.querySelector('small');
    return { card: cs(c).backgroundColor, lifted: /rgba\(60, 30, 10/.test(cs(c).boxShadow), price: cs(pp).fontFamily.slice(0, 18) + ' ' + cs(pp).fontSize, per: cs(sm).fontFamily.slice(0, 8) + ' ' + cs(sm).fontSize + ' ' + cs(sm).color, rupee: pp.textContent.trim()[0],
      name: cs(c.querySelector('h3')).fontWeight, ring: (v => v && cs(v).stroke)(c.querySelector('.ring .val')), disc: (v => v && cs(v).fill)(c.querySelector('.ring circle')), btn: cs(document.querySelector('.btn')).fontWeight }; });
  ok(hc.card === 'rgb(255, 255, 255)' && hc.lifted && hc.price === '"DM Serif Display" 28px' && hc.per === 'Urbanist 12.5px rgb(87, 83, 78)' && hc.rupee === '₹' && hc.name === '800' && hc.btn === '800',
    'a home\'s card on Discover: white, lifted off the cream by a warm shadow; the rent in the serif at 28px with a small grey "/month"; the name and the buttons at 800: ' + JSON.stringify(hc));
  const rings = await p.evaluate(() => { const tok = n => { const d = document.createElement('i'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const want = n => n >= 80 ? tok('--ok') : n >= 60 ? tok('--mid') : tok('--text-3');
    const all = [...document.querySelectorAll('#cards .card .ring')].map(r => { const n = parseInt(r.getAttribute('aria-label'), 10), got = getComputedStyle(r.querySelector('.val')).stroke; return { n, got, right: got === want(n) }; });
    return { n: all.length, wrong: all.filter(x => !x.right).map(x => x.n + ' ' + x.got), kinds: [...new Set(all.map(x => x.got))], lt: tok('--orange-lt'), strong: all.filter(x => x.n >= 80).length, fair: all.filter(x => x.n >= 60 && x.n < 80).length }; });
  ok(rings.n >= 5 && !rings.wrong.length && rings.strong >= 1 && rings.fair >= 1 && rings.kinds.length >= 2 && !rings.kinds.includes(rings.lt) && hc.disc === 'rgb(28, 25, 23)',
    'the vibe score\'s ring keeps its meaning on its ink disc: green from 80, amber from 60, grey under (' + rings.strong + ' strong and ' + rings.fair + ' fair on Discover); never the look\'s light orange, which made a strong match and a fair one look the same: ' + JSON.stringify(rings.kinds) + ' ' + rings.wrong.join(' | '));
  // neither of our fonts has a rupee sign (a phone borrows it from a font of its own): beside the big serif figures it is set small, in the body face
  const rs = await p.evaluate(() => { const pp = document.querySelector('#cards .card .price-pill'), r = pp.querySelector('.rs'), cs = r && getComputedStyle(r);
    return { text: pp.textContent.replace(/\s+/g, ' ').trim(), sign: r && r.textContent, fam: cs && cs.fontFamily.slice(0, 8), weight: cs && cs.fontWeight, size: cs && parseFloat(cs.fontSize), of: parseFloat(getComputedStyle(pp).fontSize), firstInPill: r && pp.firstChild === r }; });
  ok(/^₹[\d,]+ \/month$/.test(rs.text) && rs.sign === '₹' && rs.firstInPill && rs.fam === 'Urbanist' && rs.weight === '700' && rs.size > rs.of * .5 && rs.size < rs.of * .7,
    'the rent reads as it did ("' + rs.text + '"); the rupee sign beside the serif figures is set small in the body face, so it looks meant whichever font a phone draws it with: ' + JSON.stringify({ size: rs.size, of: rs.of }));
  const d = await p.evaluate(async () => { const lab = document.querySelector('#dlgListing .section-h') || null; await openListing(document.querySelector('#cards .card').dataset.id); await new Promise(r => setTimeout(r, 700));
    const l = document.querySelector('#dlgListing .section-h'), cs = getComputedStyle(l), dash = getComputedStyle(l, '::before'), np = document.querySelector('#dlgListing .hero-pic .nophoto'), t = document.querySelector('#dlgListing .hp-title b');
    const ring = document.querySelector('#dlgListing .ring circle'), go = document.querySelector('#dlgListing .l-bar .btn-primary, #dlgListing .btn-primary');
    return { label: cs.color, caps: cs.textTransform, size: cs.fontSize, dash: dash.backgroundColor, dashW: dash.width, hero: np ? getComputedStyle(np).backgroundColor : null, heroGrad: np ? /gradient/.test(getComputedStyle(np).backgroundImage) : null,
      title: t ? getComputedStyle(t).fontFamily.slice(0, 18) : null, ring: ring && getComputedStyle(ring).fill, go: go && getComputedStyle(go).backgroundColor,
      frame: np ? (a => a.content !== 'none' ? a.borderTopWidth + ' ' + a.borderTopColor : 'none')(getComputedStyle(np, '::after')) : null, white: np ? getComputedStyle(np).color : null }; });
  ok(d.label === 'rgb(194, 65, 12)' && d.caps === 'uppercase' && d.size === '12.5px' && d.dash === 'rgb(194, 65, 12)' && d.dashW === '18px', 'a home\'s page: the small labels are orange capitals with a short orange line in front: ' + JSON.stringify({ label: d.label, size: d.size, dash: d.dash }));
  ok(d.hero === 'rgb(92, 36, 8)' && d.heroGrad && d.frame === '3px rgb(194, 65, 12)' && d.white === 'rgb(255, 255, 255)' && /DM Serif/.test(d.title || '') && d.ring === 'rgb(28, 25, 23)' && d.go === 'rgb(194, 65, 12)',
    'a home with no photo: the deep warm brown inside a thin orange frame as its header (the dark card until 17 Nov), white words, the name in the serif, the score on an ink disc, Send request in the orange: ' + JSON.stringify(d));
  const ink = await p.evaluate(() => { const cs = e => getComputedStyle(e), D = $('dlgListing'), sh = D.querySelector('.ink-sheet'); if(!sh) return { n: 0 }; const h = sh.querySelector('.ink-h'), pr = D.querySelector('.l-bar-price b');
    return { n: D.querySelectorAll('.ink-sheet').length, bg: cs(sh).backgroundColor, h: h.textContent, tag: h.tagName, hLook: cs(h).fontFamily.slice(0, 18) + ' ' + cs(h).fontSize + ' ' + cs(h).color, intro: cs(sh.querySelector('.gen-intro')).color,
      chips: [...new Set([...sh.querySelectorAll('.traits span')].map(x => cs(x).backgroundColor + ' ' + cs(x).color))].join(' | '), ticks: sh.querySelectorAll('.traits .tk').length, tick: (t => t && cs(t).color)(sh.querySelector('.tk')),
      same: [...sh.querySelectorAll('.traits span.tr-same')].length, compat: (c => c && cs(c).backgroundColor + ' ' + cs(c).color)(sh.querySelector('.compat-mini')), cell: (c => c && cs(c).backgroundColor)(sh.querySelector('.compat-mini .cx-area')),
      bar: pr && cs(pr).fontFamily.slice(0, 18) + ' ' + cs(pr).fontSize + ' ' + pr.textContent.trim()[0] + ' ' + !!pr.querySelector('.rs'), labelGone: ![...D.querySelectorAll('.section-h')].some(x => /who you'd live with/i.test(x.textContent)) }; });
  ok(ink.n === 1 && ink.bg === 'rgb(28, 25, 23)' && ink.h === 'Who you\'d live with' && ink.tag === 'H3' && ink.hLook === '"DM Serif Display" 24px rgb(255, 255, 255)' && ink.intro === 'rgb(214, 211, 209)' && ink.labelGone,
    'a home\'s page: "Who you\'d live with" and the household\'s answers sit on one ink sheet, the title in the white serif at 24px with a small grey line under it: ' + JSON.stringify({ n: ink.n, bg: ink.bg, h: ink.h, look: ink.hLook }));
  ok(ink.chips === 'rgb(43, 41, 40) rgb(255, 255, 255)' && ink.ticks >= 1 && ink.ticks === ink.same && ink.tick === 'rgb(253, 186, 116)' && ink.compat === 'rgb(255, 255, 255) rgb(28, 25, 23)' && ink.cell === 'rgb(255, 244, 232)',
    'on the ink sheet: dark chips with white words, a light-orange tick on each answer you share (' + ink.ticks + '), and the compatibility card white inside it with cream cells: ' + JSON.stringify({ chips: ink.chips, tick: ink.tick, compat: ink.compat, cell: ink.cell }));
  ok(ink.bar === '"DM Serif Display" 32px ₹ true', 'the bar at the foot of a home\'s page: the rent in the serif at 32px, with the same small rupee sign: ' + ink.bar);
  ok(!(await p.evaluate(melted)).length, 'a home\'s page: no panel has melted into what it sits on: ' + (await p.evaluate(melted)).slice(0, 4).join(' | '));
  ok(!(await p.evaluate(audit)).length, 'a home\'s page: every word reads: ' + (await p.evaluate(audit)).slice(0, 4).join(' | '));
  await p.screenshot({ path: O + '/p31-home.png' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(x => x.close()));
  // the pictures people share: the deep warm brown with soft glows inside a thin orange frame (a card in the logo's orange
  // until 17 Nov); the Vibe Card on the cream; nothing aubergine, light red, navy or teal
  const pics = await p.evaluate(async () => { const hex = d => '#' + [...d].slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    const l = api.all().find(x => x.city === 'Bengaluru'), c1 = await drawListingCard(l, { pct: 87 }), x1 = c1.getContext('2d');
    const t = vibeType(state.vibe), c2 = await drawVibeCard(t, 'Neha', '', null), x2 = c2.getContext('2d');
    return { top: hex(x1.getImageData(4, 4, 1, 1).data), bottom: hex(x1.getImageData(c1.width - 4, c1.height - 4, 1, 1).data), card: CARD.brown, frame: hex(x1.getImageData(20, Math.round(c1.height / 2), 1, 1).data), inside: hex(x1.getImageData(60, Math.round(c1.height / 2), 1, 1).data),
      vibeBg: hex(x2.getImageData(6, 900, 1, 1).data), want: VC_PALETTE.bg[t.rhythm] || VC_PALETTE.bg[''],
      pal: JSON.stringify([CARD, VC_PALETTE]), fonts: document.fonts.check('400 54px "DM Serif Display"') && document.fonts.check('800 60px "Urbanist"') }; });
  // a deep warm brown: red over green over blue, and dark enough for white words at 5:1 or better (the lightest glow is #B45309)
  const lumOf = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const brown = h => { const [r, g, bl] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return r > g && g > bl && 1.05 / (lumOf(h) + .05) >= 5; };
  ok(pics.card === '#5C2408' && brown(pics.top) && brown(pics.bottom) && brown(pics.inside) && pics.frame === '#C2410C' && pics.vibeBg === '#FFF4E8' && pics.vibeBg === pics.want.toUpperCase() && pics.fonts
    && !/#1F1B2E|#4B303B|#EE6468|#CE3A44|#1B2440|#253360|#10264F|#0B7C82|#1C7F72|#C3C9F6|#EBD981|#C3E0D6/i.test(pics.pal),
    'the pictures people share: a home\'s is the deep warm brown inside a thin orange frame, dark enough everywhere for its white words; the Vibe Card sits on the cream: ' + JSON.stringify({ top: pics.top, bottom: pics.bottom, inside: pics.inside, frame: pics.frame, vibeBg: pics.vibeBg }));
  // the compatibility chart's four areas: each name is written in its own colour, so each must read on white
  const cg = await p.evaluate(() => { const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    return COMPAT_GROUPS.map(g => [g.name, g.color, Math.round(1.05 / (lum(g.color) + .05) * 100) / 100]).concat(AV_COLORS.map(c => ['dot', c, Math.round(1.05 / (lum(c) + .05) * 100) / 100])); });
  ok(cg.every(x => x[2] >= 4.5) && new Set(cg.slice(0, 4).map(x => x[1])).size === 4, 'the compatibility chart\'s four colours and the people dots read at 4.5:1 with white: ' + cg.filter(x => x[2] < 4.5).map(x => x.join(' ')).join(' | '));
  await ctx.close();
  // ------------------------------------------------------------ someone with a room
  ({ ctx, p } = await open(b, owner, { viewport:{ width:390, height:844 } }, 'mine'));
  const left2 = [], low2 = [], gone2 = [], kws2 = {};
  for(const v of ['mine', 'requests', 'escape', 'post', 'account']){ await go(p, v);
    left2.push(...(await p.evaluate(oldLeft, OLD)).map(x => v + ': ' + x)); low2.push(...(await p.evaluate(audit)).map(x => v + ': ' + x)); gone2.push(...(await p.evaluate(melted)).map(x => v + ': ' + x)); kws2[v] = await p.evaluate(keyWord); }
  ok(!left2.length && !low2.length, 'someone with a room: no old colours left, every word reads: ' + left2.concat(low2).slice(0, 5).join(' | '));
  ok(!gone2.length, 'someone with a room: no panel has melted into what it sits on: ' + gone2.slice(0, 5).join(' | '));
  ok(JSON.stringify(kws2) === JSON.stringify({ mine: 'live' + O1, requests: 'meet you' + O1, escape: 'Escape' + O1, post: '', account: '' }), 'someone with a room: the key word is "live" on My flat, "meet you" on Requests and "Escape" on the Escape; none on Post and Profile: ' + JSON.stringify(kws2));
  await ctx.close();
  // ------------------------------------------------------------ small phones: the bigger headlines still fit
  for(const [w, h, views] of [[360, 640, ['discover', 'saved', 'requests', 'tribe', 'parties', 'splits', 'market', 'account', 'messages']], [320, 568, ['discover', 'tribe', 'splits', 'market']]]){
    ({ ctx, p } = await open(b, seeker, { viewport:{ width: w, height: h } }, 'discover')); const tall = [], wide = [], sizes = new Set();
    for(const v of views){ await go(p, v); const m = await p.evaluate(() => { const h1 = document.querySelector('#appMain > section:not([hidden]) .home-band h1'), cs = getComputedStyle(h1);
        return { lines: Math.round(h1.getBoundingClientRect().height / parseFloat(cs.lineHeight)), size: parseFloat(cs.fontSize), side: document.documentElement.scrollWidth - innerWidth }; });
      sizes.add(m.size); if(m.lines > 3) tall.push(v + ' ' + m.lines); if(m.side > 0) wide.push(v + ' ' + m.side); }
    ok(!tall.length && !wide.length && [...sizes].every(x => x >= 30 && x <= 36), w + ' x ' + h + ': every screen\'s headline is the serif at ' + [...sizes].join('/') + 'px on at most three lines, and nothing runs off the side: ' + tall.concat(wide).join(' | '));
    await go(p, 'tribe'); const tn = await p.evaluate(() => { const o = $('tribeOrbit'), s = o.querySelector(':scope > svg').getBoundingClientRect(), or = o.getBoundingClientRect(), j = $('tribeJourney').getBoundingClientRect();
      return { card: getComputedStyle(o).backgroundColor, w: Math.round(or.width), steps: Math.round(j.width), shape: Math.round(s.width * 220 / 340 - s.height), side: document.documentElement.scrollWidth - innerWidth,
        inside: [...o.querySelectorAll('.node')].every(n => { const r = n.getBoundingClientRect(); return r.left >= or.left && r.right <= or.right && r.top >= or.top && r.bottom <= or.bottom; }),
        oneLine: [...document.querySelectorAll('#tribeJourney li b')].every(x => x.getClientRects().length === 1) }; });
    ok(tn.card === 'rgb(255, 255, 255)' && tn.w === w - 40 && tn.steps === w - 40 && Math.abs(tn.shape) <= 1 && tn.inside && tn.oneLine && tn.side <= 0,
      w + ' x ' + h + ': Tribe\'s two white cards fit the screen, the drawing keeps its shape (no empty strip above and below it), everyone is inside the card, and each step\'s name is on one line: ' + JSON.stringify(tn));
    if(w === 360){ await go(p, 'discover'); const fold = await p.evaluate(() => { const c = document.querySelector('#cards .card'), s = document.querySelector('.d-search, #dSearch, .ds-q'); return { card: c ? Math.round(c.getBoundingClientRect().top) : null, search: s ? Math.round(s.getBoundingClientRect().top) : null }; });
      ok(fold.card !== null && fold.search !== null && fold.search <= 296, '360 x 640: with the bigger headline the search still starts no lower than it did (296px on 16 Nov; the room kept for the old sheet\'s edge went), so the homes under it do not either: ' + JSON.stringify(fold));
      await p.screenshot({ path: O + '/p31-discover-360.png' }); }
    await ctx.close(); }
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
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await go(p, 'tribe');
  const twc = await p.evaluate(() => { const o = $('tribeOrbit'), j = $('tribeJourney'), cj = getComputedStyle(j), hero = document.querySelector('.tribe-hero').getBoundingClientRect(), jr = j.getBoundingClientRect();
    return { hero: getComputedStyle(document.querySelector('.tribe-hero')).backgroundColor, orbit: getComputedStyle(o).backgroundColor, label: getComputedStyle(o.querySelector('.node > rect')).fill,
      steps: cj.backgroundColor, radius: cj.borderRadius, hair: /^rgb\(238, 232, 226\) 0px 0px 0px 1px/.test(cj.boxShadow), inLine: Math.round(jr.left - hero.left) + Math.round(jr.right - hero.right), subs: [...j.querySelectorAll('li span')].filter(x => x.offsetParent).length }; });
  ok(twc.hero === 'rgb(255, 255, 255)' && twc.orbit === 'rgba(0, 0, 0, 0)' && twc.label === 'rgb(255, 244, 232)' && twc.steps === 'rgb(255, 255, 255)' && twc.radius === '28px' && twc.hair && twc.inLine === 0 && twc.subs === 4,
    'Tribe on a computer: the people are inside the band\'s white card as before (no second card), their labels cream; the four steps get a white card, as wide as the band, with their second lines: ' + JSON.stringify(twc));
  await p.screenshot({ path: O + '/p31-tribe-wide.png' });
  await ctx.close();
  // ------------------------------------------------------------ the pages beside the app
  ({ ctx, p } = await open(b, null, { viewport:{ width:390, height:844 } }));
  await p.goto(U + 'privacy.html'); await p.waitForTimeout(900); await p.evaluate(() => document.fonts.ready);
  const pv = await p.evaluate(() => { const cs = e => getComputedStyle(document.querySelector(e)); return { h1: cs('h1').fontFamily.slice(0, 18), body: cs('body').fontFamily.slice(0, 12), bg: cs('body').backgroundColor, box: cs('.short').backgroundColor, link: cs('main a, .wrap a:not(.logo):not(.back)').color,
    logo: document.querySelector('.logo img').getAttribute('src'), src: document.documentElement.outerHTML }; });
  ok(/DM Serif/.test(pv.h1) && /Urbanist/.test(pv.body) && pv.bg === 'rgb(255, 244, 232)' && pv.box === 'rgb(255, 255, 255)' && pv.link === 'rgb(194, 65, 12)' && !/#1C7F72|#156358|#DCEFE9|#EE6468|#CE3A44|#1F1B2E|Plus Jakarta/i.test(pv.src) && !(await p.evaluate(audit)).length,
    'the privacy policy page wears the same look (a cream page, its summary a white panel), and reads: ' + JSON.stringify({ h1: pv.h1, body: pv.body, bg: pv.bg, link: pv.link }) + ' ' + (await p.evaluate(audit)).slice(0, 3).join(' | '));
  const pl = await p.evaluate(() => ({ srcs: [...document.querySelectorAll('.logo img')].map(i => i.getAttribute('src')).join(), glow: getComputedStyle(document.querySelector('.logo img')).boxShadow,
    word: getComputedStyle(document.querySelectorAll('.logo img')[1]).boxShadow, tab: document.querySelector('link[rel=icon]').getAttribute('href') }));
  const pvSeen = await pixelOf(p, (await p.locator('.logo img').first().screenshot()).toString('base64'), .5, .88);   // under the letters, where the tile is plain
  ok(pl.srcs === 'icons/icon-192.png,icons/wordmark.svg' && /^rgba\(194, 65, 12, 0\.22\)/.test(pl.glow) && pl.word === 'none' && pl.tab === 'icons/icon-192.png'
    && pvSeen === '194,65,12', 'the privacy policy page shows the same logo: the orange tile and the wordmark, and the tile as its tab icon: ' + JSON.stringify(Object.assign(pl, { seen: pvSeen })));
  await p.screenshot({ path: O + '/p31-privacy.png' });
  const hold = fs.readFileSync(path.join(APP, 'hold.html'), 'utf8');
  ok(/fill='%23C2410C'/.test(hold) && !/%23EE6468|#EE6468|#1F1B2E|#FDF8F1/i.test(hold) && /--orange:#C2410C/.test(hold) && /--bg:#FFF4E8/.test(hold) && /name="theme-color" content="#FFF4E8"/.test(hold) && /src="icons\/logo-icon\.svg"/.test(hold) && /src="icons\/wordmark\.svg"/.test(hold),
    'the Coming soon page (kept for a hold) has the same logo, the same orange tab icon and the app\'s colours, on the cream');
  const man = await p.evaluate(async () => (await fetch('manifest.webmanifest')).json());
  ok(man.theme_color.toUpperCase() === '#FFF4E8' && man.background_color.toUpperCase() === '#FFF4E8', 'the installed app opens on the cream page: ' + man.theme_color);
  // the Android app: the window, the navigation bar and the strip behind the clock are the same cream, with dark icons
  const sty = fs.readFileSync(path.join(APP, 'android/app/src/main/res/values/styles.xml'), 'utf8'), act = fs.readFileSync(path.join(APP, 'android/app/src/main/java/com/findmeflatmate/app/MainActivity.java'), 'utf8');
  ok(/<color name="page">#FFF4E8<\/color>/.test(sty) && /<color name="brand">#C2410C<\/color>/.test(sty) && /statusStrip\.setBackgroundColor\(getColor\(R\.color\.page\)\)/.test(act) && /APPEARANCE_LIGHT_NAVIGATION_BARS\s*\|\s*WindowInsetsController\.APPEARANCE_LIGHT_STATUS_BARS/.test(act)
    && /setSystemBarsAppearance\(light, light\)/.test(act), 'the Android app: the page colour is the cream, the strip behind the clock is painted in it, and both bars carry dark icons');
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
