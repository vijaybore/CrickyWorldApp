export type RootStackParamList = {
  Home:          undefined
  NewMatch:      undefined
  OpenMatch:     { id?: string } | undefined
  Scoring:       { id: string }
  MatchDetails:  { id: string }
  MatchReport:   { id: string }
  Players:       undefined
  ManagePlayers: undefined
  Tournaments:   undefined
  Records:       undefined
  Settings:      undefined
}

export type PlayerRole =
  | 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'
  | 'batsman' | 'bowler' | 'allrounder'  | 'wk-batsman'

export interface Player {
  _id:                string
  id?:                string
  name:               string
  role?:              PlayerRole
  mobile?:            string
  avatar?:            string
  photoUrl?:          string
  jerseyNumber?:      number | string
  battingStyle?:      string
  bowlingStyle?:      string
  totalMatches?:      number
  totalRuns?:         number
  totalWickets?:      number
  totalBallsFaced?:   number
  totalBallsBowled?:  number
  totalRunsConceded?: number
  totalFours?:        number
  totalSixes?:        number
  totalFifties?:      number
  totalHundreds?:     number
  totalWides?:        number
  highestScore?:      number
  bestBowlingW?:      number
  bestBowlingR?:      number
  fiveWickets?:       number
  timesOut?:          number
  matches?:           number
  runs?:              number
  wickets?:           number
  average?:           number
}

export interface Ball {
  ballNumber:   number
  overNumber:   number
  runs:         number
  extras?:      number
  extraType?:   'WD' | 'NB' | 'LB' | 'B' | null
  isWicket:     boolean
  isWide?:      boolean
  isNoBall?:    boolean
  wicketType?:  string
  batsmanId?:   string
  bowlerId?:    string
  batsmanName?: string
  bowlerName?:  string
  outcome?:     string
}

export interface BattingStats {
  playerId?:   string
  playerName?: string
  name?:       string
  runs:        number
  balls:       number
  fours:       number
  sixes:       number
  isOut:       boolean
  dismissal?:  string
  strikeRate:  number
  notOut?:     boolean
}

export interface BowlingStats {
  playerId?:   string
  playerName?: string
  name?:       string
  overs:       number
  balls:       number
  maidens:     number
  runs:        number
  wickets:     number
  economy:     number
  wides:       number
  noBalls:     number
}

export interface Innings {
  inningsNumber?: 1 | 2
  battingTeam?:   string
  bowlingTeam?:   string
  runs?:          number
  wickets?:       number
  totalRuns?:     number
  totalWickets?:  number
  totalOvers?:    number
  overs?:         string
  crr?:           string
  balls?:         Ball[]
  ballByBall?:    Ball[]
  battingStats?:  BattingStats[]
  bowlingStats?:  BowlingStats[]
  extras?:        { wides: number; noBalls: number; legByes: number; byes: number; total: number }
}

export type MatchFormat  = 'T20' | 'ODI' | 'Test' | 'Custom'
export type TossDecision = 'bat' | 'bowl'
export type MatchStatus  = 'setup' | 'toss' | 'innings1' | 'innings2' | 'completed'

export interface Match {
  _id:             string
  id?:             string
  title?:          string
  team1:           string
  team2:           string
  format:          MatchFormat
  overs:           number
  venue?:          string
  date?:           string
  tossWinner?:     string
  tossDecision?:   TossDecision
  battingFirst?:   string
  isCompleted:     boolean
  isLive?:         boolean
  status?:         MatchStatus | string
  result?:         string
  innings1?:       Innings
  innings2?:       Innings
  innings?:        Innings[]
  createdAt?:      string
  updatedAt?:      string
  realMatchId?:    string
  tournamentId?:   string | null
  tournamentName?: string | null
}

export interface UserSession {
  mobile:   string
  username: string
  token:    string
}