// src/services/api.ts

const BASE_URL = "https://crickyworld-server.onrender.com"

export function apiUrl(path: string) {
  return `${BASE_URL}${path}`
}

export function authHeaders(token?: string | null) {
  const headers: any = {}

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

export function jsonHeaders(token?: string | null) {
  const headers: any = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}