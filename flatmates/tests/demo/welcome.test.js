// Welcome page and sign-in card in demo mode (port 8765): the form says what is missing, a pasted or auto-filled
// number is tidied to its 10 digits, the code screen opens without the old error, and the way back works.
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
  ok(/What brings you here/.test(e.box) && /Mobile number/.test(e.box) && e.box === e.toast, 'empty form names what is missing: ' + e.box);
  await p.screenshot({ path: `${O}/welcome-1-errors.png` });
  // a pasted number with +91 and spaces, one with a leading 0, one with dashes
  await p.click('.role:nth-child(1)');
  for (const [raw, want] of [['+91 98765 43210', '9876543210'], ['098765 43210', '9876543210'], ['98765-43210', '9876543210'], ['9123456789', '9123456789']]) {
    await p.fill('#lgPhone', ''); await p.evaluate(v => { const el = $('lgPhone'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, raw);
    ok(await phone() === want, `"${raw}" becomes ${await phone()}`);
  }
  await p.fill('#lgPhone', ''); await p.type('#lgPhone', '98765432101');
  ok(await phone() === '9876543210', 'an 11th typed digit is dropped: ' + await phone());
  // a short number is refused, then a good one opens the code screen with no error left behind
  await p.fill('#lgPhone', '98765'); await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(400);
  e = await err(); ok(/Mobile number/.test(e.box) && !/What brings/.test(e.box), 'short number: only the number is named: ' + e.box);
  await p.fill('#lgPhone', '9876543210'); await p.waitForTimeout(1300); await p.click('#loginForm [data-channel=whatsapp]'); await p.waitForTimeout(800);
  const otp = await p.evaluate(() => ({ shown: !$('otpForm').hidden, login: $('loginForm').hidden, to: $('otpTo').textContent, title: $('otpTitle').textContent, toast: !!document.querySelector('.toast'), focused: document.activeElement && document.activeElement.id }));
  ok(otp.shown && otp.login && otp.to === '+91 9876543210' && /WhatsApp/.test(otp.title) && !otp.toast && otp.focused === 'lgOtp', 'code screen, old error gone, code field focused: ' + JSON.stringify(otp));
  await p.screenshot({ path: `${O}/welcome-2-code.png` });
  await p.click('#otpBack'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !$('loginForm').hidden && $('otpForm').hidden && $('lgPhone').value === '9876543210'), 'back to the number, which is kept');
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
