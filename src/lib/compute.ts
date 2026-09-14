import { analyze, harmony, todayIndex } from "./harmony.ts";
import { analyzePair } from "./saju.ts";
import { parseRequiredBirth, resolvePetBirth, resolveTime } from "./dates.ts";

export type Mode = "overall" | "mbti" | "adopt" | "dogcat" | "triangle" | "lifestyle";
export type TestId = "saju" | "style" | "lifestyle" | "dogcat" | "triangle";

export type FormValues = Record<string, string>;

const MBTI_KEYS = ["mbtiEnergy", "mbtiStyle", "mbtiRoutine"] as const;
const LIFESTYLE_QUESTIONS = [
  { key: "lifeTime", weights: { high: 88, mid: 68, low: 48 } },
  { key: "lifeActivity", weights: { out: 76, home: 64, mix: 70 } },
  { key: "lifeRoutine", weights: { steady: 84, flex: 68, learn: 58 } },
] as const;

function deriveMbti(values: FormValues) {
  const letters = MBTI_KEYS.map((k) => values[k]).filter(Boolean);
  return letters.length ? letters.join(" · ") : "";
}

function nameWithMe(name: string) {
  const ch = [...name].pop() || "";
  const code = ch.charCodeAt(0);
  const batchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return batchim ? `${name}과 나` : `${name}와 나`;
}

export type HarmonyResult = {
  id?: string;
  mode: Mode;
  title: string;
  free: Record<string, unknown>;
  paid: Record<string, unknown> | null;
  unlocked?: boolean;
  pdfPaid?: boolean;
  photoData?: string;
  createdAt?: string;
};

