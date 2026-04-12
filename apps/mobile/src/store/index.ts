import { configureStore } from '@reduxjs/toolkit';
import { schoolErpApi } from '@/services/schoolErpApi';

export const store = configureStore({
  reducer: {
    [schoolErpApi.reducerPath]: schoolErpApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(schoolErpApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
