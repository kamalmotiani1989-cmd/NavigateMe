// "New version available" in the Android app (Kamal, 13 Nov; demo mode, port 8765, 390 wide). The app tells the page
// its build number; the page reads the latest build from the release notes (mocked here) and shows a card with
// Update when there is a newer one; Later hides it for a day; the release is read at most every 6 hours; offline or
// a failed read shows nothing; the website (no app) never checks.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const st = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'Designer' } },
  account:'9811111111', onboarded:{ seeker:true }, giftSeen:true, attrClaimed:true, vibeCardSeen:true, prefs:{ city:'Bengaluru', areas:[] },
  notified:{}, demoInvites:'done', demoTribeAt:'done', credits:5, giftGiven:true, profilePromoHidden: Date.now() + 9e9 };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { try{ if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }catch(e){} }, st);
  let calls = 0, body = 'Latest Flatmates Android build (0ddb42f, build 196). Download flatmates.apk on your phone and open it to install.', fail = false;
  await ctx.route('https://api.github.com/**', r => { calls++; return fail ? r.abort() : r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body: JSON.stringify({ body }) }); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/#discover'); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  ok(calls === 0 && !(await p.$('#updBar')), 'the website (no app around it) never checks for an app update');

  await p.evaluate(() => checkAppUpdate(196)); await p.waitForTimeout(300);
  ok(calls === 1 && !(await p.$('#updBar')), 'the app is on the latest build: nothing shows');

  await p.evaluate(() => localStorage.removeItem('fm_app_update'));
  await p.evaluate(() => checkAppUpdate(190)); await p.waitForTimeout(300);
  const bar = await p.evaluate(() => { const e = $('updBar'); if(!e) return null; const r = e.getBoundingClientRect(), nav = document.querySelector('.tabbar, nav.bottom, #bottomNav');
    return { text: e.innerText.replace(/\s+/g, ' ').trim(), href: e.querySelector('.upd-go').href, bottom: Math.round(r.bottom), w: Math.round(r.width), color: getComputedStyle(e).color }; });
  ok(bar && /A new version of the app is ready/.test(bar.text) && /Update/.test(bar.text) && bar.href === 'https://github.com/kamalmotiani1989-cmd/findmeflatmate/releases/download/flatmates-apk/flatmates.apk' && bar.bottom < 844 && bar.w <= 390,
    'an older app: "A new version of the app is ready" with Update, linking to the download: ' + JSON.stringify(bar));
  await p.screenshot({ path: O + '/p20-update.png' });

  await p.evaluate(() => checkAppUpdate(190)); await p.waitForTimeout(200);
  ok(calls === 2, 'the release is read at most every 6 hours (no new read on the next open): ' + calls);
  await p.click('#updBar .upd-x'); await p.waitForTimeout(200);
  await p.evaluate(() => checkAppUpdate(190)); await p.waitForTimeout(200);
  ok(!(await p.$('#updBar')), 'Later hides it, and it stays hidden on the next open');
  await p.evaluate(() => { const u = JSON.parse(localStorage.getItem('fm_app_update')); u.later.at -= 864e5 + 1000; localStorage.setItem('fm_app_update', JSON.stringify(u)); checkAppUpdate(190); }); await p.waitForTimeout(200);
  ok(!!(await p.$('#updBar')), 'a day later it comes back');
  await p.evaluate(() => $('updBar').remove());
  // a newer build after Later shows again straight away
  body = body.replace('build 196', 'build 197');
  await p.evaluate(() => { const u = JSON.parse(localStorage.getItem('fm_app_update')); u.later = { build: 196, at: Date.now() }; u.at = 0; localStorage.setItem('fm_app_update', JSON.stringify(u)); checkAppUpdate(190); }); await p.waitForTimeout(300);
  ok(!!(await p.$('#updBar')), 'Later is for that version only: a newer one shows again');
  await p.evaluate(() => $('updBar').remove());
  // offline: nothing, no error
  fail = true; await p.evaluate(() => { localStorage.removeItem('fm_app_update'); return checkAppUpdate(150); }); await p.waitForTimeout(300);
  ok(!(await p.$('#updBar')), 'offline or a failed read: nothing shows, no error');
  await b.close();
  ok(!errs.length, 'no page errors: ' + errs.join(' | '));
})();
