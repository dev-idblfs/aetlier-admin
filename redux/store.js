/**
 * Redux Store Configuration
 */

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./services/api";
import { platformApi } from "./services/platformApi";
import authReducer from "./slices/authSlice";
import platformAuthReducer from "./slices/platformAuthSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [platformApi.reducerPath]: platformApi.reducer,
    auth: authReducer,
    platformAuth: platformAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(api.middleware, platformApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export default store;