export function compute(mode: Mode, values: FormValues): HarmonyResult | { error: string } {
  if (mode === "mbti") {
    const hint = deriveMbti(values);
    if (!hint || hint.split(" · ").length < 3) return { error: "세 문항에 모두 답해 주세요." };
    return {
      mode,
      title: "내 보호자 스타일",
      free: {
        headline: `나는 ${hint} 성향의 보호자`,
        scores: [
          { label: "에너지", score: values.mbtiEnergy === "E" ? 78 : 42 },
          { label: "문제 해결", score: values.mbtiStyle === "N" ? 76 : 48 },
          { label: "루틴 방식", score: values.mbtiRoutine === "F" ? 72 : 54 },
        ],
        summary: "펫과 함께 살 때 드러나는 모습을 가볍게 정리해봤어요.",
        sajuTeaser: "정답이라기보다, 나와 펫의 생활 방식을 돌아보는 작은 힌트예요.",
        ownerMbti: hint,
      },
      paid: null,
    };
  }

  if (mode === "overall") {
    const owner = parseRequiredBirth(values.owner, "내 생일");
    if (!owner.ok) return { error: owner.error };
    const pet = resolvePetBirth(values.pet, values.species);
    if (!pet.ok) return { error: pet.error };
    const allQuestions = [...MBTI_KEYS, ...LIFESTYLE_QUESTIONS.map((q) => q.key)];
    const missing = allQuestions.find((k) => !values[k]);
    if (missing) return { error: "모든 질문에 답해 주세요." };
    const analysis = analyze(pet.birth.iso, owner.iso);
    const petTime = resolveTime(values.petTime, !pet.birth.estimated);
    const ownerTime = resolveTime(values.ownerTime, true);
    const saju = analyzePair(pet.birth.iso, owner.iso, petTime, ownerTime);
    const lifestyleScores = LIFESTYLE_QUESTIONS.map((q) => (q.weights as Record<string, number>)[values[q.key]] || 60);
    const lifeScore = Math.round(lifestyleScores.reduce((s, n) => s + n, 0) / lifestyleScores.length);
    const total = Math.round((analysis.score + saju.compatScore + lifeScore) / 3);
    const speciesLabel = pet.birth.species === "cat" ? "고양이" : "강아지";
    const hint = deriveMbti(values);
    return {
      mode,
      title: "우리의 새 가족 종합 결과",
      free: {
        headline: `${values.petName ? nameWithMe(values.petName) : "우리 펫과 나"}, 어울림 ${total}점`,
        scores: [
          { label: "생일 기반 케미", score: analysis.score },
          { label: "사주 케미", score: saju.compatScore },
          { label: "생활 준비도", score: lifeScore },
        ],
        summary: `${pet.birth.estimated ? `${speciesLabel} 기본 성향으로 계산했어요 · ` : ""}세 가지 결과를 한 번에 모아봤어요.`,
        sajuTeaser: hint ? `보호자 스타일: ${hint}` : "",
        ownerMbti: hint,
        elements: analysis.elements,
        relationType: analysis.relation.type,
        estimatedSpecies: pet.birth.estimated ? pet.birth.species : null,
        harmonyDetail: {
          total,
          lifeScore,
          relationText: analysis.relation.text,
          petElement: analysis.elements.pet.dominant,
          ownerElement: analysis.elements.owner.dominant,
          hasPetBirth: !pet.birth.estimated,
        },
      },
      paid: { relation: analysis.relation, areas: analysis.areas, elements: analysis.elements, saju },
    };
  }

  if (mode === "adopt") {
    const owner = parseRequiredBirth(values.owner, "내 생일");
    if (!owner.ok) return { error: owner.error };
    const pet = resolvePetBirth(values.pet, values.species);
    if (!pet.ok) return { error: pet.error };
    const petTime = resolveTime(values.petTime, !pet.birth.estimated);
    const ownerTime = resolveTime(values.ownerTime, true);
    const analysis = analyze(pet.birth.iso, owner.iso);
    const saju = analyzePair(pet.birth.iso, owner.iso, petTime, ownerTime);
    const speciesLabel = pet.birth.species === "cat" ? "고양이" : "강아지";
    return {
      mode,
      title: "우리 집에 와도 괜찮을까?",
      free: {
        headline: `${values.petName || "우리의 작은 친구"}와 함께할 점수`,
        scores: [
          { label: "명리 조화도", score: analysis.score },
          { label: "사주 케미", score: saju.compatScore },
        ],
        summary: `${pet.birth.estimated ? `${speciesLabel} 생일 없이 ${speciesLabel} 기본 성향으로 계산했어요 · ` : ""}${saju.compatTitle} · ${analysis.relation.text}`,
        sajuTeaser: `${saju.petSummary} / ${saju.ownerSummary}`,
        ownerMbti: deriveMbti(values),
        elements: analysis.elements,
        relationType: analysis.relation.type,
        estimatedSpecies: pet.birth.estimated ? pet.birth.species : null,
      },
      paid: { relation: analysis.relation, areas: analysis.areas, elements: analysis.elements, saju },
    };
  }

  if (mode === "dogcat") {
    const owner = parseRequiredBirth(values.owner, "내 생일");
    if (!owner.ok) return { error: owner.error };
    const dog = resolvePetBirth(values.dog, "강아지");
    const cat = resolvePetBirth(values.cat, "고양이");
    if (!dog.ok) return { error: dog.error };
    if (!cat.ok) return { error: cat.error };
    const ownerTime = resolveTime(values.ownerTime, true);
    const dogA = analyze(dog.birth.iso, owner.iso);
    const catA = analyze(cat.birth.iso, owner.iso);
    const dogSaju = analyzePair(dog.birth.iso, owner.iso, "", ownerTime);
    const catSaju = analyzePair(cat.birth.iso, owner.iso, "", ownerTime);
    const dogBlend = Math.round((dogA.score + dogSaju.compatScore) / 2);
    const catBlend = Math.round((catA.score + catSaju.compatScore) / 2);
    const recommend = dogBlend >= catBlend ? "강아지" : "고양이";
    return {
      mode,
      title: "강아지랑 고양이, 누가 더 찰떡?",
      free: {
        headline: "나와 더 맞는 쪽",
        scores: [
          { label: "나 ↔ 강아지", score: dogBlend, note: dog.birth.estimated ? "추정" : "" },
          { label: "나 ↔ 고양이", score: catBlend, note: cat.birth.estimated ? "추정" : "" },
        ],
        summary: `추천: ${recommend} · ${(recommend === "강아지" ? dogSaju : catSaju).compatTitle}`,
        sajuTeaser:
          recommend === "강아지"
            ? `${dogSaju.petSummary} / ${dogSaju.ownerSummary}`
            : `${catSaju.petSummary} / ${catSaju.ownerSummary}`,
        recommend,
        ownerMbti: deriveMbti(values),
      },
      paid: {
        dog: dogA,
        cat: catA,
        dogSaju,
        catSaju,
        recommend,
        areasWinner: recommend === "강아지" ? dogA.areas : catA.areas,
        saju: recommend === "강아지" ? dogSaju : catSaju,
      },
    };
  }

  if (mode === "lifestyle") {
    const missing = LIFESTYLE_QUESTIONS.find((q) => !values[q.key]);
    if (missing) return { error: "세 문항에 모두 답해 주세요." };
    const lifestyleScores = LIFESTYLE_QUESTIONS.map((q) => (q.weights as Record<string, number>)[values[q.key]] || 60);
    const lifeScore = Math.round(lifestyleScores.reduce((s, n) => s + n, 0) / lifestyleScores.length);
    const labels = ["함께하는 시간", "활동", "루틴"];
    return {
      mode,
      title: "우리 집 생활 준비",
      free: {
        headline: `생활 준비 ${lifeScore}점`,
        scores: LIFESTYLE_QUESTIONS.map((q, i) => ({ label: labels[i], score: lifestyleScores[i] })),
        summary: "시간·활동·루틴이 새 가족과 얼마나 잘 맞는지 살펴봤어요.",
        sajuTeaser: "이 점수는 나중에 조화도에서 이어져요.",
        harmonyDetail: { lifeScore },
      },
      paid: null,
    };
  }

  if (mode !== "triangle") return { error: "알 수 없는 질문이에요." };

  const a = parseRequiredBirth(values.a, "첫 번째 사람 생일");
  const b = parseRequiredBirth(values.b, "두 번째 사람 생일");
  if (!a.ok) return { error: a.error };
  if (!b.ok) return { error: b.error };
  const pet = resolvePetBirth(values.pet, values.species);
  if (!pet.ok) return { error: pet.error };
  const petTime = resolveTime(values.petTime, !pet.birth.estimated);
  const aTime = resolveTime(values.aTime, true);
  const bTime = resolveTime(values.bTime, true);
  const ab = harmony(a.iso, b.iso);
  const aPet = analyze(pet.birth.iso, a.iso);
  const bPet = analyze(pet.birth.iso, b.iso);
  const aSaju = analyzePair(pet.birth.iso, a.iso, petTime, aTime);
  const bSaju = analyzePair(pet.birth.iso, b.iso, petTime, bTime);
  const abSaju = analyzePair(a.iso, b.iso, aTime, bTime);
  const edgeScores = [
    { label: "A ↔ B", score: Math.round((ab.score + abSaju.compatScore) / 2) },
    { label: "A ↔ 펫", score: Math.round((aPet.score + aSaju.compatScore) / 2) },
    { label: "B ↔ 펫", score: Math.round((bPet.score + bSaju.compatScore) / 2) },
  ];
  const total = Math.round(edgeScores.reduce((s, e) => s + e.score, 0) / 3);
  const weakest = edgeScores.reduce((w, e) => (e.score < w.score ? e : w), edgeScores[0]);
  const speciesLabel = pet.birth.species === "cat" ? "고양이" : "강아지";
  return {
    mode: "triangle",
    title: "둘 사이에 펫까지 오면?",
    free: {
      headline: `${values.petName || "우리 펫"}과 함께하는 세 식구 점수`,
      scores: edgeScores.concat([{ label: "총점", score: total }]),
      summary: `${pet.birth.estimated ? `${speciesLabel} 기본 성향으로 추정했어요 · ` : ""}가장 약한 변: ${weakest.label} (${weakest.score}점)`,
      sajuTeaser: `${aSaju.petSummary} · A: ${aSaju.ownerSummary.replace("집사", "A")} · B: ${bSaju.ownerSummary.replace("집사", "B")}`,
      edges: edgeScores,
      weakest,
      total,
      estimatedSpecies: pet.birth.estimated ? pet.birth.species : null,
      ownerMbti: deriveMbti(values),
    },
    paid: { edges: edgeScores, weakest, aPet, bPet, ab, aSaju, bSaju, abSaju, areas: aPet.areas, saju: aSaju },
  };
}

