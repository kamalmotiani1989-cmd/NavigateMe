// Records the five nearby-parties clips in demo mode. Each clip: a context with video on, setup, then a marker
// time; ffmpeg later trims from the marker.
const { chromium } = require('playwright'); const fs = require('fs'); const OUT = process.argv[2];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:2, noise:1, social:2, sharing:1, work:0, pets:1, gen:'z' };
const person = (phone, name, gender, extra) => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone, name, role:'seeker', gender, occupation:{ type:'working', what:'Designer' } }, account:phone,
  onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Pune', areas:['Baner'] }, profilePromoHidden: 9e15, notified:{}, demoInvites:'done', demoTribeAt:'done' }, extra || {});
const U = h => 'http://127.0.0.1:8766/' + h   // the app in demo mode, close = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const smooth = (p, sel, block) => p.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ behavior:'smooth', block: b || 'start' }), [sel, block]);
const marks = {};
// Frames come from Chrome's screencast at the phone's full resolution (360x640 at 2x = 720x1280), with timestamps.
async function clip(b, name, state, setup, act){
  const ctx = await b.newContext({ viewport:{ width:360, height:640 }, deviceScaleFactor:2 });
  await ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, state);
  const p = await ctx.newPage(); p.on('dialog', d => d.accept().catch(() => {}));
  await setup(p);
  const cdp = await ctx.newCDPSession(p), frames = [], dir = `${OUT}/raw/${name}`; fs.mkdirSync(dir, { recursive:true });
  cdp.on('Page.screencastFrame', async f => { frames.push({ t: f.metadata.timestamp, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format:'png', maxWidth:720, maxHeight:1280, everyNthFrame:1 });
  const t0 = Date.now() / 1000; await act(p); await p.waitForTimeout(150); const t1 = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  // ffmpeg concat list: each frame held until the next one
  let list = '';
  frames.forEach((f, i) => { const fn = `${dir}/f${String(i).padStart(5, '0')}.png`; fs.writeFileSync(fn, Buffer.from(f.data, 'base64'));
    const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(f.t + 0.05, t1); list += `file '${fn}'
duration ${Math.max(0.01, next - f.t).toFixed(3)}
`; });
  if(frames.length) list += `file '${dir}/f${String(frames.length - 1).padStart(5, '0')}.png'
`;
  fs.writeFileSync(`${dir}/list.txt`, list); marks[name] = [frames.length, t1 - t0]; await ctx.close();
}
(async () => { const b = await chromium.launch();
  // (a) host opens a party to people nearby
  await clip(b, 'a-host-opens', person('9822200001', 'Hema', 'female'), async p => {
    await p.goto(U('#splits')); await p.waitForTimeout(1200); await close(p);
    const gid = await p.evaluate(() => api.splitCreate('Diwali night', '🪔', [], 'party'));
    await p.goto(U('#splits/' + gid)); await p.waitForTimeout(1200); await p.click('[data-pt="edit"]'); await p.waitForTimeout(600);
    // Free parties only in the reel: the recording hides the chip-in choice, the money line and the friends' chip-in row.
    await p.addStyleTag({ content: '#ptMoney, #ptChipBox, .pt-near .field:has([name=ptEntry]), #ptForm .pt-extra:not(.pt-near){display:none !important}' });
    await p.evaluate(() => { $('ptNear').open = true; const sc = $('ptNear').closest('.mbody') || document.scrollingElement; $('ptNear').scrollIntoView({ block:'start' }); }); await p.waitForTimeout(500);
  }, async p => {
    await p.waitForTimeout(400);
    await p.click('#ptOpen + span'); await p.waitForTimeout(600);
    await p.type('#ptLimit', '6', { delay: 120 }); await p.waitForTimeout(300);
    await p.waitForTimeout(500);
    await smooth(p, '#ptRadius', 'center'); await p.waitForTimeout(700);
    await p.click('[name=ptWho][value=female] + span'); await p.waitForTimeout(400);
    await p.evaluate(async () => { const r = $('ptRadius'); for(const v of [3, 2]){ r.value = v; r.dispatchEvent(new Event('input', { bubbles:true })); await new Promise(x => setTimeout(x, 300)); } });
    await p.waitForTimeout(700);
  });
  // (b) a nearby person scrolls to a party card
  await clip(b, 'b-guest-finds', person('9822200002', 'Asha', 'female', { partyNear:{ on:true, pin:{ lat:18.559, lng:73.7868 }, label:'Baner' } }), async p => {
    await p.goto(U('#splits')); await p.waitForTimeout(800); await p.evaluate(() => { demoNearParties().forEach(x => { x.entry = 'free'; x.entry_chip = null; x.covers = []; x.covers_other = null; }); }); await p.goto(U('#account')); await p.goto(U('#splits')); await p.waitForTimeout(1400); await close(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  }, async p => {
    await p.waitForTimeout(500); await smooth(p, '.near-h', 'start'); await p.waitForTimeout(1800);
    await p.evaluate(() => window.scrollBy({ top: 120, behavior:'smooth' })); await p.waitForTimeout(1300);
  });
  // (c) request to join with a note
  await clip(b, 'c-request', person('9822200003', 'Asha', 'female', { partyNear:{ on:true, pin:{ lat:18.559, lng:73.7868 }, label:'Baner' } }), async p => {
    await p.goto(U('#splits')); await p.waitForTimeout(1600); await close(p); await p.evaluate(() => { demoNearParties().forEach(x => { x.entry = 'free'; x.entry_chip = null; x.covers = []; x.covers_other = null; }); });
    await p.evaluate(() => openNear('NBPUN1')); await p.waitForTimeout(800);
  }, async p => {
    await p.waitForTimeout(500); await smooth(p, '#nearAsk', 'start'); await p.waitForTimeout(1000);
    await p.type('#nearNote', 'Board games fan, new in Baner!', { delay: 55 }); await p.waitForTimeout(400);
    await p.click('#nearAsk [type=submit]'); await p.waitForTimeout(1400);
  });
  // (d) host's request list and Accept
  await clip(b, 'd-host-accepts', person('9822200004', 'Hema', 'female'), async p => {
    await p.goto(U('#splits')); await p.waitForTimeout(1200); await close(p);
    const gid = await p.evaluate(async () => { const id = await api.splitCreate('Diwali night', '🪔', [], 'party');
      await api.partySave(id, { occasion:'festival', title:"Diwali night at Hema's", starts_at: (d => { d.setDate(d.getDate() + 3); d.setHours(20, 0, 0, 0); return d.toISOString(); })(new Date()), place:'home', plus_ones:true });
      await api.partyOpenSave(id, { open:true, guest_limit:6, entry:'free', who:'female', radius_km:2, area:'Baner', near_address:'B-12 Green Woods, Baner', near_geo:{ lat:18.559, lng:73.7868 } });
      api.partyReqs().forEach((r, i) => r.user_phone = '000000000' + (i + 1)); save(); return id; });   // no real-looking numbers on screen
    await p.goto(U('#splits/' + gid)); await p.waitForTimeout(1500); await p.evaluate(() => window.scrollTo(0, 0));
  }, async p => {
    await p.waitForTimeout(400); await smooth(p, '#ptReqs', 'start'); await p.waitForTimeout(1600);
    await p.click('#ptReqs .pr-row:has-text("+1") [data-pr-yes]'); await p.waitForTimeout(1800);
  });
  // (e) guest's view unlocks: address, pin, check-in code
  await clip(b, 'e-guest-unlocks', person('9822200005', 'Asha', 'female', { partyNear:{ on:true, pin:{ lat:18.559, lng:73.7868 }, label:'Baner' } }), async p => {
    await p.goto(U('#splits')); await p.waitForTimeout(1600); await close(p); await p.evaluate(() => { demoNearParties().forEach(x => { x.entry = 'free'; x.entry_chip = null; x.covers = []; x.covers_other = null; }); });
    await p.evaluate(async () => { await api.partyRequest('NBPUN1', 'Board games fan!', 0); api.partyReqs().forEach(r => r.sampleDecideAt = Date.now() + 2500); save(); await openNear('NBPUN1'); });
    await p.waitForTimeout(400); await p.evaluate(() => $('nearAct').scrollIntoView({ block:'end' }));
  }, async p => {
    await p.waitForTimeout(3400);
    await p.evaluate(() => (document.querySelector('#nearAct .near-code') || $('nearAct')).scrollIntoView({ behavior:'smooth', block:'center' })); await p.waitForTimeout(1600);
  });
  fs.writeFileSync(OUT + '/marks.json', JSON.stringify(marks)); await b.close(); })();
