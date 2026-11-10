// The AI go-between chat (demo mode, port 8765, 390 wide; no AI and no network: canned replies). The privacy filter
// on the shared examples (tests/shield/cases.json, also checked against fm_chat_shield), the private profile check,
// "This is what <name> will see" before sending, "Show original", suggested questions only fill the box, every
// report line labelled Verified or Self-reported, nothing shared before both say yes, and closing hides it all.
const { chromium } = require('playwright');
const cases = require('../shield/cases.json');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:0, clean:0, food:0, cook:0, smoke:0, drinks:0, guests:0, noise:0, social:2, sharing:0, work:0, pets:0, gen:'z' };
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[], max:8000 },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, chatLang:'en' };
const wait = (p, ms) => p.waitForTimeout(ms);
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
async function say(p, text){ await p.fill('#chText', text); await p.click('#chForm button[type=submit]'); await p.waitForSelector('#chShown'); }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  let net = 0; p.on('request', r => { if(/anthropic|functions\/v1\/fm-chat/.test(r.url())) net++; });
  await p.goto('http://localhost:8765/#discover'); await wait(p, 1800); await closeDlgs(p);

  // 1. the privacy filter: same examples as the database
  const sh = await p.evaluate(cs => cs.map(c => { const r = shieldText(c.in);
    return { in:c.in, ok: JSON.stringify(r.held) === JSON.stringify([...c.held].sort()) && (c.gone || []).every(g => !r.text.includes(g)) && (c.keep || []).every(k => r.text.includes(k)), r }; }), cases);
  const shBad = sh.filter(x => !x.ok);
  ok(!shBad.length, `privacy filter: ${sh.length - shBad.length}/${sh.length} tricky examples (spaced, dashed, +91, in words, "double", Hindi numbers, emails, UPI, handles, links, flat numbers, payments)` + (shBad.length ? ': ' + JSON.stringify(shBad) : ''));
  // 2. the private profile check
  const tr = await p.evaluate(() => ({ smoke: truthCheck({ smoke:0 }, 'Honestly I smoke on the balcony'), neg: truthCheck({ smoke:0 }, "I don't smoke at all"),
    pets: truthCheck({ pets:0 }, 'my dog is very calm'), food: truthCheck({ food:0 }, 'we cook chicken on Sundays'), fine: truthCheck({ smoke:2 }, 'I smoke outside') }));
  ok(tr.smoke[0]?.key === 'smoke' && !tr.neg.length && tr.pets[0]?.key === 'pets' && tr.food[0]?.key === 'food' && !tr.fine.length,
    'profile check: catches a message that contradicts your own answer, not "I don\'t smoke" or an answer that allows it: ' + JSON.stringify(tr));

  // 3. a request, then the chat from Requests
  await p.evaluate(async () => { await api.sendRequest('demo-1', 'Hi!'); });
  await p.goto('http://localhost:8765/#requests'); await wait(p, 1500); await closeDlgs(p);
  ok(await p.locator('#reqList [data-chatreq]').count() === 1, 'Requests: a waiting request has "Chat with the owner"');
  await p.click('#reqList [data-chatreq]'); await wait(p, 700);
  const top = await p.evaluate(() => ({ open: $('dlgChat').open, title: $('chTitle').textContent, clash: document.querySelector('#chBody .ch-clash')?.open,
    items: [...document.querySelectorAll('#chBody .ch-clash li')].map(x => x.textContent), lang: $('chLang').value, listing: $('dlgListing').open }));
  ok(top.open && !top.listing && /^Chat with /.test(top.title), 'chat opens on its own (not the home behind it): ' + top.title);
  ok(top.clash && top.items.length > 0 && top.items.some(t => /Rent .* above your budget/.test(t)), 'clashes are shown at the start, rent over budget included: ' + top.items.slice(0, 3).join(' / '));
  await p.screenshot({ path: O + '/p14-start.png' });

  // 4. what they'll see, before it goes
  await say(p, 'Hi! I am Neha. Call me on 98765 43210 or mail neha.k@gmail.com');
  const pv = await p.evaluate(() => ({ eye: document.querySelector('.ch-preview .eyebrow').textContent, shown: $('chShown').value,
    held: document.querySelector('.ch-preview .ch-note.held')?.textContent || '', msgs: document.querySelectorAll('.ch-msg').length, own: !!document.querySelector('[data-chat="own"]') }));
  ok(/^This is what .+ will see$/.test(pv.eye) && !/98765|43210|gmail/.test(pv.shown) && /phone number/.test(pv.held) && /email/.test(pv.held) && pv.msgs === 0,
    'before sending: "This is what <name> will see", the number and email held back with the reason, nothing sent yet: ' + JSON.stringify(pv).slice(0, 220));
  await p.screenshot({ path: O + '/p14-preview.png' });
  await p.fill('#chShown', 'Hi! I am Neha, a designer. Is the room still free?');
  await p.click('[data-chat="send"]'); await wait(p, 400);
  const s1 = await p.evaluate(() => { const c = Object.values(state.chats)[0]; return { body: c.messages[0].body, shown: c.messages[0].shown, notes: c.notes.map(n => n.kind),
    bubble: document.querySelector('.ch-msg.mine p').textContent, heldUi: !!document.querySelector('.ch-msgs ~ * .ch-note.held, .ch-msgs .ch-note.held') }; });
  ok(s1.shown === 'Hi! I am Neha, a designer. Is the room still free?' && !/98765|gmail/.test(s1.body) && s1.notes.includes('held') && s1.heldUi,
    'the edited text is what they read; your own words are stored filtered; the held-back note stays with you: ' + JSON.stringify(s1).slice(0, 220));
  await wait(p, 1900);
  const r1 = await p.evaluate(() => { const t = document.querySelector('.ch-msg.theirs'); return { text: t?.querySelector('p').textContent, btn: t?.querySelector('[data-chat="orig"]')?.textContent }; });
  ok(r1.text && r1.btn === 'Show original', 'their reply arrives in your language with "Show original": ' + r1.text);
  await p.click('.ch-msg.theirs [data-chat="orig"]');
  ok(await p.evaluate(() => /[ऀ-ॿ]/.test(document.querySelector('.ch-msg.theirs .ch-orig:not([hidden])')?.textContent || '')), '"Show original" shows their own words (Hindi)');

  // 5. the private profile check while writing
  await say(p, 'Just so you know, I smoke on the balcony sometimes');
  const tc = await p.evaluate(() => document.querySelector('.ch-preview .ch-note.truth')?.textContent || '');
  ok(/Only you can see this/.test(tc) && /smoking/.test(tc) && /Never/.test(tc), 'profile check: a quiet note only you see, no accusation: ' + tc.replace(/\s+/g, ' ').slice(0, 140));
  ok(await p.evaluate(() => !/Only you|profile/.test($('chShown').value)), 'profile check: nothing about it goes into what they read');
  await p.click('[data-chat="send"]'); await wait(p, 2000);

  // 6. suggested questions only fill the box
  const before = await p.evaluate(() => Object.values(state.chats)[0].messages.length);
  await p.click('[data-chat="qs"]'); await wait(p, 300);
  const qs = await p.evaluate(() => [...document.querySelectorAll('[data-chat="useq"]')].map(x => x.textContent));
  ok(qs.length >= 1 && qs.length <= 2, 'Smart Questions: one or two suggestions: ' + qs.join(' / '));
  await p.click('[data-chat="useq"]');
  const q2 = await p.evaluate(() => ({ box: $('chText').value, n: Object.values(state.chats)[0].messages.length }));
  ok(q2.box.length > 10 && q2.n === before, 'Smart Questions: tapping one puts it in the box to edit; nothing is sent: ' + q2.box);

  // 7. the report: every line labelled
  await p.click('[data-chat="report"]'); await wait(p, 400);
  const rep = await p.evaluate(() => [...document.querySelectorAll('.ch-report li')].map(li => ({ tag: li.querySelector('.ch-tag')?.textContent, text: li.textContent })));
  const ver = rep.filter(r => r.tag === 'Verified');
  ok(rep.length > 4 && rep.every(r => r.tag === 'Verified' || r.tag === 'Self-reported'), `report: all ${rep.length} lines say Verified or Self-reported`);
  ok(ver.length && ver.every(r => /phone verified|18 or older|pays on time|photo/.test(r.text)), 'report: Verified only for the phone check, 18+, pays on time and photos: ' + ver.map(r => r.text).join(' / '));
  await p.screenshot({ path: O + '/p14-report.png' });
  await p.click('[data-chat="report-x"]');

  // 8. both have to say yes
  await say(p, 'When can I come and see it?'); await p.click('[data-chat="send"]'); await wait(p, 2100);
  const pre = await p.evaluate(() => ({ unlocked: (state.unlocked || []).includes('demo-1'), share: !!document.querySelector('[data-chat="share"]'), req: state.requests.find(r => r.listing_id === 'demo-1').status }));
  ok(pre.share && !pre.unlocked && pre.req === 'pending', 'the owner said yes: you get "Share my number", and nothing is shared yet: ' + JSON.stringify(pre));
  await p.screenshot({ path: O + '/p14-yes.png' });
  await p.click('[data-chat="share"]'); await wait(p, 500);
  const post = await p.evaluate(() => ({ unlocked: (state.unlocked || []).includes('demo-1'), req: state.requests.find(r => r.listing_id === 'demo-1').status, done: !!document.querySelector('[data-chat="done"]') }));
  ok(post.unlocked && post.req === 'approved' && post.done, 'after both yeses the numbers are shared: ' + JSON.stringify(post));
  await closeDlgs(p);

  // 9. withdrawing closes it for both and hides what was said
  await p.evaluate(async () => { await api.sendRequest('demo-2', 'Hello'); });
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await wait(p, 1500); await closeDlgs(p);
  await p.click('#reqList [data-chatreq]'); await wait(p, 600);
  await say(p, 'Hi there'); await p.click('[data-chat="send"]'); await wait(p, 300);
  await p.click('[data-chat="close"]');
  ok(await p.evaluate(() => /Tap again/.test(document.querySelector('[data-chat="close"]').textContent)), 'closing asks once more first');
  await p.click('[data-chat="close"]'); await wait(p, 600);
  const cl = await p.evaluate(async () => { const c = Object.values(state.chats).find(x => x.listing === 'demo-2'); const g = await api.chatGet(c.id);
    return { h: document.querySelector('.ch-closed h3')?.textContent, msgs: g.messages, stored: c.messages.length, req: state.requests.find(r => r.listing_id === 'demo-2').status }; });
  ok(cl.h === 'This conversation was closed' && !cl.msgs && cl.stored === 0 && cl.req === 'withdrawn', 'closed: "This conversation was closed", the content gone, the request withdrawn: ' + JSON.stringify(cl));
  await p.screenshot({ path: O + '/p14-closed.png' });
  await closeDlgs(p);

  // 10. the lister's side: Accept waits for the seeker's "Share my number"
  await p.evaluate(() => { const l = api.all().find(x => x.id === 'demo-3');
    state.myListings.push({ ...l, id:'mine-c', owner_phone: state.user.phone, status:'active', created_at:new Date().toISOString(), unlock_count:0, private:{ address:'x', contact_name:'Neha' } });
    state.requests.push({ id:'rc1', listing_id:'mine-c', listing_title:l.title, seeker_phone:'9822222222', seeker:{ name:'Riya', occupation:{ type:'working' }, vibe:{ smoke:2, food:2, sleep:2, clean:2, cook:2, social:0 }, phone:'9822222222', interests:{} },
      status:'pending', message:'Hi', match_pct:40, created_at:new Date().toISOString(), decided_at:null, seen_owner:false, seen_seeker:true });
    state.user.role = 'owner'; state.onboarded.owner = true; save(); });
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await wait(p, 1500); await closeDlgs(p);
  await p.click('#reqList [data-chatreq="rc1"]'); await wait(p, 600);
  await p.click('[data-chat="accept"]'); await wait(p, 400);
  const ow = await p.evaluate(() => ({ req: state.requests.find(r => r.id === 'rc1').status, wait: document.querySelector('.ch-yes.wait')?.textContent || '' }));
  ok(ow.req === 'pending' && /Waiting for Riya/.test(ow.wait), 'lister accepts: nothing shared until the seeker confirms: ' + JSON.stringify(ow).slice(0, 160));
  await wait(p, 2700);
  ok(await p.evaluate(() => state.requests.find(r => r.id === 'rc1').status === 'approved' && !!document.querySelector('[data-chat="done"]')), 'the seeker confirms: now both have the numbers');
  await closeDlgs(p);

  // 11. switched off: no chat anywhere
  await p.evaluate(() => { state.chatOff = true; state.requests.push({ id:'rc2', listing_id:'mine-c', listing_title:'x', seeker_phone:'9833333333', seeker:{ name:'Asha', occupation:{}, vibe:{}, phone:'9833333333' },
    status:'pending', message:'', match_pct:null, created_at:new Date().toISOString(), seen_owner:false, seen_seeker:true }); save(); });
  await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/#requests'); await wait(p, 1500); await closeDlgs(p);
  const off = { n: await p.locator('[data-chatreq]').count(), o: await p.evaluate(() => api.chatOpen('rc2', 'en')) };
  ok(off.n === 0 && off.o.error === 'off', 'switched off: no chat buttons and nothing opens: ' + JSON.stringify(off));
  ok(net === 0, 'no AI or network calls in the demo: ' + net);
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
