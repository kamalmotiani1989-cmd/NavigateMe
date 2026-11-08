// The design-study changes Kamal approved on 8 Nov 2026 (demo mode, port 8765): the trust line on the welcome's
// first screen, the type scale, green text on pale green tips, the sign-in card on the first phone screen, the
// "No photos yet" state, the hint grey and the WhatsApp green.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
(async () => {
  const b = await chromium.launch();
  // ------------------------------------------------------------ visitor: the welcome page on a phone
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push('visitor ' + e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(2000);
  const w = await p.evaluate(() => { const t = document.querySelector('.w-trust'), r = t && t.getBoundingClientRect();
    return { text: t ? t.textContent : '', bottom: r ? r.bottom : 9999 }; });
  ok(/Listed by owners and the flatmates who live there · your number is shared only if you both say yes/.test(w.text) && w.bottom < 844,
    'visitor: the trust line is on the welcome page\'s first phone screen: ' + JSON.stringify(w));
  const faces = await p.evaluate(() => ({ svgs: document.querySelectorAll('.wq-faces i svg').length, text: document.querySelector('.wq-faces').textContent.trim() }));
  ok(faces.svgs === 3 && !faces.text, 'visitor: the quiz card shows three line icons, not emoji faces: ' + JSON.stringify(faces));
  // the sign-in card on the first phone screen: both choices show, the paragraph follows the card, the card is the same
  const lay = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect();
    const roles = [...document.querySelectorAll('.w-card .role')].map(e => Math.round(e.getBoundingClientRect().top + 30));
    return { h2: Math.round(r('.w-card h2').top), roles, lede: Math.round(r('.w-copy .lede').top), cardEnd: Math.round(r('.w-card').bottom),
      kids: [...document.querySelector('#loginForm').children].length, quiz: Math.round(r('.w-quiz').top) }; });
  ok(lay.roles.length === 2 && lay.roles.every(y => y < 844) && lay.h2 > lay.quiz, 'visitor: the sign-in card\'s heading and both choices are on the first phone screen: ' + JSON.stringify(lay));
  ok(lay.lede > lay.cardEnd, 'visitor: the paragraph comes after the sign-in card on a phone');
  await p.screenshot({ path: O + '/p8-welcome.png' });
  // hints and small print: the darker grey, 4.5:1 or better on white and on the mint wash
  const grey = await p.evaluate(() => { const v = getComputedStyle(document.documentElement).getPropertyValue('--text-3').trim();
    const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round((x + .05) / (y + .05) * 100) / 100; };
    return { v, white: ratio(v, '#FFFFFF'), wash: ratio(v, '#DCEFE9'), appBg: ratio(v, '#F4F7F6') }; });
  ok(grey.v.toUpperCase() === '#5E6679' && grey.white >= 4.5 && grey.wash >= 4.5 && grey.appBg >= 4.5, 'visitor: the hint grey reads at 4.5:1 or better: ' + JSON.stringify(grey));
  // the WhatsApp button: darker green, white text at 4.5:1 or better; the sign-in card's controls are the same
  const wa = await p.evaluate(() => { const bt = document.querySelector('#loginForm .btn-wa'), cs = getComputedStyle(bt);
    const lum = rgb => { const c = rgb.match(/\d+/g).slice(0, 3).map(x => x / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    return { bg: cs.backgroundColor, ratio: Math.round((lum(cs.color) + .05) / (lum(cs.backgroundColor) + .05) * 100) / 100, text: bt.textContent.trim(),
      fields: [...document.querySelectorAll('#loginForm input')].map(i => i.name || i.id).join(',') }; });
  ok(wa.bg === 'rgb(23, 135, 65)' && wa.ratio >= 4.5 && wa.text === 'Get the code on WhatsApp', 'visitor: the WhatsApp button is #178741 with readable white text: ' + JSON.stringify(wa));
  // a wide screen keeps the two columns: words on the left, the card on the right
  await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(500);
  const wide = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect();
    return { ledeRight: Math.round(r('.w-copy .lede').right), cardLeft: Math.round(r('.w-card').left), ledeTop: Math.round(r('.w-copy .lede').top), cityTop: Math.round(r('#city').top) }; });
  ok(wide.ledeRight <= wide.cardLeft && wide.ledeTop < wide.cityTop, 'visitor: on a wide screen the paragraph stays in the left column above the city: ' + JSON.stringify(wide));
  await ctx.close();
  // ------------------------------------------------------------ green text on pale green: none left at --brand
  const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
  const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'x' } }, account:'9811111111',
    onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, interests:{ music:['Indie'], hobbies:['Gym'] }, prefs:{ city:'Bengaluru', areas:[] }, profilePromoHidden: Date.now() + 9e9 };
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, seeker);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('seeker ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  // every visible text whose colour is --brand (#1C7F72) on a --brand-soft (#E5F3EF) background: 4.25:1, below 4.5
  // text sizes in use on each screen (avatars and icon circles aside)
  const sizes = new Set(), odd = new Set();
  const scale = async () => (await p.evaluate(() => { const r = [];
    document.querySelectorAll('body *').forEach(e => { if(!e.offsetParent) return; if(![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      const cs = getComputedStyle(e), f = parseFloat(cs.fontSize); if(f < 12 || f > 20) return;
      if(cs.display === 'grid' && cs.placeItems.includes('center') && parseFloat(cs.width) <= 56) return;   // avatar and icon circles
      if(/^H[1-3]$/.test(e.tagName) && !Number.isInteger(f * 2)) return;   // headlines scale with the screen (clamp)
      r.push([String(f), (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 16)]); });
    return r; })).forEach(([f, w]) => { sizes.add(f); if(!['12', '13.5', '15.5', '20'].includes(f)) odd.add(f + ' ' + w); });
  // one icon style: none of these emoji left in the app's own words (categories people pick keep theirs)
  const emo = new Set();
  const emojiLeft = async () => (await p.evaluate(() => { const re = /[🎉🥳🎁⚡🦉🦋📦🛋📍🔔🧾🤝]/u, out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for(let t; (t = walk.nextNode());){ const e = t.parentElement; if(!re.test(t.textContent) || !e || !e.offsetParent) continue;
      if(e.closest('[data-mk-cat], select, .mk-catpick, .fs-cats, .sp-cat, .fs-emoji, .pt-kinds, .mk-art, .split-cat')) continue;
      out.push((e.className || e.tagName) + ': ' + t.textContent.trim().slice(0, 24)); }
    return out; })).forEach(x => emo.add(x));
  const lowGreen = async () => { await scale(); await emojiLeft(); return p.evaluate(() => {
    const bgOf = e => { for(; e && e !== document.documentElement; e = e.parentElement){ const c = getComputedStyle(e).backgroundColor; if(c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; } return ''; };
    const out = [];
    document.querySelectorAll('body *').forEach(e => { if(!e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
      const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if(!own) return;
      if(getComputedStyle(e).color === 'rgb(28, 127, 114)' && bgOf(e) === 'rgb(229, 243, 239)') out.push((e.className || e.tagName) + ': ' + e.textContent.trim().slice(0, 30)); });
    return out; }); };
  const found = [];
  for(const h of ['#discover', '#saved', '#tribe', '#account', '#passes', '#market', '#splits']){
    await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1500); found.push(...await lowGreen()); }
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500);
  // sample homes keep their drawn room and say "Sample"; a real home without photos says "No photos yet". Live, the 100
  // seeded homes are samples; the demo's homes are not, so mark every other one as a sample and draw Discover again.
  await p.evaluate(async () => { demoListings().forEach((l, i) => { if(i % 2 === 0) l.household = Object.assign({}, l.household, { sample: true }); });
    location.hash = '#saved'; await new Promise(r => setTimeout(r, 600)); location.hash = '#discover'; }); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const np = await p.evaluate(() => [...document.querySelectorAll('#cards .card')].map(c => { const l = api.all().find(x => x.id === c.dataset.id);
    return { sample: isSample(l), photos: photosOf(l).length, panel: !!c.querySelector('.thumb .nophoto'), img: !!c.querySelector('.thumb > img'),
      drawn: !!c.querySelector('.thumb > svg.art'), label: !!c.querySelector('.body .smp') }; }));
  ok(np.some(c => c.sample && !c.photos) && np.every(c => c.photos ? c.img && !c.panel : c.sample ? c.drawn && !c.panel && c.label : c.panel && !c.drawn),
    'seeker: sample homes keep the drawn room with a Sample label; real homes without photos get the panel (' + np.filter(c => c.sample).length + ' samples of ' + np.length + ')');
  await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); openListing([...document.querySelectorAll('#cards .card')].find(c => isSample(api.all().find(x => x.id === c.dataset.id))).dataset.id); }); await p.waitForTimeout(1500);
  const hero = await p.evaluate(() => { const h = document.querySelector('.hero-pic'); return h ? { text: (h.querySelector('.nophoto') || {}).textContent || '', gallery: !!h.querySelector('.gallery') } : null; });
  const heroS = await p.evaluate(() => ({ drawn: !!document.querySelector('.hero-pic > svg.art'), label: !!document.querySelector('#dlgListing .smp, .smp-note .smp') }));
  ok(hero && (hero.gallery || (heroS.drawn && heroS.label && !hero.text)), "seeker: a sample home's page keeps the drawn room and the Sample label: " + JSON.stringify({ hero, heroS }));
  await p.screenshot({ path: O + '/p8-home.png' });
  found.push(...await lowGreen());
  await ctx.close();
  // the owner's screens: My flat with its strength tips, Requests
  const listing = { id:'mine-p8', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000, available_from:'2026-12-01',
    gender:'any', furnishing:'semi', bachelors:true, amenities:[], description:'Short.', photos:[], household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer' }] }, vibe),
    costs:{}, owner_phone:'9822222222', status:'active', created_at: new Date().toISOString(), unlock_count:0, private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, HSR Layout' } };
  const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true,
    vibe, homeDraft: Object.assign({ residents:1 }, vibe), myListings:[listing], requests:[], demoIncoming:{} };
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, owner);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push('owner ' + e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  for(const h of ['#mine', '#requests', '#account']){ await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1500); found.push(...await lowGreen());
    if(h === '#mine'){ const mp = await p.evaluate(() => ({ panel: (document.querySelector('.mine-card .pic .nophoto') || {}).textContent || '', drawn: !!document.querySelector('.mine-card .pic svg.art') }));
      ok(mp.panel === 'No photos yet' && !mp.drawn, 'owner: a real home without photos says "No photos yet", no drawn room: ' + JSON.stringify(mp)); } }
  ok(!sizes.size || [...sizes].every(x => ['12', '13.5', '15.5', '20'].includes(x)), 'seeker and owner: text between 12 and 20 px uses only the scale (12, 13.5, 15.5, 20): ' + [...sizes].join(', ') + ' ' + [...odd].slice(0, 6).join(' / '));
  ok(!emo.size, 'seeker and owner: badges, notices and empty states use line icons, not emoji: ' + [...emo].slice(0, 8).join(' / '));
  ok(!found.length, 'seeker and owner: no green text below 4.5:1 on the pale green tips and labels: ' + [...new Set(found)].join(' / '));
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
