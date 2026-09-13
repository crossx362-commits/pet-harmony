import { createFileRoute } from "@tanstack/react-router";
import { capturePaypalOrder, paymentConfigured } from "@/lib/paypal.server";
import { recordUnlock } from "@/lib/store.server";

export const Route = createFileRoute("/api/capture")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!paymentConfigured()) {
          return Response.json({ error: "payment_not_configured" }, { status: 503 });
        }
        const body = (await request.json().catch(() => ({}))) as {
          resultId?: string;
          product?: string;
          orderId?: string;
        };
        if (!body.resultId || !body.orderId || (body.product !== "tips" && body.product !== "pdf")) {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        try {
          await capturePaypalOrder(body.orderId);
          await recordUnlock(body.resultId, body.product, body.orderId);
          return Response.json({ ok: true, product: body.product });
        } catch {
          return Response.json({ error: "capture_failed" }, { status: 502 });
        }
      },
    },
  },
});
