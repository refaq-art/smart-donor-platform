import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Plain anon-key client for server-side code that has no user session
 * (the public report route). It never touches tables directly — RLS grants
 * `anon` nothing — it only calls the two SECURITY DEFINER RPCs
 * (get_report_by_token / record_report_view) that validate the token
 * themselves. No secret key is needed anywhere in this app.
 */
export function createAnonServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
