import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user?.id) return new NextResponse(null, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user?.id) return new NextResponse(null, { status: 401 });

  const body = await request.json();

  if (body.all) {
    await db.notification.updateMany({
      where: { user_id: user.id, read: false },
      data: { read: true },
    });
  } else if (body.id) {
    await db.notification.updateMany({
      where: { id: body.id, user_id: user.id },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
