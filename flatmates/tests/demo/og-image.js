// Draws flatmates/og-image.png, the 1200 x 630 picture that WhatsApp, Instagram, LinkedIn and X show when someone
// shares findmeflatmate.com. Not a test: run it when the look, the logo or the headline changes.
//   cd flatmates && python3 -m http.server 8765 &      (any copy of the page will do)
//   node tests/demo/og-image.js [http://localhost:8765/]
// It is drawn from the page's own parts (logo, colours, font, cartoon people, match ring), so it follows the look.
// The look of 17 Nov 2026: the deep warm brown inside a thin orange frame, white serif words, the key word in light
// orange with the hand-drawn line under it, as on the reels' last scene.
// Everything that matters sits in the middle 630 px, because some apps crop the picture to a square.
// WhatsApp shows a link's picture reliably only when the file is small (p25 holds it under 300 KB). The brown's soft
// glows make a large file, so the picture is reduced to 256 colours at the end (python3 with Pillow; the logo's orange
// and the frame's stay exact, p31 reads them). Without Pillow the full-colour file is left and its size is printed.
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const url = process.argv[2] || 'http://localhost:8765/', out = path.join(__dirname, '..', '..', 'og-image.png');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport:{ width:1200, height:630 }, deviceScaleFactor:1 });
  await p.goto(url); await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    const o = document.createElement('div'); o.id = 'og';
    o.innerHTML = `<style>
        #og{position:fixed; inset:0; z-index:2147483647; overflow:hidden; background:var(--dark-hero) var(--brown); color:#fff; font-family:var(--display);
          display:flex; flex-direction:column; align-items:center; text-align:center}
        #og::after{content:""; position:absolute; inset:18px; border:10px solid var(--orange); border-radius:26px; pointer-events:none}   /* the thin orange frame */
        #og .og-brand{position:relative; margin-top:50px; display:flex; align-items:center; gap:14px}
        #og .og-brand img.fm-mark{width:54px; height:54px}
        #og .og-brand img.wmk{height:25px; width:auto; display:block}
        #og h1{position:relative; margin:30px 0 0; font-size:88px; line-height:1.04; color:#fff}   /* the serif comes from the page's own rule for h1 */
        #og h1 em{display:block; font-style:normal; color:#fff}
        #og .okw{position:relative; display:inline-block; color:var(--orange-lt)}                 /* the key word: light orange, underlined by hand */
        #og .okw svg{position:absolute; left:-4%; bottom:-.14em; width:108%; height:.3em; overflow:visible}
        #og .okw path{fill:none; stroke:var(--orange-lt); stroke-width:9; stroke-linecap:round}
        #og .og-row{position:relative; display:flex; align-items:center; margin-top:38px}
        #og .og-row > span{display:block; width:128px; height:128px; border-radius:50%; overflow:hidden; background:var(--surface); box-shadow:0 0 0 6px var(--surface), 0 14px 30px rgba(20,8,0,.35)}
        #og .og-row > span + span, #og .og-row > b + span{margin-left:-18px}
        #og .og-row > span svg{display:block; width:100%; height:100%}
        #og .og-row > b{position:relative; z-index:1; margin:0 -18px 0 -18px; line-height:0; border-radius:50%; box-shadow:0 0 0 6px var(--surface), 0 14px 30px rgba(20,8,0,.4)}
        #og .ring circle:first-child{fill:var(--ink)}
        #og .og-line{position:relative; margin:30px 0 0; font-size:27px; font-weight:600; color:#fff}
      </style>
      <div class="og-brand"><img class="fm-mark" src="icons/logo-icon.svg" alt=""><img class="wmk" src="icons/wordmark-light.svg" alt=""></div>
      <h1>Find flatmates who <em>match your <span class="okw">vibe<svg viewBox="0 0 500 40" preserveAspectRatio="none"><path d="M8 26 C120 10 260 34 492 14"/></svg></span>.</em></h1>
      <div class="og-row"><span>${avCast(1)}</span><span>${avCast(0)}</span><b>${ringSvg(92, 112)}</b><span>${avCast(2)}</span><span>${avCast(3)}</span></div>
      <p class="og-line">Matched on how you live. No brokers, ever.</p>`;
    document.body.appendChild(o);
    await document.fonts.ready; await Promise.all([...o.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
  });
  await p.waitForTimeout(600);
  await p.screenshot({ path: out, clip:{ x:0, y:0, width:1200, height:630 } });
  await b.close();
  try{ execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nim = Image.open(sys.argv[1]).convert("RGB")\nim.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(sys.argv[1], optimize=True)', out]); }
  catch(e){ console.log('not reduced to 256 colours (python3 with Pillow is needed for that):', String(e.message).split('\n')[0]); }
  const kb = Math.round(fs.statSync(out).size / 1024); console.log('wrote', out, kb + ' KB' + (kb >= 300 ? ' (too big: p25 wants it under 300 KB)' : ''));
})();
