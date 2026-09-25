import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[FlatFinds] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — " +
      "group creation, joining, and the realtime waiting screen won't work until they are. " +
      "See supabase/schema.sql and .env.local.example.",
  );
}

/**
 * A single browser-safe Supabase client (anon key). There's no auth in this
 * app — anyone with a group's id (from its QR code or invite link) can join
 * it and read its status, which is the deliberate "if you have the link you
 * have it" security model, matching how the invite flow works. See
 * supabase/schema.sql for the (intentionally permissive, no-auth) RLS
 * policies this depends on.
 */
export const supabase = createClient(url ?? "", anonKey ?? "");
