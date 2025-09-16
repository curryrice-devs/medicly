'use client'

import React from 'react'
import { 
  Users,
  Settings, 
  LogOut
} from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const { user, logout, isLoggingOut } = useAuth()
  const router = useRouter()

  if (!user) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'railway'
      case 'admin': return 'destructive'
      default: return 'railway-outline'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'doctor': return 'Doctor'
      case 'admin': return 'Admin'
      default: return 'Patient'
    }
  }

  const handleSettingsClick = () => {
    const settingsRoute = user.role === 'doctor' 
      ? '/dashboard/doctor/settings'
      : '/dashboard/patient/settings'
    router.push(settingsRoute)
  }

  const handlePatientsClick = () => {
    router.push('/dashboard/doctor/patients')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-64 railway-glass border shadow-lg z-[99999]" 
        align="end" 
        forceMount
        style={{ zIndex: 99999 }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
              <Badge variant={getRoleColor(user.role)} className="text-xs">
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.role === 'doctor' && (
            <DropdownMenuItem 
              className="gap-2 cursor-pointer hover:bg-muted transition-colors"
              onClick={handlePatientsClick}
            >
              <Users className="h-4 w-4" />
              <span>Patients</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            className="gap-2 cursor-pointer hover:bg-muted transition-colors"
            onClick={handleSettingsClick}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="gap-2 text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10 transition-colors" 
          onClick={async () => {
            if (isLoggingOut) {
              console.debug('[menu] logout already in progress')
              return
            }
            
            console.debug('[menu] logout clicked')
            
            try {
              await logout()
              console.debug('[menu] logout completed, redirecting to home...')
              // The logout function now handles the redirect with router.push
            } catch (error) {
              console.error('[menu] logout failed:', error)
              // Fallback redirect to home
              router.push('/')
            }
          }}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 