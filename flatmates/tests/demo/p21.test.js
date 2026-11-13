// Avatars (Kamal, 13 Nov; demo mode, port 8765, 390 wide): the maker (Skip, pick, save, edit, remove), the neutral
// default when there's none (never a guessed face), every list showing avatars instead of letters, the Vibe Card
// (live on screen, a still in the shared image), Account, the owner's own row in "who lives there", the type layer
// following the answers, still small avatars, and reduced motion.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: now + 9e9 };
const listing = { id:'mine-p21', kind:'room', title:'Sunny room near the metro', city:'Bengaluru', locality:'HSR Layout', bhk:2, rent:15000, deposit:30000,
  available_from:'2026-12-01', gender:'any', furnishing:'semi', bachelors:true, amenities:['Wi-Fi'], description:'Short.', photos:[],
  household: Object.assign({ residents:1, flatmates:[], interests:{ music:[], hobbies:[] } }, vibe), costs:{}, owner_phone:'9822222222', status:'active', created_at: iso(now - 5 * 864e5), unlock_count:0,
  private:{ contact_name:'Rohit', contact_phone:'9822222222', address:'B-304, Green Park', address_parts:{ flat:'B-304', building:'Green Park', street:'', landmark:'', pin:'560102' } } };
const owner = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9822222222', name:'Rohit', role:'owner', gender:'male' }, account:'9822222222', onboarded:{ owner:true }, attrClaimed:true, giftSeen:true, vibe,
  homeDraft: Object.assign({ residents:1 }, vibe), myListings:[listing], requests:[], demoIncoming:{}, notified:{}, waitNudged: now, seekerSince: iso(now - 3600e3), passes:{ escape: iso(now + 7 * 864e5) } };
const seed = (ctx, s) => ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, s);
const closeDlgs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const go = async (p, h) => { await p.goto('http://localhost:8765/#discover'); await p.goto('http://localhost:8765/' + h); await p.waitForTimeout(1500); await closeDlgs(p); await p.waitForTimeout(300); };
// in a list: how many avatar spots, how many drawn as a person, how many the default, and no letters left
const avs = (p, sel) => p.evaluate(sel => { const e = [...document.querySelectorAll(sel)];
  return { n: e.length, person: e.filter(x => x.querySelector('svg.fm-av:not(.av-none)')).length, none: e.filter(x => x.querySelector('svg.av-none')).length,
    letters: e.filter(x => x.textContent.trim().length).length }; }, sel);
