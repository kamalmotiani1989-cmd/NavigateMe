// Flatsplits in demo mode (8765): edit an expense (edited mark, history), delete + undo, edit a payment,
// the invite link with the balance and the invite page, CSV export.
const { chromium } = require('playwright');
const O = process.argv[2], ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m), errs = [];
const vibe = { sleep:1, clean:1, food:1, cook:1, smoke:0, drinks:1, guests:1, noise:1, social:1, sharing:1, work:0, pets:1, gen:'z' };
const seeker = { user:{ adultAt:'2026-11-01T00:00:00.000Z', phone:'9811111111', name:'Neha', role:'seeker', gender:'female', occupation:{ type:'working', what:'x' } }, account:'9811111111', onboarded:{ seeker:true },
  giftSeen:true, attrClaimed:true, vibeCardSeen:true, vibe, prefs:{ city:'Bengaluru', areas:[], moveIn:'2w' }, profilePromoHidden: Date.now() + 9e9, notified:{}, demoInvites:'done', demoTribeAt:'done' };
const closeDialogs = p => p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true });
  await ctx.addInitScript(s => { if(!localStorage.getItem('fm_state')){ localStorage.setItem('fm_state', JSON.stringify(s)); localStorage.setItem('fm_state:' + s.account, JSON.stringify(s)); } }, seeker);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(1500); await closeDialogs(p);
  const g = await p.evaluate(async () => {
    const id = await api.splitCreate('Flat 7A', '🏠', [{ name: 'Riya', phone: '9811100001' }, { name: 'Kabir', phone: '9811100002' }], 'flat');
    const d = await api.splitGet(id), me = d.me, [riya, kabir] = d.members.filter(m => m.id !== me).map(m => m.id);
    const eq = (amt, ids) => Object.fromEntries(ids.map((x, i) => [x, Math.floor(amt / ids.length) + (i < amt % ids.length ? 1 : 0)]));
    const groceries = await api.splitAdd(id, { kind: 'expense', title: 'Groceries', category: 'groceries', amount: 90000, paid_by: me, splits: eq(90000, [me, riya, kabir]), spent_on: new Date().toISOString().slice(0, 10) });
    const rent = await api.splitAdd(id, { kind: 'expense', title: 'Rent', category: 'rent', amount: 3000000, paid_by: riya, splits: eq(3000000, [me, riya, kabir]), spent_on: new Date().toISOString().slice(0, 10) });
    const pay = await api.splitAdd(id, { kind: 'settle', title: 'Settle up', category: 'other', amount: 50000, paid_by: me, splits: { [riya]: 50000 }, spent_on: new Date().toISOString().slice(0, 10) });
    return { id, me, riya, kabir, groceries, rent, pay };
  });
  await p.goto('http://localhost:8765/#splits/' + g.id); await p.waitForTimeout(1500);
  const a1 = await p.evaluate(() => ({ rows: document.querySelectorAll('#fsPanel .fs-row').length, tools: [...document.querySelectorAll('.fs-tools .linkbtn')].map(b => b.textContent) }));
  ok(a1.rows === 3 && a1.tools.join() === 'History,Export', 'group shows 3 rows with History and Export: ' + JSON.stringify(a1));
  // edit the groceries expense
  await p.click(`[data-fs-exp="${g.groceries}"]`); await p.waitForTimeout(500);
  ok(!!(await p.$('#dlgFs [data-fs-edit]')), 'expense detail has Edit');
  await p.click('#dlgFs [data-fs-edit]'); await p.waitForTimeout(500);
  const ed = await p.evaluate(() => ({ title: $('fsdTitle').textContent, amt: $('fsAmt').value, name: $('fsTitle').value, paid: document.querySelector('[name=fsPaid]:checked').value, how: document.querySelector('[data-how][aria-pressed=true]').dataset.how, btn: document.querySelector('#fsAddForm [type=submit]').textContent }));
  ok(ed.title === 'Edit expense' && ed.amt === '900' && ed.name === 'Groceries' && ed.paid === g.me && ed.how === 'equal' && ed.btn === 'Save changes', 'edit form prefilled: ' + JSON.stringify(ed));
  await p.screenshot({ path: `${O}/p7-m-edit.png` });
  await p.fill('#fsAmt', '1200'); await p.fill('#fsTitle', 'Groceries + milk'); await p.click('#fsAddForm [type=submit]'); await p.waitForTimeout(1200);
  const after = await p.evaluate(async id => { const d = await api.splitGet(fsData.group.id); const e = d.expenses.find(x => x.id === id);
    return { amount: e.amount, title: e.title, edited: !!e.edited_at, tag: !!document.querySelector(`[data-fs-exp="${id}"] .ed`), log: d.log.map(l => l.action).join(','), sum: Object.values(e.splits).reduce((a, b2) => a + b2, 0) }; }, g.groceries);
  ok(after.amount === 120000 && after.title === 'Groceries + milk' && after.edited && after.tag && after.sum === 120000 && after.log.startsWith('edit'), 'edit saved: amount, title, split, edited mark, logged: ' + JSON.stringify(after));
  await p.click(`[data-fs-exp="${g.groceries}"]`); await p.waitForTimeout(400);
  ok(/Edited by You/.test(await p.textContent('#fsdBody')), 'detail says who edited it');
  await closeDialogs(p);
  // history
  await p.click('.fs-tools [data-fs="history"]'); await p.waitForTimeout(500);
  const hist = await p.evaluate(() => [...document.querySelectorAll('.fs-log')].map(l => l.innerText.replace(/\s+/g, ' ')));
  ok(hist.length === 4 && /You changed Groceries \+ milk/.test(hist[0]) && /name “Groceries” → “Groceries \+ milk”, amount ₹900 → ₹1,200, the split/.test(hist[0]) && /recorded a payment/.test(hist[1]), 'history lists the change in words: ' + hist[0]);
  await p.screenshot({ path: `${O}/p7-m-history.png` });
  await closeDialogs(p);
  // delete + undo
  const balBefore = await p.textContent('.fs-bal b');
  await p.click(`[data-fs-exp="${g.rent}"]`); await p.waitForTimeout(400); await p.click('#dlgFs [data-fs-del]'); await p.waitForTimeout(200); await p.click('#dlgFs [data-fs-del]'); await p.waitForTimeout(1200);
  const del = await p.evaluate(() => ({ rows: document.querySelectorAll('#fsPanel .fs-row').length, undo: (document.querySelector('.fs-undo') || {}).innerText || '', bal: document.querySelector('.fs-bal b').textContent }));
  ok(del.rows === 2 && /You deleted Rent · ₹30,000/.test(del.undo) && /Undo/.test(del.undo) && del.bal !== balBefore, 'deleted: row gone, undo bar, balance changed: ' + del.undo.replace(/\s+/g, ' '));
  await p.screenshot({ path: `${O}/p7-m-undo.png` });
  await p.click('[data-fs-undo]'); await p.waitForTimeout(1200);
  const und = await p.evaluate(async () => { const d = await api.splitGet(fsData.group.id); return { rows: document.querySelectorAll('#fsPanel .fs-row').length, undo: !!document.querySelector('.fs-undo'), bal: document.querySelector('.fs-bal b').textContent, log: d.log.slice(0, 2).map(l => l.action).join(',') }; });
  ok(und.rows === 3 && !und.undo && und.bal === balBefore && und.log === 'restore,delete', 'undo restores it and the balance; logged: ' + JSON.stringify(und));
  // edit a payment
  await p.click(`[data-fs-exp="${g.pay}"]`); await p.waitForTimeout(400); await p.click('#dlgFs [data-fs-edit]'); await p.waitForTimeout(400);
  ok(!!(await p.$('#fsSettleEditForm')) && (await p.inputValue('#fsSEAmt')) === '500', 'a payment opens the small edit form');
  await p.fill('#fsSEAmt', '600'); await p.click('#fsSettleEditForm [type=submit]'); await p.waitForTimeout(1000);
  ok(await p.evaluate(async id => { const e = (await api.splitGet(fsData.group.id)).expenses.find(x => x.id === id); return e.amount === 60000 && Object.values(e.splits)[0] === 60000 && !!e.edited_at; }, g.pay), 'payment amount changed, both sides');
  // invite link with the balance for someone not on the app
  await p.evaluate(async () => { await api.splitAddMember(fsData.group.id, 'Tara', '9899999999'); const d = await api.splitGet(fsData.group.id); const t = d.members.find(m => m.name === 'Tara');
    const ids = d.members.map(m => m.id); await api.splitAdd(d.group.id, { kind:'expense', title:'Wi-Fi', category:'wifi', amount:40000, paid_by:d.me, splits:Object.fromEntries(ids.map(x => [x, 10000])), spent_on:new Date().toISOString().slice(0, 10) }); });
  await p.goto('http://localhost:8765/#splits'); await p.waitForTimeout(500); await p.goto('http://localhost:8765/#splits/' + g.id); await p.waitForTimeout(1200);
  await p.click('[data-fs="members"]'); await p.waitForTimeout(500);
  const inv = await p.evaluate(() => { const a = [...document.querySelectorAll('#fsdBody a[href^="https://wa.me/919899999999"]')][0]; return a ? decodeURIComponent(a.href) : ''; });
  const code = (inv.match(/#split\/([A-Z0-9]{8})/) || [])[1];
  ok(/Right now you owe ₹100/.test(inv) && code, 'invite text carries the balance and the link: ' + inv.slice(inv.indexOf('Flatsplits'), inv.indexOf('Flatsplits') + 120));
  await closeDialogs(p);
  // the invite page (signed in on this device: "Open the group")
  await p.goto('http://localhost:8765/#split/' + code); await p.waitForTimeout(1200);
  const sp = await p.evaluate(() => ({ h1: $('spBody').querySelector('h1').textContent, bal: $('spBody').querySelector('.sp-bal').innerText.replace(/\s+/g, ' '), cta: ($('spBody').querySelector('.pt-foot a, .pt-foot button') || {}).textContent, phones: /\d{10}/.test($('spBody').innerText) }));
  ok(sp.h1 === 'Hi Tara, you’re in “Flat 7A”'.replace('’', "'") && /You owe ₹100/.test(sp.bal) && /to (Neha|Riya|Kabir)/.test(sp.bal) && sp.cta === 'Open the group' && !sp.phones, 'invite page: name, balance, who, no numbers: ' + JSON.stringify(sp));
  await p.screenshot({ path: `${O}/p7-m-invite.png`, fullPage: true });
  ok(await p.evaluate(async () => !(await api.splitInvite('NOPE1234'))), 'a wrong code gives nothing');
  // export
  await p.goto('http://localhost:8765/#splits/' + g.id); await p.waitForTimeout(1200);
  await p.click('.fs-tools [data-fs="export"]'); await p.waitForTimeout(500);
  const ex = await p.evaluate(() => ({ periods: [...document.querySelectorAll('#fsExpPeriod [data-period]')].map(b => b.textContent), count: $('fsExpCount').textContent, csv: fsCsv('all') }));
  const lines = ex.csv.text.split('\r\n');
  ok(ex.periods[0] === 'This month' && ex.periods[ex.periods.length - 1] === 'Everything' && /^4 rows/.test(ex.count) && lines.length === 5 && /"Riya share \(INR\)"/.test(lines[0]) && lines.some(l => /"Groceries \+ milk"/.test(l) && /"1200.00"/.test(l)) && lines.some(l => /"Payment"/.test(l) && /"received 600.00"/.test(l)),
    'CSV has a header per person, the edited expense and the payment: ' + lines[0].slice(0, 80));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), p.click('#dlgFs [data-fs-export]')]);
  ok(/^Flat-7A-\d{4}-\d{2}\.csv$/.test(dl.suggestedFilename()), 'share without a share sheet downloads the file: ' + dl.suggestedFilename());
  await p.screenshot({ path: `${O}/p7-m-export.png` });
  await ctx.close(); await b.close(); console.log('errors', errs);
})();
