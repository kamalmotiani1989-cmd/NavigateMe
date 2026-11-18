#!/usr/bin/env node
// Builds the website's blog, flatmates/blog/, from the articles in flatmates/marketing/blog/posts/.
//
//   node flatmates/marketing/blog/build.js             write the pages (and the blog's lines in sitemap.xml)
//   node flatmates/marketing/blog/build.js --check     write nothing; fail if the pages on disk are not what the
//                                                      articles say (the test suite p35 runs this)
//   node flatmates/marketing/blog/build.js --pictures  also draw the picture each article shows when its link is
//                                                      shared (blog/og/<slug>.png, 1200 x 630). Needs Playwright
//                                                      (Chromium) and python3 with Pillow, like tests/demo/og-image.js
//
// Why a script: every article needs its own page for search engines and for WhatsApp previews (a title, a
// description and a picture that are in the page before any script runs), and seven pages by hand would drift apart.
// The app's "no build step" still holds: what is published is plain files, committed here, and the website's
// publish job copies them as they are. No packages: Node's own modules only.
//
// What is where (README, "Blog"):
//   posts/<date>-<slug>.md   the articles: a few lines of facts about the article, then the words (posts/README in
//                            ../README.md says how to write one)
//   src/blog.css, src/blog.js  the blog's look and its extras (search, ticks, the calculator)
//   ../../blog/              what is published: don't edit there
// The cartoon people on the covers are drawn by the app's own avatar module, read out of ../../index.html, so the
// blog can never show a different drawing from the app.
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const HERE = __dirname, APP = path.join(HERE, "..", ".."), OUT = path.join(APP, "blog");
const SITE = "https://findmeflatmate.com/", BLOG = SITE + "blog/", NAME = "FindMeFlatMate";
const args = process.argv.slice(2), CHECK = args.includes("--check"), PICTURES = args.includes("--pictures");

// ------------------------------------------------------------------------------------------------ small helpers
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slugify = s => String(s).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const niceDate = iso => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const isoTime = iso => iso + "T09:00:00+05:30";   // articles go out in the morning, India time
const hash = s => crypto.createHash("sha256").update(s).digest("hex").slice(0, 10);
const fail = msg => { console.error("blog: " + msg); process.exit(1); };

// The topics, in the order of the chips. An article has exactly one.
const TOPICS = [["finding", "Finding a place"], ["money", "Money"], ["living", "Living together"], ["safety", "Safety"], ["paperwork", "Paperwork"]];
const topicName = k => (TOPICS.find(t => t[0] === k) || fail("unknown topic " + k))[1];
const TOPIC_MARK = { finding: "🔎", money: "₹", living: "🛋️", safety: "🛡️", paperwork: "📝" };
// The three things the first page points at: [article, the name of the box inside it, title, one line, the drawing].
const HANDY = [["split-rent-fairly", "split", "Rent split calculator", "Works it out as you type", "rupee"],
  ["flat-visit-checklist", "visit", "Flat-visit checklist", "Tick it off on your phone, or print it", "key"],
  ["house-rules-that-hold", "one-page", "House rules on one page", "Copy it, change it, send it to the flat", "rules"]];

// ------------------------------------------------------------------------------------------------ the cartoon people
// The app's own avatar module (index.html, "FMAvatar") and its cast, read from the app's page.
const appHtml = fs.readFileSync(path.join(APP, "index.html"), "utf8");
const FMAvatar = (() => {
  const m = appHtml.match(/\(function\(root\)\{\s*const INK = "#1C1917";[\s\S]*?\n\}\)\(this\);/);
  if(!m) fail("the avatar module was not found in index.html");
  const mod = { exports: {} }; new Function("module", m[0])(mod); return mod.exports;
})();
const fromApp = name => { const m = appHtml.match(new RegExp("const " + name + " = (\\[[\\s\\S]*?\\]);\\n")); if(!m) fail(name + " was not found in index.html"); return new Function("return " + m[1])(); };
const AV_RHYTHM = fromApp("AV_RHYTHM"), AV_HABIT = fromApp("AV_HABIT"), AV_CAST = fromApp("AV_CAST");
// The four people on the app's first page, then a few more for the blog, written the way the app saves an avatar:
// s skin, f face, h hair, hc hair colour, g glasses, b beard, t top, ty "<rhythm>-<habit>" (the scene and what they hold).
const CAST = AV_CAST.concat([
  { s:"s3", f:"grin", h:"long", hc:"#1C1917", t:"#E79078", ty:"1-2" },                // 4 · the host, with the chai
  { s:"s5", f:"calm", h:"short", hc:"#1C1917", g:true, t:"#C3E0D6", ty:"2-4" },        // 5 · the bookworm
  { s:"s2", f:"smile", h:"bun", hc:"#3A2A20", t:"#EBD981", ty:"0-3" },                 // 6 · the tidy one
  { s:"s4", f:"grin", h:"curly", hc:"#3A2A20", b:"moustache", t:"#86A6E0", ty:"1-7" }, // 7 · the foodie
  { s:"s6", f:"smile", h:"short", hc:"#1C1917", t:"#C3C9F6", ty:"0-10" },              // 8 · the go-getter
  { s:"s1", f:"calm", h:"bob", hc:"#8A5A3B", t:"#8D9B62", ty:"2-6" },                  // 9 · the homebody
  { s:"s3", f:"smile", h:"short", hc:"#1C1917", b:"full", g:true, t:"#FBF8F6", ty:"1-5" } // 10 · the one always on the phone
]);
let avN = 0;
function avatar(i){
  const a = CAST[i % CAST.length], [r, p] = String(a.ty || "").split("-").map(Number), c = a.c && a.c !== "none" ? { kind: a.c, colour: a.cc || "#C3C9F6" } : null;
  return FMAvatar.avatar({ key: "b" + (avN++), label: "", skin: a.s, mouth: a.f || "smile", hair: a.h || "short", hairColour: a.hc || "#1C1917", cover: c, glasses: !!a.g,
    beard: a.b === "full" || a.b === "moustache" ? a.b : null, top: a.t || "#86A6E0", rhythm: AV_RHYTHM[r] || "neutral", prop: AV_HABIT[p] || "", still: false, bare: false })
    .replace(/\s*\n\s*/g, "");
}

