// src/api.ts
// This file replaces the old Vite/web api.js.
// It simply re-exports everything from services/api.ts
// so any screen that imports from '../api' still works.
//
// The export keyword makes this a proper ES module,
// which PREVENTS the "Cannot redeclare BASE_URL" error.

export { API_URL, apiUrl, authHeaders, jsonHeaders, default } from './services/api'