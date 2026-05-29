import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is a protected user route
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/add") ||
    pathname.startsWith("/box") ||
    pathname.startsWith("/import") ||
    pathname.startsWith("/scan")
  ) {
    // For now, let the client-side ProtectedRoute handle the auth check
    // You could add additional server-side checks here if needed
    return NextResponse.next();
  }

  // Admin routes require special handling
  if (pathname.startsWith("/admin")) {
    // Let the client-side AdminLayout handle role-based access control
    // This ensures consistent behavior and access to user context
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
