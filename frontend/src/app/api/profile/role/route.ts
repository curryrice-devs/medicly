import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// POST /api/profile/role { role: 'client' | 'doctor' }
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
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

  // Wait longer to ensure database propagation
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verify the profile was actually updated before returning
  const { data: verifyProfile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", user.id)
    .single();

  if (!verifyProfile?.onboarded) {
    console.error('[role-api] Profile verification failed - onboarded is still false');
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  }

  // Refresh the session to ensure updated data is available
  await supabase.auth.refreshSession();

  return NextResponse.json({ success: true, role, profile: verifyProfile });
}


