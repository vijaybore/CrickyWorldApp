// ─────────────────────────────────────────────────────────────────────────────
// CrickyWorld — Open Match Screen
// src/screens/OpenMatchScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { useLiveScores } from '../hooks/useLiveScores'
import { useFavorites } from '../hooks/useFavorites'
import { FavoriteToggle } from '../components/FavoriteToggle'
import { apiUrl } from '../services/api'

import type { Match, RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

// ── Helpers ─────────────────────────────────────────────────────────────

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''

  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`

  return `${Math.floor(hrs / 24)}d ago`
}

type FilterType = 'all' | 'live' | 'completed'

const STATUS_CONFIG: Record<string, { text: string; color: string; bg: string }> = {
  setup: { text: 'Setup', color: '#888', bg: 'rgba(136,136,136,0.12)' },
  innings1: { text: 'Live', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  innings2: { text: 'Live', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  completed: { text: 'Completed', color: '#facc15', bg: 'rgba(250,204,21,0.10)' },
}

// ── Match Card ─────────────────────────────────────────────────────────

interface MatchCardProps {
  match: Match
  onOpen: (m: Match) => void
  onDetails: (m: Match) => void
  onDelete: (id: string) => void
  deleting: string | null
}

function MatchCard({ match, onOpen, onDetails, onDelete, deleting }: MatchCardProps) {
  const st = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.setup
  const isLive = match.status === 'innings1' || match.status === 'innings2'
  const isDone = match.status === 'completed'

  return (
    <Pressable
      android_ripple={{ color: '#ccc' }}
      onPress={() => onOpen(match)}
      style={styles.card}
    >
      {/* Card Top */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.teamsRow}>
            <Text style={styles.teamsText} numberOfLines={1}>
              {match.team1} <Text style={styles.vsText}>vs</Text> {match.team2}
            </Text>

            <View style={styles.favRow}>
              <FavoriteToggle team={match.team1} size={15} />
              <FavoriteToggle team={match.team2} size={15} />
            </View>
          </View>

          <Text style={styles.metaText}>
            {match.overs} overs • {match.battingFirst} batted first
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[styles.statusText, { color: st.color }]}>
            {st.text}
          </Text>
        </View>
      </View>

      {/* Scores */}
      <View style={styles.scoresRow}>
        {[match.innings1, match.innings2].map((inn, i) => (
          <View key={i} style={styles.scoreBox}>
            <Text style={styles.scoreTeam} numberOfLines={1}>
              {inn.battingTeam || (i === 0 ? match.team1 : match.team2)}
            </Text>

            <Text style={styles.scoreRuns}>
              {inn.runs}/{inn.wickets}
            </Text>

            <Text style={styles.scoreOvers}>({inn.overs} ov)</Text>
          </View>
        ))}
      </View>

      {/* Result */}
      {isDone && match.result !== '' && (
        <Text style={styles.resultText}>🏆 {match.result}</Text>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.timeText}>{timeAgo(match.createdAt)}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => onDetails(match)}
            style={styles.detailsBtn}
          >
            <Text style={styles.detailsBtnText}>📊 Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpen(match)}
            style={[
              styles.openBtn,
              isLive ? styles.openBtnLive : styles.openBtnDone,
            ]}
          >
            <Text style={styles.openBtnText}>
              {isLive ? '▶ Resume' : '📋 Report'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(match.id)}
            disabled={deleting === match.id}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteBtnText}>
              {deleting === match.id ? '⏳' : '🗑'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  )
}

// ── MAIN SCREEN ─────────────────────────────────────────────────────────

export default function OpenMatchScreen() {
  const navigation = useNavigation<Nav>()

  const { isFavorite } = useFavorites()

  const {
    matches: allMatches,
    loading,
    refreshing,
    error,
    refresh,
  } = useLiveScores({ pollInterval: 20000 })

  const [filter, setFilter] = useState<FilterType>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = allMatches.filter((m) => {
    if (filter === 'live') return m.isLive
    if (filter === 'completed') return m.isCompleted
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const af = isFavorite(a.team1) || isFavorite(a.team2)
    const bf = isFavorite(b.team1) || isFavorite(b.team2)

    if (af && !bf) return -1
    if (!af && bf) return 1

    return (
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
    )
  })

  const handleOpen = (match: Match) => {
    if (match.isCompleted) {
      navigation.navigate('MatchReport', { id: match.id })
    } else {
      navigation.navigate('Scoring', { id: match.id })
    }
  }

  const handleDetails = (match: Match) => {
    navigation.navigate('MatchDetails', { id: match.id })
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete Match', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(id)

          try {
            const token = await AsyncStorage.getItem('token')

            await fetch(apiUrl(`/api/matches/${id}`), {
              method: 'DELETE',
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : {},
            })

            await refresh()
          } catch {
            Alert.alert('Error', 'Failed to delete match')
          } finally {
            setDeleting(null)
          }
        },
      },
    ])
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#080808" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ff4444" />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onOpen={handleOpen}
              onDetails={handleDetails}
              onDelete={handleDelete}
              deleting={deleting}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        />
      )}
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    overflow: 'hidden',
    margin: 10,
  },

  cardTop: {
    flexDirection: 'row',
    padding: 14,
  },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ddd',
    flex: 1,
  },

  vsText: {
    color: '#cc0000',
  },

  favRow: {
    flexDirection: 'row',
  },

  metaText: {
    fontSize: 11,
    color: '#444',
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  scoresRow: {
    flexDirection: 'row',
    padding: 14,
  },

  scoreBox: {
    flex: 1,
  },

  scoreTeam: {
    fontSize: 11,
    color: '#555',
  },

  scoreRuns: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e0e0e0',
  },

  scoreOvers: {
    fontSize: 11,
    color: '#444',
  },

  resultText: {
    paddingHorizontal: 14,
    color: '#f59e0b',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },

  timeText: {
    fontSize: 11,
    color: '#333',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  detailsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },

  detailsBtnText: {
    color: '#f59e0b',
    fontWeight: '700',
  },

  openBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  openBtnLive: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },

  openBtnDone: {
    backgroundColor: 'rgba(250,204,21,0.12)',
  },

  openBtnText: {
    color: '#ddd',
  },

  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteBtnText: {
    fontSize: 14,
  },
})