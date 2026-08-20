import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, ROLES } from "@/lib/constants";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-please-32chars-min";
  return new TextEncoder().encode(secret);
}

async function readSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  // معظم المنصة عام (الرئيسية، الدورات، تفاصيل الدورة) — نحمي فقط لوحة
  // المستخدم ولوحة الإدارة على مستوى الـ Edge لمنع أي وصول غير مصرح به مبكرًا.
  const isAccountPath = pathname.startsWith("/account");
  const isAdminPath = pathname.startsWith("/admin");

  if (!isAccountPath && !isAdminPath) {
    return NextResponse.next();
  }

  const session = await readSession(token);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && session.role !== ROLES.ADMIN) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
