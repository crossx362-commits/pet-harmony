import { composeHarmony, computeTest, todayIndex, type FormValues, type HarmonyResult, type TestId } from "./compute.ts";

export const REQUIRED_TESTS: TestId[] = ["saju", "style", "lifestyle"];
export const OPTIONAL_TESTS: TestId[] = ["dogcat", "triangle"];
export const ALL_TESTS: TestId[] = [...REQUIRED_TESTS, ...OPTIONAL_TESTS];

export type TestRecord = {
  status: "idle" | "done" | "skipped";
  input: FormValues;
};

export type AuditionSession = {
  resultId: string;
  tests: Partial<Record<TestId, TestRecord>>;
  shared: FormValues;
  harmony: HarmonyResult | null;
  createdAt: string;
  sample?: boolean;
};

const CURRENT_KEY = "petHarmony:current";
const sessionKey = (id: string) => `petHarmony:session:${id}`;
const resultKey = (id: string) => `petHarmony:${id}`;

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptySession(id: string): AuditionSession {
  return {
    resultId: id,
    tests: {},
    shared: {},
    harmony: null,
    createdAt: new Date().toISOString(),
  };
}

export function demoSession(id = uid()): AuditionSession {
  const sajuInput: FormValues = {
    owner: "1994-05-12",
    species: "강아지",
    pet: "2022-08-03",
    petName: "두부",
  };
  const styleInput: FormValues = { mbtiEnergy: "E", mbtiStyle: "S", mbtiRoutine: "F" };
  const lifeInput: FormValues = { lifeTime: "mid", lifeActivity: "out", lifeRoutine: "steady" };
  const session: AuditionSession = {
    ...emptySession(id),
    sample: true,
    tests: {
      saju: { status: "done", input: sajuInput },
      style: { status: "done", input: styleInput },
      lifestyle: { status: "done", input: lifeInput },
    },
    shared: mergeShared({}, "saju", sajuInput),
  };
  const harmony = composeFromSession(session);
  if (!("error" in harmony)) session.harmony = harmony;
  return session;
}

export function samplePreview(now = new Date()) {
  const harmony = demoSession("sample").harmony;
  const scores = (harmony?.free.scores as { label: string; score: number }[]) || [];
  const d = (harmony?.free.harmonyDetail || { total: 0, petElement: "" }) as { total: number; petElement: string };
  const care = (harmony?.free.carePreview as { name: string; grade: string; teaser?: string }[]) || [];
  return {
    total: d.total,
    oneLiner: String(harmony?.free.oneLiner || ""),
    scores,
    periods: [
      { label: "평생", score: d.total },
      { label: "오늘", score: todayIndex(d.total, d.petElement, now) },
      { label: "이번 달", score: todayIndex(d.total, d.petElement, new Date(now.getFullYear(), now.getMonth(), 1)) },
      { label: "올해", score: todayIndex(d.total, d.petElement, new Date(now.getFullYear(), 0, 1)) },
    ],
    care,
  };
}

export function isDone(session: AuditionSession, id: TestId) {
  return session.tests[id]?.status === "done";
}

export function isSkipped(session: AuditionSession, id: TestId) {
  return session.tests[id]?.status === "skipped";
}

export function requiredCount(session: AuditionSession) {
  return REQUIRED_TESTS.filter((id) => isDone(session, id)).length;
}

export function requiredReady(session: AuditionSession) {
  return requiredCount(session) === REQUIRED_TESTS.length;
}

export function isSampleSession(session: AuditionSession | null | undefined) {
  if (!session) return false;
  if (session.sample) return true;
  const s = session.shared || {};
  return s.owner === "1994-05-12" && s.pet === "2022-08-03" && s.petName === "두부";
}

export function canOpenHarmony(session: AuditionSession | null | undefined) {
  if (!session || isSampleSession(session)) return false;
  return requiredReady(session);
}

export function nextRequired(session: AuditionSession): TestId | null {
  return REQUIRED_TESTS.find((id) => !isDone(session, id)) ?? null;
}

export function mergeShared(shared: FormValues, testId: TestId, input: FormValues): FormValues {
  const next = { ...shared };
  if (testId === "saju") {
    for (const key of ["owner", "ownerTime", "species", "pet", "petTime", "petName"]) {
      if (input[key] !== undefined) next[key] = input[key];
    }
  }
  if (testId === "dogcat") {
    if (input.owner) next.owner = input.owner;
    if (input.ownerTime) next.ownerTime = input.ownerTime;
  }
  if (testId === "triangle") {
    if (input.a) next.owner = next.owner || input.a;
    if (input.aTime) next.ownerTime = next.ownerTime || input.aTime;
    if (input.species !== undefined) next.species = input.species;
    if (input.pet !== undefined) next.pet = input.pet;
    if (input.petTime !== undefined) next.petTime = input.petTime;
    if (input.petName) next.petName = input.petName;
  }
  return next;
}

