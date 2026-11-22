// The Android app's first-open step (Kamal, 22 Nov: "Can we build that app automaticaly takes the permission of camera,
// location and gallery and anything else that is important"). No app can take a permission by itself, so the app asks
// early, once, and says first what each is for: one sheet, then Android's own boxes (notifications, then location).
// Photos and the camera need no permission. Demo mode, port 8765, 390 wide; the Android wrapper is stood in for.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now();
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: now + 9e9, avatarAsked:true };
// The wrapper: it keeps what the page sends, answers "hello" with its status, and on "setup" (or "permission") gives what
// the person would give (st.say) and answers with the new status, as MainActivity does after Android's boxes.
const wrapper = st => { window.__sent = []; window.FlatmatesNative = { postMessage(s){ const m = JSON.parse(s); if(m.type !== 'bars') window.__sent.push(m.type);   // (the strip's colour, p26, is not this suite's)
  if(m.type === 'setup'){ st.granted = st.granted || st.say; st.location = st.location || st.say; }
  if(['hello', 'setup', 'permission'].includes(m.type)) setTimeout(() => this.onmessage && this.onmessage({ data: JSON.stringify(Object.assign({ type:'status', granted: st.granted }, st.old ? {} : { location: st.location, setup: true })) }), 30); } }; };
async function open(b, st, state, hash){
  const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  if(st) await ctx.addInitScript(wrapper, st);
  if(state) await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, state);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '#' + (hash || 'discover')); await p.waitForFunction(() => document.querySelector('#dlgSetup') && document.querySelector('#dlgSetup').open, null, { timeout: 4500 }).catch(() => {});
  await p.waitForTimeout(300); return { ctx, p };
}
const sheet = p => p.evaluate(() => ({ open: $('dlgSetup').open, title: $('suTitle').textContent, rows: [...document.querySelectorAll('.su-list li')].filter(x => !x.hidden).map(x => x.querySelector('b').textContent).join(),
  words: $('dlgSetup').textContent.replace(/\s+/g, ' '), btns: [...$('dlgSetup').querySelectorAll('button')].map(x => x.textContent).join(), sent: (window.__sent || []).join(), asked: !!localStorage.getItem('fm_setup_asked'),
  other: [...document.querySelectorAll('dialog[open]')].map(d => d.id).join() }));

