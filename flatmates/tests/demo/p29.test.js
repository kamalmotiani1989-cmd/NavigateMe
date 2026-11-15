// The help bot, quicker messaging and Passes (Kamal, 15 Nov: "Fix the chat bot.. make me more better and make the
// messaging quicker. Also remove the passes from bottom bar and pop up whever the same is required. It should be in
// profile near the accout name"; and, of the chat screen, "Why is it showing so much of clank space down").
// The chat runs on the real page with the live backend on (live.html) against the stand-in server
// (stub/supabase-stub.js), whose chats behave like the database's: nothing reaches the real server. The rest runs in
// demo mode.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/', LIVE = U + 'live.html';
const STUB = fs.readFileSync(path.join(__dirname, 'stub', 'supabase-stub.js'), 'utf8');
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const seeker = extra => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: now + 9e9 }, extra);
const listing = { id:'mine-p29', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[{ type:'working', what:'Designer at an agency', age:'25–30' }], interests:{ music:['Indie'], hobbies:[] } }, vibe),
  costs:{ wifi:300 }, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park, HSR Layout, Bengaluru', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } };
const owner = extra => Object.assign({ user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true },
  attrClaimed:true, giftSeen:true, vibe, homeDraft: Object.assign({ residents:1 }, vibe), myListings:[listing], requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3) }, extra);
