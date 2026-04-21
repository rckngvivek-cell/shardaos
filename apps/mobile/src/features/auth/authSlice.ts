import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '@school-erp/shared';

interface AuthState {
  uid: string | null;
  role: UserRole | null;
  schoolId: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  uid: null,
  role: null,
  schoolId: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ uid: string; role: UserRole; schoolId: string }>) {
      state.uid = action.payload.uid;
      state.role = action.payload.role;
      state.schoolId = action.payload.schoolId;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.uid = null;
      state.role = null;
      state.schoolId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
