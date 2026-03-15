// src/types/navigation.ts
// Navigation param list — single source of truth for all route names & params

export type RootStackParamList = {
  Home:          undefined
  Login:         undefined
  Register:      undefined
  NewMatch:      undefined
  OpenMatch:     undefined
  Scoring:       { id: string }
  MatchReport:   { id: string }
  MatchDetails:  { id: string }
  Players:       undefined
  ManagePlayers: undefined
  Tournaments:   undefined
  Records:       undefined
  Settings:      undefined
}