(async () => {
  const b = await chromium.launch();
  // nothing given yet: the sheet, once someone signed in is on a main screen
  let { ctx, p } = await open(b, { granted:false, location:false, say:true }, seeker);
  let s = await sheet(p);
  ok(s.open && s.title === 'Set up your app' && s.rows === 'Notifications,Location,Photos and camera' && s.btns === 'Continue,Not now' && s.other === 'dlgSetup', 'in the Android app, signed in, nothing allowed yet: one sheet names notifications, location, and photos and camera: ' + JSON.stringify({ open: s.open, rows: s.rows, btns: s.btns, other: s.other }));
  ok(/Your phone will ask you next/.test(s.words) && /only when you tap/.test(s.words) && /Never followed in the background/.test(s.words) && /Nothing to allow/.test(s.words) && !/automatic/i.test(s.words),
    'it says the phone asks next, that location is read only on a tap and never in the background, and that photos and the camera need nothing');
  ok(s.sent === 'hello' && !s.asked, 'nothing has been asked of Android yet: the page has only said hello');
  await p.screenshot({ path: O + '/p36-setup.png' });
  await p.click('#suAllow'); await p.waitForTimeout(400);
  s = await sheet(p); const st1 = await p.evaluate(() => ({ on: Notify.nativeOn, loc: Notify.loc }));
  ok(!s.open && /^hello,setup/.test(s.sent) && s.asked && st1.on === true && st1.loc === true, 'Continue closes the sheet and hands over to Android ("setup"); the answer comes back as the new status: ' + s.sent + ' ' + JSON.stringify(st1));
  await p.reload(); await p.waitForTimeout(2500);
  ok(!(await sheet(p)).open, 'it is asked once per phone: not again on the next open');
  await ctx.close();
  // Not now: nothing is asked of Android, and each permission waits for the moment it is needed
  ({ ctx, p } = await open(b, { granted:false, location:false, say:true }, seeker));
  await p.click('#suLater'); await p.waitForTimeout(300); s = await sheet(p);
  const card = await p.evaluate(async () => { location.hash = '#requests'; await new Promise(r => setTimeout(r, 1200)); return { ask: !!document.querySelector('.notif-ask [data-notify-on]'), on: Notify.on() }; });
  ok(!s.open && s.sent === 'hello' && s.asked, '"Not now" closes it and asks Android nothing');
  ok(card.ask || card.on === false, 'after "Not now" the "Stay in the loop" card still offers notifications where it did before: ' + JSON.stringify(card));
  await p.reload(); await p.waitForTimeout(2500);
  ok(!(await sheet(p)).open, '"Not now" is remembered too');
  await ctx.close();
  // only what is missing is named; nothing missing, no sheet
  ({ ctx, p } = await open(b, { granted:true, location:false, say:true }, seeker)); s = await sheet(p);
  ok(s.open && s.rows === 'Location,Photos and camera', 'notifications already allowed: only location is named (with the photos line): ' + s.rows);
  await ctx.close();
  ({ ctx, p } = await open(b, { granted:true, location:true, say:true }, seeker)); s = await sheet(p);
  ok(!s.open && s.asked && s.sent === 'hello', 'everything already allowed: no sheet, and it is not looked at again');
  await ctx.close();
  // not on an older app, not before sign-in, not on the website, not on top of another sheet
  ({ ctx, p } = await open(b, { granted:false, old:true }, seeker)); s = await sheet(p);
  ok(!s.open && !s.asked, 'an app from before this build (its status does not say "setup") is not shown the sheet');
  await ctx.close();
  ({ ctx, p } = await open(b, { granted:false, location:false, say:true }, null, '')); s = await sheet(p);
  ok(!s.open && !s.asked, 'before sign-in: no sheet');
  await ctx.close();
  ({ ctx, p } = await open(b, null, seeker)); s = await sheet(p);
  ok(!s.open && !s.asked && s.sent === '', 'on the website (no Android app around it): no sheet');
  const over = await p.evaluate(() => { window.FlatmatesNative = { postMessage(){} }; Notify.canSetup = true; Notify.nativeOn = false; Notify.loc = false; $('dlgHelp').showModal(); setupAsk(); const under = $('dlgSetup').open;
    $('dlgHelp').close(); setupAsk(); return { under, after: $('dlgSetup').open }; });
  ok(!over.under && over.after, 'it never opens on top of another sheet; it comes on the next round instead: ' + JSON.stringify(over));
  await ctx.close();
  // the Android side, as written (it is compiled by CI, not here)
  const A = path.join(__dirname, '../../android/app/src/main'), java = fs.readFileSync(path.join(A, 'java/com/findmeflatmate/app/MainActivity.java'), 'utf8'), man = fs.readFileSync(path.join(A, 'AndroidManifest.xml'), 'utf8'), paths = fs.readFileSync(path.join(A, 'res/xml/share_paths.xml'), 'utf8');
  const perms = (man.match(/uses-permission android:name="([^"]+)"/g) || []).map(x => x.replace(/.*permission\./, '').replace('"', '')).sort().join();
  ok(perms === 'ACCESS_COARSE_LOCATION,ACCESS_FINE_LOCATION,INTERNET,POST_NOTIFICATIONS', 'the app declares internet, notifications and location, and nothing else (no camera, no storage, no contacts): ' + perms);
  const setup = java.slice(java.indexOf('private void askSetupPermissions()'), java.indexOf('private boolean locationAllowed()'));
  ok(/case "setup":\s*askSetupPermissions\(\);/.test(java) && (setup.match(/Manifest\.permission\.\w+/g) || []).sort().join() === 'Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.POST_NOTIFICATIONS,Manifest.permission.POST_NOTIFICATIONS'
    && /requestPermissions\(ask\.toArray\(new String\[0\]\), ASK_SETUP\)/.test(setup) && /requestCode == ASK_NOTIFICATIONS \|\| requestCode == ASK_SETUP\) sendStatus\(\)/.test(java) && /\\"location\\":" \+ locationAllowed\(\)/.test(java) && /\\"setup\\":true/.test(java),
    '"setup" asks Android for notifications and location only, only those not given yet, and answers the page with what was given');
  ok(/MediaStore\.ACTION_IMAGE_CAPTURE/.test(java) && /EXTRA_INITIAL_INTENTS, new Intent\[\] \{ shot \}/.test(java) && /new File\(getCacheDir\(\), "camera"\)/.test(java) && /<cache-path name="camera" path="camera\/" \/>/.test(paths)
    && /android\.media\.action\.IMAGE_CAPTURE/.test(man) && /cameraFile\.length\(\) > 0/.test(java),
    '"Take a photo" is in the photo chooser beside the gallery: the phone\'s camera app writes to the app\'s own cache, and an empty file (a cancelled shot) is never handed to the page');
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
  await b.close();
})();
