import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiUrl } from '../services/api'
import type { Match } from '../types'

interface RawInnings {
  battingTeam?: string
  runs?: number
  wickets?: number
  balls?: number
  ballByBall?: unknown[]
  battingStats?: unknown[]
  bowlingStats?: unknown[]
}

interface RawMatch {
  _id: string
  team1?: string
  team2?: string
  team1Players?: string[]
  team2Players?: string[]
  overs?: number
  status?: string
  tossWinner?: string
  battingFirst?: string
  result?: string
  innings1?: RawInnings
  innings2?: RawInnings
  createdAt?: string
  updatedAt?: string
  tournamentId?: string | null
  tournamentName?: string | null
}

function normalize(r: RawMatch): Match {
  const status = (r.status ?? 'setup') as Match['status']
  return {
    _id: r._id,
    id: r._id,
    team1: r.team1 ?? '',
    team2: r.team2 ?? '',
    overs: r.overs ?? 0,
    status,
    tossWinner: r.tossWinner ?? '',
    battingFirst: r.battingFirst ?? '',
    result: r.result ?? '',
    isLive: status === 'innings1' || status === 'innings2',
    isCompleted: status === 'completed',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    format: 'Custom',
    innings1: {
      battingTeam: r.innings1?.battingTeam ?? '',
      runs: r.innings1?.runs ?? 0,
      wickets: r.innings1?.wickets ?? 0,
      ballByBall: (r.innings1?.ballByBall ?? []) as any,
      battingStats: (r.innings1?.battingStats ?? []) as any,
      bowlingStats: (r.innings1?.bowlingStats ?? []) as any,
    },
    innings2: {
      battingTeam: r.innings2?.battingTeam ?? '',
      runs: r.innings2?.runs ?? 0,
      wickets: r.innings2?.wickets ?? 0,
      ballByBall: (r.innings2?.ballByBall ?? []) as any,
      battingStats: (r.innings2?.battingStats ?? []) as any,
      bowlingStats: (r.innings2?.bowlingStats ?? []) as any,
    },
  }
}

interface Options {
  liveOnly?: boolean
  pollInterval?: number
  matchId?: string | null
}

export function useLiveScores({
  liveOnly = false,
  pollInterval = 0,
  matchId = null,
}: Options = {}) {
  const [matches,    setMatches]    = useState<Match[]>([])
  const [match,      setMatch]      = useState<Match | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    if (!silent) setLoading(true)
    setError(null)
    try {
      const token = await AsyncStorage.getItem('token').catch(() => null)
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {}
      const url = matchId
        ? apiUrl(`/api/matches/${matchId}`)
        : apiUrl('/api/matches')
      const res = await fetch(url, { headers, signal: abortRef.current.signal })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const raw = await res.json()
      if (matchId) {
        setMatch(normalize(raw as RawMatch))
      } else {
        let list = (raw as RawMatch[]).map(normalize)
        if (liveOnly) list = list.filter(m => m.isLive)
        setMatches(list)
      }
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return
      setError((e as Error).message ?? 'Failed to fetch')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [matchId, liveOnly])

  useEffect(() => {
    fetchData()
    return () => abortRef.current?.abort()
  }, [fetchData])

  useEffect(() => {
    if (!pollInterval || pollInterval < 1000) return
    const id = setInterval(() => fetchData(true), pollInterval)
    return () => clearInterval(id)
  }, [pollInterval, fetchData])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
  }, [fetchData])

  return { matches, match, loading, refreshing, error, refresh }
}