// What sits on the dark disc in the middle of a cover: plain line drawings, white with one light-orange part (.a / .af).
const ic = (body, extra) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra || ""}>${body}</svg>`;
const ICONS = {
  ask:      ic(`<path d="M8 12a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H22l-9 8v-8a5 5 0 0 1-5-5Z"/><path class="a" d="M19.5 16.5a4.5 4.5 0 1 1 6.8 3.9c-1.4.8-2.3 1.7-2.3 3.1"/><circle class="af" cx="24" cy="27.8" r="1.4" stroke="none"/>`),
  rupee:    ic(`<circle cx="24" cy="24" r="18"/><path class="a" d="M17 15h14M17 21h14M17 15h4a6 6 0 0 1 0 12h-4l10 9"/>`),
  paper:    ic(`<path d="M13 6h16l8 8v25a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"/><path d="M29 6v8h8M16 21h14M16 27h9"/><path class="a" d="M17 35l3.5 3.5 8-9"/>`),
  shield:   ic(`<path d="M24 5l15 6v11c0 10-6.5 17-15 21C15.5 39 9 32 9 22V11Z"/><path class="a" d="M24 15v10"/><circle class="af" cx="24" cy="31" r="1.5" stroke="none"/>`),
  rules:    ic(`<rect x="10" y="8" width="28" height="34" rx="4"/><path d="M18 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M28 21h5M28 32h5"/><path class="a" d="M16 20l2.5 2.5 4.5-5M16 31l2.5 2.5 4.5-5"/>`),
  key:      ic(`<circle cx="17" cy="19" r="9"/><path d="M23.5 25.5 40 42M33 35l5-5M28 30l4-4"/><circle class="af" cx="15" cy="17" r="2.4" stroke="none"/>`),
  doors:    ic(`<path d="M5 41h38M9 41V20l8-6 8 6v21M25 41V12l7-5 7 5v29"/><path class="a" d="M14 41v-9h6v9M30 20h4M30 28h4"/>`),
  talk:     ic(`<path d="M6 13a5 5 0 0 1 5-5h16a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5H18l-7 6v-6a5 5 0 0 1-5-5Z"/><path class="a" d="M37 18h1a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5v6l-7-6h-8"/>`),
};
// The cover of each kind of article: who stands round the disc, what is on it, and the two or three small words that
// float by. Decoration only (aria-hidden): the title beside it says everything the cover says.
const COVERS = {
  ask:    { cast: [2, 0],     icon: "ask",    chips: [["🌙 Night owl?", "c1"], ["🧹 Who cleans?", "c2"], ["Ask before you move in", "c3 dk"]] },
  split:  { cast: [1, 4, 6],  icon: "rupee",  chips: [["₹ 30,000 ÷ 3", "c1 dk"], ["Fair, not equal", "c2"], ["Sorted before move-in", "c3"]] },
  paper:  { cast: [5, 3],     icon: "paper",  chips: [["11 months", "c1"], ["Deposit", "c2"], ["Read before you sign", "c3 dk"]] },
  scam:   { cast: [10, 8],    icon: "shield", chips: [["“Pay first, see later”", "c1"], ["No.", "c2 dk"], ["See it. Then pay.", "c3"]] },
  rules:  { cast: [6, 7, 9],  icon: "rules",  chips: [["Dishes: same day", "c1"], ["Guests: say first", "c2"], ["One page. Everyone agrees.", "c3 dk"]] },
  visit:  { cast: [8, 2],     icon: "key",    chips: [["Water pressure?", "c1"], ["Phone signal?", "c2"], ["Check before the token", "c3 dk"]] },
  homes:  { cast: [3, 5, 4],  icon: "doors",  chips: [["PG", "c1"], ["Flat-share", "c2 dk"], ["Co-living", "c3"]] },
  talk:   { cast: [9, 1],     icon: "talk",   chips: [["“Can we talk about the AC?”", "c1"], ["Early beats awkward", "c3 dk"]] },
};
function cover(scene, cls, extra){
  const c = COVERS[scene] || fail("unknown cover " + scene), half = Math.ceil(c.cast.length / 2);
  const av = i => `<span class="cv-av">${avatar(i)}</span>`;
  return `<div class="cv${cls ? " " + cls : ""}" aria-hidden="true"${extra || ""}><div class="cv-row">${c.cast.slice(0, half).map(av).join("")}<span class="cv-disc">${ICONS[c.icon]}</span>${c.cast.slice(half).map(av).join("")}</div>` +
    c.chips.map(([t, k]) => `<i class="cv-chip ${k}">${esc(t)}</i>`).join("") + `</div>`;
}

// ------------------------------------------------------------------------------------------------ reading an article
// A few lines of facts between two lines of ---, then the words. Kept small on purpose: headings, paragraphs,
// lists, a table, a line to remember, and a handful of boxes (note, tip, warn, steps, checklist, copy, say, tool).
function readPost(file){
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"), m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if(!m) fail(path.basename(file) + ": the facts between --- lines are missing");
  const meta = {}; let key = null;
  m[1].split("\n").forEach(line => {
    if(/^\s*$/.test(line)) return;
    const item = line.match(/^- (.*)$/), kv = line.match(/^([a-z]+):\s*(.*)$/);
    if(item && key){ (Array.isArray(meta[key]) ? meta[key] : (meta[key] = [])).push(item[1].trim()); return; }
    if(!kv) fail(path.basename(file) + ": can't read the line \"" + line + "\"");
    key = kv[1]; meta[key] = kv[2].trim() === "" ? [] : kv[2].trim();
  });
  const base = path.basename(file, ".md"), dm = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  const p = { file: path.basename(file), slug: meta.slug || (dm ? dm[2] : base), date: meta.date || (dm && dm[1]), body: m[2] };
  ["title", "description", "topic", "cover"].forEach(k => { if(!meta[k] || Array.isArray(meta[k])) fail(p.file + ": \"" + k + "\" is missing"); });
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date || "")) fail(p.file + ": the date must be YYYY-MM-DD");
  if(!/^[a-z0-9-]+$/.test(p.slug)) fail(p.file + ": the address may only have small letters, numbers and dashes");
  Object.assign(p, { title: meta.title, kw: Array.isArray(meta.kw) ? "" : (meta.kw || ""), description: meta.description, lede: Array.isArray(meta.lede) ? "" : (meta.lede || ""), topic: meta.topic, cover: meta.cover,
    updated: !meta.updated || Array.isArray(meta.updated) ? p.date : meta.updated, featured: meta.featured === "true", legal: meta.legal === "true", rank: /^\d+$/.test(meta.rank || "") ? Number(meta.rank) : 99,
    keywords: Array.isArray(meta.keywords) ? "" : (meta.keywords || ""), takeaways: Array.isArray(meta.takeaways) ? meta.takeaways : [],
    sources: (Array.isArray(meta.sources) ? meta.sources : []).map(s => { const i = s.lastIndexOf(" | "); if(i < 0) fail(p.file + ": a source is written \"What it is | https://...\""); return { label: s.slice(0, i).trim(), url: s.slice(i + 3).trim() }; }) });
  topicName(p.topic); if(!COVERS[p.cover]) fail(p.file + ": unknown cover \"" + p.cover + "\"");
  if(p.kw && !p.title.includes(p.kw)) fail(p.file + ": the key word \"" + p.kw + "\" is not in the title");
  if(p.description.length > 165) fail(p.file + ": the description is " + p.description.length + " characters; search engines show about 160");
  if(p.title.length > 70) fail(p.file + ": the title is " + p.title.length + " characters; keep it under 70");
  p.sources.forEach(s => { if(!/^https:\/\//.test(s.url)) fail(p.file + ": a source's address must start with https://"); });
  return p;
}

// the words inside a line: **bold**, *soft*, [words](address), [^2] (source number 2)
function inline(s, p){
  let out = esc(s);
  out = out.replace(/\[\^(\d+)\]/g, (_, n) => { if(!p.sources[n - 1]) fail(p.file + ": [^" + n + "] has no source"); return `<sup><a href="#src-${n}" aria-label="Source ${n}">${n}</a></sup>`; });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
    if(url.startsWith("post:")){ const [slug, anchor] = url.slice(5).split("#"); p.links.push(slug); return `<a href="../${slug}/${anchor ? "#" + anchor : ""}">${text}</a>`; }
    if(url.startsWith("#")) return `<a href="${url}">${text}</a>`;
    if(url.startsWith("home:")) return `<a href="../../?utm_source=blog&amp;utm_medium=article&amp;utm_campaign=${p.slug}">${text}</a>`;
    if(!/^https:\/\//.test(url)) fail(p.file + ": a link must start with https:// (or post:, home:, #): " + url);
    return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`; });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  return out;
}
const NOTE_ICON = { note: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 11v6"/><circle cx="12" cy="7" r=".6" fill="currentColor"/></svg>`,
  tip: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  warn: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M12 6v8"/><circle cx="12" cy="18" r=".7" fill="currentColor"/></svg>` };
const NOTE_TITLE = { note: "Good to know", tip: "Worth doing", warn: "Watch out" };
const btnCopy = `<button type="button" class="btn btn-ghost btn-sm" data-copy>Copy</button>`;
const btnWa = label => `<a class="btn btn-wa btn-sm" data-wa target="_blank" rel="noopener" href="https://wa.me/">${label || "Send on WhatsApp"}</a>`;

function render(p){
  const lines = p.body.split("\n"), out = [], toc = []; p.links = []; p.tools = []; let i = 0, words = 0;
  const count = s => { words += (s.replace(/[*_`#>|\[\]()]/g, " ").match(/\S+/g) || []).length; };
  const used = new Set(), idFor = (text, given) => { let id = given || slugify(text); if(!id) id = "part"; let k = id, n = 2; while(used.has(k)) k = id + "-" + n++; used.add(k); return k; };
  const para = block => { count(block.join(" ")); return `<p>${inline(block.join(" "), p)}</p>`; };
  const list = (block, ordered, cls) => { const tag = ordered ? "ol" : "ul"; block.forEach(count);
    return `<${tag}${cls ? ` class="${cls}"` : ""}>${block.map(l => `<li>${inline(l.replace(ordered ? /^\d+\.\s+/ : /^- /, ""), p).replace(/^<strong>(.*?)<\/strong>\s*/, cls === "a-steps" ? "<b>$1</b> " : "<strong>$1</strong> ")}</li>`).join("")}</${tag}>`; };
  const take = test => { const b = []; while(i < lines.length && test(lines[i])) b.push(lines[i++]); return b; };
  // the blocks inside a box are the same as outside it
  function blocks(src){
    const save = [lines.slice(), i]; lines.length = 0; src.forEach(l => lines.push(l)); i = 0; const acc = [];
    while(i < lines.length){ const h = one(); if(h) acc.push(h); }
    lines.length = 0; save[0].forEach(l => lines.push(l)); i = save[1]; return acc.join("");
  }
  function one(){
    const l = lines[i];
    if(/^\s*$/.test(l)){ i++; return ""; }
    let m;
    if((m = l.match(/^(##|###) (.*?)(?:\s*\{#([a-z0-9-]+)\})?\s*$/))){ i++; count(m[2]); const id = idFor(m[2], m[3]); if(m[1] === "##") toc.push({ id, text: m[2] });
      return m[1] === "##" ? `<h2 id="${id}">${inline(m[2], p)}</h2>` : `<h3 id="${id}">${inline(m[2], p)}</h3>`; }
    if(/^---\s*$/.test(l)){ i++; return "<hr>"; }
    if(/^> /.test(l)){ const b = take(x => /^> /.test(x)).map(x => x.slice(2)); count(b.join(" ")); return `<blockquote class="a-quote">${inline(b.join(" "), p)}</blockquote>`; }
    if(/^- /.test(l)) return list(take(x => /^- /.test(x)), false);
    if(/^\d+\. /.test(l)) return list(take(x => /^\d+\. /.test(x)), true);
    if(/^\|/.test(l)){ const rows = take(x => /^\|/.test(x)).map(r => r.replace(/^\||\|\s*$/g, "").split("|").map(c => c.trim()));
      if(rows.length < 3 || !rows[1].every(c => /^:?-+:?$/.test(c))) fail(p.file + ": a table needs a heading row, a row of dashes and at least one more row");
      const head = rows[0]; rows.slice(2).forEach(r => r.forEach(count));
      return `<div class="a-table"><table><thead><tr>${head.map(h => `<th scope="col">${inline(h, p)}</th>`).join("")}</tr></thead><tbody>${rows.slice(2).map(r => `<tr>${r.map((c, k) => `<td data-h="${esc(head[k] || "")}">${inline(c, p)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
    if((m = l.match(/^:::(\w+)\s*(.*)$/))){
      i++; const kind = m[1], arg = m[2].trim(), inner = []; while(i < lines.length && !/^:::\s*$/.test(lines[i])) inner.push(lines[i++]);
      if(i >= lines.length) fail(p.file + ": a :::" + kind + " box is not closed"); i++;
      if(["note", "tip", "warn"].includes(kind)){ count(arg);
        return `<aside class="a-note ${kind}"><span class="ic">${NOTE_ICON[kind]}</span><b class="t">${inline(arg || NOTE_TITLE[kind], p)}</b><div>${blocks(inner)}</div></aside>`; }
      if(kind === "steps") return list(inner.filter(x => /^\d+\. /.test(x)), true, "a-steps");
      if(kind === "say"){ const not = inner.find(x => /^Not: /.test(x)), yes = inner.find(x => /^Try: /.test(x)); if(!not || !yes) fail(p.file + ": a :::say box has a \"Not: \" line and a \"Try: \" line"); count(not + " " + yes);
        return `<div class="a-say"><div><p class="lab">Instead of</p><p>${inline(not.slice(5), p)}</p></div><div class="yes"><p class="lab">Try</p><p>${inline(yes.slice(5), p)}</p></div></div>`; }
      if(kind === "copy"){ const text = inner.join("\n").replace(/^\n+|\n+$/g, ""), named = arg.match(/^(.*?)\s*\{#([a-z0-9-]+)\}$/), title = named ? named[1] : arg; count(text);
        if(named) p.tools.push({ id: named[2], title, kind: "copy" });
        return `<div class="a-copy"${named ? ` id="${idFor(named[2], named[2])}"` : ""}><div class="a-copy-h"><b>${esc(title || "Copy this")}</b><span class="a-acts" style="margin:0">${btnCopy}${btnWa()}</span></div><pre>${esc(text)}</pre></div>`; }
      if(kind === "checklist"){ const [id, title] = arg.split("|").map(x => x.trim()); if(!id || !title) fail(p.file + ": a checklist starts \":::checklist name | Its title\""); let n = 0, html = "", open = false;
        inner.forEach(x => { if(/^# /.test(x)){ if(open){ html += "</ul>"; open = false; } html += `<h4>${esc(x.slice(2))}</h4>`; count(x); }
          else if(/^- /.test(x)){ if(!open){ html += "<ul>"; open = true; } html += `<li><label><input type="checkbox" data-i="${n++}"><span>${inline(x.slice(2), p)}</span></label></li>`; count(x); } });
        if(open) html += "</ul>"; p.tools.push({ id, title, kind: "check" });
        return `<section class="a-check" id="${idFor(id, id)}" data-check="${esc(id)}"><div class="a-check-h"><b>${esc(title)}</b><span class="a-check-n">${n} to tick</span></div><div class="a-check-bar" aria-hidden="true"><i></i></div>${html}` +
          `<div class="a-acts"><button type="button" class="btn btn-ghost btn-sm" data-print>Print</button><button type="button" class="btn btn-ghost btn-sm" data-copy>Copy the list</button>${btnWa()}<button type="button" class="btn btn-ghost btn-sm" data-reset>Start again</button></div></section>`; }
      if(kind === "tool"){ if(arg !== "rent-split") fail(p.file + ": the only tool is rent-split"); p.tools.push({ id: "split", title: "Rent split calculator", kind: "tool" });
        // without the script the box says how the split is worked out, so nobody is left with an empty panel
        return `<section class="a-tool" id="${idFor("split", "split")}" data-tool="rent-split"><h3>Rent split calculator</h3><p class="h">${blocks(inner).replace(/<\/?p>/g, "") || "The calculator needs JavaScript. The method is written out below."}</p></section>`; }
      fail(p.file + ": unknown box :::" + kind);
    }
    return para(take(x => !/^\s*$/.test(x) && !/^(##|###) |^- |^\d+\. |^> |^\||^:::|^---\s*$/.test(x)));
  }
  while(i < lines.length){ const h = one(); if(h) out.push(h); }
  p.html = out.join("\n"); p.toc = toc; p.words = words; p.minutes = Math.max(2, Math.round(words / 200));
  return p;
}

// ------------------------------------------------------------------------------------------------ the pages
// the key word in the orange; a full stop or question mark straight after it stays on its line
const titleHtml = p => { if(!p.kw) return esc(p.title); const at = p.title.indexOf(p.kw), a = p.title.slice(0, at), b = p.title.slice(at + p.kw.length), m = b.match(/^[.,?!:;]+/);
  return esc(a) + (m ? `<span class="kw-keep"><span class="kw">${esc(p.kw)}</span>${esc(m[0])}</span>` + esc(b.slice(m[0].length)) : `<span class="kw">${esc(p.kw)}</span>` + esc(b)); };
const UL = `<svg class="kw-ul" viewBox="0 0 500 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M8 26 C120 10 260 34 492 14"/></svg>`;
const ARROW = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const WA_ICON = (() => { const m = appHtml.match(/data-channel="whatsapp"><svg[^>]*><path fill="currentColor" d="([^"]+)"/); if(!m) fail("the WhatsApp glyph was not found in index.html");
  return `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${m[1]}"/></svg>`; })();
const DOT = ` <i aria-hidden="true"></i> `;   // the dot between two facts is a drawing; the spaces keep the words apart for anyone who hears or copies them
const meta = p => `<p class="b-meta"><span>${p.minutes} min read</span>${DOT}<time datetime="${p.date}">${niceDate(p.date)}</time></p>`;

function head({ title, description, canonical, depth, image, imageAlt, type, ld, extra }, assets){
  const up = "../".repeat(depth);
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<script>if(window.top !== window.self){ try{ window.top.location.replace(window.self.location.href); }catch(e){ document.documentElement.style.display = "none"; } }
if(location.hostname === "kamalmotiani1989-cmd.github.io") location.replace("https://findmeflatmate.com" + location.pathname.replace(/^\\/NavigateMe\\/flatmates/, "") + location.search + location.hash);
document.documentElement.className = "js";</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#FFF4E8">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="application/atom+xml" title="${NAME} blog" href="${BLOG}feed.xml">
<link rel="icon" href="${up}icons/icon-192.png">
<link rel="apple-touch-icon" href="${up}icons/apple-touch-icon.png">
<meta property="og:site_name" content="${NAME}">
<meta property="og:locale" content="en_IN">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">${extra || ""}
<link rel="preload" as="font" type="font/woff2" crossorigin href="${up}vendor/fonts/dm-serif-display-latin-400-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${up}vendor/fonts/urbanist-latin-wght-normal.woff2">
<link rel="stylesheet" href="${depth === 2 ? "../" : ""}blog.css?v=${assets.css}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>`;
}
function topBar(depth, campaign, onIndex){
  const up = "../".repeat(depth), blog = depth === 2 ? "../" : "./";
  return `<a class="skip" href="#main">Skip to the article${onIndex ? "s" : ""}</a>
<header class="b-top"><div class="wrap">
  <a class="logo" href="${blog}" aria-label="${NAME} blog, first page"><img class="fm-mark" src="${up}icons/logo-icon.svg" alt="" width="42" height="42"><img class="wmk" src="${up}icons/wordmark.svg" alt="findmeflatmate.com" width="180" height="15"><b>Blog</b></a>
  <nav class="b-nav" aria-label="Blog">${onIndex ? "" : `<a class="nl wide" href="${blog}">All articles</a>`}<a class="btn btn-ghost btn-sm" href="${up}?utm_source=blog&amp;utm_medium=article&amp;utm_campaign=${campaign}">Go to the app</a></nav>
</div></header>`;
}
// The one dark sheet at the foot of a page. Until sign-up is open it says "launching soon" and never "download".
const endSheet = (depth, campaign) => `<section class="wrap b-end"><div class="ink-sheet rv">
  <div><p class="soon"><i></i>Launching soon</p><h2>Find flatmates who match your <span class="kw">vibe</span>.</h2>
  <p>${NAME} is for finding a room, and people who live like you. No brokers, and your number stays private until you both say yes.</p></div>
  <a class="btn btn-primary" href="${"../".repeat(depth)}?utm_source=blog&amp;utm_medium=article&amp;utm_campaign=${campaign}">See ${NAME} ${ARROW}</a>
</div></section>`;
const foot = depth => `<footer class="b-foot"><div class="wrap"><span>© 2026 ${NAME} · Made in India</span><a href="${depth === 2 ? "../" : "./"}">Blog</a><a href="${"../".repeat(depth)}privacy.html">Privacy policy</a><a href="${depth === 2 ? "../" : ""}feed.xml">Feed</a></div></footer>`;
const ORG = { "@type": "Organization", "@id": SITE + "#org", name: NAME, url: SITE, logo: SITE + "icons/icon-512.png" };

function card(p, depth, attrs){
  const to = depth === 2 ? `../${p.slug}/` : `${p.slug}/`;
  return `<li class="b-card${/data-feat/.test(attrs || "") ? "" : " rv"}" data-topic="${p.topic}" data-text="${esc((p.title + " " + p.description + " " + topicName(p.topic) + " " + p.keywords).toLowerCase())}"${attrs || ""}>
  ${cover(p.cover, "", depth === 1 && !/data-feat/.test(attrs || "") ? ` style="view-transition-name:cv-${p.slug}"` : "")}
  <div class="b-card-b"><p class="lab">${esc(topicName(p.topic))}</p><h3><a href="${to}">${esc(p.title)}</a></h3><p class="d">${esc(p.description)}</p>${meta(p)}</div></li>`;
}

function indexPage(posts, assets){
  const feat = posts.find(p => p.featured) || posts[0];
  // "Things you can use": the calculator, the list for a visit and the page of house rules, when their articles exist
  const tools = HANDY.map(([slug, id, title, line, icon]) => { const p = posts.find(x => x.slug === slug), t = p && p.tools.find(x => x.id === id); return t ? { p, t, title, line, icon } : null; }).filter(Boolean);
  const ld = { "@context": "https://schema.org", "@graph": [ORG, { "@type": "Blog", "@id": BLOG + "#blog", url: BLOG, name: NAME + " blog", inLanguage: "en-IN",
    description: "Straight answers on finding a flatmate, splitting the bills and living together, for renters in India.", publisher: { "@id": SITE + "#org" },
    blogPost: posts.map(p => ({ "@type": "BlogPosting", headline: p.title, url: BLOG + p.slug + "/", datePublished: isoTime(p.date), dateModified: isoTime(p.updated) })) }] };
  return head({ title: "Blog · sharing a flat, minus the drama · " + NAME, description: "Straight answers on finding a flatmate, splitting the rent and living together, with checklists, a rent calculator and house rules to copy. For renters in India.",
      canonical: BLOG, depth: 1, image: SITE + "og-image.png", imageAlt: NAME + ": find flatmates who match your vibe. Four cartoon flatmates around a 92% match ring.", type: "website", ld }, assets) + `
<body data-page="index">
${topBar(1, "blog-home", true)}
<main id="main">
<section class="wrap b-hero">
  <div class="b-hero-g">
    <div><p class="lab">The ${NAME} blog</p>
    <h1>Sharing a flat, minus the <span class="kw-keep"><span class="kw ul">drama${UL}</span>.</span></h1>
    <p class="sub">Straight answers on finding a flatmate, splitting the bills and living together. Written for renters in India.</p></div>
    <nav class="b-stick" aria-label="Jump to a topic">${TOPICS.filter(t => posts.some(p => p.topic === t[0])).map((t, k) => `<a class="s${k + 1}" href="?topic=${t[0]}#all" data-topic-go="${t[0]}"><span aria-hidden="true">${TOPIC_MARK[t[0]]}</span>${esc(t[1])}</a>`).join("")}</nav>
  </div>
  <article class="b-feat rv" id="bFeat">
    ${cover(feat.cover, "", ` style="view-transition-name:cv-${feat.slug}"`)}
    <div class="b-feat-b"><p class="lab">Start here · ${esc(topicName(feat.topic))}</p><h2><a href="${feat.slug}/">${titleHtml(feat)}</a></h2><p class="d">${esc(feat.description)}</p>${meta(feat)}
      <span class="btn btn-primary">Read it ${ARROW}</span></div>
  </article>
</section>
${tools.length ? `<section class="wrap b-sec" id="bTools" aria-labelledby="hTools">
  <div class="b-sec-h"><h2 id="hTools">Things you can use</h2><span class="b-count">Inside the articles. Nothing to install, nothing to sign up for.</span></div>
  <div class="b-tools">${tools.map(({ p, t, title, line, icon }) => `<a class="b-tool rv" href="${p.slug}/#${t.id}"><span class="ic">${ICONS[icon].replace("<svg ", '<svg width="24" height="24" ')}</span><span><b>${esc(title)}</b><span>${esc(line)}</span></span></a>`).join("")}</div>
</section>` : ""}
<section class="wrap b-sec" id="all" aria-labelledby="hAll">
  <div class="b-sec-h"><h2 id="hAll">All articles</h2><span class="b-count" id="bCount" aria-live="polite">${posts.length} articles</span></div>
  <div class="b-find">
    <div class="b-chips" role="group" aria-label="Topics"><button type="button" data-topic="all" aria-pressed="true">All</button>${TOPICS.filter(t => posts.some(p => p.topic === t[0])).map(t => `<button type="button" data-topic="${t[0]}" aria-pressed="false">${esc(t[1])}</button>`).join("")}</div>
    <label class="b-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="sr">Search the articles</span><input type="search" id="bSearch" placeholder="Search deposit, rent split, scams" autocomplete="off" enterkeyhint="search"></label>
  </div>
  <ul class="b-grid" id="bGrid">
${posts.map(p => card(p, 1, p === feat ? " data-feat hidden" : "")).join("\n")}
  </ul>
  <div class="b-none" id="bNone" hidden><h3>Nothing for that yet</h3><p>Try another word, or see everything.</p><button type="button" class="btn btn-ghost" data-clear>See all the articles</button></div>
</section>
${endSheet(1, "blog-home")}
</main>
${foot(1)}
<script src="blog.js?v=${assets.js}" defer></script>
</body>
</html>
`;
}

function postPage(p, posts, assets){
  const url = BLOG + p.slug + "/", image = BLOG + "og/" + p.slug + ".png";
  const others = posts.filter(x => x !== p), same = others.filter(x => x.topic === p.topic), linked = others.filter(x => p.links.includes(x.slug));
  const next = [...new Set([...linked, ...same, ...others])].slice(0, 3);
  const ld = { "@context": "https://schema.org", "@graph": [ORG,
    { "@type": "BlogPosting", "@id": url + "#article", mainEntityOfPage: url, url, headline: p.title, description: p.description, image: [image], datePublished: isoTime(p.date), dateModified: isoTime(p.updated),
      author: { "@id": SITE + "#org" }, publisher: { "@id": SITE + "#org" }, inLanguage: "en-IN", articleSection: topicName(p.topic), wordCount: p.words, timeRequired: "PT" + p.minutes + "M", isAccessibleForFree: true, isPartOf: { "@id": BLOG + "#blog" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: NAME, item: SITE }, { "@type": "ListItem", position: 2, name: "Blog", item: BLOG }, { "@type": "ListItem", position: 3, name: p.title, item: url }] }] };
  const share = `<span class="a-share"><a class="btn btn-wa btn-sm" data-share="wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(p.title + " " + url)}">${WA_ICON} WhatsApp</a><button type="button" class="btn btn-ghost btn-sm" data-share="copy">Copy link</button><button type="button" class="btn btn-ghost btn-sm" data-share="native">Share</button></span>`;
  const tocList = p.toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join("");
  return head({ title: p.title + " · " + NAME + " blog", description: p.description, canonical: url, depth: 2, image, imageAlt: p.title + ". " + NAME + " blog.", type: "article", ld,
      extra: `\n<meta property="article:published_time" content="${isoTime(p.date)}">\n<meta property="article:modified_time" content="${isoTime(p.updated)}">\n<meta property="article:section" content="${esc(topicName(p.topic))}">` }, assets) + `
<body data-page="article" data-slug="${p.slug}">
<div class="b-read" aria-hidden="true"><i></i></div>
${topBar(2, p.slug, false)}
<main id="main">
<article>
<header class="wrap a-head">
  <div>
  <nav aria-label="You are here"><ol class="a-crumb"><li><a href="../">Blog</a></li><li><a href="../?topic=${p.topic}#all">${esc(topicName(p.topic))}</a></li></ol></nav>
  <p class="lab">${esc(topicName(p.topic))}</p>
  <h1>${titleHtml(p)}</h1>
  <p class="sub">${esc(p.lede || p.description)}</p>
  <div class="a-meta"><span class="a-by"><img src="../../icons/icon-192.png" alt="" width="26" height="26">The ${NAME} team</span> <p class="b-meta"><time datetime="${p.date}">${niceDate(p.date)}</time>${DOT}<span>${p.minutes} min read</span>${p.updated !== p.date ? `${DOT}<span>Updated <time datetime="${p.updated}">${niceDate(p.updated)}</time></span>` : ""}</p></div>
  </div>
  ${cover(p.cover, "a-cover", ` style="view-transition-name:cv-${p.slug}"`)}
</header>
<div class="wrap a-grid${p.toc.length > 2 ? "" : " solo"}">
  <div class="a-sheet">
    ${p.toc.length > 2 ? `<details class="a-tocm"><summary>In this article</summary><ol>${tocList}</ol></details>` : ""}
    ${p.takeaways.length ? `<section class="a-short" aria-labelledby="hShort"><h2 id="hShort">The short version</h2><ul>${p.takeaways.map(t => `<li>${inline(t, p)}</li>`).join("")}</ul></section>` : ""}
    <div class="a-body">
${p.html}
    </div>
    ${p.sources.length ? `<section class="a-src" aria-labelledby="hSrc"><h2 id="hSrc">Where the facts come from</h2><ol>${p.sources.map((s, k) => `<li id="src-${k + 1}"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join("")}</ol></section>` : ""}
    ${p.legal ? `<p class="a-legal">This article is general information, not legal or tax advice. Rules differ from state to state and change; check the current rule, or ask a lawyer or a chartered accountant, before you sign or pay.</p>` : ""}
    <div class="a-share-row"><b>Send it to the flat's group</b>${share}</div>
  </div>
  ${p.toc.length > 2 ? `<nav class="a-toc" aria-labelledby="hToc"><h2 id="hToc">In this article</h2><ol>${tocList}</ol></nav>` : ""}
</div>
</article>
<section class="wrap a-next" aria-labelledby="hNext">
  <div class="b-sec-h"><h2 id="hNext">Read next</h2><a href="../">All articles</a></div>
  <ul class="b-grid">
${next.map(x => card(x, 2)).join("\n")}
  </ul>
</section>
${endSheet(2, p.slug)}
</main>
${foot(2)}
<script src="../blog.js?v=${assets.js}" defer></script>
</body>
</html>
`;
}

function feed(posts){
  const x = s => esc(s).replace(/'/g, "&apos;"), latest = posts.reduce((a, p) => p.updated > a ? p.updated : a, "0000-00-00");
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-IN">
  <title>${NAME} blog</title>
  <subtitle>Straight answers on finding a flatmate, splitting the bills and living together, for renters in India.</subtitle>
  <link href="${BLOG}feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${BLOG}" rel="alternate" type="text/html"/>
  <id>${BLOG}</id>
  <updated>${isoTime(latest)}</updated>
  <author><name>The ${NAME} team</name><uri>${SITE}</uri></author>
${posts.map(p => `  <entry>
    <title>${x(p.title)}</title>
    <link href="${BLOG}${p.slug}/" rel="alternate" type="text/html"/>
    <id>${BLOG}${p.slug}/</id>
    <published>${isoTime(p.date)}</published>
    <updated>${isoTime(p.updated)}</updated>
    <category term="${x(topicName(p.topic))}"/>
    <summary>${x(p.description)}</summary>
  </entry>`).join("\n")}
</feed>
`;
}
// sitemap.xml lists the home page and the privacy policy (as before), then the blog and each article with the day it
// last changed.
function sitemap(posts){
  const latest = posts.reduce((a, p) => p.updated > a ? p.updated : a, "0000-00-00");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}</loc></url>
  <url><loc>${SITE}privacy.html</loc></url>
  <url><loc>${BLOG}</loc><lastmod>${latest}</lastmod></url>
${posts.map(p => `  <url><loc>${BLOG}${p.slug}/</loc><lastmod>${p.updated}</lastmod></url>`).join("\n")}
</urlset>
`;
}

// ------------------------------------------------------------------------------------------------ build
function build(){
  const dir = path.join(HERE, "posts"), files = fs.readdirSync(dir).filter(f => f.endsWith(".md")).sort();
  if(!files.length) fail("no articles in posts/");
  const posts = files.map(f => render(readPost(path.join(dir, f)))).sort((a, b) => b.date.localeCompare(a.date) || a.rank - b.rank || a.slug.localeCompare(b.slug));
  const slugs = new Set();
  posts.forEach(p => { if(slugs.has(p.slug)) fail("two articles share the address " + p.slug); slugs.add(p.slug); });
  posts.forEach(p => p.links.forEach(s => { if(!slugs.has(s)) fail(p.file + " links to post:" + s + ", which does not exist"); }));
  if(posts.filter(p => p.featured).length > 1) fail("only one article can be \"featured: true\"");
  const css = fs.readFileSync(path.join(HERE, "src", "blog.css"), "utf8") + "\n/* The cartoon people's own movement, from the app's avatar module (index.html, FMAvatar.CSS). */\n" + FMAvatar.CSS.trim() + "\n";
  const js = fs.readFileSync(path.join(HERE, "src", "blog.js"), "utf8");
  const assets = { css: hash(css), js: hash(js) }, out = {};
  out["blog/blog.css"] = css; out["blog/blog.js"] = js;
  avN = 0; out["blog/index.html"] = indexPage(posts, assets);
  posts.forEach(p => { avN = 0; out[`blog/${p.slug}/index.html`] = postPage(p, posts, assets); });
  out["blog/feed.xml"] = feed(posts);
  out["sitemap.xml"] = sitemap(posts);
  return { posts, out };
}

function listFiles(dir, base){ let r = []; if(!fs.existsSync(dir)) return r;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => { const f = path.join(dir, e.name), rel = base + e.name; if(e.isDirectory()) r = r.concat(listFiles(f, rel + "/")); else r.push(rel); }); return r; }

const { posts, out } = build();
if(CHECK){
  const bad = [];
  Object.entries(out).forEach(([rel, text]) => { const f = path.join(APP, rel); if(!fs.existsSync(f)) bad.push("missing: " + rel); else if(fs.readFileSync(f, "utf8") !== text) bad.push("out of date: " + rel); });
  listFiles(OUT, "blog/").forEach(rel => { if(!(rel in out) && !/^blog\/og\/[a-z0-9-]+\.png$/.test(rel)) bad.push("not made by build.js: " + rel); });
  const pics = require("./pictures.js"); let made = {}; try{ made = JSON.parse(fs.readFileSync(path.join(HERE, "pictures.json"), "utf8")); }catch(e){}
  posts.forEach(p => { if(!fs.existsSync(path.join(OUT, "og", p.slug + ".png"))) bad.push("no share picture: blog/og/" + p.slug + ".png (run build.js --pictures)");
    else if(made[p.slug] !== pics.stamp(p, pics.LOOK)) bad.push("the share picture blog/og/" + p.slug + ".png was drawn from an older title, key word, topic or cover (run build.js --pictures)"); });
  listFiles(path.join(OUT, "og"), "").forEach(f => { if(!posts.some(p => p.slug + ".png" === f)) bad.push("a share picture without an article: blog/og/" + f); });
  if(bad.length){ console.error("blog: the published pages are not what the articles say. Run: node flatmates/marketing/blog/build.js\n  " + bad.join("\n  ")); process.exit(1); }
  console.log("blog: " + posts.length + " articles, " + Object.keys(out).length + " files, all up to date"); process.exit(0);
}
// Tidying up after an article is renamed or removed: only pages this script made (an index.html in a folder of its
// own), one file at a time; a folder goes only once it is empty. Nothing else is ever deleted.
listFiles(OUT, "blog/").forEach(rel => { if(!(rel in out) && /^blog\/[a-z0-9-]+\/index\.html$/.test(rel)){ fs.unlinkSync(path.join(APP, rel)); try{ fs.rmdirSync(path.dirname(path.join(APP, rel))); }catch(e){} } });
Object.entries(out).forEach(([rel, text]) => { const f = path.join(APP, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); if(!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== text) fs.writeFileSync(f, text); });
console.log("blog: " + posts.length + " articles written to flatmates/blog/ (" + posts.map(p => p.slug + " " + p.minutes + " min").join(", ") + ")");
if(PICTURES) require("./pictures.js")({ posts, APP, OUT, NAME, topicName, COVERS, ICONS, avatar, avatarCss: FMAvatar.CSS }).catch(e => fail("the share pictures could not be drawn: " + e.message));
