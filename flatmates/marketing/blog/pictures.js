// Draws the picture each article shows when its link is shared: flatmates/blog/og/<slug>.png, 1200 x 630.
// Run through build.js:  node flatmates/marketing/blog/build.js --pictures        (the ones that are missing or whose
//                                                                                 title, key word, topic or cover changed)
//                        node flatmates/marketing/blog/build.js --pictures --all  (every one, after a change of look)
// Needs Playwright (Chromium) and python3 with Pillow, like tests/demo/og-image.js, whose recipe this follows: the
// deep warm brown inside a thin orange frame, white serif words, the key word in light orange with the hand-drawn
// line, our cartoon people, the logo as it is. Everything that matters sits in the middle 630 px, because some apps
// crop to a square. WhatsApp shows a link's picture reliably only when the file is small, so each one is reduced to
// 256 colours and held under 300 KB (p35 checks).
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), crypto = require("crypto"), { execFileSync } = require("child_process");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TYPES = { ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".css": "text/css", ".html": "text/html; charset=utf-8" };

// what a picture is made from: when this changes, the picture is drawn again
const stamp = (p, look) => crypto.createHash("sha256").update([p.title, p.kw, p.topic, p.cover, look].join("\n")).digest("hex").slice(0, 12);
const LOOK = "2026-11-18.2";   // change this when the picture's own design changes

