import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "sdp_session";

const PUBLIC_PATHS = ["/login", "/api/health"];

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/favicon") ||
    // نقاط الإدارة/التهيئة تحمي نفسها بـ BOOTSTRAP_SECRET بدل جلسة المستخدم — يجب
    // استثناؤها هنا وإلا أُعيد توجيهها لصفحة الدخول، وهو ما يجعل تهيئة قاعدة
    // البيانات مستحيلة أصلًا (لا يمكن تسجيل الدخول قبل إنشاء الجداول).
    pathname.startsWith("/api/admin/")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await isAuthenticated(token);

  if (!authed) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
