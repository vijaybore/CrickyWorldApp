import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Match } from '../types'

const MATCHES_KEY   = '@crickyworld_matches'
const PLAYERS_KEY   = '@crickyworld_players'

interface MatchContextValue {
  matches:        Match[]
  loading:        boolean
  createMatch:    (data: Partial<Match>) => Promise<Match>
  updateMatch:    (id: string, data: Partial<Match>) => Promise<void>
  deleteMatch:    (id: string) => Promise<void>
  refreshMatches: () => Promise<void>
  getMatch:       (id: string) => Match | undefined
}

const MatchContext = createContext<MatchContextValue | null>(null)

function generateId(): string {
  return `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const MatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { refreshMatches() }, [])

  const refreshMatches = async () => {
    setLoading(true)
    try {
      const raw = await AsyncStorage.getItem(MATCHES_KEY)
      setMatches(raw ? JSON.parse(raw) as Match[] : [])
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const saveMatches = async (updated: Match[]) => {
    setMatches(updated)
    await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(updated))
  }

  const createMatch = async (data: Partial<Match>): Promise<Match> => {
    const id = generateId()
    const newMatch: Match = {
      _id:         id,
      id:          id,
      team1:       data.team1 ?? '',
      team2:       data.team2 ?? '',
      format:      data.format ?? 'T20',
      overs:       data.overs ?? 20,
      isCompleted: false,
      isLive:      false,
      status:      'innings1',
      createdAt:   new Date().toISOString(),
      ...data,
    }
    await saveMatches([newMatch, ...matches])
    return newMatch
  }

  const updateMatch = async (id: string, data: Partial<Match>) => {
    const updated = matches.map(m =>
      (m._id === id || m.id === id) ? { ...m, ...data } : m
    )
    await saveMatches(updated)
  }

  const deleteMatch = async (id: string) => {
    const updated = matches.filter(m => m._id !== id && m.id !== id)
    await saveMatches(updated)
  }

  const getMatch = (id: string) =>
    matches.find(m => m._id === id || m.id === id)

  return (
    <MatchContext.Provider value={{
      matches, loading,
      createMatch, updateMatch, deleteMatch, refreshMatches, getMatch,
    }}>
      {children}
    </MatchContext.Provider>
  )
}

export const useMatches = (): MatchContextValue => {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatches must be used inside <MatchProvider>')
  return ctx
}