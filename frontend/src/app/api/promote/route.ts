import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/admin";

// POST /api/promote { user_id: string, role: 'client' | 'doctor' | 'admin' }
export async function POST(req: NextRequest) {
  // Basic server-only guard: require header X-Admin-Token matches env ADMIN_API_TOKEN
  const headerToken = req.headers.get("x-admin-token");
  if (!headerToken || headerToken !== process.env.ADMIN_API_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user_id, role } = await req.json();
  if (!user_id || !["client", "doctor", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}


