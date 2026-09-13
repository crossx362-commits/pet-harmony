import { createFileRoute } from "@tanstack/react-router";
import { createPaypalOrder, paymentConfigured } from "@/lib/paypal.server";
import { recordOrder } from "@/lib/store.server";

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!paymentConfigured()) {
          return Response.json({ error: "payment_not_configured" }, { status: 503 });
        }
        const body = (await request.json().catch(() => ({}))) as {
          resultId?: string;
          product?: string;
        };
        if (!body.resultId || (body.product !== "tips" && body.product !== "pdf")) {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        try {
          const orderId = await createPaypalOrder(body.product);
          await recordOrder(body.resultId, body.product, orderId);
          return Response.json({ orderId });
        } catch {
          return Response.json({ error: "order_create_failed" }, { status: 502 });
        }
      },
    },
  },
});
