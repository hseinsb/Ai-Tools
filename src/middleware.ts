import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Define paths that require authentication
  const protectedPaths = ["/add", "/profile", "/edit"];

  // Define paths that should be redirected when authenticated
  const authPaths = ["/login", "/register"];

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((pp) => path.startsWith(pp));
  const isAuthPath = authPaths.some((ap) => path === ap);

  // Get auth session from cookie
  const authCookie = request.cookies.get("firebase-auth-token");
  // Also check for firebase-user-credentials cookie as a backup
  const userCredentials = request.cookies.get("firebase-user-credentials");
  const isAuthenticated = !!authCookie?.value || !!userCredentials?.value;

  console.log(
    `Middleware: Path=${path}, Protected=${isProtectedPath}, AuthPath=${isAuthPath}, Authenticated=${isAuthenticated}`
  );

  // Redirect unauthenticated users to login page if they're accessing a protected route
  if (isProtectedPath && !isAuthenticated) {
    console.log("Redirecting to login page");
    const url = new URL(`/login`, request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from login/register to homepage
  if (isAuthPath && isAuthenticated) {
    console.log("Redirecting authenticated user to home page");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow all navigation to proceed
  return NextResponse.next();
}

// Specify which paths this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /favicon.ico, /robots.txt (common static files)
     */
    "/((?!api|_next|_static|favicon.ico|robots.txt).*)",
  ],
};
