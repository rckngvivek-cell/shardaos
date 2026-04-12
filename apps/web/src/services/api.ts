import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { RootState } from '@/app/store'
import { buildSessionHeaders } from '@/services/auth'

const fallbackBaseUrl = 'http://localhost:8080/api/v1'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? fallbackBaseUrl

export const baseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers, api) => {
    const state = api.getState() as RootState
    const sessionHeaders = buildSessionHeaders(state.session)

    Object.entries(sessionHeaders).forEach(([key, value]) => {
      headers.set(key, value)
    })

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    return headers
  },
})
