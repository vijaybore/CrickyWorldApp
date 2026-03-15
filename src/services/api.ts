// src/services/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Change BASE_URL to match your environment:
//   Android emulator  →  'http://10.0.2.2:5000'
//   iOS simulator     →  'http://localhost:5000'
//   Real device       →  'http://YOUR_PC_LAN_IP:5000'  e.g. 192.168.1.5:5000
//   Production        →  'https://crickyworld.onrender.com'
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://10.0.2.2:5000'

export const API_URL = BASE_URL

export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`
}

// Always returns Record<string,string> — prevents HeadersInit TS errors
export function authHeaders(token: string | null): Record<string, string> {
  if (token) return { Authorization: `Bearer ${token}` }
  return {}
}

export function jsonHeaders(token: string | null): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders(token) }
}

export default BASE_URL