// The Android app's first-open step (Kamal, 22 Nov: "Can we build that app automaticaly takes the permission of camera,
// location and gallery and anything else that is important"). No app can take a permission by itself. Of the two ways
// put to him Kamal chose the second: at first open ask only for notifications; location the first time the map is used,
// as before; no camera or gallery permission at all. Demo mode, port 8765, 390 wide; the Android wrapper is stood in for.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [], U = 'http://localhost:8765/';
const vibe = { sleep:2, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:0, social:1, sharing:1, work:0, pets:1, gen:'z' };
const now = Date.now();
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: now + 9e9, avatarAsked:true };
// The wrapper: it keeps what the page sends, answers "hello" with its status, and on "permission" gives what the person
// would give (st.say) and answers with the new status, as MainActivity does after Android's box.
const wrapper = st => { window.__sent = []; window.FlatmatesNative = { postMessage(s){ const m = JSON.parse(s); if(m.type !== 'bars') window.__sent.push(m.type);   // (the strip's colour, p26, is not this suite's)
  if(m.type === 'permission') st.granted = st.granted || st.say;
  if(['hello', 'permission'].includes(m.type)) setTimeout(() => this.onmessage && this.onmessage({ data: JSON.stringify({ type:'status', granted: st.granted }) }), 30); } }; };
async function open(b, st, state, hash){
  const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  if(st) await ctx.addInitScript(wrapper, st);
  if(state) await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, state);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '#' + (hash || 'discover')); await p.waitForFunction(() => document.querySelector('#dlgSetup') && document.querySelector('#dlgSetup').open, null, { timeout: 4500 }).catch(() => {});
  await p.waitForTimeout(300); return { ctx, p };
}
const sheet = p => p.evaluate(() => ({ open: $('dlgSetup').open, title: $('suTitle').textContent, rows: [...document.querySelectorAll('.su-list li')].map(x => x.querySelector('b').textContent + ': ' + x.querySelector('small').textContent.split('.')[0]).join(' | '),
  words: $('dlgSetup').textContent.replace(/\s+/g, ' '), btns: [...$('dlgSetup').querySelectorAll('button')].map(x => x.textContent).join(), sent: (window.__sent || []).join(), asked: !!localStorage.getItem('fm_setup_asked'),
  other: [...document.querySelectorAll('dialog[open]')].map(d => d.id).join() }));

