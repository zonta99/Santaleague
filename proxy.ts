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

const handler = auth((req) => {
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

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", nextUrl.pathname);

  const isApiRoute = nextUrl.pathname.startsWith("/api/");

  // Inject league headers for protected routes (skip /leagues and API paths)
  if (isLoggedIn && !isAuthRoute && !isApiRoute && !isLeaguePath) {
    const leagueCookie = req.cookies.get("active-league");

    if (!leagueCookie) {
      return Response.redirect(new URL("/leagues", nextUrl));
    }

    try {
      const { leagueId } = JSON.parse(leagueCookie.value);
      requestHeaders.set("x-league-id", leagueId ?? "");
    } catch {
      return Response.redirect(new URL("/leagues", nextUrl));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export function proxy(req: Parameters<typeof handler>[0], event: Parameters<typeof handler>[1]) {
  return handler(req, event);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
