/**
 * Auth Slice - Redux state for authentication
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import config from "@/config";
import apiClient from "@/lib/apiClient";

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to fetch profile",
        status: error.response?.status,
      });
    }
  }
);

// Async thunk for logout — admin cookie only; frontend session stays intact.
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    Cookies.remove(config.tokenKey);
    Cookies.remove(config.refreshTokenKey);
    dispatch(clearAuth());

    if (typeof window !== "undefined") {
      const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
      window.location.href = frontendUrl;
    }
  }
);

const initialState = {
  user: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload || [];
      // Also attach to user object for convenience
      if (state.user) {
        state.user.permissions = action.payload || [];
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.permissions = action.payload.permissions || [];
      if (state.user) {
        state.user.permissions = action.payload.permissions || [];
      }
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.permissions = action.payload?.permissions || [];
        if (state.user && !state.user.permissions?.length) {
          state.user.permissions = state.permissions;
        }
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Authentication failed";
        if (action.payload?.status === 401) {
          Cookies.remove(config.tokenKey);
          Cookies.remove(config.refreshTokenKey);
          state.user = null;
          state.isAuthenticated = false;
        }
      });
  },
});

export const {
  setUser,
  setPermissions,
  clearAuth,
  setLoading,
  setCredentials,
} = authSlice.actions;
export default authSlice.reducer;
