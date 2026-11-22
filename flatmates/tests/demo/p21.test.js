// Avatars (Kamal, 13 Nov; the studio, 22 Nov; demo mode, port 8765, 390 wide): the studio (Skip, a look, tabs, pick, undo,
// outfits, save, the "ready" moment, edit, remove), what is saved and what an older app reads of it, the neutral
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
  const tab = k => p.click(`#avTabs [data-av-tab="${k}"]`), pick = l => p.click(`#avRows [aria-label="${l}"]`);
  const m0 = await p.evaluate(() => ({ plain: $('avStage').classList.contains('blank') && getComputedStyle($('avStage').querySelector('.face')).opacity === '0' && !!$('avStage').querySelector('svg.fm-fig'),
    save: $('avSave').disabled, note: $('avNote').textContent, skip: $('avSkip').textContent, title: $('avTitle').textContent,
    tabs: [...document.querySelectorAll('#avTabs [role="tab"]')].map(x => x.textContent + (x.disabled ? '-' : '')).join(), on: document.querySelector('#avTabs [aria-selected="true"]').textContent,
    looks: document.querySelectorAll('#avRows .av-tile').length, picked: document.querySelectorAll('#avRows [aria-checked="true"]').length, undo: $('avUndo').disabled && $('avRedo').disabled,
    full: (r => r.width >= innerWidth - 1 && r.height >= innerHeight - 1)($('dlgAvatar').getBoundingClientRect()) }));
  ok(m0.plain && m0.save && m0.picked === 0 && /nothing is guessed/.test(m0.note) && m0.skip === 'Skip' && m0.title === 'Make your avatar' && m0.undo && m0.full,
    'the studio starts neutral: a plain figure with no face, nothing picked for you, Save waits, on the whole screen: ' + JSON.stringify(m0));
  ok(m0.tabs === 'Looks,Skin,Hair-,Face-,Beard-,Glasses-,Headwear-,Outfits-,Top-,Bottoms-,Shoes-' && m0.on === 'Looks' && m0.looks === 12,
    'eleven tabs, opening on twelve looks to start from; until a look or a skin tone is picked only Looks and Skin are open: ' + m0.tabs);
  await p.screenshot({ path: O + '/p21-maker-empty.png' });
  // pick: the figure follows, the stage moves in on the face for face things and back out for clothes
  await tab('skin'); const skins = await p.evaluate(() => document.querySelectorAll('#avRows .av-tile.skin').length);
  await pick('Tone 4'); const a1 = await p.evaluate(() => $('avStage').innerHTML.length);
  await tab('head'); await pick('Hijab'); const cc = await p.evaluate(() => !!document.querySelector('[aria-label="Headwear colour"]') && $('avStage').classList.contains('zoom'));
  await tab('face'); await pick('Big smile'); await tab('top'); await pick('Mint'); await p.waitForTimeout(450);
  const m1 = await p.evaluate(() => ({ live: !$('avStage').classList.contains('blank') && !$('avStage').querySelector('svg.still'), whole: !!$('avStage').querySelector('svg.fm-fig') && !$('avStage').classList.contains('zoom'),
    save: $('avSave').disabled, len: $('avStage').innerHTML.length, open: [...document.querySelectorAll('#avTabs [role="tab"]')].every(x => !x.disabled), undo: !$('avUndo').disabled && $('avRedo').disabled,
    checked: [...document.querySelectorAll('#avRows [aria-checked="true"]')].map(x => x.getAttribute('aria-label')).join(), tiles: document.querySelectorAll('#avRows .av-tile').length,
    drawn: [...document.querySelectorAll('#avRows .av-tile')].every(x => x.querySelector('svg.fm-fig') && x.querySelector('small').textContent) }));
  ok(skins === 6 && cc && m1.live && m1.whole && !m1.save && m1.len !== a1 && m1.open && m1.undo && m1.checked === 'Mint,T-shirt' && m1.tiles === 9 && m1.drawn,
    'six skin tones; picking changes the figure at once, every tab opens, a hijab gets its colour row, the stage is close on the face for headwear and shows the whole person for a top; each choice is drawn on your own figure with its name: ' + JSON.stringify(m1));
  await p.screenshot({ path: O + '/p21-maker.png' });
  // undo and redo, an outfit in one tap, and a dress
  await p.click('#avUndo'); const u1 = await p.evaluate(() => avDraft.tc); await p.click('#avRedo'); const u2 = await p.evaluate(() => avDraft.tc + ' ' + $('avRedo').disabled);
  await tab('outfit'); await pick('Smart'); const fit = await p.evaluate(() => [avDraft.o, avDraft.tc, avDraft.p, avDraft.pc, avDraft.sh, avDraft.shc].join() + ' ' + document.querySelectorAll('#avRows .av-tile').length);
  await pick('Summer dress'); await tab('bottom'); const dr = await p.evaluate(() => /dress/.test($('avRows').querySelector('.av-hint').textContent)); await pick('Shorts'); const after = await p.evaluate(() => avDraft.o + ' ' + avDraft.p);
  ok(u1 !== '#C3E0D6' && u2 === '#C3E0D6 true' && fit === 'blazer,#2F3E63,trousers,#7D828A,loafers,#23262B 12' && dr && after === 'tee shorts',
    'Undo takes the last change back and Redo returns it; an outfit sets top, bottoms and shoes in one tap (twelve of them); in a dress the Bottoms tab says so, and picking bottoms changes the top to a T-shirt: ' + JSON.stringify({ u1, u2, fit, after }));
  // Surprise me: a whole person at once, and always one the server would accept
  const sur = await p.evaluate(() => { const bad = []; for(let i = 0; i < 300; i++){ const a = avPack(Object.assign(avUn({}), avRandom()), '1-3'); if(!avValid(a)) bad.push(JSON.stringify(a)); } $('avDice').click(); return { bad: bad.slice(0, 2), s: avDraft.s, undo: !$('avUndo').disabled }; });
  ok(!sur.bad.length && /^s[1-6]$/.test(sur.s) && sur.undo, '"Surprise me" picks everything at once (and can be undone); 300 of them are all avatars the server would accept: ' + JSON.stringify(sur.bad));
  // everything the studio offers is something the server accepts, and the lists are the server's lists
  const lists = await p.evaluate(() => ({ m: AV_MOUTHS.map(x => x[0]), e: AV_EYES.map(x => x[0]), br: AV_BROWS.map(x => x[0]), h2: AV_HAIRS.map(x => x[0]), hc2: AV_HAIR_COLOURS.map(x => x[0]), c2: AV_COVERS.map(x => x[0]), gl: AV_GLASSES.map(x => x[0]),
    b2: AV_BEARDS.map(x => x[0]), bc: AV_HAIR_COLOURS.map(x => x[0]), ea: AV_EARRINGS.map(x => x[0]), tc: AV_TOP_COLOURS.map(x => x[0]), o: AV_TOPS.map(x => x[0]), p: AV_BOTTOMS.map(x => x[0]), pc: AV_BOTTOM_COLOURS.map(x => x[0]),
    sh: AV_SHOES.map(x => x[0]), shc: AV_SHOE_COLOURS.map(x => x[0]), cc: AV_COLOURS.map(x => x[0]), t: AV_COLOURS.map(x => x[0]),
    old: [AV_MOUTHS, AV_HAIRS, AV_HAIR_COLOURS, AV_COVERS, AV_BEARDS, AV_TOP_COLOURS].map(l => [...new Set(l.map(x => x[2]))].sort().join()),
    lib: [FMAvatar.MOUTH, FMAvatar.EYES, FMAvatar.BROWS, FMAvatar.HAIR, FMAvatar.COVER, FMAvatar.GLASSES, FMAvatar.BEARD, FMAvatar.EARRING, FMAvatar.TOPS, FMAvatar.BOTTOMS, FMAvatar.SHOES].map(x => x.slice().sort().join()),
    looks: AV_LOOKS.concat(AV_OUTFITS.map(x => { const y = Object.assign({ s: 's1' }, x); delete y.n; return y; })).filter(x => !avValid(avPack(Object.assign(avUn({}), x), '0-0'))).length }));
  const sql = require('fs').readFileSync(require('path').join(__dirname, '../../supabase/schema.sql'), 'utf8'), fn = sql.slice(sql.indexOf('create or replace function public.fm_avatar_valid'), sql.indexOf('fm_profiles_avatar_ok'));
  const inSql = k => { const m = fn.match(new RegExp("p->>'" + k + "', '[^']*'\\) in \\(([^)]*)\\)")); return m ? m[1].replace(/[\s']/g, '').split(',') : []; };
  const drift = Object.keys(lists).filter(k => !['old', 'lib', 'looks'].includes(k)).filter(k => lists[k].slice().sort().join() !== inSql(k).sort().join());
  const draws = k => lists[k].filter(v => v !== 'none').sort().join();
  ok(!drift.length, 'every list of choices in the app is the server\'s list for that key in fm_avatar_valid, value for value: ' + drift.join());
  ok(lists.lib.join('|') === [draws('m'), draws('e'), draws('br'), lists.h2.concat('none').sort().join(), draws('c2'), draws('gl'), draws('b2'), draws('ea'), draws('o'), draws('p'), draws('sh')].join('|') && lists.looks === 0,
    'the drawing library has a drawing for every choice and no others; every starting look and every outfit is an avatar the server accepts');
  ok(lists.old.join('|') === [inSql('f'), inSql('h').filter(v => v !== 'none'), inSql('hc'), inSql('c'), inSql('b'), inSql('t')].map(l => l.sort().join()).join('|'),
    'what an older app reads (the first keys) only ever takes the first values: ' + lists.old.join(' | '));
  // Skip saves nothing
  await p.click('#avSkip'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !state.avatar && !$('dlgAvatar').open), 'Skip closes it and saves nothing');
  // save: the choices, and the "ready" moment
  await p.evaluate(() => openAvatarMaker('account')); await tab('skin'); await pick('Tone 4'); await tab('head'); await pick('Hijab'); await tab('hair'); const cov = await p.evaluate(() => /covers your hair/.test($('avRows').textContent));
  await tab('top'); await pick('Sky'); await pick('Kurta'); await p.click('#avSave'); await p.waitForTimeout(600);
  const sv = await p.evaluate(() => ({ a: state.avatar, me: !!$('meBtn').querySelector('svg.still'), ty: avTypeKey(state.vibe), valid: avValid(state.avatar),
    ready: $('dlgAvatar').open && $('avStudio').hidden && !$('avReady').hidden && /ready/.test($('avReady').querySelector('h2').textContent), fig: !!$('avReadyStage').querySelector('svg.fm-fig:not(.still)'),
    acts: [...document.querySelectorAll('.av-ready-acts button')].map(x => x.textContent).join() }));
  ok(sv.a && sv.a.v === 2 && sv.a.s === 's4' && sv.a.c2 === 'hijab' && sv.a.c === 'hijab' && sv.a.tc === '#BFD7EE' && sv.a.t === '#C3C9F6' && sv.a.o === 'kurta' && sv.a.h2 === 'short' && sv.a.h === 'short' && sv.a.ty === sv.ty && sv.valid && cov,
    'Save keeps the choices plus the type from the answers; each new choice sits next to the nearest thing an older app can draw (a sky kurta reads there as a lavender top): ' + JSON.stringify(sv.a));
  ok(sv.ready && sv.fig && sv.acts === 'Change outfit,Edit avatar,Done', '"Your avatar is ready!": the whole person, moving, with Change outfit, Edit avatar and Done');
  await p.screenshot({ path: O + '/p21-ready.png' });
  await p.click('#avOutfit'); await p.waitForTimeout(300);
  const back = await p.evaluate(() => !$('avStudio').hidden && $('avReady').hidden && document.querySelector('#avTabs [aria-selected="true"]').textContent + ' ' + $('avSkip').textContent);
  await p.click('#avSkip'); await p.waitForTimeout(200);
  ok(back === 'Outfits Cancel' && await p.evaluate(() => !$('dlgAvatar').open && state.avatar.o === 'kurta'), '"Change outfit" goes back into the studio on Outfits; Cancel there leaves the saved avatar as it was');
  ok(sv.me, 'the top bar shows it (still)');
  // an avatar from before the studio draws as itself, in a T-shirt, jeans and white sneakers; and the round one keeps its shape
  const oldAv = await p.evaluate(() => { const a = { v:1, s:'s2', f:'calm', h:'bob', hc:'#5B3A29', c:'none', cc:'#C3C9F6', g:true, b:'none', t:'#86A6E0', ty:'2-4' }, u = avUn(a);
    return { valid: avValid(a), u: [u.m, u.h2, u.hc2, u.gl, u.o, u.tc, u.p, u.sh].join(), round: /viewBox="0 0 240 240"/.test(avSvg(a)) && /class="prop"/.test(avSvg(a)), fig: /viewBox="0 0 240 440"/.test(avFig(a)) && !/class="prop"/.test(avFig(a)),
      roundtrip: JSON.stringify(avUn(avPack(avUn(a), '2-4'))) === JSON.stringify(u) }; });
  ok(oldAv.valid && oldAv.u === 'calm,bob,#5B3A29,round,tee,#86A6E0,jeans,sneakers' && oldAv.round && oldAv.fig && oldAv.roundtrip,
    'an avatar saved before the studio is still accepted and reads as itself, in a T-shirt, jeans and sneakers; the round one keeps its type\'s prop, the standing one has none: ' + JSON.stringify(oldAv));

  // the type layer follows the answers
  await p.evaluate(() => { state.vibe = Object.assign({}, state.vibe, { cook: 0 }); save(); }); await go(p, '#account'); await go(p, '#discover');
  const ty = await p.evaluate(() => ({ ty: state.avatar.ty, want: avTypeKey(state.vibe) }));
  ok(ty.ty === ty.want && ty.ty.endsWith('-1'), 'change your answers and the type changes with them (now a Chef): ' + JSON.stringify(ty));

  // lists: home cards, Tribe (cards and map), FlatMart seller, messages list and header, requests
  // home cards: no avatar squeezed into the trust line (King, 13 Nov); it stays on one line at 390 (and 360, below)
  const home = await p.evaluate(() => [...document.querySelectorAll('#cards .trust')].map(t => ({ av: !!t.querySelector('.fm-avh'), fits: t.scrollWidth <= t.clientWidth + 1 })));
  ok(home.length > 0 && home.every(x => !x.av && x.fits), 'home cards: the trust line ("… · phone verified") stays on one line at 390');
  await p.evaluate(() => document.querySelector('#cards .card').scrollIntoView({ block:'start' })); await p.waitForTimeout(300);
  await p.screenshot({ path: O + '/p21-home.png' });
  await go(p, '#tribe');
  const tr = await avs(p, '#view-tribe .seek-top .fm-avh, #view-tribe foreignObject .fm-avh');
  ok(tr.n > 0 && tr.person > 0 && tr.none > 0 && tr.letters === 0, 'Tribe: avatars on the cards and the map; people without one show the neutral default, no letters: ' + JSON.stringify(tr));
  ok(await p.evaluate(() => !!document.querySelector('#view-tribe .me foreignObject svg')), 'Tribe: you in the middle of the map');
  ok(await p.evaluate(() => [...document.querySelectorAll('#view-tribe .fm-avh svg')].every(s => s.classList.contains('still') || s.classList.contains('av-none'))), 'small avatars in lists don\'t move');
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

  await p.setViewportSize({ width:360, height:780 }); await p.waitForTimeout(400);
  ok(await p.evaluate(() => [...document.querySelectorAll('#cards .trust')].every(t => t.scrollWidth <= t.clientWidth + 1)), 'and at 360');
  await p.setViewportSize({ width:390, height:844 });
  // the Vibe Card: live on screen, a still in the shared image
  await p.evaluate(() => openVibeCard(state.vibe)); await p.waitForTimeout(2500);
  const vc = await p.evaluate(async () => { const live = document.querySelector('.vc-wrap .vc-live svg'), img = document.querySelector('.vc-img');
    const c = vibeCtx.canvas, x = c.getContext('2d'), px = x.getImageData(540, VC_AV.cy + 60, 1, 1).data;   // inside the avatar: not the card's navy
    return { cy: VC_AV.cy, live: !!live && !live.classList.contains('still'), play: !!document.querySelector('.vc-wrap.play'), w: c.width, h: c.height, px: [...px].slice(0, 3),
      box: live && (() => { const a = live.getBoundingClientRect(), b = img.getBoundingClientRect(); return [(a.left + a.width / 2 - b.left) / b.width, (a.top + a.height / 2 - b.top) / b.height].map(v => +v.toFixed(3)); })() }; });
  ok(vc.live && vc.play, 'Vibe Card: your avatar, animated, waving as it opens');
  ok(vc.w === 1080 && vc.h === 1920 && vc.px.join() !== '195,224,214', 'the shared 1080 × 1920 image has it as a still (not just the mint panel): ' + JSON.stringify(vc.px));
  ok(vc.box && Math.abs(vc.box[0] - .5) < .01 && Math.abs(vc.box[1] - vc.cy / 1920) < .01, 'the live one sits exactly over the still one: ' + JSON.stringify(vc.box));
  await p.screenshot({ path: O + '/p21-vibecard.png' });
  await closeDlgs(p);

  // Account: animated, with Edit; edit and remove
  await go(p, '#account');
  const ac = await p.evaluate(() => ({ live: !!$('accAvatar').querySelector('svg:not(.still)'), btn: $('accAvEdit').textContent }));
  const acFig = await p.evaluate(() => { const r = $('accAvatar').getBoundingClientRect(); return !!$('accAvatar').querySelector('svg.fm-fig') && r.height > r.width * 1.6 && r.height >= 140; });
  ok(ac.live && ac.btn === 'Edit avatar' && acFig, 'Profile: your avatar stands there whole, moving, with "Edit avatar"');
  await p.evaluate(() => $('accAvatar').scrollIntoView({ block:'center' })); await p.screenshot({ path: O + '/p21-account.png' });
  await p.click('#accAvEdit'); await p.waitForTimeout(300);
  const ed = await p.evaluate(() => $('avSkip').textContent + ' ' + $('avTitle').textContent + ' ' + document.querySelector('#avTabs [aria-selected="true"]').textContent + ' ' + !$('avRemove').hidden + ' ' + !$('avSave').disabled);
  await tab('skin'); const edSkin = await p.evaluate(() => document.querySelector('#avRows [aria-label="Tone 4"]').getAttribute('aria-checked'));
  ok(ed === 'Cancel Your avatar Hair true true' && edSkin === 'true', 'edit: opens on your choices (on Hair), with Cancel and Remove: ' + ed);
  await tab('glasses'); await pick('Square'); await p.click('#avSave'); await p.waitForTimeout(500); await p.click('#avDone'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => state.avatar.gl === 'square' && state.avatar.g === true && state.avatar.s === 's4' && state.avatar.o === 'kurta' && !$('dlgAvatar').open), 'edit saves the change and keeps the rest; Done closes the "ready" moment');
  await p.click('#accAvEdit'); await p.waitForTimeout(200); await p.click('#avRemove'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !state.avatar && $('meBtn').textContent.trim() === 'N' && $('accAvEdit').textContent === 'Make your avatar'), 'Remove: back to the initial and "Make your avatar"');

  // onboarding: right after the reveal, once, with Skip; then Discover
  await p.evaluate(() => { state.avatarAsked = false; save(); });
  const ob = await p.evaluate(async () => { const done = []; openAvatarMaker('onboarding', () => done.push(1)); const open = $('dlgAvatar').open; $('avSkip').click(); await new Promise(r => setTimeout(r, 100));
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
