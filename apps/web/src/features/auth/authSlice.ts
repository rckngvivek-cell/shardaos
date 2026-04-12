import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '@school-erp/shared';

interface AuthState {
  uid: string | null;
  email: string | null;
  role: UserRole | null;
  schoolId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  uid: null,
  email: null,
  role: null,
  schoolId: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ uid: string; email: string; role: UserRole; schoolId: string }>) {
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.schoolId = action.payload.schoolId;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    logout(state) {
      state.uid = null;
      state.email = null;
      state.role = null;
      state.schoolId = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
