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
  // the sign-in card on the first phone screen: both choices show, the paragraph follows the card, the card is the same
  const lay = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect();
    const roles = [...document.querySelectorAll('.w-card .role')].map(e => Math.round(e.getBoundingClientRect().top + 30));
    return { h2: Math.round(r('.w-card h2').top), roles, lede: Math.round(r('.w-copy .lede').top), cardEnd: Math.round(r('.w-card').bottom),
      kids: [...document.querySelector('#loginForm').children].length, quiz: Math.round(r('.w-quiz').top) }; });
  ok(lay.roles.length === 2 && lay.roles.every(y => y < 844) && lay.h2 > lay.quiz, 'visitor: the sign-in card\'s heading and both choices are on the first phone screen: ' + JSON.stringify(lay));
  ok(lay.lede > lay.cardEnd, 'visitor: the paragraph comes after the sign-in card on a phone');
  await p.screenshot({ path: O + '/p8-welcome.png' });
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
  const lowGreen = () => p.evaluate(() => {
    const bgOf = e => { for(; e && e !== document.documentElement; e = e.parentElement){ const c = getComputedStyle(e).backgroundColor; if(c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; } return ''; };
    const out = [];
    document.querySelectorAll('body *').forEach(e => { if(!e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
      const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if(!own) return;
      if(getComputedStyle(e).color === 'rgb(28, 127, 114)' && bgOf(e) === 'rgb(229, 243, 239)') out.push((e.className || e.tagName) + ': ' + e.textContent.trim().slice(0, 30)); });
    return out; });
  const found = [];
  for(const h of ['#discover', '#saved', '#tribe', '#account', '#passes', '#market']){
    await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1500); found.push(...await lowGreen()); }
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); openListing(document.querySelector('#cards .card').dataset.id); }); await p.waitForTimeout(1500);
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
  for(const h of ['#mine', '#requests', '#account']){ await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1500); found.push(...await lowGreen()); }
  ok(!found.length, 'seeker and owner: no green text below 4.5:1 on the pale green tips and labels: ' + [...new Set(found)].join(' / '));
  await ctx.close();
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
