import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar, BackHandler,
} from 'react-native'
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../types'

type Nav   = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'OTPVerification'>

const OTP_LENGTH   = 6
const RESEND_TIMER = 30

export default function OTPVerificationScreen() {
  const navigation = useNavigation<Nav>()
  const route      = useRoute<Route>()

  // ✅ loginWithOTP now only takes (otp, name?) — mobile is handled inside AuthContext
  const { loginWithOTP, sendOTP } = useAuth()

  const { mobile, isNew, name: initialName } = route.params

  const [otp,     setOtp]     = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [name,    setName]    = useState(initialName ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [timer,   setTimer]   = useState(RESEND_TIMER)

  const inputRefs = useRef<Array<TextInput | null>>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    startCountdown()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, [])

  const startCountdown = () => {
    setTimer(RESEND_TIMER)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1)
    const updated = [...otp]
    updated[index] = digit
    setOtp(updated)
    setError('')
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    // Auto-submit when last digit entered
    if (digit && index === OTP_LENGTH - 1) {
      const full = [...updated.slice(0, OTP_LENGTH - 1), digit].join('')
      if (full.length === OTP_LENGTH) handleVerify(full)
    }
  }

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (otpStr?: string) => {
    const code = otpStr ?? otp.join('')
    setError('')

    if (code.length < OTP_LENGTH) {
      setError(`Enter the complete ${OTP_LENGTH}-digit OTP`)
      return
    }
    // ✅ Validate name BEFORE attempting Firebase verification
    if (isNew && !name.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    try {
      // ✅ Only otp + name needed — mobile is stored in AuthContext
      await loginWithOTP(code, isNew ? name.trim() : undefined)
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Verification failed')
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (timer > 0) return
    setError('')
    setOtp(Array(OTP_LENGTH).fill(''))
    setLoading(true)
    try {
      await sendOTP(mobile) // Firebase re-sends SMS
      startCountdown()
      inputRefs.current[0]?.focus()
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const maskedMobile = `+91 XXXXXX${mobile.slice(-4)}`

  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
          onPress={() => navigation.goBack()}
          style={S.backBtn}
        >
          <Text style={S.backTxt}>← Change number</Text>
        </Pressable>

        <View style={S.card}>
          <View style={S.cardHeader}>
            <Text style={{ fontSize: 46, marginBottom: 12 }}>🏏</Text>
            <Text style={S.cardTitle}>Verify Your Number</Text>
            <Text style={S.cardSub}>OTP sent to {maskedMobile}</Text>
          </View>

          <View style={S.cardBody}>
            {isNew && (
              <>
                <Text style={S.label}>YOUR NAME</Text>
                <TextInput
                  style={S.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="What should we call you?"
                  placeholderTextColor="#3a3a3a"
                  autoFocus
                />
              </>
            )}

            <Text style={S.label}>6-DIGIT OTP</Text>
            <View style={S.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={ref => { inputRefs.current[i] = ref }}
                  style={[
                    S.otpBox,
                    digit        ? S.otpBoxFilled : null,
                    error        ? S.otpBoxError  : null,
                  ]}
                  value={digit}
                  onChangeText={text => handleDigitChange(text, i)}
                  onKeyPress={e => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  caretHidden
                  autoFocus={!isNew && i === 0}
                />
              ))}
            </View>

            {error !== '' && (
              <View style={S.errorBox}>
                <Text style={S.errorTxt}>{error}</Text>
              </View>
            )}

            <Pressable
              android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
              onPress={() => handleVerify()}
              disabled={loading}
              style={[S.primaryBtn, loading && S.primaryBtnDim]}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.primaryBtnTxt}>Verify & Sign In ✓</Text>}
            </Pressable>

            <Pressable
              android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
              onPress={handleResend}
              disabled={timer > 0 || loading}
              style={S.resendBtn}
            >
              <Text style={[S.resendTxt, timer === 0 && !loading && { color: '#cc0000' }]}>
                {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={S.footerNote}>Your matches & players are private to this device 🔒</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const S = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0a0a0a' },
  scroll:        { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  backBtn:       { marginBottom: 24, alignSelf: 'flex-start' },
  backTxt:       { color: '#666', fontSize: 13, fontWeight: '700' },
  card:          { backgroundColor: '#161616', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  cardHeader:    { padding: 28, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', alignItems: 'center', backgroundColor: '#1c1c1c' },
  cardTitle:     { fontSize: 20, fontWeight: '800', color: '#f0f0f0', marginBottom: 6, textAlign: 'center' },
  cardSub:       { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
  cardBody:      { padding: 24, gap: 12 },
  label:         { fontSize: 10, color: '#666', fontWeight: '800', letterSpacing: 1.5 },
  input:         { backgroundColor: '#0d0d0d', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 13, paddingHorizontal: 16, paddingVertical: 15, color: '#f0f0f0', fontSize: 15 },
  otpRow:        { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpBox:        { flex: 1, aspectRatio: 0.85, borderRadius: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0d0d0d', textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#f0f0f0' },
  otpBoxFilled:  { borderColor: '#cc0000', backgroundColor: 'rgba(204,0,0,0.08)' },
  otpBoxError:   { borderColor: '#f87171' },
  errorBox:      { padding: 12, borderRadius: 10, backgroundColor: 'rgba(248,113,113,0.10)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)', alignItems: 'center' },
  errorTxt:      { color: '#f87171', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  primaryBtn:    { width: '100%', paddingVertical: 15, borderRadius: 13, backgroundColor: '#cc0000', alignItems: 'center', justifyContent: 'center' },
  primaryBtnDim: { backgroundColor: 'rgba(204,0,0,0.4)' },
  primaryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  resendBtn:     { alignItems: 'center', paddingVertical: 6 },
  resendTxt:     { fontSize: 12, fontWeight: '700', color: '#333' },
  footerNote:    { marginTop: 24, textAlign: 'center', fontSize: 11, color: '#2a2a2a', lineHeight: 18 },
})