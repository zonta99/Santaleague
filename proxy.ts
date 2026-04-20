import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

const leaguePaths = ["/leagues"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isLeaguePath = leaguePaths.some((p) => nextUrl.pathname.startsWith(p));

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(
      `/auth/login?callbackUrl=${encodedCallbackUrl}`,
      nextUrl
    ));
  }

  // Inject league headers for protected routes
  if (isLoggedIn && !isAuthRoute && !isApiAuthRoute && !isLeaguePath) {
    const leagueCookie = req.cookies.get("active-league");

    if (!leagueCookie) {
      return Response.redirect(new URL("/leagues", nextUrl));
    }

    try {
      const { leagueId, role } = JSON.parse(leagueCookie.value);
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-league-id", leagueId ?? "");
      requestHeaders.set("x-league-role", role ?? "");
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return Response.redirect(new URL("/leagues", nextUrl));
    }
  }

  return null;
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
