// Admin client (server-only) using Supabase service role key for privileged operations.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// During build time, environment variables might not be available
// Create a minimal client or return null for build-time compatibility
let supabaseClient: any = null;

if (!supabaseUrl || !serviceRoleKey) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    // During build, create a dummy client to prevent build errors
    console.warn("Warning: Building without SUPABASE_SERVICE_ROLE_KEY. Admin functions will not work at runtime.");
    supabaseClient = null; // Placeholder for build
  } else {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only)."
    );
  }
} else {
  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export const supabase = supabaseClient;


