import { createFileRoute } from "@tanstack/react-router";
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
        }),
    },
  },
});
