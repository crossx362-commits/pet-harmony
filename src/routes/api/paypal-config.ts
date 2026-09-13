import { createFileRoute } from "@tanstack/react-router";
import { paymentConfigured, paypalClientId } from "@/lib/paypal.server";

export const Route = createFileRoute("/api/paypal-config")({
  server: {
    handlers: {
      GET: async () => {
        if (!paymentConfigured()) {
          return Response.json({ clientId: "" }, { status: 200 });
        }
        return Response.json({ clientId: paypalClientId() });
      },
    },
  },
});
