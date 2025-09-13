"use client"

import { useEffect, useState, useCallback } from "react"
import { supabaseBrowser } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = supabaseBrowser()
    let isMounted = true

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (e) {
        if (!isMounted) return
        setError(e instanceof Error ? e.message : "Failed to initialize auth")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    init()
    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabaseBrowser().auth.signOut()
    if (error) throw error
  }, [])

  return { user, isLoading, error, signOut }
}