export function publicResult(data: HarmonyResult, unlocks: { tips: boolean; pdf: boolean }): HarmonyResult {
  const copy: HarmonyResult = {
    ...data,
    unlocked: unlocks.tips,
    pdfPaid: unlocks.pdf,
    paid: unlocks.tips ? data.paid : null,
  };
  return copy;
}

const TEST_MODE: Record<TestId, Mode> = {
  saju: "adopt",
  style: "mbti",
  lifestyle: "lifestyle",
  dogcat: "dogcat",
  triangle: "triangle",
};

export function computeTest(id: TestId, values: FormValues) {
  return compute(TEST_MODE[id], values);
}

export function scoreOf(result: HarmonyResult) {
  const scores = (result.free.scores as { label: string; score: number }[]) || [];
  if (!scores.length) return 0;
  if (result.mode === "triangle") {
    const total = scores.find((s) => s.label === "총점");
    if (total) return total.score;
  }
  return Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
}

const CARE_TEASER: Record<string, string> = {
  놀이: "놀이 리듬을 어떻게 맞출지",
  식사: "밥 시간과 간식을 어떻게 맞출지",
  산책: "산책 길이와 횟수를 어떻게 맞출지",
  휴식: "잠자리와 소음을 어떻게 맞출지",
};

export type HarmonyParts = {
  saju: HarmonyResult;
  style: HarmonyResult;
  lifestyle: HarmonyResult;
  dogcat?: HarmonyResult;
  triangle?: HarmonyResult;
  shared?: FormValues;
};