(async () => {
  const b = await chromium.launch();
  // notifications not allowed yet: the sheet, once someone signed in is on a main screen
  let { ctx, p } = await open(b, { granted:false, say:true }, seeker);
  let s = await sheet(p);
  ok(s.open && s.title === 'Set up your app' && s.rows === 'Notifications: Now | Location: Not now | Photos and camera: Nothing to allow' && s.btns === 'Continue,Not now' && s.other === 'dlgSetup',
    'in the Android app, signed in, notifications off: one sheet says what is asked now (notifications), what later (location) and what never (photos and camera): ' + JSON.stringify({ open: s.open, rows: s.rows, btns: s.btns, other: s.other }));
  ok(/One thing to allow now/.test(s.words) && /Your phone will ask you next/.test(s.words) && /only the first time you use the map or tap "Use my current location"/.test(s.words) && /Never followed in the background/.test(s.words) && !/automatic/i.test(s.words),
    'it says the phone asks next, that location is asked only the first time the map is used and never followed in the background');
  ok(s.sent === 'hello' && !s.asked, 'nothing has been asked of Android yet: the page has only said hello');
  await p.screenshot({ path: O + '/p36-setup.png' });
  await p.click('#suAllow'); await p.waitForTimeout(400);
  s = await sheet(p); const st1 = await p.evaluate(() => Notify.nativeOn);
  ok(!s.open && s.sent === 'hello,permission' && s.asked && st1 === true, 'Continue closes the sheet and asks Android for notifications only ("permission", the same ask as the card\'s); the answer comes back as the new status: ' + s.sent + ' ' + st1);
  await p.reload(); await p.waitForTimeout(2500);
  ok(!(await sheet(p)).open, 'it is asked once per phone: not again on the next open');
  await ctx.close();
  // Not now: nothing is asked of Android, and the card still offers notifications where it did
  ({ ctx, p } = await open(b, { granted:false, say:true }, seeker));
  await p.click('#suLater'); await p.waitForTimeout(300); s = await sheet(p);
  const card = await p.evaluate(async () => { location.hash = '#requests'; await new Promise(r => setTimeout(r, 1200)); return { ask: !!document.querySelector('.notif-ask [data-notify-on]'), on: Notify.on() }; });
  ok(!s.open && s.sent === 'hello' && s.asked, '"Not now" closes it and asks Android nothing');
  ok(card.ask && card.on === false, 'after "Not now" the "Stay in the loop" card still offers notifications where it did before: ' + JSON.stringify(card));
  await p.reload(); await p.waitForTimeout(2500);
  ok(!(await sheet(p)).open, '"Not now" is remembered too');
  await ctx.close();
  // nothing to ask, no sheet
  ({ ctx, p } = await open(b, { granted:true, say:true }, seeker)); s = await sheet(p);
  ok(!s.open && s.asked && s.sent === 'hello', 'notifications already allowed: no sheet, and it is not looked at again');
  await ctx.close();
  // not before sign-in, not on the website, not on top of another sheet
  ({ ctx, p } = await open(b, { granted:false, say:true }, null, '')); s = await sheet(p);
  ok(!s.open && !s.asked, 'before sign-in: no sheet');
  await ctx.close();
  ({ ctx, p } = await open(b, null, seeker)); s = await sheet(p);
  ok(!s.open && !s.asked && s.sent === '', 'on the website (no Android app around it): no sheet');
  const over = await p.evaluate(() => { window.FlatmatesNative = { postMessage(){} }; Notify.nativeOn = false; $('dlgHelp').showModal(); setupAsk(); const under = $('dlgSetup').open;
    $('dlgHelp').close(); setupAsk(); return { under, after: $('dlgSetup').open }; });
  ok(!over.under && over.after, 'it never opens on top of another sheet; it comes on the next round instead: ' + JSON.stringify(over));
  await ctx.close();
  // the Android side, as written (it is compiled by CI, not here)
  const A = path.join(__dirname, '../../android/app/src/main'), java = fs.readFileSync(path.join(A, 'java/com/findmeflatmate/app/MainActivity.java'), 'utf8'), man = fs.readFileSync(path.join(A, 'AndroidManifest.xml'), 'utf8'), paths = fs.readFileSync(path.join(A, 'res/xml/share_paths.xml'), 'utf8');
  const perms = (man.match(/uses-permission android:name="([^"]+)"/g) || []).map(x => x.replace(/.*permission\./, '').replace('"', '')).sort().join();
  ok(perms === 'ACCESS_COARSE_LOCATION,ACCESS_FINE_LOCATION,INTERNET,POST_NOTIFICATIONS', 'the app declares internet, notifications and location, and nothing else (no camera, no storage, no contacts): ' + perms);
  const asks = java.split('requestPermissions(').slice(1).map(x => (x.slice(0, 220).match(/Manifest\.permission\.\w+/g) || []).map(y => y.replace('Manifest.permission.', '')).join('+'));
  const geo = java.slice(java.indexOf('public void onGeolocationPermissionsShowPrompt'), java.indexOf('public boolean onShowFileChooser'));
  ok(asks.join() === 'ACCESS_FINE_LOCATION+ACCESS_COARSE_LOCATION,POST_NOTIFICATIONS' && /requestPermissions\(/.test(geo) && !/case "setup"/.test(java) && !/CAMERA/.test(java.replace(/cameraIntent|cameraShot|cameraFile|"camera"|camera app|cache\/camera/g, '')),
    'Android is asked for two things only, each in its own place: location from the map\'s own prompt (the first time it is used), notifications from the page\'s ask; nothing asks for the camera: ' + asks.join(' | '));
  ok(/MediaStore\.ACTION_IMAGE_CAPTURE/.test(java) && /EXTRA_INITIAL_INTENTS, new Intent\[\] \{ shot \}/.test(java) && /new File\(getCacheDir\(\), "camera"\)/.test(java) && /<cache-path name="camera" path="camera\/" \/>/.test(paths)
    && /android\.media\.action\.IMAGE_CAPTURE/.test(man) && /cameraFile\.length\(\) > 0/.test(java),
    '"Take a photo" is in the photo chooser beside the gallery: the phone\'s camera app writes to the app\'s own cache, and an empty file (a cancelled shot) is never handed to the page');
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
  await b.close();
})();
