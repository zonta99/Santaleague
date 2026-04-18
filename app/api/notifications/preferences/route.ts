import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user?.id) return new NextResponse(null, { status: 401 });

  const prefs = await db.notificationPreferences.findUnique({
    where: { user_id: user.id },
  });

  // Return null if no prefs row — client uses defaults
  return NextResponse.json(prefs);
}
