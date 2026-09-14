import { createFileRoute } from "@tanstack/react-router";
import { dbSource } from "@/lib/db";
import { emailConfigured, paymentConfigured, webhookConfigured } from "@/lib/paypal.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          service: "pet-harmony",
          paymentConfigured: paymentConfigured(),
          webhookConfigured: webhookConfigured(),
          emailConfigured: emailConfigured(),
          // Production must be "neon" (DATABASE_URL set). "pglite" on Vercel = misconfig.
          dbSource,
        }),
    },
  },
});