export function prefill(session: AuditionSession, testId: TestId): FormValues {
  const saved = session.tests[testId]?.input || {};
  const shared = session.shared;
  if (testId === "saju") {
    return {
      owner: saved.owner || shared.owner || "",
      ownerTime: saved.ownerTime || shared.ownerTime || "",
      species: saved.species || shared.species || "",
      pet: saved.pet ?? shared.pet ?? "",
      petTime: saved.petTime || shared.petTime || "",
      petName: saved.petName || shared.petName || "",
    };
  }
  if (testId === "style") {
    return {
      mbtiEnergy: saved.mbtiEnergy || "",
      mbtiStyle: saved.mbtiStyle || "",
      mbtiRoutine: saved.mbtiRoutine || "",
    };
  }
  if (testId === "lifestyle") {
    return {
      lifeTime: saved.lifeTime || "",
      lifeActivity: saved.lifeActivity || "",
      lifeRoutine: saved.lifeRoutine || "",
    };
  }
  if (testId === "dogcat") {
    return {
      owner: saved.owner || shared.owner || "",
      ownerTime: saved.ownerTime || shared.ownerTime || "",
      dog: saved.dog || "",
      cat: saved.cat || "",
    };
  }
  return {
    a: saved.a || shared.owner || "",
    aTime: saved.aTime || shared.ownerTime || "",
    b: saved.b || "",
    bTime: saved.bTime || "",
    species: saved.species || shared.species || "",
    pet: saved.pet ?? shared.pet ?? "",
    petTime: saved.petTime || shared.petTime || "",
    petName: saved.petName || shared.petName || "",
  };
}

function canStore() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadSession(id: string): AuditionSession | null {
  if (!canStore()) return null;
  try {
    const raw = localStorage.getItem(sessionKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuditionSession;
    if (!parsed?.resultId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadCurrentId() {
  if (!canStore()) return "";
  try {
    return localStorage.getItem(CURRENT_KEY) || "";
  } catch {
    return "";
  }
}

export function saveSession(session: AuditionSession) {
  if (!canStore()) return;
  localStorage.setItem(sessionKey(session.resultId), JSON.stringify(session));
  localStorage.setItem(CURRENT_KEY, session.resultId);
  if (session.harmony) {
    localStorage.setItem(resultKey(session.resultId), JSON.stringify(session.harmony));
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId: session.resultId, payload: session.harmony }),
    }).catch(() => {});
  }
}

export function loadResult(id: string): HarmonyResult | null {
  if (!canStore()) return null;
  try {
    return JSON.parse(localStorage.getItem(resultKey(id)) || "null");
  } catch {
    return null;
  }
}

export function saveResultLocal(id: string, data: HarmonyResult) {
  if (!canStore()) return;
  localStorage.setItem(resultKey(id), JSON.stringify(data));
  fetch("/api/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultId: id, payload: data }),
  }).catch(() => {});
}

export async function fetchResult(id: string): Promise<HarmonyResult | null> {
  const res = await fetch(`/api/results?resultId=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const remote = await res.json();
  return (remote.payload || null) as HarmonyResult | null;
}

export function composeFromSession(session: AuditionSession): HarmonyResult | { error: string } {
  const sajuIn = session.tests.saju;
  const styleIn = session.tests.style;
  const lifeIn = session.tests.lifestyle;
  if (sajuIn?.status !== "done" || styleIn?.status !== "done" || lifeIn?.status !== "done") {
    return { error: "아직 못 본 질문이 있어요." };
  }
  const saju = computeTest("saju", sajuIn.input);
  const style = computeTest("style", styleIn.input);
  const lifestyle = computeTest("lifestyle", lifeIn.input);
  if ("error" in saju) return saju;
  if ("error" in style) return style;
  if ("error" in lifestyle) return lifestyle;
  const dogcatIn = session.tests.dogcat;
  const triangleIn = session.tests.triangle;
  const dogcat = dogcatIn?.status === "done" ? computeTest("dogcat", dogcatIn.input) : undefined;
  const triangle = triangleIn?.status === "done" ? computeTest("triangle", triangleIn.input) : undefined;
  if (dogcat && "error" in dogcat) return dogcat;
  if (triangle && "error" in triangle) return triangle;
  return composeHarmony({
    saju,
    style,
    lifestyle,
    dogcat: dogcat && !("error" in dogcat) ? dogcat : undefined,
    triangle: triangle && !("error" in triangle) ? triangle : undefined,
    shared: session.shared,
  });
}
