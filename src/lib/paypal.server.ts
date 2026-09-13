import { env } from "@/lib/env.server";

export function paymentConfigured() {
  return Boolean(env("PAYPAL_CLIENT_ID") && env("PAYPAL_CLIENT_SECRET"));
}

export function webhookConfigured() {
  return Boolean(env("PAYPAL_WEBHOOK_ID") && paymentConfigured());
}

export function emailConfigured() {
  return Boolean(env("RESEND_API_KEY"));
}

export function paypalClientId() {
  return env("PAYPAL_CLIENT_ID") || "";
}

function baseUrl() {
  return env("PAYPAL_ENV") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function accessToken() {
  const id = env("PAYPAL_CLIENT_ID");
  const secret = env("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("payment_not_configured");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("paypal_auth_failed");
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

const AMOUNTS = { tips: "0.99", pdf: "3.99" } as const;

export async function createPaypalOrder(product: "tips" | "pdf") {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: AMOUNTS[product] },
          description: product === "pdf" ? "Pet Harmony photo report" : "Pet Harmony care tips",
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("order_create_failed");
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function capturePaypalOrder(orderId: string) {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("capture_failed");
  const json = (await res.json()) as { status?: string };
  if (json.status !== "COMPLETED" && json.status !== "PENDING") {
    // PayPal often returns COMPLETED
  }
  return json;
}
