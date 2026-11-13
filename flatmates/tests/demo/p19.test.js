// Owner screens read well (King, 13 Nov, from Kamal's screenshot; demo mode, port 8765, 390 wide): every text on My flat
// (with the Empty Room Escape card showing), the requests inbox, the Escape list and the posting form reads at 4.5:1
// (3:1 for big text); the Escape card follows the pastel rules (dark text, no orange inside); and an owner who is
// also looking for a room never sees themselves among the people looking.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const listing = { id:'mine-p6a', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }], interests:{ music:['Indie'], hobbies:[] } }, vibe),
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } };
const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents: 1 }, vibe), myListings:[listing], requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3), passes:{ escape: iso(now + 7 * 864e5) }, saleCredits: 1, boostCredits: 0 };
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
const closeDlgs = p => p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.querySelectorAll('.pk-more').forEach(b => b.click()); });
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, owner);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#mine'); await p.waitForTimeout(1800); await closeDlgs(p);
  const esc = await p.evaluate(() => { const c = document.querySelector('.mine-esc'); if(!c) return null; const col = el => getComputedStyle(el).color;
    return { rows: c.querySelectorAll('.row').length, eyebrow: col(c.querySelector('small')), title: col(c.querySelector(':scope > b')), name: col(c.querySelector('.row b')),
      link: col(c.querySelector(':scope > a')), ink: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() }; });
  ok(esc && esc.rows > 0, 'My flat shows the Empty Room Escape card with people looking: ' + JSON.stringify(esc));
  if(esc){ await p.evaluate(() => document.querySelector('.mine-esc').scrollIntoView({ block:'start' })); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(300); }
  await p.screenshot({ path: O + '/p19-mine.png' });
  const rgb = s => (s.match(/\d+/g) || []).slice(0, 3).join();
  ok(esc && [esc.title, esc.name, esc.link].every(c => rgb(c) === '28,25,23') && rgb(esc.link) !== '178,58,10',
    'the Escape card: title, names and link in the dark text colour, nothing orange inside: ' + JSON.stringify(esc));
  const low = [];
  for(const h of ['#mine', '#requests', '#escape', '#post', '#account']){ await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1500); await closeDlgs(p);
    low.push(...(await p.evaluate(audit)).map(x => h + ' ' + x)); }
  ok(!low.length, 'contrast on the owner screens (My flat, requests, Escape, posting form, account): ' + low.join(' | '));
  // an owner who also looks for a room: never among the people looking at their own home (demo)
  const self = await p.evaluate(async () => { const pool = demoSeekerPool(), one = pool.find(x => x.city === 'Bengaluru'); if(!one) return null;
    const old = one.phone; one.phone = state.account; const r = await api.findSeekers('mine-p6a'); one.phone = old; return { id: one.id, listed: r.some(x => x.seeker_id === one.id), n: r.length }; });
  ok(self && !self.listed && self.n > 0, 'the owner is never one of the people looking for their own home: ' + JSON.stringify(self));
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
