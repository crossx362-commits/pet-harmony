import { getSql } from "@/lib/db";
import type { HarmonyResult } from "@/lib/compute";
import { publicResult } from "@/lib/compute";

export async function saveResult(resultId: string, payload: HarmonyResult) {
  const sql = await getSql();
  await sql.query(
    `insert into harmony_results (result_id, payload, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (result_id) do update set payload = excluded.payload, updated_at = now()`,
    [resultId, JSON.stringify(payload)],
  );
}

export async function loadResult(resultId: string): Promise<HarmonyResult | null> {
  const sql = await getSql();
  const rows = await sql.query<{ payload: HarmonyResult | string }>(
    `select payload from harmony_results where result_id = $1`,
    [resultId],
  );
  const raw = rows[0]?.payload;
  if (!raw) return null;
  return typeof raw === "string" ? (JSON.parse(raw) as HarmonyResult) : raw;
}

export async function recordOrder(resultId: string, product: string, paypalOrderId: string) {
  const sql = await getSql();
  await sql.query(
    `insert into harmony_orders (result_id, product, paypal_order_id, status)
     values ($1, $2, $3, 'created')
     on conflict (paypal_order_id) do nothing`,
    [resultId, product, paypalOrderId],
  );
}

export async function recordUnlock(resultId: string, product: string, paypalOrderId: string) {
  const sql = await getSql();
  await sql.query(
    `insert into harmony_unlocks (result_id, product, paypal_order_id, status)
     values ($1, $2, $3, 'active')
     on conflict (result_id, product) do update set status = 'active'`,
    [resultId, product, paypalOrderId],
  );
  if (product === "pdf") {
    await sql.query(
      `insert into harmony_unlocks (result_id, product, paypal_order_id, status)
       values ($1, 'tips', $2, 'active')
       on conflict (result_id, product) do update set status = 'active'`,
      [resultId, paypalOrderId],
    );
  }
}

export async function unlockStatus(resultId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ product: string }>(
    `select product from harmony_unlocks where result_id = $1 and status = 'active'`,
    [resultId],
  );
  const products = new Set(rows.map((r) => r.product));
  return { tips: products.has("tips"), pdf: products.has("pdf") };
}

export async function publicPayload(resultId: string) {
  const data = await loadResult(resultId);
  if (!data) return null;
  const unlocks = await unlockStatus(resultId);
  return publicResult(data, unlocks);
}
