const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEM_EL = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const BRANCH_EL: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
const MONTH_BRANCH = ["축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자"];
export const SHENG_CHAIN = ["목", "화", "토", "금", "수"] as const;
export const SHENG_LABEL = "목이 화를 살리고 · 화가 토를 만들고 · 토가 금을 낳고 · 금이 수를 모으고 · 수가 목을 키워요";
export const KE_LABEL = "목이 토를 가르고 · 토가 수를 가두고 · 수가 화를 끄고 · 화가 금을 녹이고 · 금이 목을 베어요";
export const ELEMENT_HEALTH: Record<(typeof SHENG_CHAIN)[number], { name: string; organ: string; body: string; season: string; pet: string; owner: string; care: string }> = {
  목: { name: "나무", organ: "간", body: "힘줄·눈·관절", season: "봄", care: "산책", pet: "스트레칭과 짧은 산책이 관절·눈을 풀어 줘요.", owner: "너무 밀어붙이면 힘줄이 긴장해요. 냄새 맡을 틈을 주세요." },
  화: { name: "불", organ: "심장", body: "혀·순환", season: "여름", care: "놀이", pet: "흥분이 빨리 올라요. 놀이 길이와 식히기가 심장 리듬이에요.", owner: "텐션을 같이 올리면 둘 다 과열돼요. 끝낼 때를 정해 주세요." },
  토: { name: "흙", organ: "위", body: "입·근육·소화", season: "환절기", care: "식사", pet: "밥 시간과 소화가 중심이에요. 급하게 먹이면 위가 바빠져요.", owner: "챙김이 과하면 위를 조여요. 슬로우 식기가 도움이 돼요." },
  금: { name: "쇠", organ: "폐", body: "코·피부·털", season: "가을", care: "숨·털", pet: "호흡·콧구멍·털 윤기가 쇠 기운과 맞닿아요. 환기와 빗질이 약이에요.", owner: "건조한 집·강한 향은 폐를 자극해요. 보습과 환기를 먼저." },
  수: { name: "물", organ: "신장", body: "뼈·귀·수분", season: "겨울", care: "휴식", pet: "잠·물·조용한 구석이 물 기운을 지켜요. 소음에 귀가 예민할 수 있어요.", owner: "일정을 꽉 채우면 물이 말라요. 낮잠 메이트가 되어 주세요." },
};

export function healthNote(pet: string, owner: string) {
  const p = ELEMENT_HEALTH[pet as keyof typeof ELEMENT_HEALTH];
  const o = ELEMENT_HEALTH[owner as keyof typeof ELEMENT_HEALTH];
  const pair = explainElements(pet, owner);
  if (!p || !o) return { pet: "", owner: "", pair: "" };
  const pairLine =
    pair.kind === "상극"
      ? `${o.care}를 너무 조이면 ${p.care}가 막혀요. ${p.care}를 먼저 풀어 주세요.`
      : pair.kind === "상생"
        ? `${o.care}가 ${p.care}를 살리는 흐름이에요. 둘을 같은 리듬으로 맞춰 보세요.`
        : pair.kind === "동일"
          ? `같은 ${p.name}이라 ${p.care}만 반복하면 지쳐요. 다른 기운의 돌봄도 끼워 주세요.`
          : `${p.care}와 ${o.care}를 서로 존중하면 몸이 편해져요.`;
  return {
    pet: `펫 ${pet}(${p.name}) · ${p.organ}·${p.body} · ${p.pet}`,
    owner: `나 ${owner}(${o.name}) · ${o.organ}·${o.body} · ${o.owner}`,
    pair: pairLine,
  };
}
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

const SHENG_WHY: Record<string, string> = {
  목화: "나무가 불을 살립니다",
  화토: "불이 타서 흙이 됩니다",
  토금: "흙 속에서 쇠가 납니다",
  금수: "쇠 표면에 이슬이 맺힙니다",
  수목: "물이 나무를 키웁니다",
};
const KE_WHY: Record<string, string> = {
  목토: "나무가 흙을 가르고 뿌리를 내립니다",
  토수: "흙이 물을 가둡니다",
  수화: "물이 불을 끕니다",
  화금: "불이 쇠를 녹입니다",
  금목: "쇠가 나무를 벱니다",
};

export type WuxingNote = {
  kind: "상생" | "상극" | "동일" | "중립";
  from: string;
  to: string;
  why: string;
  line: string;
  how: string;
};

function particle(el: string) {
  return el === "목" || el === "금" ? { i: "이", eul: "을" } : { i: "가", eul: "를" };
}

export function explainElements(pet: string, owner: string): WuxingNote {
  if (!pet || !owner) return { kind: "중립", from: pet, to: owner, why: "", line: "오행을 아직 충분히 보지 못했어요.", how: "" };
  const pp = particle(pet);
  const op = particle(owner);
  if (pet === owner) {
    return {
      kind: "동일",
      from: pet,
      to: owner,
      why: `둘 다 ${pet} 기운`,
      line: `같은 ${pet}이라 말하지 않아도 잘 통해요.`,
      how: "닮은 리듬은 편하지만 같은 데서 지칠 수 있어요. 산책·놀이로 환기하면 좋아요.",
    };
  }
  if (SHENG[pet] === owner) {
    return {
      kind: "상생",
      from: pet,
      to: owner,
      why: SHENG_WHY[pet + owner],
      line: `펫의 ${pet}${pp.i} 나의 ${owner}${op.eul} 살려 주는 상생이에요.`,
      how: `${SHENG_WHY[pet + owner]}. 함께 있을수록 기운이 자라요.`,
    };
  }
  if (SHENG[owner] === pet) {
    return {
      kind: "상생",
      from: owner,
      to: pet,
      why: SHENG_WHY[owner + pet],
      line: `나의 ${owner}${op.i} 펫의 ${pet}${pp.eul} 키워 주는 상생이에요.`,
      how: `${SHENG_WHY[owner + pet]}. 루틴을 맞춰 주면 더 잘 자랍니다.`,
    };
  }
  if (KE[pet] === owner) {
    return {
      kind: "상극",
      from: pet,
      to: owner,
      why: KE_WHY[pet + owner],
      line: `펫의 ${pet}${pp.i} 나의 ${owner}${op.eul} 누르는 상극이에요.`,
      how: `${KE_WHY[pet + owner]}. 부딪히기 쉬우니 짧은 놀이로 먼저 풀어 주세요.`,
    };
  }
  if (KE[owner] === pet) {
    return {
      kind: "상극",
      from: owner,
      to: pet,
      why: KE_WHY[owner + pet],
      line: `나의 ${owner}${op.i} 펫의 ${pet}${pp.eul} 누르는 상극이에요.`,
      how: `${KE_WHY[owner + pet]}. 담을 쌓기보다 산책·냄새 맡을 시간을 먼저 주세요.`,
    };
  }
  return {
    kind: "중립",
    from: pet,
    to: owner,
    why: "직접 상생·상극이 아님",
    line: `${pet}과 ${owner}는 옆에서 균형을 맞추는 사이예요.`,
    how: "서로를 바꾸려 하기보다 각자 영역을 존중하면 편해요.",
  };
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
  return { score, pet, owner, relation: { type, text, note: explainElements(pet.dominant, owner.dominant) } };
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
