// ─────────────────────────────────────────────────────────────────────────────
// CrickyWorld — Settings Screen
// src/screens/SettingsScreen.tsx
// Converted from Settings.jsx → React Native TypeScript
// Sections: Account, Appearance (theme), Favourites, About
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  TextInput, StyleSheet, ActivityIndicator, Alert,
  StatusBar, Platform, Switch,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import { apiUrl } from '../services/api'
import type { RootStackParamList, User } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

async function getToken(): Promise<string | null> {
  try { return await AsyncStorage.getItem('token') } catch { return null }
}

// ── Theme definitions (in RN we apply these via state, not CSS vars) ──────────
const THEMES = [
  { id:'dark',     name:'Night Black',     emoji:'🖤', accent:'#ff4444', bg:'#0a0a0a', card:'#1a1a1a', text:'#f0f0f0' },
  { id:'green',    name:'Cricbuzz Green',  emoji:'🟢', accent:'#1a7a4a', bg:'#f0f2f0', card:'#f7f9f7', text:'#111111' },
  { id:'blue',     name:'Sky Blue',        emoji:'🔵', accent:'#2563eb', bg:'#eef2fb', card:'#f5f8ff', text:'#0f172a' },
  { id:'white',    name:'Pure White',      emoji:'⬜', accent:'#e11d48', bg:'#f0f0f0', card:'#f8f8f8', text:'#111111' },
]

// ── User Avatar ───────────────────────────────────────────────────────────────
function UserAvatar({ name, size=66 }: { name:string; size?:number }) {
  const palettes = [
    ['#7f1d1d','#fca5a5'],['#1e3a5f','#93c5fd'],['#064e3b','#6ee7b7'],
    ['#78350f','#fcd34d'],['#4c1d95','#c4b5fd'],['#374151','#e5e7eb'],
  ]
  const [bg, fg] = palettes[(name||'').charCodeAt(0) % palettes.length]
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  return (
    <View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:bg, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:'#ff4444' }}>
      <Text style={{ color:fg, fontSize:size*0.34, fontWeight:'700' }}>{initials}</Text>
    </View>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────