export function composeHarmony(parts: HarmonyParts): HarmonyResult {
  const sajuScore = scoreOf(parts.saju);
  const styleScore = scoreOf(parts.style);
  const lifeScore = scoreOf(parts.lifestyle);
  const base = Math.round((sajuScore * 0.4 + lifeScore * 0.3 + styleScore * 0.2) / 0.9);
  const bonus = (parts.dogcat ? 5 : 0) + (parts.triangle ? 5 : 0);
  const total = Math.max(5, Math.min(99, base + bonus));
  const badges: string[] = [];
  if (parts.dogcat) badges.push("강아지·고양이 비교 반영");
  if (parts.triangle) badges.push("세 식구 반영");
  const shared = parts.shared || {};
  const petName = shared.petName || "";
  const sajuPaid = (parts.saju.paid || {}) as Record<string, unknown>;
  const relation = (sajuPaid.relation || {}) as { text?: string };
  const elements = (sajuPaid.elements || parts.saju.free.elements) as
    | { pet?: { dominant?: string }; owner?: { dominant?: string } }
    | undefined;
  const hint = String(parts.style.free.ownerMbti || "");
  const rawAreas = (sajuPaid.areas as { name?: string; grade?: string; score?: number; tip?: string }[] | undefined) || [];
  const carePreview = rawAreas.map((a) => ({
    name: String(a.name || ""),
    grade: String(a.grade || ""),
    score: Number(a.score || 0),
    teaser: CARE_TEASER[String(a.name || "")] || "이 집에서 맞추는 법",
  }));
  const oneLiner =
    total >= 80 ? "우리 집과 아주 잘 맞을 가능성이 높아요." : total >= 60 ? "조금만 맞춰가면 좋은 팀이 될 수 있어요." : "생활 루틴을 먼저 천천히 맞춰보면 좋아요.";
  return {
    mode: "overall",
    title: "우리 집 조화도",
    free: {
      headline: `${petName ? nameWithMe(petName) : "우리 펫과 나"}, 조화도 ${total}점`,
      oneLiner,
      scores: [
        { label: "사주 케미", score: sajuScore },
        { label: "생활 준비", score: lifeScore },
        { label: "보호자 스타일", score: styleScore },
      ],
      summary: "사주 40 · 생활 30 · 스타일 20을 이은 우리 집 조화도예요. 사주는 재미 해석이에요.",
      sajuTeaser: hint ? `보호자 스타일: ${hint}` : String(parts.saju.free.sajuTeaser || ""),
      ownerMbti: hint,
      elements: parts.saju.free.elements,
      relationType: parts.saju.free.relationType,
      estimatedSpecies: parts.saju.free.estimatedSpecies,
      badges,
      carePreview,
      harmonyDetail: {
        total,
        base,
        bonus,
        lifeScore,
        relationText: relation.text || String(parts.saju.free.summary || ""),
        petElement: elements?.pet?.dominant || "",
        ownerElement: elements?.owner?.dominant || "",
        hasPetBirth: !parts.saju.free.estimatedSpecies,
      },
    },
    paid: {
      ...sajuPaid,
      lifestyle: parts.lifestyle.free,
      style: parts.style.free,
      badges,
      dogcat: parts.dogcat?.free || null,
      triangle: parts.triangle?.free || null,
    },
  };
}

export { todayIndex };
