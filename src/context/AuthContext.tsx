// src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ONE USER PER DEVICE logic:
//  1. App opens → tries existing token (/api/auth/me)
//  2. Token missing/expired → tries POST /api/auth/device-login with { deviceId }
//  3. Both fail → user lands on Login screen
//  4. After OTP login → deviceId is sent to backend which stores it on the User doc
//  5. Next launch → step 2 silently logs them back in (no OTP needed)
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiUrl } from '../services/api'
import { getDeviceId } from '../services/deviceId'
import type { User } from '../types'

interface AuthContextValue {
  user:            User | null
  loading:         boolean
  deviceId:        string | null
  loginWithOTP:    (mobile: string, otp: string, name?: string) => Promise<void>
  loginWithDevice: () => Promise<boolean>
  logout:          () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem('token')
  await AsyncStorage.removeItem('user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,     setUser]     = useState<User | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const did = await getDeviceId()
        setDeviceId(did)

        // ── Step 1: Try stored token ──────────────────────────────────────────
        const token = await AsyncStorage.getItem('token')
        if (token) {
          try {
            const res = await fetch(apiUrl('/api/auth/me'), {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
              setUser(await res.json() as User)
              return  // ✅ done
            }
          } catch { /* network issue → try device login */ }
        }

        // ── Step 2: Try device-based silent login ─────────────────────────────
        try {
          const res = await fetch(apiUrl('/api/auth/device-login'), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ deviceId: did }),
          })
          if (res.ok) {
            const data = await res.json() as { token: string; user: User }
            await AsyncStorage.setItem('token', data.token)
            await AsyncStorage.setItem('user',  JSON.stringify(data.user))
            setUser(data.user)
            return  // ✅ done
          }
        } catch { /* device not registered → show login screen */ }

        // ── Step 3: Offline fallback (stale cache) ────────────────────────────
        try {
          const raw = await AsyncStorage.getItem('user')
          if (raw) setUser(JSON.parse(raw) as User)
        } catch { /* ignore */ }

      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // OTP login — sends deviceId so backend binds this device → user
  const loginWithOTP = useCallback(async (
    mobile: string, otp: string, name?: string,
  ): Promise<void> => {
    const did = await getDeviceId()
    const res = await fetch(apiUrl('/api/auth/verify-otp'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mobile, otp, name, deviceId: did }),
    })
    if (!res.ok) {
      const err = await res.json() as { message?: string }
      throw new Error(err.message ?? 'OTP verification failed')
    }
    const data = await res.json() as { token: string; user: User }
    await AsyncStorage.setItem('token', data.token)
    await AsyncStorage.setItem('user',  JSON.stringify(data.user))
    setDeviceId(did)
    setUser(data.user)
  }, [])

  // Silent device login (called from screens if needed)
  const loginWithDevice = useCallback(async (): Promise<boolean> => {
    try {
      const did = await getDeviceId()
      const res = await fetch(apiUrl('/api/auth/device-login'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId: did }),
      })
      if (!res.ok) return false
      const data = await res.json() as { token: string; user: User }
      await AsyncStorage.setItem('token', data.token)
      await AsyncStorage.setItem('user',  JSON.stringify(data.user))
      setUser(data.user)
      return true
    } catch { return false }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await clearAuth()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, deviceId, loginWithOTP, loginWithDevice, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