const splits = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9833333333', name:'Tara', role:'splits', gender:'female' }, account:'9833333333', onboarded:{ splits:true }, attrClaimed:true, giftSeen:true, notified:{} };
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const sleep = (p, ms) => p.waitForTimeout(ms);
async function demo(b, st, hash, w){ const ctx = await b.newContext({ viewport:{ width: w || 390, height:844 }, serviceWorkers:'block' });
  await ctx.addInitScript(s => { try{ if(s && !localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('demo: ' + e.message));
  await p.goto(U + (hash ? '#' + hash : '')); await sleep(p, 1900); await closeDlgs(p); await sleep(p, 250); return { ctx, p }; }
// the page with the live backend on and the stand-in server; ls: the stand-in's settings
async function live(b, st, ls, hash, h){
  const ctx = await b.newContext({ viewport:{ width:390, height: h || 844 }, serviceWorkers:'block' });
  await ctx.addInitScript(([s, ls]) => { try{ if(s && !localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); }
    for(const k in ls) localStorage.setItem('__' + k, String(ls[k])); }catch(e){} }, [st, ls || {}]);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push('live: ' + e.message)); const real = []; p.on('request', r => { if(/supabase\.co/.test(r.url())) real.push(r.url()); });
  await p.route('**/vendor/supabase-2.45.4.js', r => r.fulfill({ contentType:'application/javascript', body: STUB }));
  await p.route(/supabase\.co|googleapis\.com|gstatic\.com|google\.com/, r => r.abort());
  await p.goto(LIVE + '#' + (hash || 'discover')); await sleep(p, 2300); await closeDlgs(p); await sleep(p, 200);
  return { ctx, p, real };
}
const tabs = p => p.evaluate(() => [...document.querySelectorAll('#nav .tab')].filter(x => x.offsetParent).map(x => x.textContent.trim()).join());
// ask the help bot; what it said last, as plain words, its buttons, and which topic that answer belongs to
const ask = (p, q, fresh = true) => p.evaluate(async ([q, fresh]) => { if(fresh){ hb.log = []; hb.flow = null; } if(!$('dlgHelp').open) openHelp(); $('hbIn').value = q; $('hbForm').requestSubmit();
  for(let i = 0; i < 40 && !(hb.log.length && hb.log[hb.log.length - 1].who === 'bot'); i++) await new Promise(r => setTimeout(r, 25));   // "my tickets" asks the server first
  const bots = hb.log.filter(m => m.who === 'bot'), last = bots[bots.length - 1], said = last.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const topic = hb.flow ? hb.flow.kind : /Looks like you.re searching/.test(said) ? 'search' : /^I.m not sure/.test(said) ? 'unsure' : /^Your tickets|haven.t raised any tickets/.test(said) ? 'tickets'
    : (HB_TOPICS.find(x => !x.flow && (x.say({}) === last.html || x.say({ trouble: true }) === last.html)) || {}).id || '?';
  return { topic, said, chips: last.chips.map(c => c[0]), acts: last.chips.map(c => c[1]) }; }, [q, fresh]);
const chip = (p, label) => p.evaluate(label => { const b = [...document.querySelectorAll('#hbChips .chip')].find(x => x.textContent.includes(label)); if(b) b.click(); return !!b; }, label);
const bubbles = p => p.evaluate(() => [...document.querySelectorAll('#msgList .msg')].map(m => (m.classList.contains('mine') ? 'me: ' : 'them: ') + m.querySelector('p').textContent + ' [' + m.querySelector('time').textContent.replace(/\s+/g, ' ').trim().replace(/^\d+:\d+ [ap]m/, 'time') + ']'));
const rpc = (p, re) => p.evaluate(re => __rpc.filter(e => new RegExp(re).test(e.fn)).map(e => ({ fn: e.fn.replace('fm_thread_', ''), keys: Object.keys(e.args).join('+'), id: e.args.p_id || '', failed: !!e.failed, at: e.at })), re);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

(async () => {
  const b = await chromium.launch();
  let ctx, p, real, t, r;

  // =============================================================== Passes: off the bottom bar, a pop-up, by the name
  ({ ctx, p } = await demo(b, seeker(), 'discover'));
  t = await tabs(p);
  ok(t === 'Discover,Tribe,Parties,Splits,Market', 'someone looking for a room: the bottom bar is Discover, Tribe, Parties, Splits, Market, with no Passes: ' + t);
  ok(await p.evaluate(() => !$('view-plans') && !document.querySelector('#nav [data-view=plans]') && !VIEWS.includes('plans')), 'there is no Passes screen any more, only the pop-up');
  await p.evaluate(() => go('account')); await sleep(p, 500);
  t = await p.evaluate(() => { const b = $('accPassBtn'), n = $('accName').getBoundingClientRect(), r = b.getBoundingClientRect(), av = $('accAvEdit').getBoundingClientRect();
    return { shown: !!b.offsetParent, text: b.textContent.trim(), icon: !!b.querySelector('svg'), underName: r.top >= n.bottom - 2 && r.top - n.bottom < 90, besideAvatar: Math.abs(r.top - av.top) < 3 && r.left > av.right, tall: Math.round(r.height), inHero: !!b.closest('.acc-hero, .acc-head, #accHero, section') }; });
  ok(t.shown && t.text === 'Passes' && t.icon && t.underName && t.besideAvatar && t.tall >= 36, 'Account: a Passes button sits by the name, next to "Make your avatar": ' + JSON.stringify(t));
  await p.screenshot({ path: O + '/p29-account-pass.png' });
  await p.click('#accPassBtn'); await sleep(p, 500);
  t = await p.evaluate(() => ({ open: $('dlgPay').open, title: $('payTitle').textContent, plans: [...document.querySelectorAll('#payPlans .plan h3, #payPlans .plan b, #payPlans [data-plan]')].map(x => x.textContent.trim()).join(' | '),
    all: $('payPlans').textContent.replace(/\s+/g, ' '), trust: !$('payTrust').hidden && $('payTrust').textContent.replace(/\s+/g, ' ').trim(), view: currentView }));
  ok(t.open && t.title === 'Passes' && /Room Pass/.test(t.all) && /Tribe Pass/.test(t.all) && /Premium/.test(t.all) && /no auto-renewal/.test(t.trust) && t.view === 'account',
    'tapping it opens Passes as a pop-up over Account: Room Pass, Tribe Pass and Premium, "pay once, no auto-renewal": ' + t.title + ' · ' + t.trust);
  await p.screenshot({ path: O + '/p29-pass-popup.png' });
  await closeDlgs(p);
  await p.click('#accPlans'); await sleep(p, 400);
  ok(await p.evaluate(() => $('dlgPay').open && currentView === 'account'), 'the Passes row lower down in Account opens the same pop-up');
  await closeDlgs(p);
  // an old link or notification that points at the Passes screen
  await p.evaluate(() => { location.hash = '#plans'; }); await sleep(p, 900);
  t = await p.evaluate(() => ({ hash: location.hash, view: currentView, open: $('dlgPay').open }));
  ok(t.open && t.view === 'discover' && t.hash === '#discover', 'an old link to the Passes screen lands on Discover with the pop-up open: ' + JSON.stringify(t));
  await ctx.close();
  // wherever a pass is needed, it pops up there
  ({ ctx, p } = await demo(b, seeker({ credits:0 }), 'discover'));
  t = await p.evaluate(async () => { const id = document.querySelector('#cards .card').dataset.id; await openListing(id); await new Promise(r => setTimeout(r, 400));
    const btn = document.querySelector('#dlgListing [data-action=request]'), label = btn.textContent.trim(); btn.click(); await new Promise(r => setTimeout(r, 500));
    return { on: CHARGES_ON, label, pay: $('dlgPay').open, listing: $('dlgListing').open, lead: $('payLead').textContent, view: currentView }; });
  ok(t.on && /Room Pass/.test(t.label) && t.pay && t.view === 'discover', 'out of free contacts: asking for a room opens Passes right there, on the home: ' + JSON.stringify(t));
  await closeDlgs(p);
  await p.evaluate(() => go('tribe')); await sleep(p, 900);
  t = await p.evaluate(async () => { const y = document.querySelector('#view-tribe [data-ty]'); if(!y) return { none: true }; y.click(); await new Promise(r => setTimeout(r, 500)); return { pay: $('dlgPay').open, lead: $('payLead').textContent, view: currentView }; });
  ok(t.none || (t.pay && /Tribe Pass/.test(t.lead) && t.view === 'tribe'), 'teaming up without a Tribe Pass opens Passes on the Tribe page: ' + JSON.stringify(t));
  await ctx.close();
  // with a pass: the button says which, and how long
  ({ ctx, p } = await demo(b, seeker({ passes:{ room: iso(now + 12.4 * 864e5) } }), 'account'));
  t = await p.evaluate(() => ({ text: $('accPassBtn').textContent.trim(), label: $('accPassBtn').getAttribute('aria-label'), panel: $('accPasses').textContent.replace(/\s+/g, ' ').trim(), tabs: [...document.querySelectorAll('#nav .tab')].filter(x => x.offsetParent).map(x => x.textContent.trim()).join() }));
  ok(/^Room Pass · 13 days left$/.test(t.text) && /Room Pass/.test(t.label) && /Your passes/.test(t.panel) && t.tabs === 'Discover,Tribe,Parties,Splits,Market', 'with a Room Pass the button by the name says "Room Pass · 13 days left": ' + t.text);
  await ctx.close();
  ({ ctx, p } = await demo(b, owner(), 'mine'));
  t = await tabs(p);
  ok(t === 'My flat,Escape,Post,Parties,Splits,Market', 'someone with a room: My flat, Escape, Post, Parties, Splits, Market, with no Passes: ' + t);
  await p.evaluate(() => go('account')); await sleep(p, 500); await p.click('#accPassBtn'); await sleep(p, 450);
  t = await p.evaluate(() => ({ open: $('dlgPay').open, title: $('payTitle').textContent, all: $('payPlans').textContent.replace(/\s+/g, ' ') }));
  ok(t.open && t.title === 'Escape Pass' && /Escape Pass/.test(t.all) && !/Room Pass/.test(t.all), 'for them the button opens the Escape Pass');
  await ctx.close();
  ({ ctx, p } = await demo(b, splits, 'account'));
  ok(await p.evaluate(() => $('accPassBtn').hidden), 'a Flatsplits-only account has no Passes button (it has nothing to buy a pass for)');
  await ctx.close();
  ({ ctx, p } = await demo(b, seeker(), 'discover', 1280));
  t = await tabs(p);
  ok(t === 'Discover,Tribe,Saved,Parties,Splits,Market', 'on a computer the top row has no Passes either: ' + t);
  await ctx.close();

  // =============================================================== the help bot
  ({ ctx, p } = await demo(b, seeker(), 'discover'));
  const QS = [['how do i message the owner', 'messages'], ['what is a room pass', 'price'], ['how do i block someone', 'block'], ['i didnt get the otp', 'login'], ['otp nahi aaya', 'login'],
    ['how to change my answers', 'answers'], ['where are my saved homes', 'saved'], ['how do i make an avatar', 'avatar'], ['how do i book a visit', 'visit'], ['refer a friend', 'refer'],
    ['how many free contacts do i have', 'contacts'], ['i paid but pass not active', 'payment'], ['owner is not replying', 'waiting'], ['the owner said no', 'declined'], ['owner accepted what next', 'yes'],
    ['how do i delete my account', 'delete'], ['change my phone number', 'number'], ['who can see my number', 'privacy'], ['hide my profile', 'hide'], ['someone asked for token money', 'safety'],
    ['are there brokers', 'broker'], ['someone is harassing me', 'report'], ['the app is not working', 'bug'], ['how do i split the rent', 'splits'], ['plan a house party', 'party'],
    ['parties near me', 'near'], ['sell my fridge', 'market'], ['how does the vibe score work', 'vibe'], ['how do i find a flatmate', 'tribe'], ['leave my tribe', 'leave'],
    ['how do i list my room', 'post'], ['how to search near my office', 'map'], ['which cities do you cover', 'cities'], ['women only flats', 'women'], ['veg only homes', 'filters'],
    ['why am i seeing low match homes', 'sort'], ['too many notifications', 'notify'], ['is there an android app', 'app'], ['talk to a human', 'human'], ['my ticket status', 'tickets'],
    ['what is the move in kit', 'kit'], ['how does it work', 'about'], ['hi', 'hello'], ['thanks', 'thanks'], ['cancel my request', 'withdraw'],
    ['why cant i see any homes', 'nohomes'], ['are you a robot', 'bot'], ['hey can you tell me how to chat with flat owner', 'messages'], ['paisa kitna lagega', 'price'], ['shikayat karni hai', 'report'],
    ['pasword', 'login'], ['notifcations off', 'notify'], ['change city', 'cities'], ['is it available in jaipur', 'cities'], ['i want a refund', 'payment']];
  let wrong = [];
  for(const [q, want] of QS){ r = await ask(p, q); if(r.topic !== want) wrong.push(`"${q}" → ${r.topic} (wanted ${want})`); }
  ok(!wrong.length, `${QS.length} everyday questions, each in the words people use, get the answer about the right thing` + (wrong.length ? ': ' + wrong.join('; ') : ''));
  r = await ask(p, 'how do i message the owner');
  ok(/Message button/.test(r.said) && /chat icon/.test(r.said) && !/Tap Post/.test(r.said) && r.chips.includes('Open Messages'), '"how do I message the owner" is answered about messages (it used to explain how to list a room): ' + r.said.slice(0, 70));
  r = await ask(p, 'how do i contact the owner');
  ok(/Send request/.test(r.said) && /5 free contacts/.test(r.said) && !/Ask to meet/.test(r.said), 'answers use the app\'s own button names and your own numbers: "Send request", "You have 5 free contacts left"');
  r = await ask(p, 'what is the meaning of life');
  ok(r.topic === 'unsure' && r.chips.includes('🙋 Talk to a person') && r.chips.includes('↩ Something else'), 'something it doesn\'t know: it says so and offers a person, never a dead end: ' + r.said);
  r = await ask(p, 'who won the match yesterday');
  ok(r.topic === 'unsure' && /Did you mean/.test(r.said) && r.chips.includes('The vibe score'), 'a word it half-knows: "Did you mean…" with its best guess as a button: ' + r.chips.join(' · '));
  r = await ask(p, 'saved homes on the map');
  ok(r.topic === 'saved' && r.chips.includes('Or: Searching near a place'), 'when two things are close it answers the likelier one and offers the other: ' + r.chips.filter(c => /^Or: /.test(c)).join(' · '));
  r = await ask(p, 'i cant send messages');
  ok(r.topic === 'messages' && /Not sent/.test(r.said) && r.acts.includes('fix:bug'), '"I can\'t send messages": what to check, and "Still stuck? Tell the team"');
  await chip(p, 'Tell the team'); await sleep(p, 300);
  t = await p.evaluate(() => ({ flow: hb.flow && [hb.flow.kind, hb.flow.cat, hb.flow.step].join(), said: Object.assign(document.createElement('div'), { innerHTML: hb.log[hb.log.length - 1].html }).textContent }));
  ok(t.flow === 'grievance,bug,text' && /under “Something isn't working”/.test(t.said), 'that starts a note to the team with the kind already filled in: ' + t.said.slice(0, 60));
  await p.evaluate(() => { $('hbIn').value = 'The Send button did nothing when I tapped it twice in my chat with Rohit.'; $('hbForm').requestSubmit(); }); await sleep(p, 200);
  await chip(p, 'Send it'); await sleep(p, 600);
  t = await p.evaluate(() => hb.log[hb.log.length - 1].html.replace(/<[^>]+>/g, ' '));
  ok(/Sent\. Your ticket is\s+FMF-/.test(t) && /within 24 hours/.test(t), 'and it is filed as a ticket with a code: ' + t.slice(0, 60));
  // a search said the way you'd tell a friend
  r = await ask(p, 'room in pune under 15k');
  ok(r.topic === 'search' && /Pune/.test(r.said) && /15,000/.test(r.said) && r.chips[0] === '🔎 Show me these homes', '"room in Pune under 15k" is a search: it offers to run it: ' + r.said);
  await chip(p, 'Show me these homes'); await sleep(p, 1500);
  t = await p.evaluate(() => ({ help: $('dlgHelp').open, view: currentView, city: prefs().city, max: prefs().max, look: prefs().look, cards: document.querySelectorAll('#cards .card').length }));
  ok(!t.help && t.view === 'discover' && t.city === 'Pune' && t.max === 15000 && t.look === 'room', 'and Discover then shows Pune, private rooms, up to ₹15,000: ' + JSON.stringify(t));
  // buttons under the answers do what they say
  r = await ask(p, 'what passes do you have'); await chip(p, 'See passes'); await sleep(p, 500);
  ok(r.topic === 'price' && await p.evaluate(() => $('dlgPay').open && !$('dlgHelp').open), '"See passes" under the answer about prices opens the Passes pop-up');
  await closeDlgs(p);
  r = await ask(p, 'how do i see who i blocked'); await chip(p, 'Blocked people'); await sleep(p, 500);
  ok(r.topic === 'block' && await p.evaluate(() => $('dlgBlocked').open), '"Blocked people" opens the list of people you blocked');
  await closeDlgs(p);
  r = await ask(p, 'how do i make an avatar'); await chip(p, 'Make my avatar'); await sleep(p, 500);
  ok(await p.evaluate(() => $('dlgAvatar').open), '"Make my avatar" opens the avatar maker');
  await closeDlgs(p);
  r = await ask(p, 'i didnt get the otp');
  ok(/6-digit code/.test(r.said) && /WhatsApp/.test(r.said) && !/\b\d{6}\b/.test(r.said) && !/test/i.test(r.said), 'the sign-in answer explains the code and gives none away: ' + r.said.slice(0, 80));
  await p.evaluate(() => { hb.log = []; openHelp(); }); await sleep(p, 300);
  await ask(p, 'how do i message the owner', false); await p.screenshot({ path: O + '/p29-bot.png' });
  await ctx.close();
  // someone with a room to fill gets their own answers
  ({ ctx, p } = await demo(b, owner(), 'mine'));
  wrong = [];
  for(const [q, want] of [['what is escape the room', 'escape'], ['how do i invite someone to my room', 'escape'], ['how do i edit my listing', 'edit'], ['change the rent', 'edit'], ['my room is rented', 'rented'],
    ['remove my listing', 'rented'], ['who is looking for a room', 'escape'], ['nobody is sending requests', 'norequests'], ['how to share my listing', 'share'], ['escape pass', 'price'], ['how do i accept a request', 'ask']]){
    r = await ask(p, q); if(r.topic !== want) wrong.push(`"${q}" → ${r.topic} (wanted ${want})`); }
  ok(!wrong.length, 'someone with a room to fill: 11 of their questions (the Escape, editing, "my room is rented", no requests)' + (wrong.length ? ': ' + wrong.join('; ') : ' all land right'));
  r = await ask(p, 'how do i find a room');
  ok(/Look for a room instead/.test(r.said) && r.chips.includes('Open Escape'), 'and "find a room" tells them how to switch, instead of describing a screen they don\'t have: ' + r.said.slice(0, 60));
  t = await p.evaluate(() => { hb.log = []; hb.flow = null; openHelp(); return hb.log[0].chips.map(c => c[0]); });
  ok(t.includes('🚪 Find people for my room') && t.includes('✏️ Change my listing') && t.includes('📋 My tickets'), 'their first buttons are about their room: ' + t.join(' · '));
  await ctx.close();
  // signed out, on the welcome page
  ({ ctx, p } = await demo(b, null, ''));
  wrong = [];
  for(const [q, want] of [['how do i sign up', 'login'], ['how do i list my room', 'post'], ['is it free', 'price'], ['how does it work', 'about'], ['is my data safe with you', 'privacy']]){
    r = await ask(p, q); if(r.topic !== want) wrong.push(`"${q}" → ${r.topic}`); }
  ok(!wrong.length, 'signed out: signing up, listing a room, prices, how it works and privacy are answered' + (wrong.length ? ': ' + wrong.join('; ') : ''));
  r = await ask(p, 'someone is harassing me');
  ok(/sign in first/i.test(r.said) && r.chips.includes('Sign in'), 'a report needs an account, and it says so: ' + r.said.slice(0, 60));
  await ctx.close();
  // the live app while sign-up isn't open to everyone: the sign-in answer says so, and nothing about how codes work
  ({ ctx, p } = await live(b, null, { session:'none', lat: 80 }, ''));
  r = await ask(p, 'i didnt get the otp');
  t = await p.evaluate(() => ({ live: LIVE, test: FM_CONFIG.testLogin }));
  ok(t.live && (!t.test || (/a few people at a time/.test(r.said) && !/WhatsApp/.test(r.said))) && !/test|\b\d{6}\b|private code|shared code/i.test(r.said),
    'live, while we open to a few people at a time: "a code may not reach you yet", and not a word on how codes are made: ' + r.said.slice(0, 90));
  await ctx.close();

  // =============================================================== quicker messaging (the live app, the stand-in server)
  ({ ctx, p, real } = await live(b, seeker(), { lat: 300 }, 'messages'));
  t = await p.evaluate(() => [...document.querySelectorAll('#msgsList .msg-row')].map(x => x.querySelector('b').textContent));
  ok(t.join() === 'Your tribe,Room in Baner', 'Messages lists the chats: ' + t.join(' · '));
  // opening from the list
  t = await p.evaluate(async () => { const n0 = __rpc.length, t0 = performance.now(); document.querySelector('#msgsList .msg-row[data-thread="stub-thread-1"]').click();
    const at0 = { open: $('dlgMsg').open, ms: Math.round(performance.now() - t0), title: $('msgTitle').textContent.trim(), list: $('msgList').textContent.trim() };
    await new Promise(r => { const i = setInterval(() => { if(document.querySelectorAll('#msgList .msg').length){ clearInterval(i); r(); } }, 10); });
    const filled = Math.round(performance.now() - t0); await new Promise(r => setTimeout(r, 150));
    return { at0, filled, n: document.querySelectorAll('#msgList .msg').length, title: $('msgTitle').textContent.trim(), sub: $('msgSub').textContent, calls: __rpc.slice(n0).filter(e => /fm_thread/.test(e.fn)).map(e => e.fn.replace('fm_thread_', '') + ':' + Object.keys(e.args).join('+')) }; });
  ok(t.at0.open && t.at0.ms < 100 && t.at0.title === 'Room in Baner' && /Opening the chat/.test(t.at0.list), `a chat opens the moment it's tapped, with its name and "Opening the chat…" (${t.at0.ms} ms; it used to wait for the server first)`);
  ok(t.n === 3 && t.filled < 300 + 250 && t.title === 'Rohit' && t.sub === 'Room · Room in Baner' && t.calls[0] === 'get:p_thread' && !t.calls.some(c => /^open/.test(c)),
    `and fills in after one answer from the server (${t.filled} ms on a 300 ms network): ` + t.calls.join(' '));
  // the screen: the box at the bottom, the messages just above it
  t = await p.evaluate(() => { const d = $('dlgMsg').getBoundingClientRect(), f = $('msgForm').getBoundingClientRect(), l = $('msgList'), lr = l.getBoundingClientRect(), last = [...l.querySelectorAll('.msg')].pop().getBoundingClientRect();
    return { dlg: Math.round(d.height), screen: innerHeight, under: Math.round(d.bottom - f.bottom), gap: Math.round(f.top - last.bottom), listTall: Math.round(lr.height), dlgScrolls: $('dlgMsg').scrollHeight > $('dlgMsg').clientHeight + 1 }; });
  ok(t.dlg === t.screen && t.under <= 24 && t.gap <= 24 && t.listTall > 500 && !t.dlgScrolls, 'the chat fills the screen: the box to write in is at the bottom and the newest message sits just above it (it used to leave the lower half empty): ' + JSON.stringify(t));
  await p.screenshot({ path: O + '/p29-chat.png' });
  // sending
  t = await p.evaluate(async () => { const n0 = __rpc.length, t0 = performance.now(); $('msgText').value = 'See you at 11 then'; $('msgForm').requestSubmit();
    const last = () => { const m = [...document.querySelectorAll('#msgList .msg')].pop(); return { text: m.querySelector('p').textContent, line: m.querySelector('time').textContent.trim(), cls: m.className }; };
    const at0 = { ms: Math.round(performance.now() - t0), last: last(), box: $('msgText').value, locked: $('msgForm').querySelector('button').disabled || $('msgText').disabled, n: document.querySelectorAll('#msgList .msg').length, focus: document.activeElement === $('msgText') };
    $('msgText').value = 'And one more'; $('msgForm').requestSubmit(); const two = document.querySelectorAll('#msgList .msg.sending').length;
    await new Promise(r => { const i = setInterval(() => { if(!document.querySelector('#msgList .msg.sending')){ clearInterval(i); r(); } }, 10); });
    const done = Math.round(performance.now() - t0); await new Promise(r => setTimeout(r, 100));
    return { at0, two, done, last: last(), n: document.querySelectorAll('#msgList .msg').length, calls: __rpc.slice(n0).filter(e => /fm_thread/.test(e.fn)).map(e => ({ fn: e.fn.replace('fm_thread_', ''), keys: Object.keys(e.args).join('+'), id: e.args.p_id, body: e.args.p_body })) }; });
  ok(t.at0.ms < 100 && t.at0.n === 4 && t.at0.last.text === 'See you at 11 then' && /Sending/.test(t.at0.last.line) && t.at0.box === '' && !t.at0.locked && t.at0.focus,
    `a message shows the moment it's sent (${t.at0.ms} ms) and the box is free for the next one (it used to lock for two round trips)`);
  r = t.calls.filter(c => c.fn === 'send');
  ok(t.two === 2 && r.length === 2 && r[0].body === 'See you at 11 then' && r[1].body === 'And one more' && r.every(c => c.keys === 'p_thread+p_body+p_id' && UUID.test(c.id)) && r[0].id !== r[1].id,
    'a second one typed straight after goes out behind it, in order, each with its own id: ' + r.map(c => c.body).join(' → '));
  ok(t.n === 5 && /^\d+:\d\d [ap]m$/.test(t.last.line) && !/sending/.test(t.last.cls) && !t.calls.some(c => c.fn === 'get' && c.keys === 'p_thread'),
    `once the server has it the bubble shows its time, and the chat isn't read all over again (${t.done} ms for both)`);
  // receiving
  t = await p.evaluate(async () => { const l = $('msgList'), first = l.firstElementChild, n0 = l.children.length, r0 = __rpc.length, t0 = performance.now(); __chat.say('stub-thread-1', 'Perfect, see you then!');
    await new Promise(r => { const i = setInterval(() => { if(/Perfect, see you then/.test(l.textContent)){ clearInterval(i); r(); } }, 10); });
    const ms = Math.round(performance.now() - t0); await new Promise(r => setTimeout(r, 4700));
    const gets = __rpc.slice(r0).filter(e => e.fn === 'fm_thread_get');
    return { ms, added: l.children.length - n0, same: first === l.firstElementChild, last: [...l.querySelectorAll('.msg')].pop().className, gets: gets.length, allAfter: gets.every(e => e.args.p_after), gap: gets.length > 1 ? Math.round((gets[gets.length - 1].at - gets[0].at) / (gets.length - 1)) : 0,
      atEnd: Math.round(l.scrollHeight - l.scrollTop - l.clientHeight) }; });
  ok(t.ms <= 2600 && t.added === 1 && t.same && /theirs/.test(t.last) && t.atEnd < 5, `the other person's message is on screen within ${t.ms} ms (it was up to 5 seconds), added as one bubble without redrawing the rest`);
  ok(t.gets >= 2 && t.gets <= 4 && t.allAfter && t.gap >= 2000 && t.gap <= 2700, `while the chat is open it asks every 2 seconds, and only for what's new (${t.gets} asks, ${t.gap} ms apart, each with p_after)`);
  // closed and opened again: there at once
  t = await p.evaluate(async () => { $('dlgMsg').close(); await new Promise(r => setTimeout(r, 700)); const quiet0 = __rpc.filter(e => e.fn === 'fm_thread_get').length; await new Promise(r => setTimeout(r, 2600));
    const quiet = __rpc.filter(e => e.fn === 'fm_thread_get').length - quiet0, n0 = __rpc.length, t0 = performance.now(); openMsg('room', 'stub-req-1');
    const at0 = { open: $('dlgMsg').open, n: document.querySelectorAll('#msgList .msg').length, ms: Math.round(performance.now() - t0) };
    await new Promise(r => setTimeout(r, 900)); return { quiet, at0, calls: __rpc.slice(n0).filter(e => /fm_thread_(open|get)/.test(e.fn)).map(e => e.fn.replace('fm_thread_', '') + ':' + Object.keys(e.args).join('+')) }; });
  ok(t.quiet === 0, 'a closed chat asks the server nothing');
  ok(t.at0.open && t.at0.n === 6 && t.at0.ms < 100 && t.calls.join() === 'get:p_thread', `opened again, the whole chat is there at once (${t.at0.ms} ms) and is then checked with one call: ` + t.calls.join(' '));
  ok(!real.length, 'none of this reached the real server');
  await ctx.close();

  // a Message button for a chat this phone hasn't seen; and one that isn't allowed yet
  ({ ctx, p } = await live(b, seeker(), { lat: 300 }, 'discover'));
  t = await p.evaluate(async () => { state.msgIds = {}; const n0 = __rpc.length, t0 = performance.now(); openMsg('room', 'stub-req-1');
    const at0 = { open: $('dlgMsg').open, text: $('msgList').textContent.trim(), form: !$('msgForm').hidden, sub: $('msgSub').textContent };
    await new Promise(r => { const i = setInterval(() => { if(document.querySelectorAll('#msgList .msg').length){ clearInterval(i); r(); } }, 10); });
    const filled = Math.round(performance.now() - t0); await new Promise(r => setTimeout(r, 250));
    return { at0, filled, calls: __rpc.slice(n0).filter(e => /fm_thread_(open|get)/.test(e.fn)).map(e => e.fn.replace('fm_thread_', '')), focus: document.activeElement === $('msgText'), kept: state.msgIds['room:stub-req-1'] }; });
  ok(t.at0.open && /Opening the chat/.test(t.at0.text) && !t.at0.form && t.at0.sub === 'Room' && t.calls.join() === 'open,get' && t.focus && t.kept === 'stub-thread-1',
    `"Message" on a new connection: the chat is up at once saying it's opening, filled after two answers (${t.filled} ms), and the phone remembers which chat it is`);
  t = await p.evaluate(async () => { $('dlgMsg').close(); openMsg('room', 'not-a-yes-yet'); const o = $('dlgMsg').open; await new Promise(r => setTimeout(r, 800)); return { o, after: $('dlgMsg').open, toast: (document.querySelector('.toast') || {}).textContent }; });
  ok(t.o && !t.after && /once you.ve both said yes/.test(t.toast), 'no yes yet: the chat closes again and says why: ' + t.toast);
  // two chats tapped one after the other on a slow network: the second is the one shown
  t = await p.evaluate(async () => { state.msgIds = {}; openMsg('room', 'stub-req-1'); await new Promise(r => setTimeout(r, 100)); $('dlgMsg').close(); openMsg('tribe', 'stub-tribe-1');
    await new Promise(r => setTimeout(r, 1500)); return { title: $('msgTitle').textContent.trim(), sub: $('msgSub').textContent, first: (document.querySelector('#msgList .msg p') || {}).textContent }; });
  ok(t.title === 'Zoya' && t.sub === 'Tribe · Your tribe' && /Kothrud/.test(t.first), 'two chats tapped one after the other: the one tapped last is the one shown: ' + t.title);
  await ctx.close();

  // a bad connection
  ({ ctx, p } = await live(b, seeker(), { lat: 120 }, 'discover'));
  await p.evaluate(() => openMsg('room', 'stub-req-1')); await sleep(p, 600);
  await p.evaluate(() => { __chat.fail(2, 'network'); $('msgText').value = 'First try'; $('msgForm').requestSubmit(); $('msgText').value = 'Typed right after'; $('msgForm').requestSubmit(); });
  await sleep(p, 500); t = (await bubbles(p)).slice(-2);
  ok(t.join() === 'me: First try [Sending…],me: Typed right after [Sending…]', 'the connection drops: both messages wait, marked "Sending…"');
  await sleep(p, 6600); t = (await bubbles(p)).slice(-2); r = (await rpc(p, 'fm_thread_send'));
  ok(t.join() === 'me: First try [time],me: Typed right after [time]' && r.length === 4 && r.slice(0, 3).every(c => c.id === r[0].id) && r[0].failed && r[1].failed && !r[2].failed && r[3].id !== r[0].id,
    'it tries again by itself (after 1.5 s, then 4 s) with the same id, and both arrive, in order: ' + r.map(c => (c.failed ? 'x' : 'ok')).join(' '));
  await p.evaluate(() => { __chat.fail(3, 'network'); $('msgText').value = 'Stuck one'; $('msgForm').requestSubmit(); $('msgText').value = 'Behind it'; $('msgForm').requestSubmit(); });
  await sleep(p, 6900); t = (await bubbles(p)).slice(-2);
  r = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.textContent).join('|'));
  ok(t.join() === 'me: Stuck one [Not sent · Try again · Remove],me: Behind it [Not sent · Try again · Remove]' && /Couldn.t send/.test(r), 'still no connection after three tries: "Not sent", with Try again and Remove, and the one typed after it waits too');
  await p.screenshot({ path: O + '/p29-chat-not-sent.png' });
  await p.evaluate(() => document.querySelector('[data-msg-retry]').click()); await sleep(p, 900);
  t = (await bubbles(p)).slice(-2); r = await p.evaluate(() => __chat.threads[0].messages.filter(m => /Stuck one|Behind it/.test(m.body)).map(m => m.body));
  ok(t.join() === 'me: Stuck one [time],me: Behind it [time]' && r.join() === 'Stuck one,Behind it', 'Try again sends them, in the order they were written');
  await p.evaluate(() => { __chat.fail(1, 'lost'); $('msgText').value = 'Lost answer'; $('msgForm').requestSubmit(); }); await sleep(p, 2600);
  t = (await bubbles(p)).slice(-1); r = await p.evaluate(() => ({ saved: __chat.threads[0].messages.filter(m => m.body === 'Lost answer').length, shown: [...document.querySelectorAll('#msgList .msg p')].filter(x => x.textContent === 'Lost answer').length }));
  ok(t[0] === 'me: Lost answer [time]' && r.saved === 1 && r.shown === 1, 'the server took a message but its answer was lost: trying again does not send it twice (saved once, shown once)');
  await p.evaluate(() => { __chat.fail(1, 'rate-limited'); $('msgText').value = 'One too many'; $('msgForm').requestSubmit(); }); await sleep(p, 500);
  t = (await bubbles(p)).slice(-1); r = await rpc(p, 'fm_thread_send');
  ok(/Not sent/.test(t[0]) && r.filter(c => c.failed).slice(-2).length === 2 && r[r.length - 1].failed && r[r.length - 2].id !== r[r.length - 1].id, 'the server says "too many": it is not tried again by itself, and says Not sent');
  await p.evaluate(() => document.querySelector('[data-msg-drop]').click()); await sleep(p, 150);
  ok((await bubbles(p)).slice(-1)[0] === 'me: Lost answer [time]', 'Remove takes an unsent message away');
  await ctx.close();

  // a server from before "only what's new" and message ids: the plain calls still work
  ({ ctx, p } = await live(b, seeker(), { lat: 120 }, 'discover'));
  await p.evaluate(() => { __chat.old = true; openMsg('room', 'stub-req-1'); }); await sleep(p, 600);
  await p.evaluate(() => { $('msgText').value = 'To an old server'; $('msgForm').requestSubmit(); }); await sleep(p, 700);
  await p.evaluate(() => __chat.say('stub-thread-1', 'Old server reply')); await sleep(p, 2700);
  t = (await bubbles(p)).slice(-2); r = (await rpc(p, 'fm_thread_(get|send)')).map(c => (c.failed ? 'x ' : 'ok ') + c.fn + ' ' + c.keys);
  ok(t.join() === 'me: To an old server [time],them: Old server reply [time · Report]' && r.includes('x send p_thread+p_body+p_id') && r.includes('ok send p_thread+p_body') && r.includes('x get p_thread+p_after') && r[r.length - 1] === 'ok get p_thread',
    'if the server somehow doesn\'t know the new calls yet, the chat falls back to the plain ones and still works');
  await ctx.close();

  // a long chat: reading further up isn't disturbed; at the end it follows; quiet chats ask less often; the keyboard
  ({ ctx, p } = await live(b, seeker(), { lat: 100 }, 'discover'));
  await p.evaluate(() => { const t = __chat.threads[0]; for(let i = 0; i < 60; i++) t.messages.push({ id: 'long-' + i, mine: i % 2 === 0, name: i % 2 ? 'Rohit' : 'Neha', body: 'Line ' + i + ' of a long chat that goes on', at: new Date(Date.now() - (4000 - i * 10) * 1000).toISOString() }); openMsg('room', 'stub-req-1'); });
  await sleep(p, 700);
  t = await p.evaluate(async () => { const l = $('msgList'), atEnd = Math.round(l.scrollHeight - l.scrollTop - l.clientHeight), scrolls = l.scrollHeight > l.clientHeight + 200; l.scrollTop = 300; await new Promise(r => setTimeout(r, 80)); const first = l.firstElementChild;
    __chat.say('stub-thread-1', 'While you were reading up'); await new Promise(r => setTimeout(r, 2500));
    const up = { top: l.scrollTop, there: /While you were reading up/.test(l.textContent), same: first === l.firstElementChild };
    l.scrollTop = l.scrollHeight; await new Promise(r => setTimeout(r, 80)); __chat.say('stub-thread-1', 'And now at the end'); await new Promise(r => setTimeout(r, 2500));
    return { atEnd, scrolls, up, end: Math.round(l.scrollHeight - l.scrollTop - l.clientHeight), dlg: $('dlgMsg').scrollHeight <= $('dlgMsg').clientHeight + 1 }; });
  ok(t.scrolls && t.atEnd < 5 && t.dlg, 'a long chat opens on its newest message and scrolls inside the screen, the box staying put');
  ok(t.up.there && t.up.top === 300 && t.up.same && t.end < 5, 'a new message doesn\'t move you while you read further up; when you\'re at the end the chat follows it');
  await p.setViewportSize({ width: 390, height: 500 }); await sleep(p, 400);
  t = await p.evaluate(() => { const l = $('msgList'), d = $('dlgMsg').getBoundingClientRect(), f = $('msgForm').getBoundingClientRect(); return { end: Math.round(l.scrollHeight - l.scrollTop - l.clientHeight), under: Math.round(d.bottom - f.bottom), h: Math.round(d.height) }; });
  ok(t.h === 500 && t.under <= 24 && t.end < 5, 'when the keyboard takes half the screen the box stays above it and the chat stays on its newest message: ' + JSON.stringify(t));
  await p.setViewportSize({ width: 390, height: 844 });
  t = await p.evaluate(async () => { msgActive = Date.now() - 130000; await new Promise(r => setTimeout(r, 2400)); const n0 = __rpc.filter(e => e.fn === 'fm_thread_get').length; await new Promise(r => setTimeout(r, 10400)); return __rpc.filter(e => e.fn === 'fm_thread_get').length - n0; });
  ok(t >= 1 && t <= 3, `after two quiet minutes an open chat asks every 5 seconds instead of 2 (${t} asks in 10 seconds)`);
  // an empty chat
  t = await p.evaluate(async () => { $('dlgMsg').close(); __chat.threads[1].messages = []; state.msgIds = {}; openMsg('tribe', 'stub-tribe-1'); await new Promise(r => setTimeout(r, 600));
    const h = document.querySelector('#msgList .msg-empty').getBoundingClientRect(), l = $('msgList').getBoundingClientRect(); return { text: $('msgList').textContent.trim(), mid: Math.abs((h.top + h.bottom) / 2 - (l.top + l.bottom) / 2) < 40, form: !$('msgForm').hidden }; });
  ok(/^Say hello\. Never pay/.test(t.text) && t.mid && t.form, 'an empty chat says hello in the middle of the screen, with the safety line');
  await ctx.close();

  // the count on the chat button; and nothing of one account's chats is left for the next
  ({ ctx, p } = await live(b, seeker(), { lat: 80 }, 'discover'));
  t = await p.evaluate(async () => { await refreshMsgUnseen(); const b0 = msgUnseen; __chat.say('stub-thread-1', 'Are you still looking?'); api.fresh('fm_thread_list'); await refreshMsgUnseen();
    return { every: MSG_BADGE_MS, b0, b1: msgUnseen, toast: [...document.querySelectorAll('.toast')].map(x => x.textContent).join('|'), badge: (document.querySelector('#topActs [data-view=messages] .badge, .hd-msgs .badge, [data-view=messages] .badge') || {}).textContent }; });
  ok(t.every === 20000 && t.b0 === 0 && t.b1 === 1 && /New message · Room in Baner/.test(t.toast) && t.badge === '1', 'a new message while no chat is open: the count on the chat button and a short notice, checked every 20 seconds (it was 60): ' + t.toast);
  t = await p.evaluate(async () => { openMsg('room', 'stub-req-1'); await new Promise(r => setTimeout(r, 500)); $('msgText').value = 'Yes I am'; $('msgForm').requestSubmit(); await new Promise(r => setTimeout(r, 400));
    const had = Object.keys(msgSeen).length; $('dlgMsg').close(); switchAccount('9899999999'); return { had, left: Object.keys(msgSeen).length, out: msgOut.length, rows: msgRows.length }; });
  ok(t.had === 1 && t.left === 0 && t.out === 0 && t.rows === 0, 'another number signing in on the same phone starts with none of the last one\'s chats in memory');
  await ctx.close();

  // demo mode keeps working the same way (the sample person answers by themselves)
  ({ ctx, p } = await demo(b, seeker({ requests:[{ id:'rq-p29', listing_id:'demo-1', seeker_phone:'9811111111', status:'approved', created_at: iso(now - 864e5), decided_at: iso(now - 3600e3) }] }), 'requests'));
  t = await p.evaluate(async () => { const m = document.querySelector('[data-msg]'); if(!m) return { none: true }; m.click(); await new Promise(r => setTimeout(r, 300)); $('msgText').value = 'Hello from the demo'; $('msgForm').requestSubmit();
    const at0 = [...document.querySelectorAll('#msgList .msg p')].map(x => x.textContent); await new Promise(r => setTimeout(r, 2300));
    return { at0, after: [...document.querySelectorAll('#msgList .msg')].map(x => x.className.replace('msg ', '')), open: $('dlgMsg').open }; });
  ok(t.none || (t.at0.includes('Hello from the demo') && t.after.includes('theirs') && !t.after.some(c => /sending|failed/.test(c))), 'demo mode: the message shows at once and the sample person answers a moment later: ' + JSON.stringify(t).slice(0, 120));
  await ctx.close();

  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
