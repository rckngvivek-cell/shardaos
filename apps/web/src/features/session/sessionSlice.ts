import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { UserRole } from '@/types/school'

export type AuthMode = 'dev' | 'firebase'

export type SessionState = {
  authMode: AuthMode
  role: UserRole
  schoolId: string
  userId: string
  email: string
  displayName: string
  firebaseIdToken: string | null
  sidebarOpen: boolean
}

const devProfiles: Record<UserRole, Pick<SessionState, 'userId' | 'email' | 'displayName'>> = {
  principal: {
    userId: 'dev-principal',
    email: 'ops@demo.school',
    displayName: 'Operations Lead',
  },
  teacher: {
    userId: 'dev-teacher',
    email: 'teacher@demo.school',
    displayName: 'Class Teacher',
  },
  admin: {
    userId: 'dev-admin',
    email: 'admin@demo.school',
    displayName: 'School Admin',
  },
  parent: {
    userId: 'dev-parent',
    email: 'parent@demo.school',
    displayName: 'Parent Portal',
  },
}

function applyDevProfile(state: SessionState) {
  const profile = devProfiles[state.role]
  state.userId = profile.userId
  state.email = profile.email
  state.displayName = profile.displayName
}

const initialState: SessionState = {
  authMode: 'dev',
  role: 'principal',
  schoolId: 'demo-school',
  userId: devProfiles.principal.userId,
  email: devProfiles.principal.email,
  displayName: devProfiles.principal.displayName,
  firebaseIdToken: null,
  sidebarOpen: false,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setAuthMode: (state, action: PayloadAction<AuthMode>) => {
      state.authMode = action.payload

      if (action.payload === 'dev') {
        applyDevProfile(state)
      }
    },
    setFirebaseIdToken: (state, action: PayloadAction<string | null>) => {
      const token = action.payload?.trim() ?? null
      state.firebaseIdToken = token

      if (token) {
        state.authMode = 'firebase'
      } else if (state.authMode === 'firebase') {
        state.authMode = 'dev'
        applyDevProfile(state)
      }
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload

      if (state.authMode === 'dev') {
        applyDevProfile(state)
      }
    },
    setSchoolId: (state, action: PayloadAction<string>) => {
      state.schoolId = action.payload.trim() || state.schoolId
    },
    setDisplayName: (state, action: PayloadAction<string>) => {
      state.displayName = action.payload.trim() || state.displayName
    },
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload.trim() || state.email
    },
    resetSession: (state) => {
      state.authMode = 'dev'
      state.role = 'principal'
      state.schoolId = initialState.schoolId
      state.firebaseIdToken = null
      state.sidebarOpen = false
      applyDevProfile(state)
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false
    },
  },
})

export const {
  closeSidebar,
  resetSession,
  setAuthMode,
  setDisplayName,
  setEmail,
  setFirebaseIdToken,
  setRole,
  setSchoolId,
  toggleSidebar,
} = sessionSlice.actions

export default sessionSlice.reducer
