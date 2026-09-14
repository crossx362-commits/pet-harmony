import assert from "node:assert/strict";
import test from "node:test";
import { composeHarmony, compute, computeTest, scoreOf } from "./compute.ts";
import { demoSession, emptySession, isSkipped, mergeShared, nextRequired, requiredReady, samplePreview, type AuditionSession } from "./session.ts";

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

test("demo session is ready to view harmony", () => {
  const session = demoSession("demo1");
  assert.equal(requiredReady(session), true);
  assert.ok(session.harmony);
  assert.equal(session.harmony?.mode, "overall");
  assert.match(String(session.harmony?.free.headline), /두부/);
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
