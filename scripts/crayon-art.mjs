import { writeFileSync, mkdirSync } from "node:fs";

const OUT = "public/assets/crayon";
mkdirSync(OUT, { recursive: true });

const C = {
  ink: "#2b241f",
  paper: "#f7f1e8",
  floor: "#efe4d4",
  skin: "#ffd3b5",
  hair: "#5a3d2b",
  hair2: "#3f322c",
  shirt: "#e06c3c",
  shirt2: "#6f8f6a",
  shorts: "#f3d7a4",
  shoe: "#6b4a32",
  dog: "#f0d09a",
  dogEar: "#c9844a",
  cat: "#f0b27a",
  cream: "#fff8ee",
  plant: "#7d9a6b",
  window: "#dce8df",
};

const FL = (fill, w = 5) =>
  `fill="${fill}" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const ST = (w = 5) =>
  `fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

function svg(w, h, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${C.paper}"/>
  <rect x="0" y="${Math.round(h * 0.72)}" width="${w}" height="${Math.round(h * 0.28)}" fill="${C.floor}"/>
  ${body}
</svg>
`;
}

function stamp(x, y, s, dir, inner) {
  return `<g transform="translate(${x} ${y}) scale(${s * dir},${s})">${inner}</g>`;
}

function shadow(x, y, rx = 48) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="9" fill="#d9cbb8" opacity=".5"/>`;
}

function sausage(x1, y1, x2, y2, fill = C.skin) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 4;
  return `
    <path d="M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="${C.ink}" stroke-width="18" stroke-linecap="round"/>
    <path d="M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="${fill}" stroke-width="10" stroke-linecap="round"/>
  `;
}

