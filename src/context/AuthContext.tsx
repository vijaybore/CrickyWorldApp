// src/context/AuthContext.tsx
import React, {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiUrl } from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user:         User | null
  loading:      boolean
  loginWithOTP: (mobile: string, otp: string, name?: string) => Promise<void>
  logout:       () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Helper: removes both auth keys (avoids multiRemove compatibility issues)
async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem('token')
  await AsyncStorage.removeItem('user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) { setLoading(false); return }
        const res = await fetch(apiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          setUser(await res.json() as User)
        } else {
          await clearAuth()
        }
      } catch {
        try {
          const raw = await AsyncStorage.getItem('user')
          if (raw) setUser(JSON.parse(raw) as User)
        } catch { /* ignore */ }
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  const loginWithOTP = useCallback(async (
    mobile: string, otp: string, name?: string,
  ): Promise<void> => {
    const res = await fetch(apiUrl('/api/auth/verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp, name }),
    })
    if (!res.ok) {
      const err = await res.json() as { message?: string }
      throw new Error(err.message ?? 'OTP verification failed')
    }
    const data = await res.json() as { token: string; user: User }
    await AsyncStorage.setItem('token', data.token)
    await AsyncStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await clearAuth()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, loginWithOTP, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}