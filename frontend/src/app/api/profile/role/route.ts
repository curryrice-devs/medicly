import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// POST /api/profile/role { role: 'client' | 'doctor' }
export async function POST(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();
  if (!role || !["client", "doctor"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Get the user's name from auth metadata if not already in profile
  const userName = user.user_metadata?.full_name || user.email;

  // Use update instead of upsert to ensure the profile exists and is properly updated
  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      onboarded: true,
      name: userName
    })
    .eq("id", user.id);

  if (error) {
    // If update fails, try insert (for new users)
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        role,
        onboarded: true,
        name: userName
      });
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Wait a bit to ensure database propagation
  await new Promise(resolve => setTimeout(resolve, 200));

  // Refresh the session to ensure updated data is available
  await supabase.auth.refreshSession();

  return NextResponse.json({ success: true, role });
}


