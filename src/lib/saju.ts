function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

const ELEMENTS = [
  { el: "木 (나무)", key: "목", desc: "성장과 활력이 넘치는 따뜻한 봄의 기운" },
  { el: "火 (불)", key: "화", desc: "열정과 밝은 에너지가 솟구치는 여름의 기운" },
  { el: "土 (흙)", key: "토", desc: "모든 것을 포용하고 안정적인 중재자의 기운" },
  { el: "金 (쇠)", key: "금", desc: "단단하고 결단력 있는 가을의 기운" },
  { el: "水 (물)", key: "수", desc: "지혜롭고 유연하게 흘러가는 겨울의 기운" },
];

const PET_READINGS = [
  "타고난 식복과 애교로 어디서든 사랑받을 팔자입니다. 가끔 고집을 부릴 땐 간식 하나로 회유하는 것이 직빵입니다.",
  "두뇌 회전이 빠르고 호기심이 왕성합니다. 새로운 냄새를 맡고 돌아다녀야 직성이 풀리는 아이입니다.",
  "보호자에 대한 충성심과 애착이 남다릅니다. 가족이 우울해하면 가장 먼저 다가와 위로해주는 속 깊은 친구입니다.",
  "매우 예민하고 섬세한 영혼입니다. 큰 소리나 급격한 환경 변화를 싫어하며 포근한 보금자리를 좋아합니다.",
  "독립심이 강하고 자기주장이 확실한 편입니다. 프라이드를 존중해주면 최고의 관계가 됩니다.",
];

const OWNER_READINGS = [
  "동물을 사랑하는 마음이 깊어 펫에게 조건 없이 헌신하는 따뜻한 보호자 성향입니다.",
  "친구처럼 티격태격하며 지내는 수평적인 관계를 추구합니다. 함께 나가면 운도 트입니다.",
  "꼼꼼하고 세심해 작은 변화도 금방 알아챕니다. 식단과 루틴 관리에 재능이 있습니다.",
  "감수성이 풍부하여 눈빛만으로도 무엇을 원하는지 알아챕니다.",
  "밝고 긍정적인 에너지로 집안에 웃음을 전합니다.",
];

function compatTitle(score: number) {
  if (score >= 90) return "수어지교(水魚之交)";
  if (score >= 80) return "금상첨화(錦上添花)";
  if (score >= 70) return "유유상종(類類相從)";
  return "동상이몽(同床異夢)";
}

export type SajuPair = ReturnType<typeof analyzePair>;

export function analyzePair(petBirth: string, ownerBirth: string, petTime = "", ownerTime = "") {
  const petHash = hashString(String(petBirth) + String(petTime || ""));
  const ownerHash = hashString(String(ownerBirth) + String(ownerTime || ""));
  const petElement = ELEMENTS[petHash % 5];
  const ownerElement = ELEMENTS[ownerHash % 5];
  const compatScore = 50 + ((petHash + ownerHash) % 51);
  return {
    petBirth,
    ownerBirth,
    petSummary: `${petElement.el}의 기운을 가진 펫`,
    petDesc: `[${petElement.desc}]\n\n${PET_READINGS[petHash % 5]}`,
    ownerSummary: `${ownerElement.el}의 기운을 가진 집사`,
    ownerDesc: `[${ownerElement.desc}]\n\n${OWNER_READINGS[ownerHash % 5]}`,
    compatScore,
    compatTitle: compatTitle(compatScore),
    pastDesc: compatScore >= 90 ? "전생에 함께 강을 건넜던 깊은 동반자적 인연입니다." : "전생에 서로 소중히 여겼던 이웃이었습니다.",
    synergyDesc: compatScore >= 90 ? "서로의 기운을 보완하며 함께 있을 때 큰 행운이 따릅니다." : "서로를 이해하고 천천히 맞춰가면 아주 좋은 흐름이 생깁니다.",
  };
}
