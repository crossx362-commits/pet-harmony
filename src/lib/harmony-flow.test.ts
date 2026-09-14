import assert from "node:assert/strict";
import test from "node:test";
import { composeHarmony, compute, computeTest, scoreOf } from "./compute.ts";
import { ELEMENT_HEALTH, explainElements, healthNote } from "./harmony.ts";
import { canOpenHarmony, demoSession, emptySession, isSampleSession, isSkipped, mergeShared, nextRequired, requiredReady, samplePreview, type AuditionSession } from "./session.ts";

const sajuIn = { owner: "1990-01-01", species: "고양이", pet: "" };
const styleIn = { mbtiEnergy: "E", mbtiStyle: "N", mbtiRoutine: "F" };
const lifeIn = { lifeTime: "mid", lifeActivity: "mix", lifeRoutine: "steady" };

test("lifestyle is a standalone test", () => {
  const r = compute("lifestyle", lifeIn);
  if ("error" in r) throw new Error(r.error);
  assert.equal(r.mode, "lifestyle");
  assert.ok(scoreOf(r) >= 5 && scoreOf(r) <= 99);
});

test("computeTest maps saju to adopt", () => {
  const r = computeTest("saju", sajuIn);
  if ("error" in r) throw new Error(r.error);
  assert.equal(r.mode, "adopt");
});

test("composeHarmony weights required tests and optional bonuses", () => {
  const saju = computeTest("saju", sajuIn);
  const style = computeTest("style", styleIn);
  const lifestyle = computeTest("lifestyle", lifeIn);
  const dogcat = computeTest("dogcat", { owner: "1990-01-01" });
  const triangle = computeTest("triangle", { a: "1990-01-01", b: "1992-02-02", species: "고양이" });
  if ("error" in saju || "error" in style || "error" in lifestyle) throw new Error("required failed");
  if ("error" in dogcat || "error" in triangle) throw new Error("optional failed");
  const base = composeHarmony({ saju, style, lifestyle, shared: { petName: "두부" } });
  const withBonus = composeHarmony({ saju, style, lifestyle, dogcat, triangle, shared: { petName: "두부" } });
  const baseTotal = (base.free.harmonyDetail as { total: number; bonus: number }).total;
  const bonusTotal = (withBonus.free.harmonyDetail as { total: number; bonus: number }).total;
  assert.equal((base.free.harmonyDetail as { bonus: number }).bonus, 0);
  assert.equal((withBonus.free.harmonyDetail as { bonus: number }).bonus, 10);
  assert.equal(bonusTotal, Math.min(99, baseTotal + 10));
  assert.match(String(base.free.headline), /두부/);
  assert.deepEqual(withBonus.free.badges, ["강아지·고양이 비교 반영", "세 식구 반영"]);
  const preview = base.free.carePreview as { name: string; grade: string; teaser?: string; tip?: string }[];
  assert.ok(preview.length >= 4);
  assert.ok(preview.every((a) => a.name && a.grade && a.teaser && !a.tip));
  assert.ok(String(base.free.oneLiner).length > 8);
});

test("session progress unlocks after three required tests", () => {
  const session: AuditionSession = emptySession("abc123");
  assert.equal(nextRequired(session), "saju");
  assert.equal(requiredReady(session), false);
  session.tests.saju = { status: "done", input: sajuIn };
  session.shared = mergeShared(session.shared, "saju", sajuIn);
  assert.equal(nextRequired(session), "style");
  session.tests.style = { status: "done", input: styleIn };
  session.tests.lifestyle = { status: "done", input: lifeIn };
  assert.equal(nextRequired(session), null);
  assert.equal(requiredReady(session), true);
  assert.equal(session.shared.species, "고양이");
});

test("optional skip does not block harmony", () => {
  const session: AuditionSession = emptySession("skip1");
  session.tests.saju = { status: "done", input: sajuIn };
  session.tests.style = { status: "done", input: styleIn };
  session.tests.lifestyle = { status: "done", input: lifeIn };
  session.tests.dogcat = { status: "skipped", input: {} };
  assert.equal(requiredReady(session), true);
  assert.equal(isSkipped(session, "dogcat"), true);
});

test("demo session is preview-only and cannot open harmony", () => {
  const session = demoSession("demo1");
  assert.equal(session.sample, true);
  assert.equal(isSampleSession(session), true);
  assert.equal(requiredReady(session), true);
  assert.equal(canOpenHarmony(session), false);
  assert.ok(session.harmony);
  assert.match(String(session.harmony?.free.headline), /두부/);
});

test("live session can open harmony only after three required tests", () => {
  const session = emptySession("live1");
  assert.equal(canOpenHarmony(session), false);
  session.tests.saju = { status: "done", input: sajuIn };
  session.tests.style = { status: "done", input: styleIn };
  assert.equal(canOpenHarmony(session), false);
  session.tests.lifestyle = { status: "done", input: lifeIn };
  assert.equal(canOpenHarmony(session), true);
});

test("sample preview matches the demo score", () => {
  const session = demoSession("demo1");
  const preview = samplePreview();
  const total = (session.harmony?.free.harmonyDetail as { total: number }).total;
  assert.equal(preview.total, total);
  assert.equal(preview.oneLiner, session.harmony?.free.oneLiner);
  assert.equal(preview.care.length, 4);
  assert.ok(preview.care.every((a) => a.teaser && a.teaser !== "이 집에서 이렇게 맞추면 좋아요"));
});

test("wuxing generating and overcoming pairs", () => {
  assert.equal(explainElements("목", "화").kind, "상생");
  assert.match(explainElements("목", "화").why, /불을 살립/);
  assert.equal(explainElements("화", "목").kind, "상생");
  assert.equal(explainElements("토", "수").kind, "상극");
  assert.match(explainElements("토", "수").why, /물을 가둡/);
  assert.equal(explainElements("수", "토").kind, "상극");
  assert.equal(explainElements("금", "금").kind, "동일");
  assert.equal(explainElements("목", "수").kind, "상생");
});

test("wuxing health maps organs and pair care", () => {
  assert.equal(ELEMENT_HEALTH.목.organ, "간");
  assert.equal(ELEMENT_HEALTH.화.care, "놀이");
  assert.equal(ELEMENT_HEALTH.토.organ, "위");
  assert.equal(ELEMENT_HEALTH.금.body.includes("피부"), true);
  assert.equal(ELEMENT_HEALTH.수.care, "휴식");
  const n = healthNote("수", "토");
  assert.match(n.pet, /신장/);
  assert.match(n.owner, /위/);
  assert.match(n.pair, /휴식|식사/);
});
