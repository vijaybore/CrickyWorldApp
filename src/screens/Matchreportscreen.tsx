// ─────────────────────────────────────────────────────────────────────────────
// CrickyWorld — Match Report Screen
// src/screens/MatchReportScreen.tsx
// Converted from MatchReport.jsx → React Native TypeScript
// html2canvas → Share via React Native Share API (ViewShot optional)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Share,
  StyleSheet, ActivityIndicator, StatusBar, Platform,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiUrl } from '../services/api'
import type { RootStackParamList } from '../types'

type Route = RouteProp<RootStackParamList, 'MatchReport'>
type Nav   = NativeStackNavigationProp<RootStackParamList>

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtOv  = (balls:number) => `${Math.floor(balls/6)}.${balls%6}`
const getSR  = (runs:number, balls:number) => balls===0 ? '0.0' : ((runs/balls)*100).toFixed(1)
const getEco = (runs:number, balls:number) => balls===0 ? '0.0' : (runs/(balls/6)).toFixed(2)

interface BatStat { name:string; runs:number; balls:number; fours:number; sixes:number; isOut:boolean; wicketType?:string; bowlerName?:string; assistPlayer?:string }
interface BowlStat { name:string; overs:number; balls:number; runs:number; wickets:number; wides:number; noBalls:number }
interface Innings { battingTeam:string; runs:number; wickets:number; balls:number; battingStats:BatStat[]; bowlingStats:BowlStat[] }
interface MatchData { _id:string; team1:string; team2:string; overs:number; tossWinner?:string; battingFirst?:string; result?:string; innings1:Innings; innings2:Innings; status:string; createdAt?:string }

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ title, color='#555' }: { title:string; color?:string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{title}</Text>
}

