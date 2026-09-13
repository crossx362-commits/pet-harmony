import { writeFileSync, mkdirSync } from "node:fs";

const OUT = "public/assets/crayon";
mkdirSync(OUT, { recursive: true });

const C = {
  ink: "#3d332c",
  paper: "#f7f1e8",
  skin: "#ffd8be",
  hair: "#6a4e3d",
  body: "#ef7a4c",
  cream: "#fff8ee",
  dog: "#ffd39a",
  dogEar: "#e8a66a",
  cat: "#ffb36a",
  blush: "#ff9b90",
  white: "#fff",
};

const st = `stroke="${C.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;

function svg(w, h, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${C.paper}"/>
  ${body}
</svg>
`;
}

function g(x, y, s, inner) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
}

function eyes(y = -36) {
  return `
    <ellipse cx="-13" cy="${y}" rx="10" ry="12" fill="${C.ink}"/>
    <ellipse cx="13" cy="${y}" rx="10" ry="12" fill="${C.ink}"/>
    <circle cx="-9" cy="${y - 4}" r="3.6" fill="${C.white}"/>
    <circle cx="17" cy="${y - 4}" r="3.6" fill="${C.white}"/>
    <circle cx="-15" cy="${y + 3}" r="1.4" fill="${C.white}"/>
    <circle cx="11" cy="${y + 3}" r="1.4" fill="${C.white}"/>
  `;
}

function person() {
  return `
    <ellipse cx="-32" cy="30" rx="11" ry="15" fill="${C.skin}" ${st}/>
    <ellipse cx="32" cy="30" rx="11" ry="15" fill="${C.skin}" ${st}/>
    <ellipse cx="-15" cy="62" rx="10" ry="14" fill="${C.body}" ${st}/>
    <ellipse cx="15" cy="62" rx="10" ry="14" fill="${C.body}" ${st}/>
    <ellipse cx="0" cy="28" rx="44" ry="34" fill="${C.body}" ${st}/>
    <circle cx="0" cy="-32" r="40" fill="${C.skin}" ${st}/>
    <path d="M-34 -40 C -22 -72, 22 -72, 34 -40" fill="${C.hair}" ${st}/>
    ${eyes(-34)}
    <ellipse cx="-22" cy="-20" rx="8" ry="5" fill="${C.blush}"/>
    <ellipse cx="22" cy="-20" rx="8" ry="5" fill="${C.blush}"/>
    <path d="M-7 -16 Q 0 -8 7 -16" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  `;
}

function dog() {
  return `
    <ellipse cx="0" cy="36" rx="46" ry="30" fill="${C.dog}" ${st}/>
    <circle cx="0" cy="-6" r="34" fill="${C.dog}" ${st}/>
    <ellipse cx="-28" cy="-28" rx="13" ry="16" fill="${C.dogEar}" ${st}/>
    <ellipse cx="28" cy="-28" rx="13" ry="16" fill="${C.dogEar}" ${st}/>
    ${eyes(-10).replaceAll("-13", "-12").replaceAll("13", "12")}
    <ellipse cx="0" cy="4" rx="7" ry="5" fill="${C.ink}"/>
    <circle cx="-3" cy="2" r="1.6" fill="${C.white}"/>
    <path d="M-8 12 Q 0 20 8 12" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M42 20 Q 60 6 52 34" fill="none" ${st}/>
  `;
}

function cat() {
  return `
    <ellipse cx="0" cy="34" rx="40" ry="28" fill="${C.cat}" ${st}/>
    <circle cx="0" cy="-4" r="30" fill="${C.cat}" ${st}/>
    <path d="M-22 -22 L -18 -48 L -4 -24 Z" fill="${C.cat}" ${st}/>
    <path d="M22 -22 L 18 -48 L 4 -24 Z" fill="${C.cat}" ${st}/>
    ${eyes(-8)}
    <path d="M-5 4 L 0 10 L 5 4" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M-26 -2 H -14" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 -2 H 26" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M36 16 Q 52 4 46 30" fill="none" ${st}/>
  `;
}

function card() {
  return `<g>
    <rect x="-34" y="-26" width="68" height="52" rx="12" fill="${C.cream}" ${st}/>
    <path d="M-16 -6 H 16" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M-16 8 H 8" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

const files = {
  "hero.svg": svg(1200, 720, `
    ${g(250, 390, 2.15, dog())}
    ${g(600, 360, 2.45, person())}
    ${g(950, 400, 2.05, cat())}
  `),
  "family.svg": svg(900, 720, `
    ${g(210, 390, 2.1, dog())}
    ${g(450, 360, 2.35, person())}
    ${g(700, 400, 2.0, cat())}
  `),
  "saju.svg": svg(900, 720, `
    ${g(560, 250, 1.4, card())}
    ${g(340, 400, 2.2, person())}
    ${g(680, 430, 1.9, cat())}
  `),
  "style.svg": svg(900, 720, `
    ${g(450, 340, 2.4, person())}
    ${g(220, 470, 1.5, dog())}
    ${g(690, 480, 1.45, cat())}
  `),
  "lifestyle.svg": svg(900, 720, `
    ${g(360, 360, 2.3, person())}
    ${g(640, 420, 1.9, dog())}
  `),
  "dogcat.svg": svg(900, 720, `
    ${g(280, 380, 2.35, dog())}
    ${g(620, 390, 2.25, cat())}
  `),
  "triangle.svg": svg(900, 720, `
    ${g(240, 340, 1.7, person())}
    ${g(660, 340, 1.7, person())}
    ${g(450, 500, 1.7, dog())}
  `),
  "tips.svg": svg(900, 720, `
    ${g(450, 230, 1.3, card())}
    ${g(340, 410, 2.05, person())}
    ${g(660, 440, 1.8, dog())}
  `),
  "pdf.svg": svg(900, 720, `
    ${g(330, 400, 2.05, person())}
    ${g(680, 430, 1.85, cat())}
    <g transform="translate(540 220) scale(1.15)">
      <rect x="-32" y="-36" width="64" height="74" rx="12" fill="${C.cream}" ${st}/>
      <rect x="16" y="-16" width="64" height="56" rx="12" fill="#f4d2b4" ${st}/>
    </g>
  `),
  "score.svg": svg(900, 720, `
    ${g(400, 400, 2.05, person())}
    ${g(200, 450, 1.55, dog())}
    <g transform="translate(700 250)">
      <circle r="58" fill="${C.body}" ${st}/>
      <path d="M-20 6 Q 0 26 20 -8" fill="none" stroke="${C.cream}" stroke-width="8" stroke-linecap="round"/>
    </g>
  `),
  "look.svg": svg(900, 720, `
    ${g(360, 360, 2.2, person())}
    ${g(660, 430, 1.9, dog())}
  `),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(`${OUT}/${name}`, content);
  console.log(name);
}
