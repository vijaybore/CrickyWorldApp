import React, { useState } from 'react'
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, StatusBar, Switch, Alert
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function SettingsScreen() {
  const navigation = useNavigation()
  const [notifications, setNotifications] = useState(true)

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all matches and players. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Everything', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear()
          Alert.alert('Done', 'All data cleared. Restart the app.')
        }}
      ]
    )
  }

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <View style={S.header}>
        <Pressable onPress={() => navigation.goBack()} style={S.backBtn}>
          <Text style={{ color: '#666', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={S.headerTitle}>⚙️ Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <View style={S.section}>
          <Text style={S.sectionLabel}>PREFERENCES</Text>
          <View style={S.card}>
            <View style={S.settingRow}>
              <View>
                <Text style={S.settingLabel}>Notifications</Text>
                <Text style={S.settingDesc}>Match updates and reminders</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#333', true: '#cc0000' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.sectionLabel}>APP INFO</Text>
          <View style={S.card}>
            {[
              ['Version', 'v1.0.0'],
              ['Storage', 'Local device only'],
              ['Made in', 'India 🇮🇳'],
            ].map(([label, value]) => (
              <View key={label} style={[S.settingRow, { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }]}>
                <Text style={S.settingLabel}>{label}</Text>
                <Text style={{ color: '#666', fontSize: 13 }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable onPress={handleClearData} style={S.dangerBtn}>
          <Text style={S.dangerTxt}>🗑️ Clear All Data</Text>
        </Pressable>

        <Text style={S.footer}>CRICKYWORLD • v1.0.0 • MADE IN INDIA 🇮🇳</Text>
      </ScrollView>
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  backBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#f0f0f0', fontWeight: '800', fontSize: 18 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, color: '#444', fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  card: { backgroundColor: '#161616', borderRadius: 14, borderWidth: 1, borderColor: '#1f1f1f', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLabel: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  settingDesc: { color: '#444', fontSize: 12, marginTop: 2 },
  dangerBtn: { backgroundColor: 'rgba(204,0,0,0.1)', borderWidth: 1, borderColor: 'rgba(204,0,0,0.3)', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 24 },
  dangerTxt: { color: '#cc0000', fontWeight: '700', fontSize: 15 },
  footer: { textAlign: 'center', color: '#1f1f1f', fontSize: 10, letterSpacing: 2, fontWeight: '700', paddingBottom: 8 },
})