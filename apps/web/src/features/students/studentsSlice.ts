import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type StudentsFiltersState = {
  query: string
  className: string
  feeStatus: 'all' | 'paid' | 'due' | 'partial'
}

const initialState: StudentsFiltersState = {
  query: '',
  className: 'all',
  feeStatus: 'all',
}

const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload
    },
    setClassName: (state, action: PayloadAction<string>) => {
      state.className = action.payload
    },
    setFeeStatus: (state, action: PayloadAction<StudentsFiltersState['feeStatus']>) => {
      state.feeStatus = action.payload
    },
    resetFilters: (state) => {
      state.query = ''
      state.className = 'all'
      state.feeStatus = 'all'
    },
  },
})

export const { resetFilters, setClassName, setFeeStatus, setQuery } = studentsSlice.actions
export default studentsSlice.reducer
