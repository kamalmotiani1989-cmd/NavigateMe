// FindMeFlatMate: cartoon avatars people build themselves (design preview, 13 Nov 2026; not in the app).
// Our own drawn parts (no outside character set or avatar service): avatar(cfg) returns one SVG string.
// Layers, back to front: scene (rhythm) · hair back · body and clothes · neck and head · face · beard ·
// hair front / head covering · glasses · arms · prop (habit). Everything animates with transforms and
// opacity only (cheap on a low-end Android phone); prefers-reduced-motion gives a still pose.
(function(root){
  const INK = "#1C1917";
  const SKIN = { s1:"#F6D7C3", s2:"#EBC09E", s3:"#D49A6A", s4:"#A8714A", s5:"#7C4A2D", s6:"#5A3420" };
  const shade = (hex, k) => "#" + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, "0")).join("");

  // ---- the rhythm: the background scene ----
  const SCENES = {
    "neutral": c => `<rect class="sky" width="240" height="240" fill="#EEDDD3"/>`,
    "early-bird": c => `<rect class="sky" width="240" height="240" fill="#EBD981"/>
      <g class="sun"><circle cx="186" cy="74" r="30" fill="#F6EBB4"/><circle cx="186" cy="74" r="20" fill="#E79078"/></g>
      <path d="M0 196 Q60 176 120 190 T240 186 V240 H0 Z" fill="#F2E3A6"/>`,
    "midnight": c => `<rect class="sky" width="240" height="240" fill="#C3C9F6"/>
      <g class="moon"><path d="M196 40 a24 24 0 1 0 26 32 a19 19 0 1 1 -26 -32 Z" fill="#FBF8F6"/></g>
      <g class="tw"><circle cx="40" cy="52" r="2.5" fill="#FBF8F6"/><circle cx="70" cy="30" r="2" fill="#FBF8F6"/><circle cx="150" cy="26" r="2" fill="#FBF8F6"/></g>`,
    "night-owl": c => `<rect class="sky" width="240" height="240" fill="#C3E0D6"/>
      <g class="tw"><path d="M190 46 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#FBF8F6"/>
        <path class="tw2" d="M212 82 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#FBF8F6"/>
        <path d="M44 44 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#FBF8F6"/>
        <path class="tw2" d="M160 24 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z" fill="#FBF8F6"/></g>`
  };

  // ---- hair (back = behind the head, front = over the forehead) ----
  const HAIR = {
    none:  { back: () => "", front: () => "" },
    bald:  { back: () => "", front: () => "" },
    short: { back: c => "", front: c => `<path d="M80 98 C78 62 106 52 124 54 C150 56 164 74 160 100 C152 84 140 76 126 78 C110 80 96 84 86 104 Z" fill="${c}"/>` },
    bob:   { back: c => `<path d="M76 104 C70 58 112 46 130 50 C164 56 172 92 164 140 L150 142 L150 96 L90 96 L90 142 L76 140 Z" fill="${c}"/>`,
             front: c => `<path d="M82 100 C80 64 108 54 126 56 C152 58 162 78 158 100 C140 92 132 76 126 72 C114 86 98 92 82 100 Z" fill="${c}"/>` },
    long:  { back: c => `<path d="M74 104 C68 56 112 44 130 48 C168 54 174 96 170 190 L70 190 Z" fill="${c}"/>`,
             front: c => `<path d="M82 100 C80 64 108 54 126 56 C152 58 162 78 158 100 C146 86 120 78 82 100 Z" fill="${c}"/>` },
    curly: { back: c => "", front: c => `<g fill="${c}">${[[86,82,14],[100,66,15],[120,60,16],[140,66,15],[154,82,14],[92,98,9],[148,98,9],[110,74,12],[130,74,12]]
              .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>` },
    bun:   { back: c => `<circle cx="120" cy="48" r="16" fill="${c}"/>`,
             front: c => `<path d="M80 102 C78 62 106 54 124 56 C150 58 164 76 160 102 C150 84 134 76 120 76 C104 76 90 86 80 102 Z" fill="${c}"/>` }
  };

  // ---- head coverings (drawn instead of, or over, the hair) ----
  const COVER = {
    hijab: { wrap: true, back: c => "",
             drape: c => `<path d="M70 112 C66 60 100 44 120 44 C140 44 174 60 170 112 C170 150 164 182 196 240 L44 240 C76 182 70 150 70 112 Z" fill="${c}"/>
               <path d="M76 200 C96 214 144 214 164 200" stroke="${shade(c, .86)}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
             front: c => `<path d="M84 102 C84 74 100 64 120 64 C140 64 156 74 156 102 C150 86 138 78 120 78 C102 78 90 86 84 102 Z" fill="${shade(c, .9)}"/>` },
    turban: { back: c => "", front: c => `<path d="M76 98 C72 56 108 46 120 46 C132 46 168 56 164 98 C150 84 136 78 120 78 C104 78 90 84 76 98 Z" fill="${c}"/>
               <path d="M84 78 C104 60 136 58 156 78 M96 66 C112 74 128 74 146 64" stroke="${shade(c, .8)}" stroke-width="5" fill="none" stroke-linecap="round"/>` },
    cap:   { back: c => "", front: c => `<path d="M80 92 C80 62 100 52 120 52 C140 52 160 62 160 92 Z" fill="${c}"/><path d="M118 88 h56 a6 6 0 0 1 0 10 h-56 Z" fill="${shade(c, .8)}"/>` }
  };

  // small shape helpers for the props
  const heart = (x, y, s, f) => `<path d="M${x} ${y + s * .9} C${x - s * 1.5} ${y} ${x - s * .8} ${y - s * 1.1} ${x} ${y - s * .3} C${x + s * .8} ${y - s * 1.1} ${x + s * 1.5} ${y} ${x} ${y + s * .9} Z" fill="${f}"/>`;
  const star = (x, y, R, r, f) => `<path d="M${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R;
    return `${(x + d * Math.cos(a)).toFixed(1)} ${(y + d * Math.sin(a)).toFixed(1)}`; }).join(" L")} Z" fill="${f}" stroke="${f}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const note = (x, y, f, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="0" rx="5" ry="4" transform="rotate(-20)" fill="${f}"/>
    <path d="M4 -1 V-17 q5 2 7 7" stroke="${f}" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`;

  // ---- the habit: a held prop (same props as the animal samples) ----
  const PROPS = {
    "neat-freak": `<g class="prop"><rect x="168" y="168" width="36" height="52" rx="12" fill="#86A6E0"/><rect x="174" y="184" width="24" height="18" rx="5" fill="#FBF8F6"/>
      <rect x="176" y="152" width="18" height="18" rx="4" fill="${INK}"/><rect x="170" y="140" width="32" height="15" rx="6" fill="${INK}"/><rect x="198" y="142" width="12" height="7" rx="3" fill="${INK}"/>
      <g class="spark"><path d="M222 128 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#FFFFFF"/></g></g>`,
    "chef": `<g class="prop"><g class="steam"><path d="M168 128 c-7 -9 7 -14 0 -23 M186 124 c-7 -9 7 -14 0 -23" stroke="#FBF8F6" stroke-width="5" fill="none" stroke-linecap="round"/></g>
      <circle cx="168" cy="160" r="7" fill="#EBD981"/><circle cx="182" cy="157" r="8" fill="#8D9B62"/><circle cx="196" cy="161" r="6" fill="#EBD981"/>
      <path d="M150 164 h66 c-2 24 -15 36 -33 36 c-18 0 -31 -12 -33 -36 Z" fill="#C2410C"/><path d="M150 164 h66" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M216 168 c11 0 11 13 0 13" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`,
    "bookworm": `<g class="prop"><path d="M142 176 Q160 166 178 176 Q196 166 214 176 L210 210 Q194 202 178 212 Q162 202 146 210 Z" fill="#C2410C"/>
      <path d="M148 174 Q162 164 178 174 L178 206 Q162 198 150 204 Z" fill="#FBF8F6"/><path d="M208 174 Q194 164 178 174 L178 206 Q194 198 206 204 Z" fill="#FFFFFF"/>
      <path d="M155 180 q10 -5 19 0 M156 188 q9 -5 18 0 M201 180 q-10 -5 -19 0 M200 188 q-9 -5 -18 0" stroke="#D6CBC3" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M196 166 v16 l4 -3 4 3 v-16" fill="#86A6E0"/></g>`,
    "pet-parent": `<g class="prop"><g transform="translate(-8 -4) translate(196 206) scale(.88) translate(-196 -206)"><path d="M206 184 C218 178 220 166 214 160" stroke="#FBF8F6" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="194" cy="186" rx="19" ry="21" fill="#FBF8F6"/><ellipse cx="200" cy="190" rx="8" ry="9" fill="#E79078"/>
      <rect x="170" y="170" width="13" height="38" rx="6.5" fill="#FBF8F6"/><ellipse cx="174" cy="206" rx="9" ry="5" fill="#FBF8F6"/><ellipse cx="200" cy="206" rx="10" ry="5" fill="#FFFFFF"/>
      <path d="M176 190 v14" stroke="#D6CBC3" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="178" cy="152" r="17" fill="#FBF8F6"/><ellipse cx="162" cy="159" rx="11" ry="8" fill="#FFFFFF"/>
      <path d="M170 170 Q180 175 192 168" stroke="#C2410C" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="180" cy="177" r="3.5" fill="#EBD981"/>
      <ellipse cx="190" cy="154" rx="7" ry="13" transform="rotate(-18 190 154)" fill="#C2410C"/>
      <circle cx="172" cy="149" r="3" fill="${INK}"/><ellipse cx="152" cy="156" rx="4.5" ry="3.8" fill="${INK}"/>
      <path d="M154 163 q5 3 9 -1" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g></g>`,
    "host": `<g class="prop"><g class="steam"><path d="M170 144 c-6 -8 6 -12 0 -20 M192 144 c-6 -8 6 -12 0 -20" stroke="#FBF8F6" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>
      ${[[156,152],[177,156],[198,152]].map(([x, y]) => `<path d="M${x - 10} ${y} h20 l-3 ${182 - y} h-14 Z" fill="#FFFFFF"/>
      <path d="M${x - 9} ${y + 7} h18 l-2.3 ${175 - y} h-13.4 Z" fill="#C2410C"/><rect x="${x - 9}" y="${y + 6}" width="18" height="5" rx="2.5" fill="#E79078"/>
      <path d="M${x - 3.5} ${y + 13} v${166 - y} M${x + 3.5} ${y + 13} v${166 - y}" stroke="#E79078" stroke-width="1.8" stroke-linecap="round"/>`).join("")}
      <rect x="138" y="180" width="76" height="11" rx="5.5" fill="#D6CBC3"/><path d="M144 191 h64" stroke="#A89C93" stroke-width="3.5" stroke-linecap="round"/></g>`,
    "social-butterfly": `<g class="prop"><rect x="164" y="148" width="34" height="58" rx="8" fill="${INK}"/><rect x="168" y="155" width="26" height="42" rx="4" fill="#C3C9F6"/>
      ${heart(181, 175, 7, "#C2410C")}<rect x="176" y="150" width="10" height="2.5" rx="1.25" fill="#3A3431"/>
      <g class="spark">${heart(208, 138, 8, "#E79078")}</g><g class="spark" style="animation-delay:.5s">${heart(188, 122, 6, "#C2410C")}</g>
      <g class="spark" style="animation-delay:1s">${heart(216, 110, 5.5, "#FFFFFF")}</g></g>`,
    "homebody": `<g class="prop"><g transform="translate(-3 -1)"><rect x="144" y="178" width="60" height="26" rx="9" fill="#8D9B62"/><path d="M144 191 h60" stroke="#6F7C4A" stroke-width="3"/>
      <path d="M156 180 v22 M190 180 v22" stroke="#EBD981" stroke-width="4"/><path d="M200 180 c6 2 6 22 0 24" stroke="#6F7C4A" stroke-width="3" fill="none"/>
      <path d="M152 148 Q179 138 206 146 Q216 166 208 184 Q178 194 148 186 Q140 167 152 148 Z" fill="#E79078"/>
      <path d="M156 154 Q179 147 202 152 M154 180 Q178 187 203 179" stroke="#C9705A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="178" cy="167" r="4.5" fill="#C9705A"/><path d="M168 160 l10 7 10 -7 M168 174 l10 -7 10 7" stroke="#C9705A" stroke-width="2" fill="none" stroke-linecap="round"/></g></g>`,
    "foodie": `<g class="prop"><ellipse cx="176" cy="188" rx="35" ry="12" fill="#FFFFFF"/><ellipse cx="176" cy="187" rx="26" ry="7.5" fill="#FBF8F6" stroke="#D6CBC3" stroke-width="2"/>
      <path d="M160 184 L177 146 L194 184 Z" fill="#E2BE5E" stroke="#C9973A" stroke-width="8" stroke-linejoin="round"/>
      ${[[160, 156], [192, 158]].map(([x, y]) => `<path d="M${x - 14} 187 L${x} ${y} L${x + 14} 187 Z" fill="#D9A441" stroke="#D9A441" stroke-width="9" stroke-linejoin="round"/>
      <path d="M${x - 14} 187 L${x} ${y} L${x + 14} 187 Z" fill="#EBD981" stroke="#EBD981" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${x} ${y + 4} L${x + 4} 188" stroke="#D9A441" stroke-width="2.5" stroke-linecap="round"/><circle cx="${x - 5}" cy="180" r="1.6" fill="#C9705A"/><circle cx="${x - 2}" cy="172" r="1.4" fill="#C9705A"/><circle cx="${x + 8}" cy="181" r="1.4" fill="#C9705A"/>`).join("")}
      <circle cx="203" cy="194" r="5.5" fill="#8D9B62"/><circle cx="201.5" cy="192.5" r="1.8" fill="#C3E0D6"/></g>`,
    "introvert": `<g class="prop"><path d="M159 170 C154 124 206 124 201 170" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M163 160 C161 134 199 134 197 160" stroke="#C3C9F6" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="148" y="160" width="21" height="32" rx="9" fill="#C2410C"/><rect x="191" y="160" width="21" height="32" rx="9" fill="#C2410C"/>
      <rect x="164" y="164" width="7" height="24" rx="3.5" fill="${INK}"/><rect x="189" y="164" width="7" height="24" rx="3.5" fill="${INK}"/>
      <circle cx="201" cy="176" r="5" fill="#E79078"/>
      <g class="spark">${note(214, 132, INK)}</g><g class="spark" style="animation-delay:.8s">${note(198, 110, INK, .8)}</g></g>`,
    "free-spirit": `<g class="prop"><g transform="translate(178 192) rotate(27)">
      <rect x="-4" y="-80" width="8" height="46" rx="3" fill="#3A3431"/><rect x="-6.5" y="-95" width="13" height="18" rx="4" fill="${INK}"/>
      <circle cx="-8" cy="-90" r="2.4" fill="#D6CBC3"/><circle cx="8" cy="-90" r="2.4" fill="#D6CBC3"/><circle cx="-8" cy="-82" r="2.4" fill="#D6CBC3"/><circle cx="8" cy="-82" r="2.4" fill="#D6CBC3"/>
      <circle cx="0" cy="-26" r="17" fill="#C2410C"/><circle cx="0" cy="0" r="23" fill="#C2410C"/><rect x="-13" y="-24" width="26" height="18" fill="#C2410C"/>
      <circle cx="0" cy="-15" r="7" fill="${INK}"/><rect x="-9" y="7" width="18" height="5" rx="2.5" fill="${INK}"/>
      <path d="M-2 9 V-86 M2 9 V-86" stroke="#FBF8F6" stroke-width="1.2"/></g></g>`,
    "go-getter": `<g class="prop"><path d="M152 168 C148 124 204 124 198 168" stroke="#3A3431" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="190" y="138" width="12" height="8" rx="2.5" fill="none" stroke="#EBD981" stroke-width="3" transform="rotate(62 196 142)"/>
      <rect x="142" y="160" width="64" height="38" rx="9" fill="#9E3409"/><path d="M146 166 v26 M202 166 v26" stroke="#7E2A07" stroke-width="3" stroke-linecap="round"/>
      <path d="M142 168 a8 8 0 0 1 8 -8 h48 a8 8 0 0 1 8 8 v10 q-32 12 -64 0 Z" fill="#C2410C"/>
      <path d="M148 177 q26 9 52 0" stroke="#E79078" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M174 178 v14" stroke="#3A3431" stroke-width="4" stroke-linecap="round"/><rect x="167" y="180" width="14" height="10" rx="2.5" fill="none" stroke="#EBD981" stroke-width="3"/></g>`,
    "all-rounder": `<g class="prop"><path d="M174 176 L166 200 L173 197 L177 204 L186 180 Z" fill="#C9705A"/><path d="M194 176 L202 200 L195 197 L191 204 L182 180 Z" fill="#E79078"/>
      <g fill="#C2410C">${Array.from({ length: 14 }, (_, i) => `<circle cx="${(184 + 22 * Math.cos(i * Math.PI / 7)).toFixed(1)}" cy="${(164 + 22 * Math.sin(i * Math.PI / 7)).toFixed(1)}" r="6"/>`).join("")}</g>
      <circle cx="184" cy="164" r="22" fill="#C2410C"/><circle cx="184" cy="164" r="17" fill="#EBD981"/>${star(184, 164.5, 11, 4.6, "#FFFFFF")}
      <g class="spark"><path d="M212 130 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="#FFFFFF"/></g></g>`
  };
  // where the holding hand sits on each prop
  const GRIP = { "neat-freak":[178, 196], "chef":[150, 178], "bookworm":[150, 200],
    "pet-parent":[198, 170], "host":[148, 192], "social-butterfly":[168, 198], "homebody":[201, 167], "foodie":[144, 192],
    "introvert":[158, 186], "free-spirit":[202, 146], "go-getter":[150, 174], "all-rounder":[162, 170] };

  const MOUTH = {
    smile: `<path d="M108 136 Q120 146 132 136" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    grin:  `<path d="M107 134 Q120 150 133 134 Z" fill="${INK}"/><path d="M111 136 Q120 142 129 136 Z" fill="#FFFFFF"/>`,
    calm:  `<path d="M111 138 Q120 142 129 138" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  };

  function avatar(c){
    const skin = SKIN[c.skin] || c.skin, sk2 = shade(skin, .86), hair = c.hairColour || INK, top = c.top || "#86A6E0";
    const h = HAIR[c.hair || "none"], cov = c.cover ? COVER[c.cover.kind] : null, cc = c.cover && c.cover.colour;
    const [gx, gy] = GRIP[c.prop] || [170, 196];
    const beard = c.beard === "full" ? `<path d="M88 116 C90 156 104 172 120 172 C136 172 150 156 152 116 C148 140 140 150 120 150 C100 150 92 140 88 116 Z" fill="${hair}"/>
        <path d="M108 140 Q120 134 132 140 Q120 146 108 140 Z" fill="${hair}"/>`
      : c.beard === "moustache" ? `<path d="M106 132 Q113 126 120 131 Q127 126 134 132 Q127 136 120 134 Q113 136 106 132 Z" fill="${hair}"/>` : "";
    const glasses = c.glasses ? `<g fill="none" stroke="${INK}" stroke-width="3.5"><circle cx="105" cy="116" r="12"/><circle cx="135" cy="116" r="12"/><path d="M117 116 h6 M93 114 l-8 -3 M147 114 l8 -3"/></g>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" class="fm-av${c.still ? " still" : ""}" role="img" aria-label="${c.label || "Avatar"}">
<defs><clipPath id="clip-${c.key}"><circle cx="120" cy="120" r="120"/></clipPath></defs>
<g clip-path="url(#clip-${c.key})">
  <g class="scene">${SCENES[c.bare || !SCENES[c.rhythm] ? "neutral" : c.rhythm]()}</g>
  <g class="who">
    ${cov ? cov.back(cc) : h.back(hair)}
    <path class="body" d="M52 240 C52 196 80 178 120 178 C160 178 188 196 188 240 Z" fill="${top}"/>
    <path d="M104 178 Q120 196 136 178" stroke="${shade(top, .82)}" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${cov && cov.wrap ? cov.drape(cc) : `<rect x="108" y="146" width="24" height="36" rx="10" fill="${sk2}"/>
    <ellipse cx="82" cy="118" rx="8" ry="11" fill="${sk2}"/><ellipse cx="158" cy="118" rx="8" ry="11" fill="${sk2}"/>`}
    <ellipse cx="120" cy="112" rx="${cov && cov.wrap ? 34 : 38}" ry="${cov && cov.wrap ? 42 : 44}" fill="${skin}"/>
    <g class="face">
      <path d="M96 100 q9 -6 17 -1 M127 99 q8 -5 17 1" stroke="${c.cover ? INK : hair}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <g class="eyes"><ellipse cx="105" cy="116" rx="4.5" ry="5.5" fill="${INK}"/><ellipse cx="135" cy="116" rx="4.5" ry="5.5" fill="${INK}"/></g>
      <path d="M120 120 q-4 8 1 10" stroke="${sk2}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="96" cy="132" r="7" fill="#E0623E" opacity=".22"/><circle cx="144" cy="132" r="7" fill="#E0623E" opacity=".22"/>
      ${MOUTH[c.mouth || "smile"]}
    </g>
    ${beard}
    ${cov ? cov.front(cc) : h.front(hair)}
    ${glasses}
    <g class="wave"><path d="M64 224 C58 204 56 184 60 168" stroke="${top}" stroke-width="18" fill="none" stroke-linecap="round"/><circle cx="60" cy="160" r="11" fill="${skin}"/></g>
    ${c.bare || !PROPS[c.prop] ? "" : `<path d="M160 222 C168 214 ${gx - 4} ${gy + 8} ${gx} ${gy}" stroke="${top}" stroke-width="18" fill="none" stroke-linecap="round"/>`}
  </g>
  ${c.bare || !PROPS[c.prop] ? "" : PROPS[c.prop] + `<circle class="hand" cx="${gx}" cy="${gy}" r="10" fill="${skin}"/>`}
</g></svg>`;
  }

  // The animation, as one small stylesheet (transform and opacity only). .play on a parent runs the wave.
  const CSS = `
.fm-av .who, .fm-av .prop, .fm-av .hand, .fm-av .eyes, .fm-av .wave, .fm-av .sun, .fm-av .moon, .fm-av .tw, .fm-av .tw2, .fm-av .steam, .fm-av .spark{transform-box:fill-box}
.fm-av .who{animation:fmBreathe 4.2s ease-in-out infinite; transform-origin:50% 100%}
.fm-av .eyes{animation:fmBlink 4.6s infinite; transform-origin:50% 50%}
.fm-av .prop, .fm-av .hand{animation:fmBob 3.4s ease-in-out infinite; transform-origin:50% 100%}
.fm-av .sun{animation:fmRise 7s ease-in-out infinite}
.fm-av .moon{animation:fmSway 6s ease-in-out infinite; transform-origin:50% 50%}
.fm-av .tw{animation:fmTwinkle 3s ease-in-out infinite} .fm-av .tw2{animation:fmTwinkle 2.4s ease-in-out .8s infinite}
.fm-av .steam{animation:fmSteam 2.6s ease-in-out infinite}
.fm-av .spark{animation:fmTwinkle 1.6s ease-in-out infinite; transform-origin:50% 50%}
.fm-av .wave{opacity:0; transform-origin:50% 100%}
.play .fm-av .wave{animation:fmWave 2.4s ease-in-out .3s 1 both}
@keyframes fmBreathe{50%{transform:translateY(-1.6px) scale(1.006)}}
@keyframes fmBlink{0%, 93%, 100%{transform:scaleY(1)} 96%{transform:scaleY(.1)}}
@keyframes fmBob{50%{transform:translateY(-3px) rotate(-2deg)}}
@keyframes fmRise{50%{transform:translateY(-5px)}}
@keyframes fmSway{50%{transform:rotate(-6deg) translateY(-2px)}}
@keyframes fmTwinkle{50%{opacity:.35; transform:scale(.8)}}
@keyframes fmSteam{0%{opacity:0; transform:translateY(6px)} 40%{opacity:1} 100%{opacity:0; transform:translateY(-8px)}}
@keyframes fmWave{0%{opacity:0; transform:rotate(0)} 10%{opacity:1} 25%{transform:rotate(-14deg)} 45%{transform:rotate(10deg)} 65%{transform:rotate(-14deg)} 85%{opacity:1; transform:rotate(6deg)} 100%{opacity:0; transform:rotate(0)}}
.fm-av.still *, .fm-av.still{animation:none !important}
@media (prefers-reduced-motion:reduce){ .fm-av *, .fm-av{animation:none !important} }`;

  const SAMPLES = [
    { key:"early-bird-neat-freak", label:"The Early Bird Neat Freak", rhythm:"early-bird", prop:"neat-freak",
      skin:"s4", cover:{ kind:"hijab", colour:"#C3C9F6" }, top:"#C3E0D6", mouth:"grin" },
    { key:"midnight-chef", label:"The Midnight Chef", rhythm:"midnight", prop:"chef",
      skin:"s5", hair:"curly", hairColour:"#1C1917", beard:"full", top:"#EBD981", mouth:"smile" },
    { key:"night-owl-bookworm", label:"The Night Owl Bookworm", rhythm:"night-owl", prop:"bookworm",
      skin:"s2", hair:"bob", hairColour:"#5B3A29", glasses:true, top:"#86A6E0", mouth:"calm" }
  ];
  const api = { avatar, CSS, SAMPLES, SKIN };
  if(typeof module !== "undefined") module.exports = api; else root.FMAvatar = api;
})(this);
