// FindMeFlatMate: cartoon avatars people build themselves. Our own drawn parts (no outside character set, no avatar
// service, never a photo): avatar(cfg) returns the round one (head and shoulders, with the flatmate type's scene and
// prop), figure(cfg) the whole person standing (the studio, the "ready" moment, Profile). Both draw the same person
// from the same parts, in the same coordinates: the round one is the top 240 of the figure's 240 x 440.
// Layers, back to front: scene · hair back · legs and shoes · top and arms · neck and head · face · beard ·
// hair front / headwear · glasses · what hangs over the shoulder · the waving arm · prop.
// Everything animates with transforms and opacity only; prefers-reduced-motion gives a still pose.
(function(root){
  const INK = "#1C1917";
  const SKIN = { s1:"#F6D7C3", s2:"#EBC09E", s3:"#D49A6A", s4:"#A8714A", s5:"#7C4A2D", s6:"#5A3420" };
  const shade = (hex, k) => "#" + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, "0")).join("");
  const lum = hex => [1, 3, 5].reduce((t, i, n) => t + parseInt(hex.slice(i, i + 2), 16) * [.299, .587, .114][n], 0);
  // a line drawn on a colour: darker on a light colour, lighter on a dark one
  const line = hex => lum(hex) < 40 ? "#4A4744" : lum(hex) < 70 ? shade(hex, 1.9) : shade(hex, .8);

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

  // ---- hair (back = behind the head, front = over the forehead, over = hangs in front of the shoulder) ----
  const FRINGE = `M80 102 C78 62 106 54 124 56 C150 58 164 76 160 102 C150 84 134 76 120 76 C104 76 90 86 80 102 Z`;
  const HAIR = {
    none:  { back: () => "", front: () => "" },
    bald:  { back: () => "", front: () => "" },
    short: { back: c => "", front: c => `<path d="M80 98 C78 62 106 52 124 54 C150 56 164 74 160 100 C152 84 140 76 126 78 C110 80 96 84 86 104 Z" fill="${c}"/>` },
    buzz:  { back: c => "", front: c => `<path d="M81 104 C78 68 102 60 120 60 C138 60 162 68 159 104 C154 88 140 81 120 81 C100 81 86 88 81 104 Z" fill="${c}" opacity=".82"/>` },
    quiff: { back: c => "", front: c => `<path d="M80 100 C76 70 92 50 116 46 C136 40 158 50 164 70 C166 82 162 94 160 102 C156 88 148 80 138 78 C122 74 100 80 86 104 Z" fill="${c}"/>
              <path d="M96 74 C104 58 126 50 146 56" stroke="${line(c)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>` },
    side:  { back: c => "", front: c => `<path d="M80 102 C76 64 104 50 126 52 C152 54 166 74 160 104 C156 90 150 82 142 78 C124 86 100 84 92 76 C86 84 84 94 80 102 Z" fill="${c}"/>
              <path d="M96 72 C108 62 130 58 148 66" stroke="${line(c)}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".5"/>` },
    spiky: { back: c => "", front: c => `<path d="M80 102 C78 84 82 72 86 66 L92 50 L100 62 L108 42 L118 58 L128 40 L136 58 L148 46 L152 64 L160 62 C162 76 162 90 160 102 C152 86 138 78 120 78 C102 78 88 86 80 102 Z" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>` },
    curly: { back: c => "", front: c => `<g fill="${c}">${[[86,82,14],[100,66,15],[120,60,16],[140,66,15],[154,82,14],[92,98,9],[148,98,9],[110,74,12],[130,74,12]]
              .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>` },
    afro:  { back: c => `<g fill="${c}"><circle cx="120" cy="88" r="56"/>${[[70,104,16],[170,104,16],[76,70,16],[164,70,16],[98,44,16],[142,44,16],[120,38,16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`,
             front: c => `<path d="M82 100 C82 74 100 62 120 62 C140 62 158 74 158 100 C150 86 136 80 120 80 C104 80 90 86 82 100 Z" fill="${c}"/>` },
    pixie: { back: c => "", front: c => `<path d="M78 108 C74 66 104 50 126 52 C152 54 168 76 162 110 C158 98 154 90 150 86 C132 92 108 96 90 84 C84 92 82 100 78 108 Z" fill="${c}"/>
              <path d="M90 84 C100 70 122 62 144 66" stroke="${line(c)}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".45"/>` },
    bob:   { back: c => `<path d="M76 104 C70 58 112 46 130 50 C164 56 172 92 164 140 L150 142 L150 96 L90 96 L90 142 L76 140 Z" fill="${c}"/>`,
             front: c => `<path d="M82 100 C80 64 108 54 126 56 C152 58 162 78 158 100 C140 92 132 76 126 72 C114 86 98 92 82 100 Z" fill="${c}"/>` },
    wavy:  { back: c => `<path d="M74 104 C66 56 110 44 128 48 C166 52 176 90 168 120 C176 134 164 146 172 160 C176 172 166 180 158 178 L84 178 C74 180 64 172 68 160 C76 146 64 134 72 120 Z" fill="${c}"/>`,
             front: c => `<path d="M82 102 C78 66 104 54 120 56 C114 72 100 88 82 102 Z M158 102 C162 66 136 54 120 56 C126 72 140 88 158 102 Z" fill="${c}"/>` },
    long:  { back: c => `<path d="M74 104 C68 56 112 44 130 48 C168 54 174 96 170 190 L70 190 Z" fill="${c}"/>`,
             front: c => `<path d="M82 100 C80 64 108 54 126 56 C152 58 162 78 158 100 C146 86 120 78 82 100 Z" fill="${c}"/>` },
    pony:  { back: c => `<path d="M150 70 C182 66 190 104 182 138 C178 158 168 172 160 176 C168 150 164 118 150 96 Z" fill="${c}"/>`,
             front: c => `<path d="${FRINGE}" fill="${c}"/><rect x="150" y="70" width="12" height="9" rx="4" fill="${line(c)}" transform="rotate(30 156 74)"/>` },
    bun:   { back: c => `<circle cx="120" cy="48" r="16" fill="${c}"/>`,
             front: c => `<path d="${FRINGE}" fill="${c}"/>` },
    braid: { back: c => `<path d="M76 104 C70 58 110 46 128 50 C164 54 170 90 164 126 L76 126 Z" fill="${c}"/>`,
             front: c => `<path d="M82 100 C80 64 108 54 126 56 C152 58 162 78 158 100 C146 86 120 78 82 100 Z" fill="${c}"/>`,
             over: c => `<g fill="${c}">${[[84,150],[82,166],[85,182],[83,198],[86,214]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="9.5" ry="10.5" transform="rotate(${i % 2 ? 16 : -16} ${x} ${y})"/>`).join("")}
               <path d="M80 224 l6 -2 l5 16 l-8 0 Z"/></g><rect x="78" y="220" width="14" height="6" rx="3" fill="${line(c)}"/>` }
  };

  // ---- headwear (drawn instead of, or over, the hair) ----
  const COVER = {
    hijab: { wrap: true, back: c => "",
             drape: (c, standing) => standing ? `<path d="M70 112 C66 60 100 44 120 44 C140 44 174 60 170 112 C170 150 174 178 184 204 C164 236 76 236 56 204 C66 178 70 150 70 112 Z" fill="${c}"/>
               <path d="M78 196 C98 212 142 212 162 196" stroke="${shade(c, .86)}" stroke-width="4" fill="none" stroke-linecap="round"/>`
               : `<path d="M70 112 C66 60 100 44 120 44 C140 44 174 60 170 112 C170 150 164 182 196 240 L44 240 C76 182 70 150 70 112 Z" fill="${c}"/>
               <path d="M76 200 C96 214 144 214 164 200" stroke="${shade(c, .86)}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
             front: c => `<path d="M84 102 C84 74 100 64 120 64 C140 64 156 74 156 102 C150 86 138 78 120 78 C102 78 90 86 84 102 Z" fill="${shade(c, .9)}"/>` },
    turban: { back: c => "", front: c => `<path d="M76 98 C72 56 108 46 120 46 C132 46 168 56 164 98 C150 84 136 78 120 78 C104 78 90 84 76 98 Z" fill="${c}"/>
               <path d="M84 78 C104 60 136 58 156 78 M96 66 C112 74 128 74 146 64" stroke="${shade(c, .8)}" stroke-width="5" fill="none" stroke-linecap="round"/>` },
    cap:   { back: c => "", front: c => `<path d="M80 92 C80 62 100 52 120 52 C140 52 160 62 160 92 Z" fill="${c}"/><path d="M118 88 h56 a6 6 0 0 1 0 10 h-56 Z" fill="${shade(c, .8)}"/>` },
    beanie: { hair: true, back: c => "", front: c => `<path d="M78 96 C76 60 100 46 120 46 C140 46 164 60 162 96 Z" fill="${c}"/>
               <rect x="74" y="84" width="92" height="18" rx="9" fill="${shade(c, .86)}"/><path d="M88 86 v14 M104 86 v14 M120 86 v14 M136 86 v14 M152 86 v14" stroke="${shade(c, .74)}" stroke-width="2.5" stroke-linecap="round"/>
               <circle cx="120" cy="42" r="9" fill="${shade(c, .9)}"/>` },
    hat:   { hair: true, back: c => "", front: c => `<path d="M86 88 C86 58 100 48 120 48 C140 48 154 58 154 88 Z" fill="${c}"/>
               <path d="M62 92 C76 78 164 78 178 92 C168 100 72 100 62 92 Z" fill="${shade(c, .9)}"/><path d="M86 82 C104 76 136 76 154 82" stroke="${shade(c, .72)}" stroke-width="5" fill="none" stroke-linecap="round"/>` }
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

  // ---- the face ----
  const MOUTH = {
    smile: `<path d="M108 136 Q120 146 132 136" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    grin:  `<path d="M107 134 Q120 150 133 134 Z" fill="${INK}"/><path d="M111 136 Q120 142 129 136 Z" fill="#FFFFFF"/>`,
    calm:  `<path d="M111 138 Q120 142 129 138" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    laugh: `<path d="M106 133 Q120 131 134 133 Q132 150 120 150 Q108 150 106 133 Z" fill="${INK}"/><path d="M110 135 Q120 133.5 130 135 L129 139 Q120 137.5 111 139 Z" fill="#FFFFFF"/><path d="M113 146 Q120 141 127 146 Q120 150 113 146 Z" fill="#E0623E"/>`,
    smirk: `<path d="M110 139 Q122 143 132 133" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  };
  const EYES = {
    dot:    `<ellipse cx="105" cy="116" rx="4.5" ry="5.5" fill="${INK}"/><ellipse cx="135" cy="116" rx="4.5" ry="5.5" fill="${INK}"/>`,
    big:    `<ellipse cx="105" cy="116" rx="7.5" ry="8" fill="#FFFFFF"/><ellipse cx="135" cy="116" rx="7.5" ry="8" fill="#FFFFFF"/><circle cx="106" cy="117" r="4.6" fill="${INK}"/><circle cx="134" cy="117" r="4.6" fill="${INK}"/>
             <circle cx="107.6" cy="115" r="1.5" fill="#FFFFFF"/><circle cx="135.6" cy="115" r="1.5" fill="#FFFFFF"/>`,
    lash:   `<ellipse cx="105" cy="117" rx="4.5" ry="5.5" fill="${INK}"/><ellipse cx="135" cy="117" rx="4.5" ry="5.5" fill="${INK}"/>
             <path d="M98 113 l-5 -4 M101 110 l-2 -5 M142 113 l5 -4 M139 110 l2 -5" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    happy:  `<path d="M99 118 Q105 110 111 118 M129 118 Q135 110 141 118" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    sleepy: `<path d="M100 116 a5 5.5 0 0 0 10 0 Z M130 116 a5 5.5 0 0 0 10 0 Z" fill="${INK}"/><path d="M99 115.5 h12 M129 115.5 h12" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
  };
  const BROWS = {
    soft:     c => `<path d="M96 100 q9 -6 17 -1 M127 99 q8 -5 17 1" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    straight: c => `<path d="M96 100 h17 M127 100 h17" stroke="${c}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`,
    thick:    c => `<path d="M95 101 q9 -7 18 -2 M127 99 q9 -5 18 2" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    raised:   c => `<path d="M96 98 q8 -9 17 -3 M127 95 q9 -6 17 3" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
  };
  const BEARD = {
    stubble:   c => `<path d="M84 126 A38 44 0 0 0 156 126 C150 136 140 142 132 142 C126 136 114 136 108 142 C100 142 90 136 84 126 Z" fill="${c}" opacity=".3"/>
                 <path d="M108 133 Q114 129 120 132 Q126 129 132 133 Q126 135.5 120 134.5 Q114 135.5 108 133 Z" fill="${c}" opacity=".3"/>`,
    moustache: c => `<path d="M106 132 Q113 126 120 131 Q127 126 134 132 Q127 136 120 134 Q113 136 106 132 Z" fill="${c}"/>`,
    goatee:    c => `<path d="M106 132 Q113 126 120 131 Q127 126 134 132 Q127 136 120 134 Q113 136 106 132 Z" fill="${c}"/>
                 <path d="M108 146 Q120 142 132 146 C132 160 126 168 120 168 C114 168 108 160 108 146 Z" fill="${c}"/>`,
    short:     c => `<path d="M86 118 C88 152 104 164 120 164 C136 164 152 152 154 118 C150 136 142 146 134 148 C128 142 112 142 106 148 C98 146 90 136 86 118 Z" fill="${c}"/>
                 <path d="M106 132 Q113 126 120 131 Q127 126 134 132 Q127 136 120 134 Q113 136 106 132 Z" fill="${c}"/>`,
    full:      c => `<path d="M88 116 C90 156 104 172 120 172 C136 172 150 156 152 116 C148 140 140 150 120 150 C100 150 92 140 88 116 Z" fill="${c}"/>
                 <path d="M108 140 Q120 134 132 140 Q120 146 108 140 Z" fill="${c}"/>`
  };
  const GLASSES = {
    round:  `<g fill="none" stroke="${INK}" stroke-width="3.5"><circle cx="105" cy="116" r="12"/><circle cx="135" cy="116" r="12"/><path d="M117 116 h6 M93 114 l-8 -3 M147 114 l8 -3"/></g>`,
    square: `<g fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"><rect x="92" y="105" width="25" height="21" rx="5"/><rect x="123" y="105" width="25" height="21" rx="5"/><path d="M117 114 h6 M92 112 l-7 -2 M148 112 l7 -2"/></g>`,
    thin:   `<g fill="none" stroke="#8A6A3B" stroke-width="2.2"><ellipse cx="105" cy="116" rx="12.5" ry="10.5"/><ellipse cx="135" cy="116" rx="12.5" ry="10.5"/><path d="M117.5 115 h5 M92.5 114 l-7.5 -3 M147.5 114 l7.5 -3"/></g>`,
    shades: `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round"><path d="M91 107 h27 v8 a12 12 0 0 1 -12 12 h-3 a12 12 0 0 1 -12 -12 Z" fill="#2B2826"/><path d="M122 107 h27 v8 a12 12 0 0 1 -12 12 h-3 a12 12 0 0 1 -12 -12 Z" fill="#2B2826"/>
             <path d="M118 110 h4 M91 110 l-6 -1 M149 110 l6 -1" fill="none"/></g><path d="M96 111 l8 0 M127 111 l8 0" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".35"/>`
  };
  const EARRING = {
    studs: `<circle cx="80" cy="128" r="3" fill="#E2B93B"/><circle cx="160" cy="128" r="3" fill="#E2B93B"/>`,
    hoops: `<g fill="none" stroke="#E2B93B" stroke-width="2.6"><circle cx="80" cy="133" r="6"/><circle cx="160" cy="133" r="6"/></g>`
  };

  // ---- the body: one torso shape, arms at the sides, legs ----
  const TORSO = "M76 196 C76 184 92 178 104 178 L136 178 C148 178 164 184 164 196 L160 296 C160 300 156 302 152 302 L88 302 C84 302 80 300 80 296 Z";
  const ARM_L = "M73 200 C64 228 60 258 62 290", ARM_R = "M167 200 C176 228 180 258 178 290";
  const SLEEVE_L = "M73 200 C69 212 66 224 64.5 234", SLEEVE_R = "M167 200 C171 212 174 224 175.5 234";
  // arms: "long" sleeves to the wrist (with a cuff), "short" sleeves and a bare arm, or "none" (bare from the shoulder)
  function arms(kind, c, skin, o = {}){
    const cuff = o.cuff || line(c), one = (side, arm, sl, hx) => {
      const hand = `<circle cx="${hx}" cy="299" r="10.5" fill="${skin}"/>`;
      const g = kind === "long" ? `<path d="${arm}" stroke="${o.sleeve || c}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M${hx - 10.5} 287 h21" stroke="${cuff}" stroke-width="5" stroke-linecap="round"/>${hand}`
        : kind === "short" ? `<path d="${arm}" stroke="${skin}" stroke-width="17" fill="none" stroke-linecap="round"/>${hand}<path d="${sl}" stroke="${o.sleeve || c}" stroke-width="23" fill="none" stroke-linecap="round"/>`
        : `<path d="${arm}" stroke="${skin}" stroke-width="17" fill="none" stroke-linecap="round"/>${hand}`;
      return `<g class="arm-${side}">${g}</g>`; };
    return (o.noLeft ? "" : one("l", ARM_L, SLEEVE_L, 62)) + (o.noRight ? "" : one("r", ARM_R, SLEEVE_R, 178));
  }
  const hem = c => `<path d="M81 296 C81 300 84 302 88 302 L152 302 C156 302 159 300 159 296 L159.4 290 L80.6 290 Z" fill="${line(c)}"/>`;
  const neckHole = sk2 => `<path d="M105 178 Q120 196 135 178 Z" fill="${sk2}"/>`;
  // Each top: { body: what covers the chest (drawn over the legs), sleeves: "long" | "short" | "none", low: true when it
  // hangs below the waist (a kurta, a dress) }. a = { c: its colour, skin, sk2 }.
  const TOPS = {
    tee: a => ({ sleeves: "short", body: `<path d="${TORSO}" fill="${a.c}"/>${neckHole(a.sk2)}<path d="M104 178 Q120 196 136 178" stroke="${line(a.c)}" stroke-width="4" fill="none" stroke-linecap="round"/>` }),
    shirt: a => ({ sleeves: "long", body: `<path d="${TORSO}" fill="${a.c}"/>${neckHole(a.sk2)}
      <path d="M120 196 V301" stroke="${line(a.c)}" stroke-width="2.5"/>${[214, 238, 262, 286].map(y => `<circle cx="120" cy="${y}" r="2.4" fill="${line(a.c)}"/>`).join("")}
      <path d="M103 176 L121 197 L99 203 Z M137 176 L119 197 L141 203 Z" fill="${a.c}" stroke="${line(a.c)}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M92 226 h16 v12 h-16 Z" fill="none" stroke="${line(a.c)}" stroke-width="2" stroke-linejoin="round" opacity=".7"/>` }),
    hoodie: a => ({ sleeves: "long", body: `<path d="${TORSO}" fill="${a.c}"/>${hem(a.c)}
      <path d="M95 192 C90 164 150 164 145 192" stroke="${shade(a.c, lum(a.c) < 70 ? 1.5 : .9)}" stroke-width="13" fill="none" stroke-linecap="round"/>${neckHole(a.sk2)}
      <path d="M98 262 h44 l7 26 h-58 Z" fill="none" stroke="${line(a.c)}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M112 190 v24 M128 190 v24" stroke="#FBF8F6" stroke-width="3" stroke-linecap="round"/><circle cx="112" cy="216" r="2.6" fill="#FBF8F6"/><circle cx="128" cy="216" r="2.6" fill="#FBF8F6"/>` }),
    sweater: a => ({ sleeves: "long", body: `<path d="${TORSO}" fill="${a.c}"/>${hem(a.c)}${neckHole(a.sk2)}
      <path d="M103 178 Q120 198 137 178" stroke="${line(a.c)}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M79 232 h82 M79 244 h82" stroke="${line(a.c)}" stroke-width="4" opacity=".55"/>` }),
    jacket: a => ({ sleeves: "long", body: `<path d="${TORSO}" fill="#F4F2EE"/>${neckHole(a.sk2)}<path d="M104 178 Q120 196 136 178" stroke="#D6D2CC" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M76 196 C76 184 92 178 104 178 L108 178 L112 302 L88 302 C84 302 80 300 80 296 Z M164 196 C164 184 148 178 136 178 L132 178 L128 302 L152 302 C156 302 160 300 160 296 Z" fill="${a.c}"/>
      <path d="M80.6 290 L111.6 290 L112 302 L88 302 C84 302 81 300 81 296 Z M159.4 290 L128.4 290 L128 302 L152 302 C156 302 159 300 159 296 Z" fill="${line(a.c)}"/>
      <path d="M109 182 L112 300 M131 182 L128 300" stroke="${line(a.c)}" stroke-width="2.5" stroke-linecap="round"/>` }),
    varsity: a => ({ sleeves: "long", sleeve: "#F3E9D8", cuff: a.c, body: `<path d="${TORSO}" fill="#F4F2EE"/>${neckHole(a.sk2)}<path d="M104 178 Q120 196 136 178" stroke="#D6D2CC" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M76 196 C76 184 92 178 104 178 L108 178 L112 302 L88 302 C84 302 80 300 80 296 Z M164 196 C164 184 148 178 136 178 L132 178 L128 302 L152 302 C156 302 160 300 160 296 Z" fill="${a.c}"/>
      <path d="M80.6 290 L111.6 290 L112 302 L88 302 C84 302 81 300 81 296 Z M159.4 290 L128.4 290 L128 302 L152 302 C156 302 159 300 159 296 Z" fill="#F3E9D8"/>
      <path d="M82 296 h28 M130 296 h28" stroke="${a.c}" stroke-width="2.5"/><path d="M104 180 L109 196 M136 180 L131 196" stroke="#F3E9D8" stroke-width="6" stroke-linecap="round"/>
      <path d="M138 222 v16 M138 222 h6 a4 4 0 0 1 0 8 h-6 M138 230 h7 a4 4 0 0 1 0 8 h-7" stroke="#F3E9D8" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` }),
    blazer: a => ({ sleeves: "long", body: `<path d="${TORSO}" fill="#F4F2EE"/>${neckHole(a.sk2)}
      <path d="M104 177 L120 196 L136 177" stroke="#D6D2CC" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <path d="M76 196 C76 184 92 178 104 178 L120 262 L120 302 L88 302 C84 302 80 300 80 296 Z M164 196 C164 184 148 178 136 178 L120 262 L120 302 L152 302 C156 302 160 300 160 296 Z" fill="${a.c}"/>
      <path d="M103 178 L120 262 L96 222 L104 214 L94 200 Z M137 178 L120 262 L144 222 L136 214 L146 200 Z" fill="${shade(a.c, lum(a.c) < 70 ? 1.45 : .88)}"/>
      <path d="M120 262 V302" stroke="${line(a.c)}" stroke-width="2.5"/><circle cx="120" cy="272" r="3" fill="${line(a.c)}"/>
      <path d="M88 268 h18" stroke="${line(a.c)}" stroke-width="2.5" stroke-linecap="round"/>` }),
    kurta: a => ({ sleeves: "long", low: 352, body: `<path d="M76 196 C76 184 92 178 104 178 L136 178 C148 178 164 184 164 196 L163 346 C163 350 160 352 156 352 L84 352 C80 352 77 350 77 346 Z" fill="${a.c}"/>${neckHole(a.sk2)}
      <path d="M103 177 Q120 197 137 177" stroke="${line(a.c)}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M120 194 V252" stroke="${line(a.c)}" stroke-width="2.5" stroke-linecap="round"/>${[206, 222, 238].map(y => `<circle cx="120" cy="${y}" r="2.4" fill="${line(a.c)}"/>`).join("")}
      <path d="M90 322 V352 M150 322 V352" stroke="${line(a.c)}" stroke-width="2.5" stroke-linecap="round"/>` }),
    dress: a => ({ sleeves: "short", low: 372, body: `<path d="M76 196 C76 184 92 178 104 178 L136 178 C148 178 164 184 164 196 L158 280 L178 366 Q120 380 62 366 L82 280 Z" fill="${a.c}"/>${neckHole(a.sk2)}
      <path d="M104 178 Q120 198 136 178" stroke="${line(a.c)}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M82 280 Q120 288 158 280" stroke="${line(a.c)}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M96 300 L88 368 M144 300 L152 368 M120 302 V372" stroke="${line(a.c)}" stroke-width="2" stroke-linecap="round" opacity=".5"/>` })
  };
  const bareLegs = (skin, from) => `<path d="M101 ${from} V404 M139 ${from} V404" stroke="${skin}" stroke-width="23" stroke-linecap="round"/>`;
  const BOTTOMS = {
    jeans: (c, skin) => `<path d="M80 286 L160 286 L156 408 L124 408 L120 322 L116 408 L84 408 Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M120 290 V322 M86 400 h28 M126 400 h28" stroke="${line(c)}" stroke-width="2.5" stroke-linecap="round"/><path d="M92 304 q8 6 16 0 M132 304 q8 6 16 0" stroke="${line(c)}" stroke-width="2" fill="none" opacity=".7"/>`,
    trousers: (c, skin) => `<path d="M80 286 L160 286 L158 408 L123 408 L120 322 L117 408 L82 408 Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M120 290 V322" stroke="${line(c)}" stroke-width="2.5" stroke-linecap="round"/><path d="M100 306 V406 M140 306 V406" stroke="${line(c)}" stroke-width="2" opacity=".55"/>`,
    joggers: (c, skin) => `<path d="M80 286 L160 286 L152 398 L127 398 L120 322 L113 398 L88 398 Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="86" y="394" width="29" height="13" rx="5" fill="${line(c)}"/><rect x="125" y="394" width="29" height="13" rx="5" fill="${line(c)}"/>
      <path d="M120 290 V322" stroke="${line(c)}" stroke-width="2.5" stroke-linecap="round"/><path d="M88 300 V388 M152 300 V388" stroke="#FBF8F6" stroke-width="2.5" opacity=".6"/>`,
    wide: (c, skin) => `<path d="M80 286 L160 286 L168 408 L122 408 L120 322 L118 408 L72 408 Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M120 290 V322" stroke="${line(c)}" stroke-width="2.5" stroke-linecap="round"/><path d="M96 306 L92 406 M144 306 L148 406" stroke="${line(c)}" stroke-width="2" opacity=".5"/>`,
    shorts: (c, skin) => `${bareLegs(skin, 340)}<path d="M80 286 L160 286 L160 350 L123 350 L120 322 L117 350 L80 350 Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M120 290 V322 M82 344 h33 M125 344 h33" stroke="${line(c)}" stroke-width="2.5" stroke-linecap="round"/>`,
    skirt: (c, skin) => `${bareLegs(skin, 350)}<path d="M82 286 L158 286 L174 360 Q120 372 66 360 Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M100 300 L94 364 M140 300 L146 364 M120 300 V368" stroke="${line(c)}" stroke-width="2" stroke-linecap="round" opacity=".5"/>`
  };
  const SHOES = {
    sneakers: (c, skin) => [[78, 1], [122, -1]].map(([x, d]) => `<path d="M${x + 6} 400 h28 a6 6 0 0 1 6 6 v12 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 v-12 a6 6 0 0 1 6 -6 Z" fill="${c}"/>
      <rect x="${x}" y="416" width="40" height="8" rx="4" fill="${lum(c) > 200 ? "#D6D2CC" : "#FBF8F6"}"/><path d="M${x + 13} 406 h14 M${x + 13} 411 h14" stroke="${line(c)}" stroke-width="2" stroke-linecap="round"/>`).join(""),
    boots: (c, skin) => [[78, 1], [122, -1]].map(([x, d]) => `<path d="M${x + 7} 384 h26 v16 a6 6 0 0 1 7 6 v12 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 v-12 a6 6 0 0 1 7 -6 Z" fill="${c}"/>
      <rect x="${x}" y="417" width="40" height="7" rx="3.5" fill="${shade(c, .6)}"/><path d="M${x + 8} 392 h24" stroke="${line(c)}" stroke-width="2.5" stroke-linecap="round"/>`).join(""),
    sandals: (c, skin) => [[78, 1], [122, -1]].map(([x, d]) => `<rect x="${x + 2}" y="402" width="36" height="18" rx="8" fill="${skin}"/><rect x="${x}" y="418" width="40" height="6" rx="3" fill="${shade(c, .7)}"/>
      <path d="M${x + 4} 410 h32" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join(""),
    loafers: (c, skin) => [[78, 1], [122, -1]].map(([x, d]) => `<path d="M${x + 6} 404 h28 a6 6 0 0 1 6 6 v8 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 v-8 a6 6 0 0 1 6 -6 Z" fill="${c}"/>
      <rect x="${x}" y="419" width="40" height="5" rx="2.5" fill="${shade(c, .6)}"/><path d="M${x + 10} 410 h20" stroke="${line(c)}" stroke-width="3" stroke-linecap="round"/>`).join("")
  };

  // ---- one person, as layers. c: skin, mouth, eyes, brows, hair, hairColour, cover {kind, colour}, glasses (a style or
  // true), beard, beardColour, earrings, top (a colour), outfit (a top's style), bottoms, bottomsColour, shoes, shoesColour.
  function person(c, o = {}){
    const skin = SKIN[c.skin] || c.skin || "#D6CBC3", sk2 = shade(skin, .86), hair = c.hairColour || INK, top = c.top || "#86A6E0";
    const cov = c.cover ? COVER[c.cover.kind] : null, cc = c.cover && c.cover.colour, wrap = !!(cov && cov.wrap);
    const h = HAIR[c.hair] || HAIR.short, t = (TOPS[c.outfit] || TOPS.tee)({ c: top, skin, sk2 });
    const hairUnder = cov && cov.hair && h.back ? h.back(hair) : "";   // a beanie or a hat sits on the hair, which still shows below it
    const glasses = c.glasses === true ? GLASSES.round : GLASSES[c.glasses] || "", beard = BEARD[c.beard] ? BEARD[c.beard](c.beardColour || hair) : "";
    const legs = !o.legs ? "" : (t.low >= 372 ? bareLegs(skin, 350) : (BOTTOMS[c.bottoms] || BOTTOMS.jeans)(c.bottomsColour || "#4F6FA5", skin))
      + (SHOES[c.shoes] || SHOES.sneakers)(c.shoesColour || "#F4F2EE", skin);
    return { skin, sk2, top, sleeveColour: t.sleeve || top,
      back: cov ? (wrap ? "" : hairUnder) + cov.back(cc) : h.back(hair),
      legs, body: t.body,
      arms: wrap && !o.legs ? "" : arms(t.sleeves, top, skin, { sleeve: t.sleeve, cuff: t.cuff, noLeft: o.noLeft, noRight: o.noRight }),
      head: `${wrap ? cov.drape(cc, !!o.legs) : `<rect x="108" y="146" width="24" height="36" rx="10" fill="${sk2}"/>
    <ellipse cx="82" cy="118" rx="8" ry="11" fill="${sk2}"/><ellipse cx="158" cy="118" rx="8" ry="11" fill="${sk2}"/>${EARRING[c.earrings] || ""}`}
    <ellipse cx="120" cy="112" rx="${wrap ? 34 : 38}" ry="${wrap ? 42 : 44}" fill="${skin}"/>
    <g class="face">
      ${(BROWS[c.brows] || BROWS.soft)(c.cover && !(cov && cov.hair) ? INK : hair === "#E4DFDA" || hair === "#9C9590" ? shade(hair, .7) : hair)}
      <g class="eyes">${EYES[c.eyes] || EYES.dot}</g>
      <path d="M120 120 q-4 8 1 10" stroke="${sk2}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="96" cy="132" r="7" fill="#E0623E" opacity=".22"/><circle cx="144" cy="132" r="7" fill="#E0623E" opacity=".22"/>
      ${MOUTH[c.mouth] || MOUTH.smile}
    </g>
    ${beard}
    ${cov ? cov.front(cc) : h.front(hair)}
    ${glasses}`,
      over: !cov && h.over ? h.over(hair) : "" };
  }

  // The round one: head and shoulders in a circle, on the flatmate type's scene, holding its prop.
  function avatar(c){
    const [gx, gy] = GRIP[c.prop] || [170, 196], prop = !c.bare && PROPS[c.prop];
    const p = person(c, { noRight: !!prop });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" class="fm-av${c.still ? " still" : ""}" role="img" aria-label="${c.label || "Avatar"}">
<defs><clipPath id="clip-${c.key}"><circle cx="120" cy="120" r="120"/></clipPath></defs>
<g clip-path="url(#clip-${c.key})">
  <g class="scene">${SCENES[c.bare || !SCENES[c.rhythm] ? "neutral" : c.rhythm]()}</g>
  <g class="who">
    ${p.back}
    ${p.arms}
    ${p.body}
    ${p.head}
    ${p.over}
    <g class="wave"><path d="M74 204 C58 206 50 196 49 174" stroke="${p.sleeveColour}" stroke-width="20" fill="none" stroke-linecap="round"/><circle cx="49" cy="164" r="11" fill="${p.skin}"/></g>
    ${prop ? `<path d="M164 204 C172 214 ${gx - 4} ${gy + 8} ${gx} ${gy}" stroke="${p.sleeveColour}" stroke-width="18" fill="none" stroke-linecap="round"/>` : ""}
  </g>
  ${prop ? PROPS[c.prop] + `<circle class="hand" cx="${gx}" cy="${gy}" r="10" fill="${p.skin}"/>` : ""}
</g></svg>`;
  }

  // The whole person, standing. o.box: a viewBox to crop to (the studio's small pictures of one part).
  function figure(c){
    const p = person(c, { legs: true });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${c.box || "0 0 240 440"}" class="fm-av fm-fig${c.still ? " still" : ""}" role="img" aria-label="${c.label || "Avatar"}">
  <ellipse class="floor" cx="120" cy="424" rx="64" ry="9" fill="#1C1917" opacity=".1"/>
  <g class="who">
    ${p.back}
    ${p.legs}
    ${p.arms}
    ${p.body}
    ${p.head}
    ${p.over}
    <g class="wave"><path d="M74 204 C58 206 50 196 49 174" stroke="${p.sleeveColour}" stroke-width="20" fill="none" stroke-linecap="round"/><circle cx="49" cy="164" r="11" fill="${p.skin}"/></g>
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
.fm-av .wave{opacity:0; transform-origin:90% 100%}
.play .fm-av .wave{animation:fmWave 2.4s ease-in-out .3s 1 both}
.play .fm-av .arm-l{animation:fmArmAway 2.4s ease-in-out .3s 1 both}
@keyframes fmBreathe{50%{transform:translateY(-1.6px) scale(1.006)}}
@keyframes fmBlink{0%, 93%, 100%{transform:scaleY(1)} 96%{transform:scaleY(.1)}}
@keyframes fmBob{50%{transform:translateY(-3px) rotate(-2deg)}}
@keyframes fmRise{50%{transform:translateY(-5px)}}
@keyframes fmSway{50%{transform:rotate(-6deg) translateY(-2px)}}
@keyframes fmTwinkle{50%{opacity:.35; transform:scale(.8)}}
@keyframes fmSteam{0%{opacity:0; transform:translateY(6px)} 40%{opacity:1} 100%{opacity:0; transform:translateY(-8px)}}
@keyframes fmWave{0%{opacity:0; transform:rotate(0)} 10%{opacity:1} 25%{transform:rotate(-14deg)} 45%{transform:rotate(10deg)} 65%{transform:rotate(-14deg)} 85%{opacity:1; transform:rotate(6deg)} 100%{opacity:0; transform:rotate(0)}}
@keyframes fmArmAway{0%{opacity:1} 10%{opacity:0} 85%{opacity:0} 100%{opacity:1}}
.fm-av.still *, .fm-av.still{animation:none !important}
@media (prefers-reduced-motion:reduce){ .fm-av *, .fm-av{animation:none !important} }`;

  const api = { avatar, figure, CSS, SKIN, HAIR: Object.keys(HAIR), COVER: Object.keys(COVER), TOPS: Object.keys(TOPS), BOTTOMS: Object.keys(BOTTOMS), SHOES: Object.keys(SHOES),
    BEARD: Object.keys(BEARD), GLASSES: Object.keys(GLASSES), EYES: Object.keys(EYES), BROWS: Object.keys(BROWS), MOUTH: Object.keys(MOUTH), EARRING: Object.keys(EARRING) };
  if(typeof module !== "undefined") module.exports = api; else root.FMAvatar = api;
})(this);
