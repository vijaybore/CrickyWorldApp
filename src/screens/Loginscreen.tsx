import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function LoginScreen() {
  const navigation    = useNavigation<Nav>()
  const { sendOTP }   = useAuth()
  const [mobile,  setMobile]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSendOTP = async () => {
    setError('')
    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      await sendOTP(mobile)
      navigation.navigate('OTPVerification', {
        mobile,
        isNew: true,
        name: undefined,
      })
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={S.card}>
          <View style={S.cardHeader}>
            <Text style={{ fontSize: 46, marginBottom: 12 }}>🏏</Text>
            <Text style={S.cardTitle}>Welcome to CrickyWorld</Text>
            <Text style={S.cardSub}>Sign in to save your matches & players</Text>
          </View>
          <View style={S.cardBody}>
            <Text style={S.label}>MOBILE NUMBER</Text>
            <View style={S.mobileRow}>
              <View style={S.dialCode}>
                <Text style={S.dialTxt}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={S.mobileInput}
                value={mobile}
                onChangeText={v => { setMobile(v.replace(/\D/g, '').slice(0, 10)); setError('') }}
                placeholder="10-digit number"
                placeholderTextColor="#3a3a3a"
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleSendOTP}
                autoFocus
              />
            </View>
            {error !== '' && (
              <View style={S.errorBox}>
                <Text style={S.errorTxt}>{error}</Text>
              </View>
            )}
            <Pressable
              android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
              onPress={handleSendOTP}
              disabled={loading}
              style={[S.primaryBtn, loading && S.primaryBtnDim]}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.primaryBtnTxt}>Send OTP →</Text>}
            </Pressable>
          </View>
        </View>
        <Text style={S.footerNote}>Your matches & players are private to this device 🔒</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  card:       { backgroundColor: '#161616', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  cardHeader: { padding: 28, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', alignItems: 'center', backgroundColor: '#1c1c1c' },
  cardTitle:  { fontSize: 20, fontWeight: '800', color: '#f0f0f0', marginBottom: 6, textAlign: 'center' },
  cardSub:    { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
  cardBody:   { padding: 24, gap: 12 },
  label:       { fontSize: 10, color: '#666', fontWeight: '800', letterSpacing: 1.5 },
  mobileRow:   { flexDirection: 'row', borderRadius: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  dialCode:    { paddingHorizontal: 14, paddingVertical: 15, backgroundColor: '#202020', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)', justifyContent: 'center' },
  dialTxt:     { color: '#666', fontSize: 14, fontWeight: '700' },
  mobileInput: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 15, color: '#f0f0f0', fontSize: 15 },
  errorBox: { padding: 12, borderRadius: 10, backgroundColor: 'rgba(248,113,113,0.10)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)', alignItems: 'center' },
  errorTxt: { color: '#f87171', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  primaryBtn:    { width: '100%', paddingVertical: 15, borderRadius: 13, backgroundColor: '#cc0000', alignItems: 'center', justifyContent: 'center' },
  primaryBtnDim: { backgroundColor: 'rgba(204,0,0,0.4)' },
  primaryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  footerNote: { marginTop: 24, textAlign: 'center', fontSize: 11, color: '#2a2a2a', lineHeight: 18 },
})