import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import { apiUrl } from '../services/api'

export interface UserSession {
  mobile:   string
  username: string
  token:    string
}

interface AuthContextValue {
  user:         UserSession | null
  loading:      boolean
  sendOTP:      (mobile: string) => Promise<void>
  loginWithOTP: (otp: string, name?: string) => Promise<void>
  logout:       () => Promise<void>
  confirmation: FirebaseAuthTypes.ConfirmationResult | null
}

const STORAGE_KEY = '@crickyworld_session'
const AuthContext  = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,         setUser]         = useState<UserSession | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null)
  const [pendingMobile, setPendingMobile] = useState<string>('')

  // ── Restore saved session on app launch ──────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (raw) setUser(JSON.parse(raw) as UserSession)
      } catch (e) {
        console.warn('[AuthContext] restore failed:', e)
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  // ── Step 1: Send OTP via Firebase ────────────────────────────────────────
  // Firebase directly sends the SMS — no backend involved here
  const sendOTP = async (mobile: string) => {
    try {
      // Firebase requires +91 prefix for India
      const result = await auth().signInWithPhoneNumber(`+91${mobile}`)
      setConfirmation(result)
      setPendingMobile(mobile)
    } catch (e: any) {
      console.error('[sendOTP] Firebase error:', e)

      // Friendly error messages
      if (e.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number. Please check and try again.')
      }
      if (e.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please try again later.')
      }
      if (e.code === 'auth/quota-exceeded') {
        throw new Error('SMS quota exceeded. Please try again tomorrow.')
      }
      throw new Error(e.message ?? 'Failed to send OTP')
    }
  }

  // ── Step 2: Verify OTP + register/login on your backend ──────────────────
  // Firebase verifies the OTP, then your backend creates/fetches the user
  const loginWithOTP = async (otp: string, name?: string) => {
    if (!confirmation) throw new Error('No OTP request found. Please request OTP again.')

    try {
      // 1. Verify OTP with Firebase
      await confirmation.confirm(otp)

      // 2. Now register/login on your backend to get JWT
      const res = await fetch(apiUrl('/api/auth/verify-firebase'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mobile: pendingMobile, name }),
      })

      const data = await res.json() as {
        token:    string
        username: string
        message?: string
      }

      if (!res.ok) throw new Error(data.message ?? 'Login failed')

      const session: UserSession = {
        mobile:   pendingMobile,
        username: data.username || name || pendingMobile,
        token:    data.token,
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setUser(session)
      setConfirmation(null)
      setPendingMobile('')

    } catch (e: any) {
      console.error('[loginWithOTP] error:', e)

      if (e.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP. Please check and try again.')
      }
      if (e.code === 'auth/code-expired') {
        throw new Error('OTP expired. Please request a new one.')
      }
      throw new Error(e.message ?? 'Verification failed')
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await auth().signOut()
    } catch (_) {}
    await AsyncStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sendOTP,
      loginWithOTP,
      logout,
      confirmation,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}