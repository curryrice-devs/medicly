'use client'

import React, { useState } from 'react'
import { Loader2, Mail, Lock, User, UserPlus } from 'lucide-react'
import Image from 'next/image'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface LoginModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'patient' as 'patient' | 'doctor'
  })
  const [error, setError] = useState('')

  const { login, signup, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
      } else {
        await signup(formData.email, formData.password, formData.name, formData.role as 'client' | 'doctor')
      }
      onOpenChange(false)
      setFormData({ email: '', password: '', name: '', role: 'patient' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 relative">
              <Image
                src="/mediclylogo.png"
                alt="Medicly Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-bold">
                {mode === 'login' ? 'Welcome back' : 'Join Medicly'}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' 
              ? 'Sign in to access your medical analysis dashboard'
              : 'Create your account to start analyzing patient movements'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Full name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Account Type</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.role === 'patient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, role: 'patient' })}
                    className="flex-1"
                  >
                    Patient
                  </Button>
                  <Button
                    type="button"
                    variant={formData.role === 'doctor' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, role: 'doctor' })}
                    className="flex-1"
                  >
                    Healthcare Provider
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-10"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-10"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? (
                    <User className="mr-2 h-4 w-4" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </>
              )}
            </Button>
            
            <div className="text-center text-sm">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={switchMode}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={switchMode}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </DialogFooter>
        </form>

        {mode === 'login' && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Demo accounts:</p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                patient@demo.com
              </Badge>
              <Badge variant="outline" className="text-xs">
                doctor@demo.com
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Password: any text</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 