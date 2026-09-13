import { createFileRoute } from "@tanstack/react-router";
import type { HarmonyResult } from "@/lib/compute";
import { publicPayload, saveResult } from "@/lib/store.server";

export const Route = createFileRoute("/api/results")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resultId = new URL(request.url).searchParams.get("resultId") || "";
        if (!resultId) return Response.json({ error: "invalid_input" }, { status: 400 });
        const payload = await publicPayload(resultId);
        if (!payload) return Response.json({ error: "not_found" }, { status: 404 });
        return Response.json({ payload });
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          resultId?: string;
          payload?: HarmonyResult;
        };
        if (!body.resultId || !body.payload) {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        await saveResult(body.resultId, body.payload);
        return Response.json({ ok: true });
      },
    },
  },
});
