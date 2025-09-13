import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarded')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarded) {
    redirect('/welcome')
  }

  const role = (profile?.role as 'client' | 'doctor' | 'admin') ?? 'client'

  // Map database roles to dashboard routes and redirect
  switch (role) {
    case 'client':
      redirect('/dashboard/patient')
    case 'doctor':
      redirect('/dashboard/doctor')
    case 'admin':
      redirect('/dashboard/admin')
    default:
      redirect('/dashboard/patient')
  }
}

