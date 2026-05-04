import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types'

import HomeScreen         from '../screens/HomeScreen'
import NewMatchScreen     from '../screens/NewMatchScreen'
import OpenMatchScreen    from '../screens/OpenMatchScreen'
import ScoringScreen      from '../screens/ScoringScreen'
import MatchDetailsScreen from '../screens/MatchDetailsScreen'
import MatchReportScreen  from '../screens/MatchReportScreen'
import PlayersScreen      from '../screens/PlayersScreen'
import ManagePlayersScreen from '../screens/ManagePlayersScreen'
import TournamentsScreen  from '../screens/TournamentsScreen'
import RecordsScreen      from '../screens/RecordsScreen'
import SettingsScreen     from '../screens/SettingsScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

const DarkTheme = {
  dark: true,
  colors: {
    primary:      '#cc0000',
    background:   '#080808',
    card:         '#0c0c0c',
    text:         '#f0f0f0',
    border:       'rgba(255,255,255,0.06)',
    notification: '#cc0000',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium:  { fontFamily: 'System', fontWeight: '500' as const },
    bold:    { fontFamily: 'System', fontWeight: '700' as const },
    heavy:   { fontFamily: 'System', fontWeight: '900' as const },
  },
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Home"          component={HomeScreen} />
        <Stack.Screen name="NewMatch"      component={NewMatchScreen} />
        <Stack.Screen name="OpenMatch"     component={OpenMatchScreen} />
        <Stack.Screen name="Scoring"       component={ScoringScreen} />
        <Stack.Screen name="MatchDetails"  component={MatchDetailsScreen} />
        <Stack.Screen name="MatchReport"   component={MatchReportScreen} />
        <Stack.Screen name="Players"       component={PlayersScreen} />
        <Stack.Screen name="ManagePlayers" component={ManagePlayersScreen} />
        <Stack.Screen name="Tournaments"   component={TournamentsScreen} />
        <Stack.Screen name="Records"       component={RecordsScreen} />
        <Stack.Screen name="Settings"      component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}