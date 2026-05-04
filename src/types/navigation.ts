// src/types/navigation.ts
// ─────────────────────────────────────────────────────────────────────────────
// CrickyWorld — Typed navigation hooks
// Import these instead of the raw useNavigation / useRoute hooks
// so every screen gets full type-safety and autocomplete.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from './index'

// ─── Typed useNavigation ──────────────────────────────────────────────────────
export type AppNavigation = NativeStackNavigationProp<RootStackParamList>

export const useAppNavigation = () => useNavigation<AppNavigation>()

// ─── Typed useRoute ───────────────────────────────────────────────────────────
export type AppRoute<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>

export const useAppRoute = <T extends keyof RootStackParamList>() =>
  useRoute<AppRoute<T>>()