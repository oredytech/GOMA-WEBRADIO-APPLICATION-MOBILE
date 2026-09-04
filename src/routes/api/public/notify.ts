import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { sendNotification } from "@/lib/fcm.server";

const payloadSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(300),
  url: z.string().url().max(500).optional(),
  image: z.string().url().max(500).optional(),
  data: z.record(z.string(), z.string().max(500)).optional(),
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["NOTIFY_PUSH_SECRET"];
        if (!secret) {
          return Response.json({ error: "NOTIFY_PUSH_SECRET is not configured" }, { status: 500 });
        }
        const provided =
          request.headers.get("x-notify-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!timingSafeEqual(provided, secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const parsed = payloadSchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            { error: "Invalid payload", issues: parsed.error.issues },
            { status: 400 },
          );
        }

        try {
          const result = await sendNotification(parsed.data);
          return Response.json(result, { status: result.failed > 0 && result.sent === 0 ? 502 : 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Push notification failed: ${message}`);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
