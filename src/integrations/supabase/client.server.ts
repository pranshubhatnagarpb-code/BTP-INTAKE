// Server-only Supabase client. Needs the service / secret key: the database
// only lets it (not the public key) write clients and intake_submissions.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.INTAKE_SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// On Cloudflare this must be a *Secret* named INTAKE_SUPABASE_SERVICE_KEY.
export const serviceKeyConfigured = Boolean(SUPABASE_URL && SERVICE_KEY);

if (!serviceKeyConfigured) {
  // eslint-disable-next-line no-console
  console.error("INTAKE_SUPABASE_SERVICE_KEY is not set — assessment form submissions will fail.");
}

// createClient throws on an empty key, so a placeholder keeps the page rendering;
// submissions are stopped earlier with a clear message (see intake.functions.ts).
export const supabaseAdmin = createClient(SUPABASE_URL || "http://localhost", SERVICE_KEY || "missing-service-key", {
  auth: { persistSession: false, autoRefreshToken: false },
});
