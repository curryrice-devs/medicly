'use client'

import React from 'react'
import { 
  User, 
  Settings, 
  LogOut, 
  FileText, 
  Activity,
  CreditCard,
  Shield,
  HelpCircle
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
      case 'doctor': return 'success'
      case 'admin': return 'destructive'
      default: return 'secondary'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'doctor': return 'Doctor'
      case 'admin': return 'Admin'
      default: return 'Patient'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-64 bg-white/95 backdrop-blur-sm border shadow-xl z-[99999]" 
        align="end" 
        forceMount
        style={{ zIndex: 99999 }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{user.name}</p>
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
          <DropdownMenuItem className="gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Activity className="h-4 w-4" />
            <span>My Analyses</span>
          </DropdownMenuItem>
          {user.role === 'doctor' && (
            <DropdownMenuItem className="gap-2">
              <FileText className="h-4 w-4" />
              <span>Patient Reports</span>
            </DropdownMenuItem>
          )}
          {user.role === 'admin' && (
            <DropdownMenuItem className="gap-2">
              <Shield className="h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="gap-2 text-destructive focus:text-destructive" 
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