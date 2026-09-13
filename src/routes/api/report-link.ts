import { createFileRoute } from "@tanstack/react-router";
import { emailConfigured } from "@/lib/paypal.server";
import { unlockStatus } from "@/lib/store.server";

export const Route = createFileRoute("/api/report-link")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          resultId?: string;
          email?: string;
        };
        if (!body.resultId || !body.email) {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        const status = await unlockStatus(body.resultId);
        if (!status.pdf) return Response.json({ error: "not_paid" }, { status: 403 });
        if (!emailConfigured()) {
          return Response.json({ error: "email_not_configured" }, { status: 503 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
