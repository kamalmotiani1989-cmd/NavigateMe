// Welcome page and sign-in card in demo mode (port 8765): the form says what is missing, a pasted or auto-filled
// number is tidied to its 10 digits, the code screen opens without the old error, and the way back works.
// 18 or older: no code without the tick, the tick lets it through, the request without it is refused, the
// confirmation is kept on the account, and an account from before is asked once.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
  const err = () => p.evaluate(() => ({ box: (document.querySelector('#loginForm .form-err') || {}).textContent || '', toast: (document.querySelector('.toast') || {}).textContent || '' }));
  const phone = () => p.$eval('#lgPhone', el => el.value);
  // nothing filled in: both the choice and the number are named
  await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(500);
  let e = await err();
  ok(/What brings you here/.test(e.box) && /Mobile number/.test(e.box) && /18 or older/.test(e.box) && e.box === e.toast, 'empty form names what is missing, the 18+ tick too: ' + e.box);
  const tick = await p.evaluate(() => { const t = $('lgAge'), b = document.querySelector('#loginForm [data-channel=whatsapp]'); return { text: t.parentElement.textContent.trim(), required: t.required, above: !!(t.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING), checked: t.checked }; });
  ok(tick.text === 'I am 18 or older' && tick.required && tick.above && !tick.checked, 'the tick sits above the code button, unticked: ' + JSON.stringify(tick));
  await p.screenshot({ path: `${O}/welcome-1-errors.png` });
  // a pasted number with +91 and spaces, one with a leading 0, one with dashes
  await p.click('.role:nth-child(1)');
  for (const [raw, want] of [['+91 98765 43210', '9876543210'], ['098765 43210', '9876543210'], ['98765-43210', '9876543210'], ['9123456789', '9123456789']]) {
    await p.fill('#lgPhone', ''); await p.evaluate(v => { const el = $('lgPhone'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, raw);
    ok(await phone() === want, `"${raw}" becomes ${await phone()}`);
  }
  await p.fill('#lgPhone', ''); await p.type('#lgPhone', '98765432101');
  ok(await phone() === '9876543210', 'an 11th typed digit is dropped: ' + await phone());
  // a good number but no tick: no code, a plain reason, the code screen stays shut
  await p.fill('#lgPhone', '9876543210'); await p.waitForTimeout(1300); await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(500);
  e = await err();
  ok(/18 or older/.test(e.box) && !/Mobile number|What brings/.test(e.box) && await p.evaluate(() => $('otpForm').hidden && !$('loginForm').hidden), 'no tick: no code, and the message says why: ' + e.box);
  await p.screenshot({ path: `${O}/welcome-1b-age.png` });
  // the request itself is refused without the tick (the server does the same: fm_otp_request)
  const refused = await p.evaluate(async () => { try{ await api.sendOtp('9876543210', '', 'seeker', { channel: 'whatsapp' }); return 'sent'; }catch(err){ return err.code; } });
  ok(refused === 'age-required', 'a code request without the tick is refused: ' + refused);
  await p.click('label.age-tick:has(#lgAge)');
  // a short number is refused, then a good one opens the code screen with no error left behind
  await p.fill('#lgPhone', '98765'); await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(400);
  e = await err(); ok(/Mobile number/.test(e.box) && !/What brings|18 or older/.test(e.box), 'short number: only the number is named: ' + e.box);
  await p.fill('#lgPhone', '9876543210'); await p.waitForTimeout(1300); await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(800);
  const otp = await p.evaluate(() => ({ shown: !$('otpForm').hidden, login: $('loginForm').hidden, to: $('otpTo').textContent, title: $('otpTitle').textContent, toast: !!document.querySelector('.toast'), focused: document.activeElement && document.activeElement.id }));
  ok(otp.shown && otp.login && otp.to === '+91 9876543210' && /WhatsApp/.test(otp.title) && !otp.toast && otp.focused === 'lgOtp', 'code screen, old error gone, code field focused: ' + JSON.stringify(otp));
  await p.screenshot({ path: `${O}/welcome-2-code.png` });
  await p.click('#otpBack'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !$('loginForm').hidden && $('otpForm').hidden && $('lgPhone').value === '9876543210'), 'back to the number, which is kept');
  // with the tick: sign in, and the confirmation is kept on the account with the time
  await p.evaluate(() => { demoOtpLog['9876543210'] = []; });   // the demo keeps the server's one-code-a-minute rule
  await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(800);
  const code = await p.evaluate(() => ($('otpDemo').textContent.match(/\d{6}/) || [])[0]);
  await p.fill('#lgOtp', code); await p.click('#otpForm [type=submit]'); await p.waitForTimeout(2000);
  const kept = await p.evaluate(() => ({ adultAt: state.user && state.user.adultAt, box: $('dlgAge').open }));
  ok(kept.adultAt && Math.abs(Date.now() - Date.parse(kept.adultAt)) < 120e3 && !kept.box, 'signed in with the tick: confirmation kept with the time, no box: ' + JSON.stringify(kept));
  await ctx.close();
  // an account from before the tick: asked once, can't close the box without ticking, then never again
  const old = { user:{ phone:'9877777777', name:'Ravi', role:'seeker', gender:'male', occupation:{ type:'working', what:'x' } }, account:'9877777777', onboarded:{ seeker:true }, attrClaimed:true, giftSeen:true,
    vibe:{ sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' }, prefs:{ city:'Bengaluru', areas:[] } };
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await c2.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, old);
  const q = await c2.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto('http://localhost:8765/#discover'); await q.waitForTimeout(2000);
  const box = await q.evaluate(() => ({ open: $('dlgAge').open, title: $('agTitle').textContent, gender: $('dlgGender').open }));
  ok(box.open && box.title === 'One quick question' && !box.gender, 'an account from before is asked first, in the one-question box: ' + JSON.stringify(box));
  await q.screenshot({ path: `${O}/welcome-3-age-box.png` });
  await q.keyboard.press('Escape'); await q.waitForTimeout(300);
  await q.click('#agForm [type=submit]'); await q.waitForTimeout(400);
  const stuck = await q.evaluate(() => ({ open: $('dlgAge').open, err: (document.querySelector('#agForm .form-err') || {}).textContent || '', adultAt: state.user.adultAt }));
  ok(stuck.open && /18 or older/.test(stuck.err) && !stuck.adultAt, 'Escape and Continue without the tick keep the box open: ' + JSON.stringify(stuck));
  await q.click('label.age-tick:has(#agAge)'); await q.click('#agForm [type=submit]'); await q.waitForTimeout(500);
  const done = await q.evaluate(() => ({ open: $('dlgAge').open, adultAt: state.user.adultAt }));
  await q.reload(); await q.waitForTimeout(2000);
  const again = await q.evaluate(() => $('dlgAge').open);
  ok(!done.open && done.adultAt && !again, 'ticked: saved with the time, and not asked again after a reload: ' + JSON.stringify(done));
  await c2.close();
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
