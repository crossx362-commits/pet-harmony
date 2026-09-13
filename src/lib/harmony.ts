const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEM_EL = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const BRANCH_EL: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
const MONTH_BRANCH = ["축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자"];
const SHENG: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const KE: Record<string, string> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };
const ELS = ["목", "화", "토", "금", "수"] as const;

export type ElementVec = { 목: number; 화: number; 토: number; 금: number; 수: number };
export type Elements = { vec: ElementVec; list: string[]; dominant: string };

function yearPillar(y: number) {
  const s = ((y - 4) % 10 + 10) % 10;
  const b = ((y - 4) % 12 + 12) % 12;
  return { stem: STEMS[s], branch: BRANCHES[b], stemEl: STEM_EL[s], branchEl: BRANCH_EL[BRANCHES[b]] };
}

function dayPillar(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const jdn = Math.floor(d.getTime() / 86400000) + 2440588;
  const idx = ((jdn + 49) % 60 + 60) % 60;
  const s = idx % 10;
  const b = idx % 12;
  return { stem: STEMS[s], branch: BRANCHES[b], stemEl: STEM_EL[s], branchEl: BRANCH_EL[BRANCHES[b]] };
}

function parseISO(iso: string) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) throw new Error("invalid_birth");
  return { y, m, d, date: new Date(Date.UTC(y, m - 1, d)) };
}

export function elementsOf(birthISO: string): Elements {
  const { y, m, date } = parseISO(birthISO);
  const yp = yearPillar(y);
  const mb = MONTH_BRANCH[m - 1];
  const dp = dayPillar(date);
  const list = [yp.stemEl, yp.branchEl, BRANCH_EL[mb], dp.stemEl, dp.branchEl];
  const vec: ElementVec = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  list.forEach((e) => {
    vec[e as keyof ElementVec] += 1;
  });
  const dominant = ELS.reduce((best, e) => (vec[e] > vec[best] ? e : best), "목");
  return { vec, list, dominant };
}

function rel(a: string, b: string) {
  if (a === b) return "same";
  if (SHENG[a] === b || SHENG[b] === a) return "sheng";
  if (KE[a] === b || KE[b] === a) return "ke";
  return "neutral";
}

const REL_TEXT = {
  상생: (p: string, o: string) =>
    `${p} 기운의 펫과 ${o} 기운의 집사 — 서로를 살려주는 상생 조화예요. 함께할수록 기운이 자라나요!`,
  상극: (p: string, o: string) =>
    `${p} 기운의 펫과 ${o} 기운의 집사 — 부딪히기 쉬운 상극이지만, 그만큼 서로를 단련시키는 관계예요.`,
  동일: (p: string) =>
    `둘 다 ${p} 기운 — 닮은꼴 영혼이라 말하지 않아도 통해요. 다만 같은 데서 지치니 환기가 필요해요.`,
  중립: (p: string, o: string) =>
    `${p} 기운의 펫과 ${o} 기운의 집사 — 서로의 영역을 존중하는 담백한 조화예요.`,
};

export function harmony(petISO: string, ownerISO: string) {
  const pet = elementsOf(petISO);
  const owner = elementsOf(ownerISO);
  let sheng = 0;
  let ke = 0;
  let same = 0;
  for (const a of pet.list)
    for (const b of owner.list) {
      const r = rel(a, b);
      if (r === "sheng") sheng++;
      else if (r === "ke") ke++;
      else if (r === "same") same++;
    }
  const n = pet.list.length * owner.list.length;
  const score = Math.round(Math.max(5, Math.min(99, 50 + (sheng / n) * 40 - (ke / n) * 25 + (same / n) * 10)));
  const rd = rel(pet.dominant, owner.dominant);
  const type = rd === "sheng" ? "상생" : rd === "ke" ? "상극" : rd === "same" ? "동일" : "중립";
  const text = type === "동일" ? REL_TEXT.동일(pet.dominant) : REL_TEXT[type](pet.dominant, owner.dominant);
  return { score, pet, owner, relation: { type, text } };
}

