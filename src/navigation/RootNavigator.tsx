// src/navigation/RootNavigator.tsx
import React from 'react'
import { createNativeStackNavigator }  from '@react-navigation/native-stack'
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs'
import { Text }                        from 'react-native'
import type { RootStackParamList }     from '../types'

// ── Screen imports — each must match the exact filename in src/screens/
import HomeScreen          from '../screens/HomeScreen'
import LoginScreen         from '../screens/LoginScreen'
import RegisterScreen      from '../screens/RegisterScreen'
import NewMatchScreen      from '../screens/NewMatchScreen'
import OpenMatchScreen     from '../screens/OpenMatchScreen'
import MatchDetailsScreen  from '../screens/MatchDetailsScreen'
import MatchReportScreen   from '../screens/MatchReportScreen'
import PlayersScreen       from '../screens/PlayersScreen'
import ManagePlayersScreen  from '../screens/ManagePlayersScreen'
import RecordsScreen        from '../screens/RecordsScreen'
import SettingsScreen       from '../screens/SettingsScreen'
import ScoringScreen        from '../screens/ScoringScreen'
import TournamentsScreen    from '../screens/TournamentsScreen'

// ── Bottom tab param list ─────────────────────────────────────────────────────
type TabList = {
  HomeTab:     undefined
  MatchesTab:  undefined
  RecordsTab:  undefined
  SettingsTab: undefined
}

const Tab   = createBottomTabNavigator<TabList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

// ── Tab Navigator (nested inside Home stack screen) ───────────────────────────
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   '#ff4444',
        tabBarInactiveTintColor: '#333333',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={OpenMatchScreen}
        options={{ tabBarLabel: 'Matches', tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏏</Text> }}
      />
      <Tab.Screen
        name="RecordsTab"
        component={RecordsScreen}
        options={{ tabBarLabel: 'Records', tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📊</Text> }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  )
}

// ── Root Stack Navigator ───────────────────────────────────────────────────────
export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown:  false,
        animation:    'slide_from_right',
        contentStyle: { backgroundColor: '#080808' },
      }}
    >
      {/* Main tabs screen — acts as the home */}
      <Stack.Screen name="Home" component={BottomTabs} />

      {/* Auth */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />

      {/* Match flow */}
      <Stack.Screen name="NewMatch"     component={NewMatchScreen} />
      <Stack.Screen name="OpenMatch"    component={OpenMatchScreen} />
      <Stack.Screen name="Scoring"       component={ScoringScreen}
        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="MatchDetails"  component={MatchDetailsScreen}
        options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="MatchReport"   component={MatchReportScreen} />

      {/* Players */}
      <Stack.Screen name="Players"       component={PlayersScreen} />
      <Stack.Screen name="ManagePlayers" component={ManagePlayersScreen} />

      {/* Tournaments */}
      <Stack.Screen name="Tournaments"   component={TournamentsScreen} />

      {/* Records & Settings */}
      <Stack.Screen name="Records"  component={RecordsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  )
}

export default RootNavigator