function hand(x, y, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <circle r="8.2" ${FL(C.skin, 3.6)}/>
    <circle cx="-7.5" cy="-3.5" r="4" ${FL(C.skin, 3)}/>
    <circle cx="-2.2" cy="-8.5" r="4" ${FL(C.skin, 3)}/>
    <circle cx="3.6" cy="-8.5" r="4" ${FL(C.skin, 3)}/>
    <circle cx="8.4" cy="-3.8" r="4" ${FL(C.skin, 3)}/>
  </g>`;
}

function mouth(kind) {
  if (kind === "open") return `<ellipse cx="14" cy="24" rx="8" ry="6.5" fill="${C.ink}"/>`;
  if (kind === "line") return `<path d="M8 23 H 22" ${ST(4)}/>`;
  return `<path d="M8 22 Q 16 30 24 22" ${ST(4)}/>`;
}

function card() {
  return `
    <rect x="-26" y="-32" width="52" height="50" rx="8" ${FL(C.cream, 4.5)}/>
    <rect x="-26" y="-32" width="52" height="14" rx="8" ${FL(C.shirt, 4.5)}/>
    <circle cx="-8" cy="0" r="2.8" fill="${C.ink}"/>
    <circle cx="4" cy="0" r="2.8" fill="${C.ink}"/>
    <circle cx="14" cy="0" r="2.8" fill="${C.ink}"/>
    <circle cx="-8" cy="12" r="2.8" fill="${C.ink}"/>
    <circle cx="4" cy="12" r="2.8" fill="${C.ink}"/>
  `;
}

function papers() {
  return `
    <rect x="-6" y="-24" width="50" height="62" rx="8" fill="#f4d2b4" stroke="${C.ink}" stroke-width="4.5"/>
    <rect x="-30" y="-36" width="50" height="64" rx="8" ${FL(C.cream, 4.5)}/>
    <path d="M-16 -10 H 6 M-16 4 H 0" ${ST(3.6)}/>
  `;
}

function person({
  shirt = C.shirt,
  shorts = C.shorts,
  hair = C.hair,
  hairStyle = "bob",
  mood = "smile",
  arm = "down",
  prop = "",
} = {}) {
  const bun = hairStyle === "bun" ? `<circle cx="0" cy="-50" r="12" ${FL(hair)}/>` : "";
  const frontArm =
    arm === "wave"
      ? `${sausage(22, 58, 38, 12)}${hand(40, 6, -28)}`
      : arm === "hold"
        ? `${sausage(22, 58, 46, 30)}${hand(50, 26, 18)}${prop ? `<g transform="translate(78 4) scale(.95)">${prop}</g>` : ""}`
        : `${sausage(22, 58, 28, 90)}${hand(30, 96, 12)}`;

  return `
    ${sausage(-14, 58, -26, 92)}
    <rect x="-16" y="98" width="14" height="22" rx="7" ${FL(C.skin)}/>
    <rect x="8" y="98" width="14" height="22" rx="7" ${FL(C.skin)}/>
    <ellipse cx="-8" cy="122" rx="13" ry="7" ${FL(C.shoe)}/>
    <ellipse cx="16" cy="122" rx="13" ry="7" ${FL(C.shoe)}/>
    <rect x="-22" y="82" width="50" height="22" rx="10" ${FL(shorts)}/>
    <rect x="-24" y="46" width="54" height="44" rx="14" ${FL(shirt)}/>
    <ellipse cx="-12" cy="-8" rx="50" ry="42" ${FL(hair)}/>
    ${bun}
    <ellipse cx="10" cy="10" rx="42" ry="34" ${FL(C.skin)}/>
    <ellipse cx="2" cy="8" rx="7.2" ry="9.5" fill="${C.ink}"/>
    <ellipse cx="24" cy="10" rx="9" ry="11.5" fill="${C.ink}"/>
    <path d="M-8 -6 H 10" ${ST(3.5)}/>
    <path d="M18 -4 H 36" ${ST(3.5)}/>
    ${mouth(mood)}
    ${frontArm}
  `;
}

function dog() {
  return `
    <ellipse cx="-18" cy="46" rx="7" ry="13" ${FL(C.dog)}/>
    <ellipse cx="6" cy="48" rx="7" ry="13" ${FL(C.dog)}/>
    <ellipse cx="24" cy="46" rx="7" ry="12" ${FL(C.dog)}/>
    <path d="M-36 14 Q -58 -8 -44 16" ${ST(7)}/>
    <ellipse cx="-2" cy="20" rx="38" ry="24" ${FL(C.dog)}/>
    <ellipse cx="12" cy="10" rx="12" ry="22" transform="rotate(-28 12 10)" ${FL(C.dogEar)}/>
    <ellipse cx="48" cy="12" rx="13" ry="24" transform="rotate(16 48 12)" ${FL(C.dogEar)}/>
    <ellipse cx="30" cy="-2" rx="24" ry="22" ${FL(C.dog)}/>
    <ellipse cx="22" cy="-4" rx="5.8" ry="7.6" fill="${C.ink}"/>
    <ellipse cx="38" cy="-2" rx="6.8" ry="8.6" fill="${C.ink}"/>
    <ellipse cx="48" cy="6" rx="5.5" ry="4.2" fill="${C.ink}"/>
    <path d="M42 12 Q 48 18 54 12" ${ST(3.4)}/>
  `;
}

function cat() {
  return `
    <ellipse cx="-12" cy="42" rx="6" ry="12" ${FL(C.cat)}/>
    <ellipse cx="8" cy="44" rx="6" ry="12" ${FL(C.cat)}/>
    <ellipse cx="22" cy="42" rx="6" ry="11" ${FL(C.cat)}/>
    <path d="M-26 10 Q -6 -24 -16 8" ${ST(6)}/>
    <ellipse cx="2" cy="20" rx="30" ry="22" ${FL(C.cat)}/>
    <path d="M10 -14 L 6 -36 L 22 -10 Z" ${FL(C.cat)}/>
    <path d="M34 -12 L 46 -36 L 42 -8 Z" ${FL(C.cat)}/>
    <ellipse cx="24" cy="-2" rx="21" ry="19" ${FL(C.cat)}/>
    <ellipse cx="16" cy="-4" rx="5.2" ry="7" fill="${C.ink}"/>
    <ellipse cx="30" cy="-2" rx="6.2" ry="8" fill="${C.ink}"/>
    <path d="M22 8 L 26 13 L 30 8" ${ST(3)}/>
    <path d="M6 0 H 13 M 34 1 H 43" ${ST(2.6)}/>
  `;
}

function plant() {
  return `
    <path d="M0 46 V 6" ${ST(5)}/>
    <ellipse cx="-15" cy="4" rx="15" ry="9" ${FL(C.plant)}/>
    <ellipse cx="15" cy="6" rx="15" ry="9" ${FL(C.plant)}/>
    <ellipse cx="0" cy="-10" rx="12" ry="14" ${FL(C.plant)}/>
  `;
}

function win() {
  return `
    <rect x="-48" y="-58" width="96" height="110" rx="8" fill="${C.window}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M-48 -4 H 48 M 0 -58 V 52" ${ST(3.6)}/>
  `;
}

const ara = (extra = {}) => person({ mood: "open", ...extra });
const jun = (extra = {}) =>
  person({ shirt: C.shirt2, hair: C.hair2, hairStyle: "bun", mood: "smile", ...extra });

const files = {
  "hero.svg": svg(
    1000,
    520,
    `
    ${stamp(90, 250, 0.85, 1, win())}
    ${stamp(60, 400, 0.95, 1, plant())}
    ${shadow(250, 488, 68)}
    ${shadow(500, 490, 54)}
    ${shadow(760, 492, 58)}
    ${stamp(250, 355, 1.82, 1, dog())}
    ${stamp(500, 278, 1.7, 1, ara({ arm: "down" }))}
    ${stamp(760, 368, 1.7, -1, cat())}
  `,
  ),
  "family.svg": svg(
    880,
    520,
    `
    ${stamp(36, 400, 0.95, 1, plant())}
    ${shadow(210, 490, 62)}
    ${shadow(440, 490, 52)}
    ${shadow(680, 492, 56)}
    ${stamp(210, 358, 1.68, 1, dog())}
    ${stamp(440, 282, 1.6, 1, ara())}
    ${stamp(680, 370, 1.58, -1, cat())}
  `,
  ),
  "saju.svg": svg(
    680,
    520,
    `
    ${shadow(280, 490, 54)}
    ${shadow(510, 494, 48)}
    ${stamp(280, 282, 1.68, 1, ara({ arm: "hold", mood: "open", prop: card() }))}
    ${stamp(510, 370, 1.52, -1, cat())}
  `,
  ),
  "style.svg": svg(
    680,
    520,
    `
    ${shadow(340, 490, 56)}
    ${shadow(150, 498, 40)}
    ${shadow(530, 498, 38)}
    ${stamp(340, 278, 1.72, 1, ara({ arm: "wave", mood: "open" }))}
    ${stamp(150, 405, 1.12, 1, dog())}
    ${stamp(530, 412, 1.08, -1, cat())}
  `,
  ),
  "lifestyle.svg": svg(
    680,
    520,
    `
    ${stamp(70, 400, 0.95, 1, plant())}
    ${shadow(250, 490, 52)}
    ${shadow(500, 494, 56)}
    ${stamp(250, 282, 1.58, 1, ara({ arm: "hold" }))}
    <path d="M310 350 Q 390 292 470 382" ${ST(5)}/>
    ${stamp(500, 362, 1.55, -1, dog())}
  `,
  ),
  "dogcat.svg": svg(
    680,
    520,
    `
    ${shadow(200, 490, 68)}
    ${shadow(500, 490, 60)}
    ${stamp(200, 345, 2.05, 1, dog())}
    ${stamp(500, 352, 1.95, -1, cat())}
  `,
  ),
  "triangle.svg": svg(
    680,
    520,
    `
    ${shadow(190, 420, 42)}
    ${shadow(500, 420, 42)}
    ${shadow(345, 498, 48)}
    ${stamp(190, 248, 1.22, 1, ara())}
    ${stamp(500, 248, 1.22, -1, jun())}
    ${stamp(345, 392, 1.4, 1, dog())}
  `,
  ),
  "look.svg": svg(
    680,
    520,
    `
    ${shadow(230, 490, 52)}
    ${shadow(480, 494, 56)}
    ${stamp(230, 282, 1.58, 1, ara({ mood: "open", arm: "down" }))}
    ${stamp(480, 362, 1.58, -1, dog())}
  `,
  ),
  "tips.svg": svg(
    680,
    520,
    `
    ${shadow(260, 490, 52)}
    ${shadow(480, 494, 48)}
    ${stamp(260, 286, 1.52, 1, ara({ arm: "hold", mood: "open", prop: card() }))}
    ${stamp(480, 370, 1.48, -1, dog())}
  `,
  ),
  "pdf.svg": svg(
    680,
    520,
    `
    ${shadow(230, 490, 52)}
    ${shadow(480, 494, 48)}
    ${stamp(230, 286, 1.5, 1, ara({ arm: "hold", prop: papers() }))}
    ${stamp(480, 372, 1.46, -1, cat())}
  `,
  ),
  "free.svg": svg(
    680,
    520,
    `
    ${shadow(340, 490, 56)}
    ${shadow(130, 498, 38)}
    ${stamp(340, 278, 1.72, 1, ara({ arm: "wave", mood: "open" }))}
    ${stamp(130, 405, 1.1, 1, dog())}
  `,
  ),
  "score.svg": svg(
    680,
    520,
    `
    ${shadow(280, 490, 52)}
    ${shadow(120, 498, 38)}
    ${stamp(280, 286, 1.52, 1, ara({ mood: "open" }))}
    ${stamp(120, 405, 1.1, 1, dog())}
    <g transform="translate(520 200)">
      <circle r="68" ${FL(C.shirt)}/>
      <path d="M-26 8 Q 0 30 26 -4" fill="none" stroke="${C.cream}" stroke-width="9" stroke-linecap="round"/>
    </g>
  `,
  ),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(`${OUT}/${name}`, content);
  console.log(name);
}
