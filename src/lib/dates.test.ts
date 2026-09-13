import assert from "node:assert/strict";
import test from "node:test";
import { compute, publicResult } from "./compute.ts";
import { estimateBirth, parseOptionalBirth, resolvePetBirth, resolveTime, speciesKind } from "./dates.ts";

test("speciesKind maps cat", () => {
  assert.equal(speciesKind("고양이"), "cat");
  assert.equal(speciesKind("cat"), "cat");
  assert.equal(speciesKind("강아지"), "dog");
  assert.equal(speciesKind(""), "dog");
});

test("cat and dog estimates differ", () => {
  assert.equal(estimateBirth("cat"), "2021-09-15");
  assert.equal(estimateBirth("dog"), "2020-05-01");
});

test("future and invalid dates fail", () => {
  const now = new Date("2026-09-13T00:00:00Z");
  assert.equal(parseOptionalBirth("2026-09-14", now).ok, false);
  assert.equal(parseOptionalBirth("2026-02-31", now).ok, false);
  assert.equal(parseOptionalBirth("not-a-date", now).ok, false);
  assert.equal(parseOptionalBirth("", now).ok, true);
  const empty = parseOptionalBirth("", now);
  assert.equal(empty.ok && empty.iso, null);
});

test("compute rejects missing or future owner birth", () => {
  assert.equal("error" in compute("adopt", { owner: "", species: "고양이" }), true);
  assert.equal("error" in compute("adopt", { owner: "2099-01-01", species: "고양이" }), true);
  assert.equal("error" in compute("adopt", { owner: "1990-13-40", species: "고양이" }), true);
});

test("adopt cat without birthday uses cat estimate", () => {
  const r = compute("adopt", { owner: "1990-01-01", species: "고양이", pet: "" });
  if ("error" in r) throw new Error(r.error);
  assert.equal(r.free.estimatedSpecies, "cat");
  assert.match(String(r.free.summary), /고양이/);
  const dog = compute("adopt", { owner: "1990-01-01", species: "강아지", pet: "" });
  if ("error" in dog) throw new Error(dog.error);
  assert.equal(dog.free.estimatedSpecies, "dog");
  assert.notEqual(r.free.summary, dog.free.summary);
});

test("overall without species still needs species field for cat", () => {
  const dog = compute("overall", {
    owner: "1990-01-01",
    pet: "",
    species: "",
    mbtiEnergy: "E",
    mbtiStyle: "N",
    mbtiRoutine: "F",
    lifeTime: "mid",
    lifeActivity: "mix",
    lifeRoutine: "steady",
  });
  const cat = compute("overall", {
    owner: "1990-01-01",
    pet: "",
    species: "고양이",
    mbtiEnergy: "E",
    mbtiStyle: "N",
    mbtiRoutine: "F",
    lifeTime: "mid",
    lifeActivity: "mix",
    lifeRoutine: "steady",
  });
  if ("error" in dog || "error" in cat) throw new Error("compute failed");
  assert.equal(dog.free.estimatedSpecies, "dog");
  assert.equal(cat.free.estimatedSpecies, "cat");
  assert.notEqual(dog.free.scores, undefined);
});

test("triangle empty pet uses estimate not invalid date", () => {
  const r = compute("triangle", { a: "1990-01-01", b: "1992-02-02", pet: "", petTime: "09:00" });
  if ("error" in r) throw new Error(r.error);
  const scores = r.free.scores as { score: number }[];
  assert.ok(scores.every((s) => s.score >= 5 && s.score <= 99));
  assert.equal(r.free.estimatedSpecies, "dog");
  assert.match(String(r.free.summary), /기본 성향/);
});

test("triangle cat species without pet birth uses cat estimate", () => {
  const r = compute("triangle", {
    a: "1990-01-01",
    b: "1992-02-02",
    pet: "",
    species: "고양이",
    petTime: "09:00",
  });
  if ("error" in r) throw new Error(r.error);
  assert.equal(r.free.estimatedSpecies, "cat");
  const scores = r.free.scores as { score: number }[];
  assert.ok(scores.every((s) => Number.isFinite(s.score) && s.score >= 5 && s.score <= 99));
});

test("time ignored without real pet birth", () => {
  const pet = resolvePetBirth("", "고양이");
  if (!pet.ok) throw new Error("est");
  assert.equal(pet.birth.estimated, true);
  assert.equal(pet.birth.iso, "2021-09-15");
  assert.equal(resolveTime("14:30", !pet.birth.estimated), "");
  const given = resolvePetBirth("2019-03-03", "고양이");
  if (!given.ok) throw new Error("given");
  assert.equal(resolveTime("14:30", !given.birth.estimated), "14:30");
});

test("GET-shaped publicResult hides paid until tips unlock", () => {
  const r = compute("adopt", { owner: "1990-01-01", species: "고양이", pet: "" });
  if ("error" in r) throw new Error(r.error);
  assert.ok(r.paid);
  const locked = publicResult(r, { tips: false, pdf: true });
  assert.equal(locked.paid, null);
  assert.equal(locked.pdfPaid, true);
  assert.equal(locked.unlocked, false);
  const tipsOn = publicResult(r, { tips: true, pdf: false });
  assert.ok(tipsOn.paid);
  assert.equal(tipsOn.unlocked, true);
  assert.equal(tipsOn.pdfPaid, false);
});
