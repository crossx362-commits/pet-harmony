import { createFileRoute } from "@tanstack/react-router";
import { unlockStatus } from "@/lib/store.server";

export const Route = createFileRoute("/api/unlock-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resultId = new URL(request.url).searchParams.get("resultId") || "";
        if (!resultId) return Response.json({ error: "invalid_input" }, { status: 400 });
        const status = await unlockStatus(resultId);
        return Response.json(status);
      },
    },
  },
});
