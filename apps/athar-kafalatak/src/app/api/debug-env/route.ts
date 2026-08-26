import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
  return NextResponse.json({
    urlPresent: Boolean(url),
    urlHost: url ? new URL(url).host : null,
    keyPresent: Boolean(key),
    keyLength: key?.length ?? 0,
    keyPrefix: key ? key.slice(0, 12) : null,
  });
}
