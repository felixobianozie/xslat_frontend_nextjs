// Located at /proxy.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Public auth pages that already-logged-in users should be bounced away
// from. Listed in one place so the matcher below and the runtime check
// here cannot quietly drift apart.
const AUTH_PAGES = [
  "/login",
  "/signup",
  "/password-reset",
  "/contact-validation",
];

/**
 * Edge middleware that handles two opposite guards in one place:
 *
 *   1. /dashboard/*  → blocked for logged-out users (existing behaviour).
 *      Handled by the `authorized` callback below; withAuth performs the
 *      redirect to /login automatically.
 *
 *   2. Auth pages    → blocked for logged-in users. Visiting /login,
 *      /signup, /password-reset, or /contact-validation while authenticated
 *      sends the user to /dashboard.
 *
 * Both checks run before the page renders, so there is no flash of the
 * wrong UI in either direction.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // A `RefreshAccessTokenError` means the refresh token also expired or
    // was rejected, so the session is unrecoverable. Treat such tokens as
    // logged-out for the auth-page guard so the user can still reach
    // /login to re-authenticate — otherwise they would be trapped in a
    // redirect loop to a dashboard they cannot load.
    const isAuthenticated =
      Boolean(token) && token?.error !== "RefreshAccessTokenError";

    // Authenticated user landed on a public auth page → send to dashboard.
    if (isAuthenticated && AUTH_PAGES.includes(path)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      // `authorized` decides whether withAuth lets the request reach the
      // middleware function above. Returning `false` triggers withAuth's
      // built-in redirect to the signIn page.
      //
      // For auth pages we always return `true` so the inner function can
      // run and decide whether to bounce *logged-in* users away. For every
      // other matched route (i.e. /dashboard/*) we require a valid token,
      // preserving the original guard.
      authorized: ({ token, req }) => {
        if (AUTH_PAGES.includes(req.nextUrl.pathname)) return true;
        return Boolean(token);
      },
    },
  },
);

// Routes this middleware runs on. Combines:
//   - the dashboard tree (guarded against logged-out users)
//   - the auth pages    (guarded against logged-in users)
// Every other request skips middleware entirely.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/password-reset",
    "/contact-validation",
  ],
};
