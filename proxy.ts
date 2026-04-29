import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/chat", request.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