// ── Batting scorecard ─────────────────────────────────────────────────────────
function BattingCard({ inn }: { inn:Innings }) {
  const rows = inn.battingStats || []
  const hs   = Math.max(...rows.map(p=>p.runs), 0)
  return (
    <View style={styles.tableWrap}>
      {/* Header */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        {['BATTER','R','B','4s','6s','SR'].map((h,i)=>(
          <Text key={h} style={[styles.th, i===0&&{ flex:2, textAlign:'left' }]}>{h}</Text>
        ))}
      </View>
      {rows.map((p,i)=>{
        const sr = getSR(p.runs, p.balls)
        return (
          <View key={i} style={[styles.tableRow, i%2===0&&{ backgroundColor:'rgba(255,255,255,0.018)' }]}>
            <Text style={[styles.td, { flex:2, textAlign:'left', color: p.runs===hs?'#f5c842':'#f0f0f0', fontWeight: p.runs===hs?'700':'400' }]} numberOfLines={1}>{p.name}</Text>
            <Text style={[styles.td, { color: p.runs>=50?'#f5c842':'#e0e0e0', fontWeight:'700' }]}>{p.runs}{p.isOut?'':'*'}</Text>
            <Text style={styles.td}>{p.balls}</Text>
            <Text style={[styles.td, { color:'#4ade80' }]}>{p.fours}</Text>
            <Text style={[styles.td, { color:'#c084fc' }]}>{p.sixes}</Text>
            <Text style={[styles.td, { color: parseFloat(sr)>=150?'#4ade80':'#888' }]}>{sr}</Text>
          </View>
        )
      })}
      {/* Total */}
      <View style={[styles.tableRow, { backgroundColor:'rgba(245,200,66,0.08)', borderTopWidth:1, borderTopColor:'rgba(245,200,66,0.3)' }]}>
        <Text style={[styles.td, { flex:3, textAlign:'left', color:'#f5c842', fontWeight:'800' }]}>TOTAL</Text>
        <Text style={[styles.td, { flex:3, textAlign:'right', color:'#f5c842', fontSize:15, fontWeight:'800' }]}>{inn.runs}/{inn.wickets} ({fmtOv(inn.balls)})</Text>
      </View>
    </View>
  )
}

// ── Bowling scorecard ─────────────────────────────────────────────────────────
function BowlingCard({ inn }: { inn:Innings }) {
  const rows = inn.bowlingStats || []
  return (
    <View style={styles.tableWrap}>
      <View style={[styles.tableRow, styles.tableHeader, { backgroundColor:'#181c28' }]}>
        {['BOWLER','O','R','W','ECO'].map((h,i)=>(
          <Text key={h} style={[styles.th, { color:'#b48aff' }, i===0&&{ flex:2, textAlign:'left' }]}>{h}</Text>
        ))}
      </View>
      {rows.map((b,i)=>{
        const eco = getEco(b.runs, b.balls)
        return (
          <View key={i} style={[styles.tableRow, i%2===0&&{ backgroundColor:'rgba(255,255,255,0.018)' }]}>
            <Text style={[styles.td, { flex:2, textAlign:'left', color: b.wickets>=3?'#c084fc':'#e0e0e0', fontWeight: b.wickets>=3?'700':'400' }]} numberOfLines={1}>{b.name}</Text>
            <Text style={styles.td}>{fmtOv(b.balls)}</Text>
            <Text style={styles.td}>{b.runs}</Text>
            <Text style={[styles.td, { color: b.wickets>0?'#c084fc':'#555', fontWeight:'700' }]}>{b.wickets}</Text>
            <Text style={[styles.td, { color: parseFloat(eco)<=6?'#4ade80':parseFloat(eco)>=12?'#f87171':'#888' }]}>{eco}</Text>
          </View>
        )
      })}
    </View>
  )
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function MatchReportScreen() {
  const route      = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const { id }     = route.params

  const [match,   setMatch]   = useState<MatchData|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl(`/api/matches/${id}`))
      .then(r => r.json())
      .then(data => setMatch(data as MatchData))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Share as text (plain text report — no screenshot needed for RN)
  const handleShare = async () => {
    if (!match) return
    const inn1 = match.innings1
    const inn2 = match.innings2
    const text = [
      `🏏 CrickyWorld Match Report`,
      `${match.team1} vs ${match.team2} | ${match.overs} Overs`,
      ``,
      `${inn1.battingTeam}: ${inn1.runs}/${inn1.wickets} (${fmtOv(inn1.balls)})`,
      inn1.battingStats.map(p=>`  ${p.name}: ${p.runs}${p.isOut?'':'*'} (${p.balls}b)`).join('\n'),
      ``,
      `${inn2.battingTeam}: ${inn2.runs}/${inn2.wickets} (${fmtOv(inn2.balls)})`,
      inn2.battingStats.map(p=>`  ${p.name}: ${p.runs}${p.isOut?'':'*'} (${p.balls}b)`).join('\n'),
      ``,
      match.result ? `Result: ${match.result}` : '',
    ].filter(l => l !== undefined).join('\n')

    try {
      await Share.share({ message: text, title: `${match.team1} vs ${match.team2}` })
    } catch { /* cancelled */ }
  }

  if (loading) return (
    <View style={[styles.root, { alignItems:'center', justifyContent:'center' }]}>
      <ActivityIndicator color="#ff4444" size="large" />
    </View>
  )

  if (!match) return (
    <View style={[styles.root, { alignItems:'center', justifyContent:'center', padding:40 }]}>
      <Text style={{ fontSize:36, marginBottom:12 }}>⚠️</Text>
      <Text style={{ color:'#f87171', fontWeight:'700', fontSize:15 }}>Match not found</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop:20, padding:12, borderRadius:10, backgroundColor:'#1a1a1a', borderWidth:1, borderColor:'#2a2a2a' }}>
        <Text style={{ color:'#f0f0f0', fontWeight:'700' }}>← Go back</Text>
      </TouchableOpacity>
    </View>
  )

  const inn1 = match.innings1
  const inn2 = match.innings2

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{match.team1} vs {match.team2}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareTxt}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Match summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.matchTitle}>{match.team1} vs {match.team2}</Text>
          <Text style={styles.matchMeta}>{match.overs} Overs · {match.tossWinner} won toss</Text>

          {/* Scores */}
          {[inn1, inn2].map((inn, i) => (
            <View key={i} style={[styles.scoreRow, i===0&&{ borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.scoreTeam}>{inn.battingTeam}</Text>
              <Text style={styles.scoreRuns}>{inn.runs}/{inn.wickets} <Text style={styles.scoreOvers}>({fmtOv(inn.balls)})</Text></Text>
            </View>
          ))}

          {match.result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>🏆 {match.result}</Text>
            </View>
          )}
        </View>

        {/* 1st Innings */}
        <SectionLabel title={`🏏 ${inn1.battingTeam} — Batting`} color="#ff4444" />
        <BattingCard inn={inn1} />
        <SectionLabel title={`🎳 Bowling vs ${inn1.battingTeam}`} color="#c084fc" />
        <BowlingCard inn={inn1} />

        {/* 2nd Innings */}
        {inn2.battingTeam ? (
          <>
            <SectionLabel title={`🏏 ${inn2.battingTeam} — Batting`} color="#ff4444" />
            <BattingCard inn={inn2} />
            <SectionLabel title={`🎳 Bowling vs ${inn2.battingTeam}`} color="#c084fc" />
            <BowlingCard inn={inn2} />
          </>
        ) : null}

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:'#0b0f1a' },

  header: { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:14, paddingTop: Platform.OS==='ios'?50:36, paddingBottom:14, backgroundColor:'#0b0f1a', borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.07)' },
  backBtn: { width:32, height:32, borderRadius:9, backgroundColor:'#151e2e', borderWidth:1, borderColor:'rgba(255,255,255,0.07)', alignItems:'center', justifyContent:'center' },
  backTxt: { color:'#94a3b8', fontSize:18, fontWeight:'600' },
  headerTitle: { flex:1, color:'#f1f5f9', fontWeight:'700', fontSize:16 },
  shareBtn: { paddingHorizontal:14, paddingVertical:7, borderRadius:10, backgroundColor:'rgba(99,179,237,0.1)', borderWidth:1, borderColor:'rgba(99,179,237,0.25)' },
  shareTxt: { color:'#60a5fa', fontSize:13, fontWeight:'800' },

  content: { padding:14, paddingBottom:60, gap:0 },

  summaryCard: { backgroundColor:'#151e2e', borderRadius:16, padding:16, marginBottom:20, borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  matchTitle: { color:'#f1f5f9', fontWeight:'700', fontSize:18, marginBottom:4 },
  matchMeta: { color:'#94a3b8', fontSize:12, marginBottom:14 },
  scoreRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:10 },
  scoreTeam: { color:'#cbd5e1', fontWeight:'700', fontSize:14 },
  scoreRuns: { fontFamily:'monospace', fontWeight:'700', fontSize:20, color:'#f1f5f9' },
  scoreOvers: { fontSize:12, color:'#94a3b8', fontWeight:'400' },
  resultBox: { marginTop:10, paddingTop:10, borderTopWidth:1, borderTopColor:'rgba(245,158,11,0.25)' },
  resultText: { color:'#f59e0b', fontWeight:'700', fontSize:13 },

  sectionLabel: { fontSize:11, fontWeight:'800', letterSpacing:1.5, marginTop:16, marginBottom:8 },

  tableWrap: { borderRadius:10, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.07)', marginBottom:8 },
  tableHeader: { backgroundColor:'#151e2e' },
  tableRow: { flexDirection:'row', paddingHorizontal:10, paddingVertical:9, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.04)' },
  th: { flex:1, textAlign:'right', fontSize:10, color:'#f5c842', fontWeight:'800', letterSpacing:0.8 },
  td: { flex:1, textAlign:'right', fontSize:12, color:'#94a3b8', fontFamily:'monospace' },
})