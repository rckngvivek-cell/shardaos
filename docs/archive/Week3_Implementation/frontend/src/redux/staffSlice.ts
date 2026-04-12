/**
 * Staff Redux Slice
 * Day 1: Task 2 - Redux Staff Slice Setup (1 hour)
 * Author: Frontend Team
 * Status: In Development
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// TYPES
// ============================================================================

export interface StaffData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'teacher';
  school_id: string;
  created_at: string;
  updated_at?: string;
}

export interface StaffState {
  data: StaffData | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  lastLogin: string | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: StaffState = {
  data: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  lastLogin: null,
};

// ============================================================================
// SLICE
// ============================================================================

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    /**
     * Set staff data and token after successful login
     */
    setStaff: (
      state,
      action: PayloadAction<{ staff: StaffData; token: string; refreshToken?: string }>
    ) => {
      state.data = action.payload.staff;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.error = null;
      state.lastLogin = new Date().toISOString();

      // Persist token to localStorage
      localStorage.setItem('authToken', action.payload.token);
      if (action.payload.refreshToken) {
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
    },

    /**
     * Update staff profile data
     */
    updateStaffProfile: (state, action: PayloadAction<Partial<StaffData>>) => {
      if (state.data) {
        state.data = { ...state.data, ...action.payload };
        state.updated_at = new Date().toISOString();
      }
    },

    /**
     * Clear staff data and log out
     */
    clearStaff: (state) => {
      state.data = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Restore staff from localStorage (on app load)
     */
    restoreStaff: (state, action: PayloadAction<{ staff: StaffData; token: string }>) => {
      state.data = action.payload.staff;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },

    /**
     * Set new access token (after refresh)
     */
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('authToken', action.payload);
    },

    /**
     * Handle logout
     */
    logout: (state) => {
      state.data = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    },
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setStaff,
  updateStaffProfile,
  clearStaff,
  setLoading,
  setError,
  restoreStaff,
  setAccessToken,
  logout,
} = staffSlice.actions;

export default staffSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

export const selectStaffData = (state: any) => state.staff.data;
export const selectStaffToken = (state: any) => state.staff.token;
export const selectStaffLoading = (state: any) => state.staff.loading;
export const selectStaffError = (state: any) => state.staff.error;
export const selectIsAuthenticated = (state: any) => state.staff.isAuthenticated;
export const selectStaffRole = (state: any) => state.staff.data?.role;
export const selectLastLogin = (state: any) => state.staff.lastLogin;

/**
 * Usage in Redux store:
 * 
 * import staffSlice from './staffSlice';
 * 
 * const store = configureStore({
 *   reducer: {
 *     staff: staffSlice
 *   }
 * });
 */
