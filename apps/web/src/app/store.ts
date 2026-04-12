import { configureStore } from '@reduxjs/toolkit';

import sessionReducer from '../features/session/sessionSlice';
import authReducer from './authSlice';
import examReducer from '../features/exam/examSlice';
import { schoolErpApi } from '../services/schoolErpApi';
import { examApi } from '../services/examApi';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    auth: authReducer,
    exam: examReducer,
    [schoolErpApi.reducerPath]: schoolErpApi.reducer,
    [examApi.reducerPath]: examApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(schoolErpApi.middleware)
      .concat(examApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