(async () => {
  const b = await chromium.launch();
  let ctx = await b.newContext({ viewport:{ width:390, height:844 } }); await seed(ctx, seeker);
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await go(p, '#discover');

  // no avatar yet: the letter in the top bar, the maker opens on a neutral picture, and Save waits for a skin tone
  ok(await p.evaluate(() => $('meBtn').textContent.trim() === 'N' && !state.avatar), 'no avatar: the top bar keeps the initial');
  await p.evaluate(() => openAvatarMaker('account')); await p.waitForTimeout(300);
  const m0 = await p.evaluate(() => ({ none: !!$('avStage').querySelector('.av-none'), save: $('avSave').disabled, note: $('avNote').textContent, skip: $('avSkip').textContent,
    rows: [...document.querySelectorAll('.av-row h3')].map(h => h.textContent), skins: document.querySelectorAll('[data-avk-set="s"]').length,
    picked: document.querySelectorAll('[data-avk-set="s"][aria-checked="true"]').length }));
  ok(m0.none && m0.save && m0.picked === 0 && /nothing is guessed/.test(m0.note) && m0.skip === 'Skip', 'the maker starts neutral: no skin tone picked for you, Save waits: ' + m0.note);
  ok(m0.rows.join() === 'Skin tone,Face,Hair,Head covering,Glasses and beard,Top' && m0.skins === 6, 'six rows of round tiles, six skin tones: ' + m0.rows.join(' / '));
  await p.screenshot({ path: O + '/p21-maker-empty.png' });
  // pick: the cartoon updates live
  await p.click('[data-avk-set="s"][data-avv="s4"]'); const a1 = await p.evaluate(() => $('avStage').innerHTML.length);
  await p.click('[data-avk-set="c"][data-avv="hijab"]'); await p.click('[data-avk-set="f"][data-avv="grin"]'); await p.click('[data-avk-set="t"][data-avv="#C3E0D6"]');
  const m1 = await p.evaluate(() => ({ live: !$('avStage').querySelector('.av-none') && !$('avStage').querySelector('svg.still'), cc: !!document.querySelector('[aria-label="Head covering colour"]'),
    save: $('avSave').disabled, len: $('avStage').innerHTML.length, prop: !!$('avStage').querySelector('.prop'), checked: document.querySelector('[data-avk-set="c"][aria-checked="true"]').dataset.avv }));
  ok(m1.live && m1.cc && !m1.save && m1.len !== a1 && m1.prop && m1.checked === 'hijab', 'picking updates the cartoon live (with the type\'s prop), a hijab gets its colour row: ' + JSON.stringify(m1));
  await p.evaluate(() => $('avStage').scrollIntoView()); await p.screenshot({ path: O + '/p21-maker.png' });
  // Skip saves nothing
  await p.click('#avSkip'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !state.avatar && !$('dlgAvatar').open), 'Skip closes it and saves nothing');
  // save
  await p.evaluate(() => openAvatarMaker('account')); await p.click('[data-avk-set="s"][data-avv="s4"]'); await p.click('[data-avk-set="c"][data-avv="hijab"]');
  await p.click('[data-avk-set="t"][data-avv="#C3E0D6"]'); await p.click('#avSave'); await p.waitForTimeout(500);
  const sv = await p.evaluate(() => ({ a: state.avatar, me: !!$('meBtn').querySelector('svg.still'), ty: avTypeKey(state.vibe) }));
  ok(sv.a && sv.a.s === 's4' && sv.a.c === 'hijab' && sv.a.t === '#C3E0D6' && sv.a.ty === sv.ty && Object.keys(sv.a).every(k => ['v','s','f','h','hc','c','cc','g','b','t','ty'].includes(k)),
    'Save keeps a few choices plus the type from the answers: ' + JSON.stringify(sv.a));
  ok(sv.me, 'the top bar shows it (still)');

  // the type layer follows the answers
  await p.evaluate(() => { state.vibe = Object.assign({}, state.vibe, { cook: 0 }); save(); }); await go(p, '#discover');
  const ty = await p.evaluate(() => ({ ty: state.avatar.ty, want: avTypeKey(state.vibe) }));
  ok(ty.ty === ty.want && ty.ty.endsWith('-1'), 'change your answers and the type changes with them (now a Chef): ' + JSON.stringify(ty));

  // lists: home cards, Tribe (cards and map), FlatMart seller, messages list and header, requests
  const home = await avs(p, '#cards .trust .fm-avh');
  ok(home.n > 0 && home.person > 0 && home.letters === 0, 'home cards: the lister\'s avatar by "Listed by…": ' + JSON.stringify(home));
  await p.evaluate(() => document.querySelector('#cards .card').scrollIntoView({ block:'start' })); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p21-home.png' });
  await go(p, '#tribe');
  const tr = await avs(p, '#view-tribe .seek-top .fm-avh, #view-tribe foreignObject .fm-avh');
  ok(tr.n > 0 && tr.person > 0 && tr.none > 0 && tr.letters === 0, 'Tribe: avatars on the cards and the map; people without one show the neutral default, no letters: ' + JSON.stringify(tr));
  ok(await p.evaluate(() => !!document.querySelector('#view-tribe .me foreignObject svg')), 'Tribe: you in the middle of the map');
  ok(await p.evaluate(() => [...document.querySelectorAll('#view-tribe .fm-avh svg')].every(s => s.classList.contains('still'))), 'small avatars in lists don\'t move');
  await p.screenshot({ path: O + '/p21-tribe.png' });
  await go(p, '#market');
  await p.evaluate(async () => { const i = (await api.marketSearch({ city: 'Bengaluru' })).find(x => !x.is_mine); await openItem(i.id); }); await p.waitForTimeout(1200);
  const mk = await avs(p, '#dlgItem .mk-seller .fm-avh, dialog[open] .mk-seller .fm-avh');
  ok(mk.n === 1 && mk.letters === 0, 'FlatMart: the seller\'s avatar on an item: ' + JSON.stringify(mk));
  await closeDlgs(p);
  // a room request said yes, then a message: the list and the chat header
  await go(p, '#discover');
  const rid = await p.evaluate(async () => { await api.sendRequest('demo-1', 'Hi'); const r = state.requests.find(x => x.listing_id === 'demo-1'); r.status = 'approved'; r.decided_at = new Date().toISOString();
    state.unlocked = [...new Set((state.unlocked || []).concat('demo-1'))]; save(); const o = await api.msgOpen('room', r.id); await api.msgSend(o.thread, 'Hello!'); return r.id; });
  await go(p, '#messages');
  const ml = await avs(p, '#msgsList .msg-row .fm-avh');
  ok(ml.n > 0 && ml.letters === 0, 'Messages: each conversation has the other person\'s avatar: ' + JSON.stringify(ml));
  await p.click('#msgsList .msg-row'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => !!$('msgTitle').querySelector('.fm-avh svg')), 'the chat header has it too');
  await p.screenshot({ path: O + '/p21-chat.png' });
  await closeDlgs(p);
  await go(p, '#requests');
  const rq = await p.evaluate(() => document.querySelectorAll('#reqList .fm-avh, #reqList svg').length);
  ok(rq > 0, 'Requests: an avatar (or the match ring) where the letter was: ' + rq);

  // the Vibe Card: live on screen, a still in the shared image
  await p.evaluate(() => openVibeCard(state.vibe)); await p.waitForTimeout(2500);
  const vc = await p.evaluate(async () => { const live = document.querySelector('.vc-wrap .vc-live svg'), img = document.querySelector('.vc-img');
    const c = vibeCtx.canvas, x = c.getContext('2d'), px = x.getImageData(540, VC_AV.cy + 60, 1, 1).data;   // inside the avatar: not the card's navy
    return { live: !!live && !live.classList.contains('still'), play: !!document.querySelector('.vc-wrap.play'), w: c.width, h: c.height, px: [...px].slice(0, 3),
      box: live && (() => { const a = live.getBoundingClientRect(), b = img.getBoundingClientRect(); return [(a.left + a.width / 2 - b.left) / b.width, (a.top + a.height / 2 - b.top) / b.height].map(v => +v.toFixed(3)); })() }; });
  ok(vc.live && vc.play, 'Vibe Card: your avatar, animated, waving as it opens');
  ok(vc.w === 1080 && vc.h === 1920 && !(vc.px[0] < 60 && vc.px[2] > 50 && vc.px[2] < 110), 'the shared 1080 × 1920 image has it as a still: ' + JSON.stringify(vc.px));
  ok(vc.box && Math.abs(vc.box[0] - .5) < .01 && Math.abs(vc.box[1] - 505 / 1920) < .01, 'the live one sits exactly over the still one: ' + JSON.stringify(vc.box));
  await p.screenshot({ path: O + '/p21-vibecard.png' });
  await closeDlgs(p);

  // Account: animated, with Edit; edit and remove
  await go(p, '#account');
  const ac = await p.evaluate(() => ({ live: !!$('accAvatar').querySelector('svg:not(.still)'), btn: $('accAvEdit').textContent }));
  ok(ac.live && ac.btn === 'Edit avatar', 'Account: your avatar, animated, with "Edit avatar"');
  await p.evaluate(() => $('accAvatar').scrollIntoView({ block:'center' })); await p.screenshot({ path: O + '/p21-account.png' });
  await p.click('#accAvEdit'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => $('avSkip').textContent === 'Cancel' && document.querySelector('[data-avk-set="s"][data-avv="s4"]').getAttribute('aria-checked') === 'true' && !$('avRemove').hidden),
    'edit: opens on your choices, with Cancel and Remove');
  await p.click('[data-avk-set="g"][data-avv="true"]'); await p.click('#avSave'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => state.avatar.g === true && state.avatar.s === 's4'), 'edit saves the change and keeps the rest');
  await p.click('#accAvEdit'); await p.waitForTimeout(200); await p.click('#avRemove'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !state.avatar && $('meBtn').textContent.trim() === 'N' && $('accAvEdit').textContent === 'Make your avatar'), 'Remove: back to the initial and "Make your avatar"');

  // onboarding: right after the reveal, once, with Skip; then Discover
  await p.evaluate(() => { state.avatarAsked = false; save(); });
  const ob = await p.evaluate(async () => { const done = []; openAvatarMaker('onboarding', () => done.push(1)); const open = $('dlgAvatar').open; $('avSkip').click();
    return { open, done: done.length, asked: state.avatarAsked, again: avAskNow() }; });
  ok(ob.open && ob.done === 1 && ob.asked && !ob.again, 'onboarding: the maker once, Skip goes straight on and it isn\'t asked again: ' + JSON.stringify(ob));
  ok(await p.evaluate(() => finishOnboarding.toString().includes('if(avAskNow()) openAvatarMaker("onboarding", on)')), 'it comes after the reveal\'s "Show me" (seekers)');
  await b.close().catch(() => {});

  // owner: Escape list, and only their own row in "who lives there"
  const b2 = await chromium.launch(); ctx = await b2.newContext({ viewport:{ width:390, height:844 } }); await seed(ctx, owner);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await go(p, '#mine');
  const esc = await avs(p, '.mine-esc .row .fm-avh');
  ok(esc.n > 0 && esc.letters === 0, 'owner: Escape seekers on My flat show avatars: ' + JSON.stringify(esc));
  await go(p, '#escape');
  const esc2 = await avs(p, '#view-escape .seek-top .fm-avh');
  ok(esc2.n > 0 && esc2.letters === 0, 'owner: the Escape list too: ' + JSON.stringify(esc2));
  await go(p, '#post');
  await p.evaluate(() => { $('hCount').value = '3'; $('hCount').dispatchEvent(new Event('change')); });
  const pf = await p.evaluate(() => ({ you: !!document.querySelector('.fm-row[data-i="0"] [data-av-edit="post"]'), others: document.querySelectorAll('.fm-row:not([data-i="0"]) [data-av-edit]').length }));
  ok(pf.you && pf.others === 0, 'posting: "Add your avatar" on your own row only, never for flatmates: ' + JSON.stringify(pf));
  await b2.close();

  // reduced motion: nothing moves anywhere
  const b3 = await chromium.launch(); ctx = await b3.newContext({ viewport:{ width:390, height:844 }, reducedMotion:'reduce' });
  await seed(ctx, Object.assign({}, seeker, { avatar:{ v:1, s:'s2', f:'calm', h:'bob', hc:'#5B3A29', c:'none', cc:'#C3C9F6', g:true, b:'none', t:'#86A6E0', ty:'2-4' } }));
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await go(p, '#account');
  await p.evaluate(() => openAvatarMaker('account')); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.fm-av')).length === 0), 'reduced motion: the avatars stay still');
  await b3.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
