"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: "client" | "doctor" | "admin"
  onboarded?: boolean
}

interface RolePermissions {
  canViewPatients: boolean
  canUploadVideos: boolean
  canViewAnalytics: boolean
  canManageUsers: boolean
  canManageSystem: boolean
}

type UserRole = "client" | "doctor" | "admin";

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLoggingOut: boolean
  isAuthenticated: boolean
  permissions: RolePermissions
  login: (email: string, password: string) => Promise<void>
  signup: (
    email: string,
    password: string,
    name: string,
    role: "client" | "doctor"
  ) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasPermission: (permission: keyof RolePermissions) => boolean
  canAccess: (route: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialUser }: { children: React.ReactNode, initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = supabaseBrowser()
    
    // Add error handling for undefined supabase client
    if (!supabase) {
      console.error('[auth] Supabase client is undefined - check environment variables')
      setIsLoading(false)
      return
    }
    
    if (!supabase.auth) {
      console.error('[auth] Supabase auth is undefined - client may not be properly initialized')
      setIsLoading(false)
      return
    }

    const mapUser = (u: any | null): User | null => {
      if (!u) return null
      const metadata = u.user_metadata || {}
      const name = metadata.full_name || metadata.name || u.email?.split("@")[0] || "User"
      const avatar = metadata.avatar_url || metadata.picture
      const role: User["role"] = (metadata.role as any) || "client"
      return {
        id: u.id,
        email: u.email,
        name,
        avatar,
        role,
      }
    }

    const init = async () => {
      console.debug('[auth] init() start')
      try {
        const { data } = await supabase.auth.getUser()
        console.debug('[auth] getUser()', { hasUser: !!data.user })
        const baseUser = mapUser(data.user)
        if (!baseUser) {
          console.debug('[auth] no baseUser - setting user to null')
          setUser(null)
          return
        }
        // Load role and onboarding from profiles table to ensure source of truth
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, onboarded")
          .eq("id", baseUser.id)
          .maybeSingle()
        if (profileError) {
          console.warn('[auth] profile fetch error', profileError)
        }
        console.debug('[auth] setting user from init()', { role: profile?.role || baseUser.role, onboarded: profile?.onboarded })
        setUser({
          ...baseUser,
          role: (profile?.role as User["role"]) || baseUser.role,
          onboarded: profile?.onboarded ?? false,
        })
      } finally {
        console.debug('[auth] init() end - isLoading=false')
        setIsLoading(false)
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[auth] onAuthStateChange', { event, hasSession: !!session })
      const mapped = mapUser(session?.user ?? null)
      if (!mapped) {
        console.debug('[auth] mapped user is null - setting user to null')
        setUser(null)
        return
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, onboarded, name")
        .eq("id", mapped.id)
        .maybeSingle()
      if (profileError) {
        console.warn('[auth] profile fetch error (state change)', profileError)
      }
      console.debug('[auth] setting user from onAuthStateChange', { role: profile?.role || mapped.role, onboarded: profile?.onboarded })
      setUser({
        ...mapped,
        role: (profile?.role as User["role"]) || mapped.role,
        onboarded: profile?.onboarded ?? false,
        name: profile?.name || mapped.name || mapped.email,
      })
    })

    init()
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const supabase = supabaseBrowser()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: "client" | "doctor"
  ) => {
    setIsLoading(true)
    try {
      const supabase = supabaseBrowser()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role } },
      })
      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    // Prevent multiple concurrent logout calls
    if (isLoggingOut) {
      console.debug('[auth] logout() already in progress, skipping')
      return
    }
    
    const supabase = supabaseBrowser() 
    console.debug('[auth] logout() start')
    setIsLoggingOut(true)
    
    try {
      // Clear server-side cookies first
      try {
        const resp = await fetch('/api/auth/logout', { method: 'POST', headers: { 'cache-control': 'no-store' } })
        console.debug('[auth] server logout endpoint response', { ok: resp.ok, status: resp.status })
      } catch (err) {
        console.warn('[auth] server logout endpoint failed', err)
      }
      
      // Then sign out from Supabase client
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[auth] logout() error', error)
        // Don't throw error, continue with logout process
      } else {
        console.debug('[auth] logout() success - auth cleared')
      }
      
      // Clear user state immediately
      setUser(null)
      console.debug('[auth] logout() completed')
      
      // Redirect to home page instead of reloading
      router.push('/')
      
    } catch (e) {
      console.error('[auth] logout() threw', e)
      // Even on error, clear the user state and redirect
      setUser(null)
      router.push('/')
    } finally {
      // Always clear loading state
      setIsLoggingOut(false)
      console.debug('[auth] logout() finally - isLoggingOut set to false')
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return
    setUser({ ...user, ...updates })
  }

  // Role utility functions
  const getRolePermissions = (role: UserRole): RolePermissions => {
    const basePermissions: RolePermissions = {
      canViewPatients: false,
      canUploadVideos: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canManageSystem: false,
    }

    switch (role) {
      case "client":
        return {
          ...basePermissions,
        }
      case "doctor":
        return {
          ...basePermissions,
          canViewPatients: true,
          canUploadVideos: true,
          canViewAnalytics: true,
        }
      case "admin":
        return {
          canViewPatients: true,
          canUploadVideos: true,
          canViewAnalytics: true,
          canManageUsers: true,
          canManageSystem: true,
        }
      default:
        return basePermissions
    }
  }

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!user) return false
    const permissions = getRolePermissions(user.role)
    return permissions[permission]
  }

  const canAccess = (route: string): boolean => {
    if (!user) return false
    
    // Public routes
    if (['/signup', '/welcome', '/'].includes(route)) {
      return true
    }

    // General dashboard route - allow access (will redirect to role-specific dashboard)
    if (route === '/dashboard') {
      return true
    }

    // Role-specific routes
    if (route.startsWith('/dashboard/patient')) {
      return hasRole('client')
    }
    if (route.startsWith('/dashboard/doctor')) {
      return hasRole('doctor')
    }
    if (route.startsWith('/dashboard/admin')) {
      return hasRole('admin')
    }
    
    // Feature-specific routes
    if (route === '/upload') {
      return hasPermission('canUploadVideos')
    }
    if (route.includes('/patients')) {
      return hasPermission('canViewPatients')
    }
    
    if (route.includes('/analytics')) {
      return hasPermission('canViewAnalytics')
    }

    // Default: allow access for authenticated users
    return true
  }

  const permissions = user ? getRolePermissions(user.role) : {
    canViewPatients: false,
    canUploadVideos: false,
    canViewAnalytics: false,
    canManageUsers: false,
    canManageSystem: false,
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isLoggingOut,
      isAuthenticated: !!user,
      permissions,
      login,
      signup,
      logout,
      updateProfile,
      hasRole,
      hasPermission,
      canAccess,
    }),
    [user, isLoading, isLoggingOut, permissions]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}