const AREAS = [
  { key: "play", name: "놀이", emoji: "🎾", element: "화" },
  { key: "meal", name: "식사", emoji: "🍚", element: "토" },
  { key: "walk", name: "산책", emoji: "🐾", element: "목" },
  { key: "rest", name: "휴식", emoji: "💤", element: "수" },
] as const;

const TIPS: Record<string, Record<string, string>> = {
  play: { 최고: "놀이 조화도 만점! 새 장난감이 최고의 선물이에요", 좋음: "짧고 굵은 놀이가 잘 맞아요. 하루 2번 10분씩!", 보통: "펫이 좋아하는 놀이 하나를 정해 루틴으로 만들어보세요", 노력: "놀이 전 간식으로 텐션을 올려주면 훨씬 잘 놀아요", 주의: "과격한 놀이보다 노즈워크 같은 차분한 놀이가 길해요" },
  meal: { 최고: "먹복이 타고났어요. 규칙적인 식사가 건강운을 지켜줘요", 좋음: "식사 시간을 일정하게 — 토(土) 기운은 규칙에서 자라요", 보통: "간식보다 주식에 정성을. 식기를 깨끗이 하면 운이 트여요", 노력: "급하게 먹는 습관 주의 — 슬로우 식기를 써보세요", 주의: "소화가 약할 수 있어요. 소량씩 나눠 급여하는 게 좋아요" },
  walk: { 최고: "산책이 곧 보약! 새로운 길을 함께 개척해보세요", 좋음: "아침 산책이 특히 길해요 — 목(木) 기운이 아침에 자라요", 보통: "매일 같은 시간 산책이 둘의 리듬을 맞춰줘요", 노력: "산책 거리보다 냄새 맡을 시간을 충분히 주세요", 주의: "무리한 장거리보다 짧은 산책 여러 번이 좋아요" },
  rest: { 최고: "함께 쉬기만 해도 충전되는 사이! 낮잠 메이트네요", 좋음: "조용한 휴식 공간을 만들어주면 애착이 깊어져요", 보통: "휴식 중엔 건드리지 않기 — 수(水) 기운은 고요에서 회복돼요", 노력: "잠자리를 어둡고 아늑하게 바꿔보세요", 주의: "수면이 예민할 수 있어요. 소음을 줄여주는 게 우선이에요" },
};

function grade(s: number) {
  return s >= 85 ? "최고" : s >= 70 ? "좋음" : s >= 55 ? "보통" : s >= 40 ? "노력" : "주의";
}

export function areas(petISO: string, ownerISO: string) {
  const h = harmony(petISO, ownerISO);
  return AREAS.map((a) => {
    const strength = (h.pet.vec[a.element as keyof ElementVec] + h.owner.vec[a.element as keyof ElementVec]) / 10;
    const bonus = SHENG[h.pet.dominant] === a.element || SHENG[h.owner.dominant] === a.element ? 10 : 0;
    const score = Math.round(Math.max(5, Math.min(99, h.score * 0.5 + strength * 40 + bonus)));
    const g = grade(score);
    return { ...a, score, grade: g, tip: TIPS[a.key][g] };
  });
}

export function todayIndex(harmonyScore: number, petDominant: string, date?: Date) {
  const d = date || new Date();
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const el = dayPillar(utc).stemEl;
  const r = rel(el, petDominant);
  const adj = r === "sheng" ? 15 : r === "ke" ? -15 : 0;
  return Math.round(Math.max(5, Math.min(99, (harmonyScore || 60) + adj)));
}

export function analyze(petISO: string, ownerISO: string) {
  const h = harmony(petISO, ownerISO);
  return {
    score: h.score,
    elements: { pet: h.pet, owner: h.owner },
    relation: h.relation,
    areas: areas(petISO, ownerISO),
  };
}
