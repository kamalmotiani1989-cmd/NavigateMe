// Draws flatmates/og-image.png, the 1200 x 630 picture that WhatsApp, Instagram, LinkedIn and X show when someone
// shares findmeflatmate.com. Not a test: run it when the look, the logo or the headline changes.
//   cd flatmates && python3 -m http.server 8765 &      (any copy of the page will do)
//   node tests/demo/og-image.js [http://localhost:8765/]
// It is drawn from the page's own parts (logo, colours, font, cartoon people, match ring), so it follows the look.
// Everything that matters sits in the middle 630 px, because some apps crop the picture to a square.
const { chromium } = require('playwright'), path = require('path');
const url = process.argv[2] || 'http://localhost:8765/', out = path.join(__dirname, '..', '..', 'og-image.png');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport:{ width:1200, height:630 }, deviceScaleFactor:1 });
  await p.goto(url); await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    const o = document.createElement('div'); o.id = 'og';
    o.innerHTML = `<style>
        #og{position:fixed; inset:0; z-index:2147483647; overflow:hidden; background:var(--bg); color:var(--text); font-family:var(--display);
          display:flex; flex-direction:column; align-items:center; text-align:center}
        #og i.blob{position:absolute; border-radius:50%}
        #og .b1{left:-150px; top:-170px; width:460px; height:460px; background:var(--lav)}
        #og .b2{right:-170px; bottom:-190px; width:500px; height:500px; background:var(--red-tint)}
        #og .b3{right:-90px; top:-120px; width:270px; height:270px; background:var(--butter)}
        #og .b4{left:-70px; bottom:-110px; width:230px; height:230px; background:var(--red-soft)}
        #og .og-brand{position:relative; margin-top:50px; display:flex; align-items:center; gap:14px}
        #og .og-brand img.fm-mark{width:54px; height:54px}
        #og .og-brand img.wmk{height:25px; width:auto; display:block}
        #og h1{position:relative; margin:30px 0 0; font-size:88px; line-height:1.04; color:var(--ink)}   /* the serif comes from the page's own rule for h1 */
        #og h1 em{display:block; font-style:normal; color:var(--red-text)}
        #og .og-row{position:relative; display:flex; align-items:center; margin-top:38px}
        #og .og-row > span{display:block; width:128px; height:128px; border-radius:50%; overflow:hidden; background:var(--surface); box-shadow:0 0 0 6px var(--surface), 0 14px 30px rgba(60,40,30,.16)}
        #og .og-row > span + span, #og .og-row > b + span{margin-left:-18px}
        #og .og-row > span svg{display:block; width:100%; height:100%}
        #og .og-row > b{position:relative; z-index:1; margin:0 -18px 0 -18px; line-height:0; border-radius:50%; box-shadow:0 0 0 6px var(--surface), 0 14px 30px rgba(60,40,30,.2)}
        #og .ring circle:first-child{fill:var(--ink)}
        #og .og-line{position:relative; margin:30px 0 0; font-size:27px; font-weight:600; color:var(--text)}
      </style>
      <i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i><i class="blob b4"></i>
      <div class="og-brand"><img class="fm-mark" src="icons/logo-icon.svg" alt=""><img class="wmk" src="icons/wordmark.svg" alt=""></div>
      <h1>Find flatmates who <em>match your vibe.</em></h1>
      <div class="og-row"><span>${avCast(1)}</span><span>${avCast(0)}</span><b>${ringSvg(92, 112)}</b><span>${avCast(2)}</span><span>${avCast(3)}</span></div>
      <p class="og-line">Matched on how you live. No brokers, ever.</p>`;
    document.body.appendChild(o);
    await document.fonts.ready; await Promise.all([...o.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
  });
  await p.waitForTimeout(600);
  await p.screenshot({ path: out, clip:{ x:0, y:0, width:1200, height:630 } });
  console.log('wrote', out); await b.close();
})();
