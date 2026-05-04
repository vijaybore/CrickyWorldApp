// src/navigation/AppNavigator.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CrickyWorld — Root Navigator
// Shows a splash loader while AuthContext restores the session,
// then routes to Home (logged in) or Login (not logged in).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '../context/AuthContext'
import LoginScreen           from '../screens/Loginscreen'
import OTPVerificationScreen from '../screens/OTPVerificationScreen'
import HomeScreen            from '../screens/HomeScreen'    // ← your existing Home
import type { RootStackParamList } from '../types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const { user, loading } = useAuth()

  // While AsyncStorage restores the session, show a splash
  if (loading) {
    return (
      <View style={S.splash}>
        <ActivityIndicator size="large" color="#cc0000" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? 'Home' : 'Login'}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* ── Auth screens ─────────────────────────────────────────────── */}
        <Stack.Screen name="Login"           component={LoginScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />

        {/* ── App screens ──────────────────────────────────────────────── */}
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* Add more screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const S = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
})