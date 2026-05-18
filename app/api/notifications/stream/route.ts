import { currentUser } from "@/lib/auth";
import { notificationEmitter } from "@/lib/notification-emitter";
import { Notification } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user?.id) return new Response("Unauthorized", { status: 401 });

  const userId = user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encode = (data: string) => new TextEncoder().encode(data);

      const onNotification = (notifications: Notification[]) => {
        controller.enqueue(encode(`data: ${JSON.stringify(notifications)}\n\n`));
      };

      notificationEmitter.on(`notification:${userId}`, onNotification);

      // Keep-alive ping every 15s to prevent proxy timeouts
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        notificationEmitter.off(`notification:${userId}`, onNotification);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
