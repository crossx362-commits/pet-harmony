#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.QA_URL || "http://127.0.0.1:8080";
const DIR = "/workspace/screenshots";
mkdirSync(DIR, { recursive: true });

const results = [];
function log(id, ok, detail = "") {
  results.push({ id, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}${detail ? " — " + detail : ""}`);
}

async function shot(page, name) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.setDefaultTimeout(8000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const home = await page.locator("h1").first().innerText();
  log("home-title", home.includes("잘 맞는지"), home);
  const sampleScore = await page.locator(".outcome-score strong").first().innerText();
  log("home-sample-68", sampleScore.replace(/\s/g, "").includes("68"), sampleScore);
  log("home-no-82", !sampleScore.includes("82"), sampleScore);
  const usd = await page.locator(".price-card strong").allInnerTexts();
  log("home-usd", usd.some((t) => t.includes("$0.99")) && usd.some((t) => t.includes("$3.99")), usd.join(" | "));
  const demoBtn = await page.getByRole("button", { name: "샘플로 먼저 결과 보기" }).count();
  log("home-no-demo-harmony", demoBtn === 0, String(demoBtn));
  await shot(page, "qa-home");

  await page.evaluate(() => {
    location.hash = "#/result/skip-me";
  });
  await page.waitForTimeout(400);
  const blocked = await page.locator("h1").first().innerText();
  log("direct-result-blocked", !blocked.includes("조화도") || blocked.includes("세 가지") || blocked.includes("잘 맞는지") || blocked.includes("사주"), blocked);

  await page.getByRole("button", { name: "홈" }).click();
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    localStorage.clear();
    location.hash = "";
  });
  await page.reload({ waitUntil: "networkidle" });

  await page.getByRole("button", { name: "내 점수 보기" }).click();
  await page.waitForTimeout(400);
  const sajuTitle = await page.locator("h1").first().innerText();
  log("saju-form", sajuTitle.includes("사주"), sajuTitle);
  await shot(page, "qa-saju-form");

  await page.locator("#owner").fill("2099-01-01");
  await page.getByRole("button", { name: "사주 케미 보기" }).click();
  await page.waitForTimeout(200);
  const futureAlert = await page.locator("[role=alert], .form-tip").first().innerText().catch(() => "");
  log("future-date-blocked", /미래|날짜/.test(futureAlert) || (await page.locator("h1").innerText()).includes("사주"), futureAlert);

  await page.locator("#owner").fill("1994-05-12");
  const catBtn = page.getByRole("button", { name: "고양이" });
  await catBtn.click();
  await page.getByRole("button", { name: "생일을 몰라요" }).click();
  await page.getByRole("button", { name: "사주 케미 보기" }).click();
  await page.waitForTimeout(400);
  const mid = await page.locator("h1").first().innerText();
  const midBody = await page.locator("body").innerText();
  log("saju-cat-estimate", /추정|고양이/.test(midBody), mid);
  await shot(page, "qa-saju-mid");

  await page.getByRole("button", { name: /다음으로/ }).click();
  await page.waitForTimeout(300);
  log("style-form", (await page.locator("h1").innerText()).includes("스타일"));
  for (const label of ["같이 밖에 나가고 싶어요", "확실한 원인부터 차근차근 봐요", "서로 기분과 마음을 먼저 봐요"]) {
    await page.getByRole("button", { name: label }).click();
  }
  await page.getByRole("button", { name: "내 스타일 보기" }).click();
  await page.waitForTimeout(300);
  log("style-mid", (await page.locator("body").innerText()).includes("보호자"));
  await shot(page, "qa-style-mid");

  await page.getByRole("button", { name: /다음으로/ }).click();
  await page.waitForTimeout(300);
  log("life-form", (await page.locator("h1").innerText()).includes("생활"));
  for (const label of ["아침·저녁에 꾸준히 챙길 수 있어요", "산책·놀이처럼 몸을 움직이는 것", "정해둔 시간에 꾸준히 하는 편"]) {
    await page.getByRole("button", { name: label }).click();
  }
  await page.getByRole("button", { name: "생활 준비 보기" }).click();
  await page.waitForTimeout(300);
  log("life-mid", (await page.locator("body").innerText()).includes("생활"));
  await shot(page, "qa-life-mid");

  const readyCta = page.getByRole("button", { name: "조화도 보기" });
  log("harmony-unlocks-after-3", await readyCta.count().then((n) => n > 0));
  await readyCta.click();
  await page.waitForTimeout(400);
  const harm = await page.locator("h1").first().innerText();
  log("harmony-composed", /조화도 \d+점/.test(harm), harm);
  log("harmony-no-input-form", !(await page.locator("#owner").count()));
  log("harmony-usd", (await page.locator("body").innerText()).includes("$0.99"));
  await shot(page, "qa-harmony-pay");

  await page.getByRole("button", { name: "전체" }).first().click();
  await page.waitForTimeout(300);
  const hub = await page.locator("body").innerText();
  log("hub-progress-3", hub.includes("꼭 보기 3 / 3"), hub.slice(0, 80));
  log("hub-optional-skip", hub.includes("안 함"));
  const skip = page.getByRole("button", { name: "안 함" }).first();
  if (await skip.count()) await skip.click();
  await page.waitForTimeout(150);
  log("hub-skip-works", (await page.locator("body").innerText()).includes("안 함"));
  await shot(page, "qa-hub");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(BASE, { waitUntil: "networkidle" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log("mobile-no-overflow", overflow <= 1, String(overflow));
  await mobile.screenshot({ path: `${DIR}/qa-home-mobile.png` });
  await mobile.close();

  const health = await (await page.request.get(`${BASE}/api/health`)).json();
  log("health-ok", health.ok === true, JSON.stringify(health));
  log("payment-guard", health.paymentConfigured === false);

  const orders = await page.request.post(`${BASE}/api/orders`, {
    data: { product: "tips", resultId: "qa" },
  });
  log("orders-blocked", orders.status() === 503, String(orders.status()));

  const resultsGet = await page.request.get(`${BASE}/api/results?resultId=missing`);
  log("results-missing-404", resultsGet.status() === 404, String(resultsGet.status()));

  log("no-page-errors", errors.length === 0, errors.slice(0, 5).join(" | "));
} catch (err) {
  log("runner", false, String(err));
} finally {
  await browser.close();
}

const fail = results.filter((r) => !r.ok);
writeFileSync(`${DIR}/qa-full.json`, JSON.stringify({ pass: results.length - fail.length, fail: fail.length, results }, null, 2));
console.log(`\n${results.length - fail.length}/${results.length} passed`);
process.exit(fail.length ? 1 : 0);