function Row({ icon, label, sub, right, onPress, danger, last=false }: {
  icon:string; label:string; sub?:string; right?:React.ReactNode;
  onPress?:()=>void; danger?:boolean; last?:boolean
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={onPress?0.7:1}
      style={[rowStyles.row, !last&&rowStyles.border]}>
      <View style={[rowStyles.iconBox, danger&&{ backgroundColor:'rgba(239,68,68,0.1)' }]}>
        <Text style={{ fontSize:18 }}>{icon}</Text>
      </View>
      <View style={rowStyles.textBox}>
        <Text style={[rowStyles.label, danger&&{ color:'#f87171' }]}>{label}</Text>
        {sub && <Text style={rowStyles.sub}>{sub}</Text>}
      </View>
      {right
        ? <View style={{ flexShrink:0 }}>{right}</View>
        : onPress && <Text style={{ color:'#2e2e2e', fontSize:20 }}>›</Text>}
    </TouchableOpacity>
  )
}
const rowStyles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:13, gap:13 },
  border: { borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.04)' },
  iconBox: { width:38, height:38, borderRadius:11, backgroundColor:'#1a1a1a', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  textBox: { flex:1, minWidth:0 },
  label: { fontSize:14, fontWeight:'700', color:'#f0f0f0', marginBottom:1 },
  sub: { fontSize:11, color:'#777', fontWeight:'600' },
})

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <View style={{ marginBottom:22 }}>
      <Text style={secStyles.label}>{label.toUpperCase()}</Text>
      <View style={secStyles.card}>{children}</View>
    </View>
  )
}
const secStyles = StyleSheet.create({
  label: { fontSize:10, fontWeight:'800', letterSpacing:2.5, color:'#555', marginBottom:8, paddingHorizontal:2 },
  card: { backgroundColor:'#141414', borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
})

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ user, onClose, onSaved }: { user:User; onClose:()=>void; onSaved:(u:User)=>void }) {
  const [name,   setName]   = useState(user.name  || '')
  const [email,  setEmail]  = useState(user.email || '')
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState<{text:string;ok:boolean}|null>(null)

  const save = async () => {
    if (!name.trim()) { setMsg({ text:'Name is required', ok:false }); return }
    setSaving(true); setMsg(null)
    try {
      const token = await getToken()
      const res = await fetch(apiUrl('/api/auth/profile'), {
        method:'PATCH', headers:{ 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify({ name:name.trim(), email:email.trim() }),
      })
      if (!res.ok) throw new Error()
      const updated: User = { ...user, name:name.trim(), email:email.trim() }
      await AsyncStorage.setItem('user', JSON.stringify(updated))
      onSaved(updated)
      setMsg({ text:'✅ Profile updated!', ok:true })
      setTimeout(onClose, 900)
    } catch { setMsg({ text:'Could not save. Please try again.', ok:false }) }
    finally { setSaving(false) }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={ep.backdrop}><TouchableOpacity style={{ flex:1 }} onPress={onClose} /></View>
      <View style={ep.sheet}>
        <View style={ep.handle} />
        <View style={ep.header}>
          <View>
            <Text style={ep.title}>Edit Profile</Text>
            <Text style={ep.sub}>Update your account information</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={ep.closeBtn}>
            <Text style={{ color:'#888', fontSize:15, fontWeight:'700' }}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={ep.body}>
          <Text style={ep.lbl}>FULL NAME</Text>
          <TextInput style={ep.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#555" />
          <Text style={ep.lbl}>EMAIL ADDRESS</Text>
          <TextInput style={ep.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" />
          {msg && (
            <View style={[ep.msgBox, { backgroundColor: msg.ok?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)', borderColor: msg.ok?'rgba(74,222,128,0.28)':'rgba(248,113,113,0.28)' }]}>
              <Text style={[ep.msgTxt, { color: msg.ok?'#4ade80':'#f87171' }]}>{msg.text}</Text>
            </View>
          )}
          <TouchableOpacity onPress={save} disabled={saving} style={[ep.saveBtn, saving&&{ opacity:0.7 }]}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={ep.saveTxt}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
const ep = StyleSheet.create({
  backdrop: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.75)' },
  sheet: { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#111', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'85%', borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  handle: { width:40, height:4, backgroundColor:'#2a2a2a', borderRadius:2, alignSelf:'center', marginTop:14 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', padding:18, paddingBottom:12, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.07)' },
  title: { color:'#f0f0f0', fontWeight:'700', fontSize:20 },
  sub: { color:'#777', fontSize:11, marginTop:2 },
  closeBtn: { width:32, height:32, borderRadius:9, backgroundColor:'#1a1a1a', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#2a2a2a' },
  body: { padding:20, paddingBottom:36 },
  lbl: { fontSize:10, color:'#777', fontWeight:'800', letterSpacing:1.5, marginBottom:6 },
  input: { backgroundColor:'#0a0a0a', borderRadius:10, borderWidth:1.5, borderColor:'rgba(255,255,255,0.07)', color:'#f0f0f0', fontSize:14, padding:12, marginBottom:16 },
  msgBox: { padding:11, borderRadius:10, borderWidth:1, marginBottom:14, alignItems:'center' },
  msgTxt: { fontSize:12, fontWeight:'700', textAlign:'center' },
  saveBtn: { backgroundColor:'#cc0000', borderRadius:12, padding:14, alignItems:'center' },
  saveTxt: { color:'#fff', fontWeight:'800', fontSize:14 },
})

// ── Favourites Section ────────────────────────────────────────────────────────
function FavouritesSection() {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites()
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(()=>setConfirmClear(false), 3000); return }
    clearFavorites(); setConfirmClear(false)
  }

  return (
    <Section label="Favourite Teams">
      {favorites.length === 0 ? (
        <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:16 }}>
          <View style={{ width:38, height:38, borderRadius:10, backgroundColor:'rgba(245,158,11,0.12)', borderWidth:1, borderColor:'rgba(245,158,11,0.2)', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontSize:18 }}>☆</Text>
          </View>
          <View>
            <Text style={{ color:'#c0c0c0', fontWeight:'700', fontSize:14 }}>No favourites yet</Text>
            <Text style={{ color:'#666', fontSize:12, marginTop:2 }}>Tap ☆ on any match card to favourite a team</Text>
          </View>
        </View>
      ) : (
        <>
          {favorites.map((team, i) => (
            <View key={team} style={[{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, paddingHorizontal:16 }, i<favorites.length-1&&{ borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.04)' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                <Text style={{ fontSize:16 }}>★</Text>
                <Text style={{ color:'#f5c842', fontWeight:'700', fontSize:14 }}>{team}</Text>
              </View>
              <TouchableOpacity onPress={()=>toggleFavorite(team)} style={{ paddingHorizontal:12, paddingVertical:5, borderRadius:8, backgroundColor:'rgba(248,113,113,0.1)', borderWidth:1, borderColor:'rgba(248,113,113,0.25)' }}>
                <Text style={{ color:'#f87171', fontSize:11, fontWeight:'800' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ padding:12 }}>
            <TouchableOpacity onPress={handleClear} style={[{ padding:10, borderRadius:10, borderWidth:1, alignItems:'center' }, confirmClear ? { borderColor:'rgba(248,113,113,0.4)', backgroundColor:'rgba(248,113,113,0.15)' } : { borderColor:'rgba(255,255,255,0.07)', backgroundColor:'transparent' }]}>
              <Text style={{ color:confirmClear?'#f87171':'#666', fontSize:13, fontWeight:'800' }}>
                {confirmClear ? '⚠️ Tap again to clear all' : '🗑 Clear All Favourites'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Section>
  )
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const navigation = useNavigation<Nav>()
  const { user: authUser, logout } = useAuth()

  const [user,     setUser]     = useState<User|null>(authUser)
  const [editing,  setEditing]  = useState(false)
  const [themeId,  setThemeId]  = useState('dark')

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Sign out of this account?', [
      { text:'Cancel', style:'cancel' },
      { text:'Log Out', style:'destructive', onPress: async () => { await logout(); setUser(null) }},
    ])
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.themeBadge}>
          <Text style={styles.themeBadgeTxt}>{theme.emoji} {theme.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── ACCOUNT ── */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.profileHero}>
              <UserAvatar name={user.name ?? '?'} size={66} />
              <View style={{ flex:1, marginLeft:16 }}>
                <Text style={styles.profileName}>{user.name || 'Player'}</Text>
                <Text style={styles.profileSub}>{user.mobile ? `+91 ${user.mobile}` : user.email || ''}</Text>
                <View style={styles.signedInBadge}>
                  <View style={styles.signedInDot} />
                  <Text style={styles.signedInTxt}>SIGNED IN</Text>
                </View>
              </View>
            </View>
            <Row icon="✏️" label="Edit Profile" sub="Change name or email" onPress={() => setEditing(true)} />
            <Row icon="🚪" label="Log Out" sub="Sign out of this account" onPress={handleLogout} danger last />
          </View>
        ) : (
          <View style={styles.loginCard}>
            <Text style={{ fontSize:48, textAlign:'center', marginBottom:12 }}>🔐</Text>
            <Text style={styles.loginTitle}>Sign In to CrickyWorld</Text>
            <Text style={styles.loginSub}>Sign in to save your stats, sync across devices and track your records</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginBtn} activeOpacity={0.8}>
              <Text style={styles.loginBtnTxt}>🔑 Log In with Mobile OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── APPEARANCE ── */}
        <Section label="Appearance">
          <View style={{ padding:16 }}>
            <Text style={{ color:'#777', fontSize:12, fontWeight:'600', marginBottom:16, lineHeight:18 }}>
              Choose a theme — updates all pages instantly.
            </Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:18 }}>
              {THEMES.map(t => {
                const active = themeId === t.id
                return (
                  <TouchableOpacity key={t.id} onPress={() => setThemeId(t.id)} activeOpacity={0.8}
                    style={[styles.themeBtn, active && { borderColor:t.accent, borderWidth:2, backgroundColor:`${t.accent}15` }]}>
                    {active && (
                      <View style={[styles.themeCheckmark, { backgroundColor:t.accent }]}>
                        <Text style={{ color:'#fff', fontSize:11, fontWeight:'900' }}>✓</Text>
                      </View>
                    )}
                    <View style={styles.themePreviewBar}>
                      {[t.bg, t.card, t.text, t.accent].map((c,i)=>(
                        <View key={i} style={{ flex: i===3?1.5:1, backgroundColor:c }} />
                      ))}
                    </View>
                    <Text style={[styles.themeName, { color: active ? t.accent : t.text }]}>{t.emoji} {t.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </Section>

        {/* ── FAVOURITES ── */}
        <FavouritesSection />

        {/* ── ABOUT ── */}
        <Section label="About">
          <Row icon="🏏" label="CrickyWorld" sub="Ball-by-ball cricket scorer & records" />
          <Row icon="📱" label="Version" sub="Current build"
            right={<View style={{ backgroundColor:'#1a1a1a', paddingHorizontal:11, paddingVertical:5, borderRadius:20, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' }}><Text style={{ color:'#777', fontSize:11, fontWeight:'800' }}>v1.0.0</Text></View>}
          />
          <Row icon="🗄️" label="Storage" sub="All data saved to MongoDB server" last />
        </Section>

      </ScrollView>

      {/* Edit Profile Modal */}
      {editing && user && (
        <EditProfileModal
          user={user}
          onClose={() => setEditing(false)}
          onSaved={u => { setUser(u); setEditing(false) }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:'#0a0a0a' },

  // Header
  header: { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingTop: Platform.OS==='ios'?50:36, paddingBottom:14, backgroundColor:'#101010', borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.06)' },
  backBtn: { width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,0.06)', alignItems:'center', justifyContent:'center' },
  backTxt: { color:'#f0f0f0', fontSize:16, fontWeight:'600' },
  headerTitle: { flex:1, color:'#f0f0f0', fontWeight:'700', fontSize:20, letterSpacing:0.5 },
  themeBadge: { paddingHorizontal:12, paddingVertical:5, borderRadius:20, backgroundColor:'rgba(255,255,255,0.06)', borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  themeBadgeTxt: { color:'#f0f0f0', fontSize:11, fontWeight:'800' },

  scroll: { flex:1 },
  scrollContent: { padding:14, paddingBottom:80 },

  // Profile card
  profileCard: { backgroundColor:'#141414', borderRadius:20, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.06)', marginBottom:22 },
  profileHero: { flexDirection:'row', alignItems:'center', padding:22, paddingBottom:18, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.06)', backgroundColor:'#1a1a1a' },
  profileName: { color:'#f0f0f0', fontWeight:'700', fontSize:20, letterSpacing:0.3, marginBottom:2 },
  profileSub: { color:'#777', fontSize:12, fontWeight:'600', marginBottom:10 },
  signedInBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,68,68,0.1)', borderRadius:20, paddingHorizontal:10, paddingVertical:3, alignSelf:'flex-start', borderWidth:1, borderColor:'rgba(255,68,68,0.2)' },
  signedInDot: { width:6, height:6, borderRadius:3, backgroundColor:'#ff4444' },
  signedInTxt: { color:'#ff4444', fontSize:10, fontWeight:'800', letterSpacing:0.5 },

  // Login card
  loginCard: { backgroundColor:'#141414', borderRadius:20, padding:24, marginBottom:22, borderWidth:1, borderColor:'rgba(255,255,255,0.06)', alignItems:'center' },
  loginTitle: { color:'#f0f0f0', fontWeight:'700', fontSize:18, marginBottom:6, textAlign:'center' },
  loginSub: { color:'#777', fontSize:12, lineHeight:18, textAlign:'center', marginBottom:18 },
  loginBtn: { width:'100%', padding:14, borderRadius:13, backgroundColor:'#cc0000', alignItems:'center', shadowColor:'#cc0000', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:10, elevation:6 },
  loginBtnTxt: { color:'#fff', fontWeight:'800', fontSize:14, letterSpacing:0.3 },

  // Theme
  themeBtn: { width:'47%', padding:14, borderRadius:14, backgroundColor:'#1a1a1a', borderWidth:1.5, borderColor:'rgba(255,255,255,0.07)', position:'relative', overflow:'hidden' },
  themeCheckmark: { position:'absolute', top:8, right:8, width:20, height:20, borderRadius:10, alignItems:'center', justifyContent:'center' },
  themePreviewBar: { flexDirection:'row', borderRadius:8, overflow:'hidden', height:28, borderWidth:1, borderColor:'rgba(255,255,255,0.08)', marginBottom:10 },
  themeName: { fontSize:13, fontWeight:'800' },
})