function page(p, { NAME, topicName, COVERS, ICONS, avatar, avatarCss }){
  const c = COVERS[p.cover], half = Math.ceil(c.cast.length / 2), av = i => `<span class="av">${avatar(i)}</span>`;
  // the key word, and a comma or full stop straight after it, stay on one line
  const at = p.kw ? p.title.indexOf(p.kw) : -1, after = at < 0 ? "" : p.title.slice(at + p.kw.length), stop = (after.match(/^[.,?!:;]+/) || [""])[0];
  const title = at < 0 ? esc(p.title) : esc(p.title.slice(0, at)) + `<span class="keep"><span class="okw">${esc(p.kw)}<svg viewBox="0 0 500 40" preserveAspectRatio="none"><path d="M8 26 C120 10 260 34 492 14"/></svg></span>${esc(stop)}</span>` + esc(after.slice(stop.length));
  const size = p.title.length > 46 ? 60 : p.title.length > 34 ? 68 : 78;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
@font-face{font-family:"Urbanist"; font-weight:100 900; src:url(/vendor/fonts/urbanist-latin-wght-normal.woff2) format("woff2")}
@font-face{font-family:"DM Serif Display"; font-weight:400; src:url(/vendor/fonts/dm-serif-display-latin-400-normal.woff2) format("woff2")}
*{box-sizing:border-box} html, body{margin:0}
body{position:relative; width:1200px; height:630px; overflow:hidden; display:flex; flex-direction:column; align-items:center; text-align:center; color:#fff; font-family:"Urbanist", sans-serif;
  background:radial-gradient(62% 56% at 14% 18%, #9A5B00 0, transparent 72%), radial-gradient(58% 60% at 92% 30%, #7A3410 0, transparent 72%), radial-gradient(80% 62% at 55% 108%, #B45309 0, transparent 70%), #5C2408}
body::after{content:""; position:absolute; inset:18px; border:10px solid #C2410C; border-radius:26px}
.brand{position:relative; margin-top:54px; display:flex; align-items:center; gap:14px}
.brand .m{width:50px; height:50px} .brand .w{height:23px; width:auto; display:block}
.brand b{margin-left:4px; padding:5px 14px; border-radius:999px; background:#fff; color:#1C1917; font-size:17px; font-weight:800; letter-spacing:.08em; text-transform:uppercase}
.lab{position:relative; margin:30px 0 0; font-size:20px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#FDBA74}
h1{position:relative; margin:10px 0 0; max-width:960px; font-family:"DM Serif Display", serif; font-weight:400; font-size:${size}px; line-height:1.06; text-wrap:balance}
.keep{white-space:nowrap}
.okw{position:relative; display:inline-block; white-space:nowrap; color:#FDBA74}
.okw svg{position:absolute; left:-4%; bottom:-.14em; width:108%; height:.3em; overflow:visible}
.okw path{fill:none; stroke:#FDBA74; stroke-width:9; stroke-linecap:round}
.row{position:absolute; left:0; right:0; bottom:66px; display:flex; align-items:center; justify-content:center}
.av{display:block; flex:none; width:118px; height:118px; border-radius:50%; overflow:hidden; background:#fff; box-shadow:0 0 0 6px #fff, 0 14px 30px rgba(20,8,0,.35)}
.av svg{display:block; width:100%; height:100%}
.av + .av{margin-left:-16px}
.disc{position:relative; z-index:1; flex:none; display:grid; place-items:center; width:108px; height:108px; margin:0 -16px; border-radius:50%; background:#1C1917; color:#fff; box-shadow:0 0 0 6px #fff, 0 14px 30px rgba(20,8,0,.4)}
.disc svg{width:54%; height:54%} .disc .a{stroke:#FDBA74} .disc .af{fill:#FDBA74}
${avatarCss}
.fm-av, .fm-av *{animation:none !important}
</style></head><body>
<div class="brand"><img class="m" src="/icons/logo-icon.svg" alt=""><img class="w" src="/icons/wordmark-light.svg" alt=""><b>Blog</b></div>
<p class="lab">${esc(topicName(p.topic))}</p>
<h1>${title}</h1>
<div class="row">${c.cast.slice(0, half).map(av).join("")}<span class="disc">${ICONS[c.icon]}</span>${c.cast.slice(half).map(av).join("")}</div>
</body></html>`;
}

module.exports = async function(ctx){
  const { posts, APP, OUT } = ctx, all = process.argv.includes("--all"), dir = path.join(OUT, "og"), manifest = path.join(__dirname, "pictures.json");
  let made = {}; try{ made = JSON.parse(fs.readFileSync(manifest, "utf8")); }catch(e){}
  fs.mkdirSync(dir, { recursive: true });
  // pictures whose article is gone
  fs.readdirSync(dir).forEach(f => { if(/^[a-z0-9-]+\.png$/.test(f) && !posts.some(p => p.slug + ".png" === f)) fs.unlinkSync(path.join(dir, f)); });
  Object.keys(made).forEach(k => { if(!posts.some(p => p.slug === k)) delete made[k]; });
  const todo = posts.filter(p => all || made[p.slug] !== stamp(p, LOOK) || !fs.existsSync(path.join(dir, p.slug + ".png")));
  if(!todo.length){ console.log("blog: the share pictures are up to date"); return; }
  const { chromium } = require("playwright");
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]), m = u.match(/^\/__og\/([a-z0-9-]+)$/);
    if(m){ const p = posts.find(x => x.slug === m[1]); if(!p){ res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": TYPES[".html"] }); return res.end(page(p, ctx)); }
    const f = path.join(APP, path.normalize(u).replace(/^(\.\.[\/\\])+/, ""));
    if(!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port, b = await chromium.launch();
  try{
    const pg = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    for(const p of todo){
      const out = path.join(dir, p.slug + ".png");
      await pg.goto(base + "/__og/" + p.slug); await pg.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
      const fit = await pg.evaluate(() => { const h = document.querySelector("h1").getBoundingClientRect(), r = document.querySelector(".row").getBoundingClientRect(); return { gap: Math.round(r.top - h.bottom), lines: Math.round(h.height / parseFloat(getComputedStyle(document.querySelector("h1")).lineHeight)) }; });
      if(fit.gap < 18) throw new Error(p.file + ": the title is too long for its share picture (" + fit.lines + " lines); shorten it");
      await pg.waitForTimeout(200); await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
      execFileSync("python3", ["-c", 'import sys\nfrom PIL import Image\nim = Image.open(sys.argv[1]).convert("RGB")\nim.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(sys.argv[1], optimize=True)', out]);
      const kb = Math.round(fs.statSync(out).size / 1024); if(kb >= 300) throw new Error("blog/og/" + p.slug + ".png is " + kb + " KB; WhatsApp wants it under 300 KB");
      made[p.slug] = stamp(p, LOOK); console.log("blog: drew blog/og/" + p.slug + ".png (" + kb + " KB, title on " + fit.lines + " line" + (fit.lines === 1 ? "" : "s") + ")");
    }
  } finally { await b.close(); server.close(); }
  const sorted = {}; Object.keys(made).sort().forEach(k => sorted[k] = made[k]);
  fs.writeFileSync(manifest, JSON.stringify(sorted, null, 2) + "\n");
};
module.exports.stamp = stamp; module.exports.LOOK = LOOK;
