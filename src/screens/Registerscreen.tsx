// src/screens/RegisterScreen.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput , Pressable, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar} from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiUrl } from '../services/api'
import type { RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

interface Form { name: string; mobile: string; password: string; confirmPassword: string }

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>()
  const [form,         setForm]         = useState<Form>({ name: '', mobile: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const set = (field: keyof Form, value: string) => { setForm(f => ({ ...f, [field]: value })); setError('') }

  const handleSubmit = async () => {
    if (!form.name || !form.mobile || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.'); return
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.mobile, password: form.password })})
      const data = await res.json() as { token?: string; message?: string }
      if (!res.ok) { setError(data.message ?? 'Registration failed.'); return }
      if (data.token) await AsyncStorage.setItem('token', data.token)
      // Reset stack so user can't go back to register screen
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))
    } catch {
      setError('Could not connect to server. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <View style={S.logoCircle}><Text style={{ fontSize: 28 }}>🏏</Text></View>
        </View>
        <Text style={S.title}>CrickyWorld</Text>
        <Text style={S.tagline}>SCORE · TRACK · WIN</Text>
        <Text style={S.subtitle}>Create your account</Text>

        {/* Name */}
        <Text style={S.label}>🧑 FULL NAME</Text>
        <TextInput style={S.input} placeholder="Enter your full name" placeholderTextColor="#555"
          value={form.name} onChangeText={v => set('name', v)} autoCapitalize="words" returnKeyType="next" />

        {/* Mobile */}
        <Text style={S.label}>📱 MOBILE NUMBER</Text>
        <View style={S.mobileRow}>
          <View style={S.dialCode}><Text style={S.dialTxt}>IN +91</Text></View>
          <TextInput style={[S.input, { flex: 1, borderWidth: 0, borderRadius: 0 }]}
            placeholder="Enter mobile number" placeholderTextColor="#555"
            value={form.mobile} onChangeText={v => set('mobile', v)}
            keyboardType="phone-pad" maxLength={10} returnKeyType="next" />
        </View>

        {/* Password */}
        <Text style={S.label}>🔒 PASSWORD</Text>
        <View style={S.passWrap}>
          <TextInput style={[S.input, { paddingRight: 50 }]}
            placeholder="Min 6 characters" placeholderTextColor="#555"
            value={form.password} onChangeText={v => set('password', v)}
            secureTextEntry={!showPassword} returnKeyType="next" />
          <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={() => setShowPassword(p => !p)} style={S.eyeBtn}>
            <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
          </Pressable>
        </View>

        {/* Confirm */}
        <Text style={S.label}>🔒 CONFIRM PASSWORD</Text>
        <View style={S.passWrap}>
          <TextInput style={[S.input, { paddingRight: 50 }]}
            placeholder="Repeat your password" placeholderTextColor="#555"
            value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)}
            secureTextEntry={!showConfirm} returnKeyType="done" onSubmitEditing={handleSubmit} />
          <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={() => setShowConfirm(p => !p)} style={S.eyeBtn}>
            <Text style={{ fontSize: 16 }}>{showConfirm ? '🙈' : '👁️'}</Text>
          </Pressable>
        </View>

        {error !== '' && (
          <View style={S.errorBox}><Text style={S.errorTxt}>⚠️ {error}</Text></View>
        )}

        <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={handleSubmit} disabled={loading}
          style={[S.submitBtn, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" size="small" />
                   : <Text style={S.submitTxt}>🏏 CREATE ACCOUNT</Text>}
        </Pressable>

        {/* Divider */}
        <View style={S.divider}>
          <View style={S.divLine} /><Text style={S.divTxt}>OR</Text><View style={S.divLine} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: '#777', fontSize: 13 }}>Already have an account? </Text>
          <Pressable android_ripple={{ color: "rgba(255,255,255,0.12)" }} onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: '#e63946', fontSize: 13, fontWeight: '600' }}>Sign in here →</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logoCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#c1121f', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, marginTop: 8 },
  tagline: { color: '#e63946', fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 3, marginTop: 2 },
  subtitle: { color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  label: { color: '#aaa', fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a', borderRadius: 10, color: '#fff', fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  mobileRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2a2a', overflow: 'hidden' },
  dialCode: { backgroundColor: '#1a1a1a', paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#2a2a2a' },
  dialTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', opacity: 0.6 },
  errorBox: { padding: 10, borderRadius: 8, backgroundColor: 'rgba(230,57,70,0.1)', borderWidth: 1, borderColor: 'rgba(230,57,70,0.3)', marginTop: 8 },
  errorTxt: { color: '#ff6b6b', fontSize: 13 },
  submitBtn: { backgroundColor: '#e63946', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  submitTxt: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: '#2a2a2a' },
  divTxt: { color: '#555', fontSize: 12, fontWeight: '600', letterSpacing: 1 }})