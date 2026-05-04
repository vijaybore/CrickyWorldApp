// All data is stored locally. No backend needed.
// These stubs keep existing screen imports working without changes.

export const API_URL    = ''
export const apiUrl     = (path: string): string => path

export const authHeaders = (token?: string | null): Record<string, string> => ({
  'Content-Type': 'application/json',
})

export const jsonHeaders = (token?: string | null): Record<string, string> => ({
  'Content-Type': 'application/json',
})

export default { apiUrl, authHeaders, jsonHeaders, API_URL }