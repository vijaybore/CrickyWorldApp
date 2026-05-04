import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { MatchProvider } from './src/context/MatchContext'
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <MatchProvider>
        <RootNavigator />
      </MatchProvider>
    </SafeAreaProvider>
  )
}