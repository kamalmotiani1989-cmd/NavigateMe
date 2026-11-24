/* FindMeFlatMate · the blog. Everything here is an extra: with no script the pages still read from top to bottom, every
   article is listed, the lists print and the calculator's method is written out. Nothing is sent anywhere: ticks and
   the calculator's numbers are kept on this phone only. Copied to flatmates/blog/ by build.js: edit it here. */
(function(){
  "use strict";
  var d = document, $ = function(s, r){ return (r || d).querySelector(s); }, $$ = function(s, r){ return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var store = { get: function(k){ try{ return JSON.parse(localStorage.getItem("fmb:" + k)); }catch(e){ return null; } },
                set: function(k, v){ try{ localStorage.setItem("fmb:" + k, JSON.stringify(v)); }catch(e){} } };
  var inr = function(n){ return "₹" + Math.round(n).toLocaleString("en-IN"); };
  var esc = function(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); };
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- the short message at the foot of the screen
  var toastT;
  function toast(msg){
    $$(".toast").forEach(function(t){ t.remove(); });
    var t = d.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; d.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(function(){ t.remove(); }, 2600);
  }
  function copy(text, done){
    var ok = function(){ toast(done || "Copied."); }, old = function(){
      var a = d.createElement("textarea"); a.value = text; a.setAttribute("readonly", ""); a.style.cssText = "position:fixed;top:-200px;opacity:0"; d.body.appendChild(a); a.select();
      try{ d.execCommand("copy"); ok(); }catch(e){ toast("Couldn't copy. Press and hold the text to copy it."); } a.remove(); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, old); else old();
  }
  var wa = function(text){ return "https://wa.me/?text=" + encodeURIComponent(text); };
  var here = function(){ var c = $('link[rel="canonical"]'); return (c && c.href) || location.href.split("#")[0].split("?")[0]; };

  // ---- the top bar gets a line under it once the page moves; the bar across the top says how far down an article you are
  var top = $(".b-top"), bar = $(".b-read i"), sheet = $(".a-sheet"), ticking = false;
  function onScroll(){
    ticking = false;
    if(top) top.classList.toggle("scrolled", window.scrollY > 6);
    if(bar && sheet){ var r = sheet.getBoundingClientRect(), total = r.height - window.innerHeight * .6, gone = -r.top + window.innerHeight * .2;
      bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, total > 0 ? gone / total : 0)).toFixed(4) + ")"; }
  }
  window.addEventListener("scroll", function(){ if(!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll); onScroll();

  // ---- things come up softly as they come into view
  var rv = $$(".rv");
  if(rv.length){
    if(still || !("IntersectionObserver" in window)) rv.forEach(function(e){ e.classList.add("in"); });
    else { var io = new IntersectionObserver(function(es){ es.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
      rv.forEach(function(e, i){ e.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(e); });
      setTimeout(function(){ rv.forEach(function(e){ e.classList.add("in"); }); }, 2500); }   // never leave anything hidden
  }

  // ---- the blog's first page: topics and the search
  var grid = $("#bGrid");
  if(grid){
    var cards = $$("li", grid), chips = $$(".b-chips button"), q = $("#bSearch"), count = $("#bCount"), none = $("#bNone"), feat = $("#bFeat"), tools = $("#bTools");
    var state = { topic: "all", q: "" }, total = cards.length;
    var apply = function(push){
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean), plain = state.topic === "all" && !words.length, shown = 0;
      cards.forEach(function(c){
        var ok = (state.topic === "all" || c.dataset.topic === state.topic) && words.every(function(w){ return c.dataset.text.indexOf(w) >= 0; });
        if(plain && c.hasAttribute("data-feat")) ok = false;   // the article at the top of the page isn't said twice
        c.hidden = !ok; if(ok) shown++;
      });
      if(feat) feat.hidden = !plain; if(tools) tools.hidden = !plain;
      chips.forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.topic === state.topic)); });
      if(count) count.textContent = plain ? total + (total === 1 ? " article" : " articles") : shown + " of " + total;
      if(none) none.hidden = shown > 0 || plain;
      if(push){ var u = new URL(location.href); state.topic === "all" ? u.searchParams.delete("topic") : u.searchParams.set("topic", state.topic);
        state.q ? u.searchParams.set("q", state.q) : u.searchParams.delete("q"); try{ history.replaceState(null, "", u.pathname + u.search + u.hash); }catch(e){} }
    };
    chips.forEach(function(b){ b.addEventListener("click", function(){ state.topic = b.dataset.topic; apply(true); }); });
    if(q){ q.addEventListener("input", function(){ state.q = q.value.trim(); apply(true); }); }
    $$("[data-clear]").forEach(function(b){ b.addEventListener("click", function(){ state = { topic: "all", q: "" }; if(q) q.value = ""; apply(true); }); });
    // the stickers beside the headline are the same filters: they set the topic and bring the list into view
    $$("[data-topic-go]").forEach(function(a){ a.addEventListener("click", function(e){ e.preventDefault(); state.topic = a.dataset.topicGo; apply(true);
      var all = d.getElementById("all"); if(all) all.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" }); }); });
    var sp = new URLSearchParams(location.search), t0 = sp.get("topic"), q0 = sp.get("q");
    if(t0 && chips.some(function(b){ return b.dataset.topic === t0; })) state.topic = t0;
    if(q0 && q){ state.q = q0.slice(0, 60); q.value = state.q; }
    apply(false);
  }

  // ---- in this article: the heading you're reading is marked
  var tocLinks = $$(".a-toc a[href^='#']");
  if(tocLinks.length && "IntersectionObserver" in window){
    var heads = tocLinks.map(function(a){ return d.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean), cur = null;
    var mark = function(){ var y = 110, on = heads[0]; heads.forEach(function(h){ if(h.getBoundingClientRect().top <= y) on = h; });
      if(on !== cur){ cur = on; tocLinks.forEach(function(a){ a.classList.toggle("on", a.getAttribute("href") === "#" + on.id); }); } };
    window.addEventListener("scroll", function(){ requestAnimationFrame(mark); }, { passive: true }); mark();
  }
  $$(".a-tocm a").forEach(function(a){ a.addEventListener("click", function(){ var m = a.closest("details"); if(m) m.open = false; }); });

  // ---- sharing an article
  $$("[data-share]").forEach(function(b){
    var kind = b.dataset.share, title = (d.querySelector("h1") || {}).textContent || d.title;
    if(kind === "native"){ if(!navigator.share){ b.hidden = true; return; }
      b.addEventListener("click", function(){ navigator.share({ title: title.trim(), url: here() }).catch(function(){}); }); }
    else if(kind === "copy") b.addEventListener("click", function(){ copy(here(), "Link copied."); });
    else if(kind === "wa") b.href = wa(title.trim().replace(/\s+/g, " ") + " " + here());
  });

  // ---- words to copy (a message, a set of house rules)
  $$(".a-copy").forEach(function(box){
    var text = function(){ return ($("pre", box) || {}).textContent || ""; };
    $$("[data-copy]", box).forEach(function(b){ b.addEventListener("click", function(){ copy(text(), "Copied. Paste it where you need it."); }); });
    $$("[data-wa]", box).forEach(function(a){ a.addEventListener("click", function(){ a.href = wa(text()); }); a.href = wa(text()); });
  });

  // ---- a list you tick off, kept on this phone
  $$(".a-check").forEach(function(box){
    var key = "check:" + (d.body.dataset.slug || "") + ":" + box.dataset.check, inputs = $$("input[type=checkbox]", box), n = $(".a-check-n", box), bar = $(".a-check-bar i", box);
    var saved = store.get(key) || [];
    inputs.forEach(function(i, k){ i.checked = saved.indexOf(k) >= 0; });
    var draw = function(){ var done = inputs.filter(function(i){ return i.checked; }).length;
      if(n) n.textContent = done + " of " + inputs.length + (done === inputs.length ? " · all done" : " ticked");
      if(bar) bar.style.width = (inputs.length ? done / inputs.length * 100 : 0) + "%"; };
    box.addEventListener("change", function(){ store.set(key, inputs.map(function(i, k){ return i.checked ? k : -1; }).filter(function(k){ return k >= 0; })); draw(); });
    var asText = function(){ var out = [(($(".a-check-h b", box) || {}).textContent || "Checklist").trim()];
      $$("h4, label", box).forEach(function(e){ if(e.tagName === "H4") out.push("", e.textContent.trim().toUpperCase()); else out.push(($("input", e).checked ? "☑ " : "☐ ") + e.textContent.trim().replace(/\s+/g, " ")); });
      return out.join("\n") + "\n\n" + here(); };
    $$("[data-reset]", box).forEach(function(b){ b.addEventListener("click", function(){ inputs.forEach(function(i){ i.checked = false; }); store.set(key, []); draw(); toast("Cleared."); }); });
    $$("[data-print]", box).forEach(function(b){ b.addEventListener("click", function(){ window.print(); }); });
    $$("[data-copy]", box).forEach(function(b){ b.addEventListener("click", function(){ copy(asText(), "List copied."); }); });
    $$("[data-wa]", box).forEach(function(a){ a.addEventListener("click", function(){ a.href = wa(asText()); }); a.href = wa(asText()); });
    draw();
  });

  // ---- the rent split calculator. One fair way to start the talk, not a rule: the part of the rent that pays for the
  // space everyone uses is split by head; the rest is split by room, a bigger or better room counting for more.
  $$('[data-tool="rent-split"]').forEach(function(box){
    var SIZES = [["s", "Small"], ["m", "Medium"], ["l", "Large"]];
    var def = { rent: 30000, shared: 50, bath: 15, balc: 5, step: 20, rooms: [{ name: "Room 1", size: "l", bath: true, balc: false, people: 1 }, { name: "Room 2", size: "m", bath: false, balc: true, people: 1 }, { name: "Room 3", size: "s", bath: false, balc: false, people: 1 }] };
    var st = store.get("tool:rent-split") || JSON.parse(JSON.stringify(def));
    if(!st.rooms || !st.rooms.length) st = JSON.parse(JSON.stringify(def));
    var num = function(v, lo, hi, dflt){ v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dflt; };
    function split(){
      var R = num(st.rent, 0, 1e7, 0), s = num(st.shared, 0, 100, 50) / 100, people = st.rooms.reduce(function(a, r){ return a + r.people; }, 0) || 1;
      var w = { s: 1 - num(st.step, 0, 60, 20) / 100, m: 1, l: 1 + num(st.step, 0, 60, 20) / 100 };
      var pts = st.rooms.map(function(r){ return w[r.size] * (1 + (r.bath ? num(st.bath, 0, 60, 15) / 100 : 0) + (r.balc ? num(st.balc, 0, 60, 5) / 100 : 0)); });
      var sum = pts.reduce(function(a, b){ return a + b; }, 0) || 1;
      var raw = st.rooms.map(function(r, i){ return R * (1 - s) * pts[i] / sum + R * s * r.people / people; });
      // whole tens of rupees, and the amounts still add up to the rent: the biggest share takes what rounding leaves over
      var out = raw.map(function(x){ return Math.round(x / 10) * 10; }), big = raw.indexOf(Math.max.apply(null, raw));
      out[big] += Math.round(R) - out.reduce(function(a, b){ return a + b; }, 0);
      return { rooms: out, total: Math.round(R), people: people };
    }
    function words(){
      var r = split(), lines = ["Rent split · " + inr(r.total) + " a month"];
      st.rooms.forEach(function(m, i){ var bits = [SIZES.filter(function(x){ return x[0] === m.size; })[0][1].toLowerCase()]; if(m.bath) bits.push("own bathroom"); if(m.balc) bits.push("balcony");
        lines.push((m.name || "Room " + (i + 1)) + " (" + bits.join(", ") + "): " + inr(r.rooms[i]) + (m.people > 1 ? ", " + inr(r.rooms[i] / m.people) + " each for " + m.people : "")); });
      lines.push("", "Shared space split by head: " + st.shared + "% of the rent. Worked out at " + here() + "#split");
      return lines.join("\n");
    }
    function seg(name, val, opts){ return '<div class="t-seg" role="group" aria-label="' + name + '">' + opts.map(function(o){ return '<button type="button" data-k="' + name + '" data-v="' + o[0] + '" aria-pressed="' + (String(val) === String(o[0])) + '">' + o[1] + "</button>"; }).join("") + "</div>"; }
    function draw(keep){
      var r = split(), max = Math.max.apply(null, r.rooms.concat([1]));
      var focus = keep && d.activeElement && box.contains(d.activeElement) ? { i: d.activeElement.dataset.i, k: d.activeElement.dataset.k, sel: d.activeElement.selectionStart } : null;
      box.innerHTML = '<h3>Rent split calculator</h3><p class="h">Change anything. The amounts always add up to the rent.</p>' +
        '<div class="t-row"><label class="t-f"><span>Monthly rent</span><span class="t-money"><i>₹</i><input type="number" inputmode="numeric" min="0" step="500" data-k="rent" value="' + (st.rent === "" ? "" : Number(st.rent)) + '" aria-label="Monthly rent in rupees"></span></label>' +
        '<div class="t-f"><span>Rooms</span>' + seg("n", st.rooms.length, [[2, "2"], [3, "3"], [4, "4"], [5, "5"]]) + "</div></div>" +
        '<div class="t-rooms">' + st.rooms.map(function(m, i){ return '<div class="t-room"><div class="t-room-h"><input type="text" maxlength="24" data-k="name" data-i="' + i + '" value="' + esc(m.name) + '" aria-label="Name of room ' + (i + 1) + '">' +
          "<output><small>₹</small>" + r.rooms[i].toLocaleString("en-IN") + "</output></div>" +
          '<div class="t-seg" role="group" aria-label="Size of ' + esc(m.name) + '">' + SIZES.map(function(o){ return '<button type="button" data-k="size" data-i="' + i + '" data-v="' + o[0] + '" aria-pressed="' + (m.size === o[0]) + '">' + o[1] + "</button>"; }).join("") + "</div>" +
          '<div class="t-tog"><button type="button" data-k="bath" data-i="' + i + '" aria-pressed="' + !!m.bath + '">Own bathroom</button><button type="button" data-k="balc" data-i="' + i + '" aria-pressed="' + !!m.balc + '">Balcony</button>' +
          '<button type="button" data-k="people" data-i="' + i + '" aria-pressed="' + (m.people > 1) + '">Shared by two</button></div>' +
          '<div class="t-bar"><i style="width:' + (r.rooms[i] / max * 100).toFixed(1) + '%"></i></div>' +
          (m.people > 1 ? '<p class="t-per">' + inr(r.rooms[i] / m.people) + " each for the two people in it</p>" : "") + "</div>"; }).join("") + "</div>" +
        '<details class="t-more"' + (st.open ? " open" : "") + '><summary>Change how it is worked out</summary>' +
        '<div class="t-row"><label class="t-f"><span>Rent that pays for shared space</span><span class="t-range"><input type="range" min="0" max="100" step="5" data-k="shared" value="' + st.shared + '"><output>' + st.shared + "%</output></span></label>" +
        '<label class="t-f"><span>A size up or down is worth</span><span class="t-range"><input type="range" min="0" max="50" step="5" data-k="step" value="' + st.step + '"><output>' + st.step + "%</output></span></label>" +
        '<label class="t-f"><span>Own bathroom adds</span><span class="t-range"><input type="range" min="0" max="40" step="5" data-k="bath%" value="' + st.bath + '"><output>' + st.bath + "%</output></span></label>" +
        '<label class="t-f"><span>Balcony adds</span><span class="t-range"><input type="range" min="0" max="40" step="5" data-k="balc%" value="' + st.balc + '"><output>' + st.balc + "%</output></span></label></div></details>" +
        '<div class="t-sum"><p><b>' + inr(r.total) + "</b> a month between <b>" + r.people + "</b> " + (r.people === 1 ? "person" : "people") + '</p><span class="a-acts" style="margin:0">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="copy">Copy the split</button><a class="btn btn-wa btn-sm" data-act="wa" target="_blank" rel="noopener" href="' + wa(words()) + '">Send on WhatsApp</a>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="reset">Start again</button></span></div>';
      if(focus){ var e = $('[data-k="' + focus.k + '"]' + (focus.i != null ? '[data-i="' + focus.i + '"]' : ""), box); if(e){ e.focus(); try{ if(focus.sel != null && e.type === "text") e.setSelectionRange(focus.sel, focus.sel); }catch(x){} } }
    }
    function save(){ store.set("tool:rent-split", st); }
    box.addEventListener("click", function(e){
      var b = e.target.closest("button, a"); if(!b || !box.contains(b)) return;
      var k = b.dataset.k, i = Number(b.dataset.i), act = b.dataset.act;
      if(act === "copy") return copy(words(), "Split copied.");
      if(act === "wa"){ b.href = wa(words()); return; }
      if(act === "reset"){ st = JSON.parse(JSON.stringify(def)); save(); draw(); return toast("Back to the start."); }
      if(k === "n"){ var n = Number(b.dataset.v); while(st.rooms.length < n) st.rooms.push({ name: "Room " + (st.rooms.length + 1), size: "m", bath: false, balc: false, people: 1 }); st.rooms.length = n; }
      else if(k === "size") st.rooms[i].size = b.dataset.v;
      else if(k === "bath") st.rooms[i].bath = !st.rooms[i].bath;
      else if(k === "balc") st.rooms[i].balc = !st.rooms[i].balc;
      else if(k === "people") st.rooms[i].people = st.rooms[i].people > 1 ? 1 : 2;
      else return;
      save(); draw(true);
    });
    box.addEventListener("toggle", function(e){ if(e.target.classList && e.target.classList.contains("t-more")){ st.open = e.target.open; save(); } }, true);
    box.addEventListener("input", function(e){
      var t = e.target, k = t.dataset.k, i = Number(t.dataset.i);
      if(k === "rent") st.rent = t.value === "" ? "" : num(t.value, 0, 1e7, 0);
      else if(k === "name") st.rooms[i].name = t.value.slice(0, 24);
      else if(k === "shared") st.shared = num(t.value, 0, 100, 50);
      else if(k === "step") st.step = num(t.value, 0, 50, 20);
      else if(k === "bath%") st.bath = num(t.value, 0, 40, 15);
      else if(k === "balc%") st.balc = num(t.value, 0, 40, 5);
      else return;
      save();
      if(k === "name"){ var w = $('[data-act="wa"]', box); if(w) w.href = wa(words()); return; }   // typing a name doesn't redraw the box under the keyboard
      if(t.type === "range"){ var o = t.parentNode.querySelector("output"); if(o) o.textContent = t.value + "%"; }
      // the amounts follow as you type, without the box you are typing in losing its place
      var r = split(), max = Math.max.apply(null, r.rooms.concat([1]));
      $$(".t-room", box).forEach(function(el, n){ $("output", el).innerHTML = "<small>₹</small>" + r.rooms[n].toLocaleString("en-IN"); $(".t-bar i", el).style.width = (r.rooms[n] / max * 100).toFixed(1) + "%";
        var p = $(".t-per", el); if(p) p.textContent = inr(r.rooms[n] / st.rooms[n].people) + " each for the two people in it"; });
      var sum = $(".t-sum p", box); if(sum) sum.innerHTML = "<b>" + inr(r.total) + "</b> a month between <b>" + r.people + "</b> " + (r.people === 1 ? "person" : "people");
      var w2 = $('[data-act="wa"]', box); if(w2) w2.href = wa(words());
    });
    draw();
  });
})();
