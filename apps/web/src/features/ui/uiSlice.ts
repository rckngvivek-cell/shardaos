import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  activeSchoolId: string;
}

const initialState: UiState = {
  activeSchoolId: "school-demo",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveSchoolId(state, action: PayloadAction<string>) {
      state.activeSchoolId = action.payload;
    },
  },
});

export const { setActiveSchoolId } = uiSlice.actions;
export default uiSlice.reducer;
