import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const leagueId = searchParams.get("id");
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  if (!leagueId) {
    return NextResponse.redirect(new URL("/leagues", req.url));
  }

  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  res.cookies.set("active-league", JSON.stringify({ leagueId }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
