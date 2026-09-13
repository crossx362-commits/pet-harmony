import { createFileRoute } from "@tanstack/react-router";
import { webhookConfigured } from "@/lib/paypal.server";
import { recordUnlock } from "@/lib/store.server";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!webhookConfigured()) {
          return Response.json({ error: "webhook_not_configured" }, { status: 503 });
        }
        const event = (await request.json().catch(() => ({}))) as {
          event_type?: string;
          resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } };
        };
        if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
          return Response.json({ ok: true, ignored: true });
        }
        const orderId =
          event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id || "";
        if (!orderId) return Response.json({ ok: true });
        const sql = await getSql();
        const rows = await sql.query<{ result_id: string; product: string }>(
          `select result_id, product from harmony_orders where paypal_order_id = $1`,
          [orderId],
        );
        const row = rows[0];
        if (row) await recordUnlock(row.result_id, row.product, orderId);
        return Response.json({ ok: true });
      },
    },
  },
});
