// src/screens/LoginScreen.tsx
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput , Pressable, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar} from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../services/api'
import type { RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function LoginScreen() {
  const navigation       = useNavigation<Nav>()
  const { loginWithOTP } = useAuth()

  const [mobile,   setMobile]   = useState('')
  const [otp,      setOtp]      = useState('')
  const [name,     setName]     = useState('')
  const [step,     setStep]     = useState<'mobile' | 'otp'>('mobile')
  const [isNew,    setIsNew]    = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [resendCD, setResendCD] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const startCountdown = () => {
    setResendCD(30)
    timerRef.current = setInterval(() => {
      setResendCD(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0 } return p - 1 })
    }, 1000)
  }

  const handleSendOTP = async () => {
    setError('')
    if (!/^\d{10}$/.test(mobile)) { setError('Enter a valid 10-digit mobile number'); return }
    setLoading(true)
    try {
      const res  = await fetch(apiUrl('/api/auth/send-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })})
      const data = await res.json() as { exists?: boolean; name?: string; message?: string }
      if (!res.ok) throw new Error(data.message ?? 'Failed to send OTP')
      setIsNew(!data.exists)
      if (data.name) setName(data.name)
      setStep('otp')
      startCountdown()
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    setError('')
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    if (isNew && !name.trim()) { setError('Please enter your name'); return }
    setLoading(true)
    try {
      await loginWithOTP(mobile, otp, isNew ? name.trim() : undefined)
      // Use CommonActions.reset to clear navigation stack after login
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Settings' }] }))
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Verification failed')
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (resendCD > 0) return
    setError(''); setOtp(''); setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/send-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })})
      const data = await res.json() as { message?: string }
      if (!res.ok) throw new Error(data.message ?? 'Failed to resend')
      startCountdown()
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to resend OTP')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={() => step === 'otp' ? setStep('mobile') : navigation.goBack()} style={S.backBtn}>
          <Text style={S.backTxt}>← {step === 'otp' ? 'Change number' : 'Back to Settings'}</Text>
        </Pressable>

        <View style={S.card}>
          {/* Header */}
          <View style={S.cardHeader}>
            <Text style={{ fontSize: 46, marginBottom: 12 }}>🏏</Text>
            <Text style={S.cardTitle}>{step === 'mobile' ? 'Sign In' : 'Enter OTP'}</Text>
            <Text style={S.cardSub}>
              {step === 'mobile' ? 'Enter your mobile number to continue' : `OTP sent to +91 ${mobile}`}
            </Text>
          </View>

          {/* Body */}
          <View style={S.cardBody}>
            {step === 'mobile' && (
              <>
                <Text style={S.label}>MOBILE NUMBER</Text>
                <View style={S.mobileRow}>
                  <View style={S.dialCode}><Text style={S.dialTxt}>🇮🇳 +91</Text></View>
                  <TextInput style={S.mobileInput} value={mobile}
                    onChangeText={v => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number" placeholderTextColor="#3a3a3a"
                    keyboardType="phone-pad" maxLength={10} returnKeyType="done"
                    onSubmitEditing={handleSendOTP} autoFocus />
                </View>
                {error !== '' && <View style={S.errorBox}><Text style={S.errorTxt}>{error}</Text></View>}
                <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={handleSendOTP} disabled={loading}
                  style={[S.primaryBtn, loading && S.primaryBtnDim]}>
                  {loading ? <ActivityIndicator color="#fff" size="small" />
                           : <Text style={S.primaryBtnTxt}>Send OTP →</Text>}
                </Pressable>
              </>
            )}

            {step === 'otp' && (
              <>
                {isNew && (
                  <>
                    <Text style={S.label}>YOUR NAME</Text>
                    <TextInput style={S.input} value={name} onChangeText={setName}
                      placeholder="What should we call you?" placeholderTextColor="#3a3a3a" autoFocus />
                  </>
                )}
                <Text style={S.label}>6-DIGIT OTP</Text>
                <TextInput style={[S.input, S.otpInput]} value={otp}
                  onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="——————" placeholderTextColor="#3a3a3a"
                  keyboardType="number-pad" maxLength={6} returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP} autoFocus={!isNew} />
                <View style={S.hintBox}>
                  <Text style={S.hintTxt}>💡 OTP is logged in your server console (Render logs)</Text>
                </View>
                {error !== '' && <View style={S.errorBox}><Text style={S.errorTxt}>{error}</Text></View>}
                <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={handleVerifyOTP} disabled={loading}
                  style={[S.primaryBtn, loading && S.primaryBtnDim]}>
                  {loading ? <ActivityIndicator color="#fff" size="small" />
                           : <Text style={S.primaryBtnTxt}>Verify & Sign In ✓</Text>}
                </Pressable>
                <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={handleResend} disabled={resendCD > 0 || loading} style={S.resendBtn}>
                  <Text style={[S.resendTxt, resendCD === 0 && !loading && { color: '#ff4444' }]}>
                    {resendCD > 0 ? `Resend OTP in ${resendCD}s` : 'Resend OTP'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <Text style={S.footerNote}>By signing in you agree to use this app responsibly 🏏</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  backBtn: { marginBottom: 28 },
  backTxt: { color: '#777', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#1a1a1a', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  cardHeader: { padding: 28, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', alignItems: 'center', backgroundColor: '#202020' },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 20 },
  cardBody: { padding: 24, gap: 12 },
  label: { fontSize: 10, color: '#777', fontWeight: '800', letterSpacing: 1.5 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 13, paddingHorizontal: 16, paddingVertical: 15, color: '#f0f0f0', fontSize: 15 },
  otpInput: { fontSize: 24, letterSpacing: 10, textAlign: 'center', fontWeight: '700' },
  mobileRow: { flexDirection: 'row', borderRadius: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  dialCode: { paddingHorizontal: 14, paddingVertical: 15, backgroundColor: '#202020', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)', justifyContent: 'center' },
  dialTxt: { color: '#777', fontSize: 14, fontWeight: '700' },
  mobileInput: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 15, color: '#f0f0f0', fontSize: 15 },
  hintBox: { padding: 12, borderRadius: 10, backgroundColor: 'rgba(96,165,250,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)' },
  hintTxt: { fontSize: 11, color: '#60a5fa', fontWeight: '600', lineHeight: 17 },
  errorBox: { padding: 12, borderRadius: 10, backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)', alignItems: 'center' },
  errorTxt: { color: '#f87171', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  primaryBtn: { width: '100%', paddingVertical: 15, borderRadius: 13, backgroundColor: '#cc0000', alignItems: 'center', justifyContent: 'center' },
  primaryBtnDim: { backgroundColor: 'rgba(204,0,0,0.4)' },
  primaryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  resendBtn: { alignItems: 'center', paddingVertical: 6 },
  resendTxt: { fontSize: 12, fontWeight: '700', color: '#3a3a3a' },
  footerNote: { marginTop: 20, textAlign: 'center', fontSize: 11, color: '#3a3a3a', lineHeight: 18 }})