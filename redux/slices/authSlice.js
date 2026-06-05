/**
 * Auth Slice - Redux state for authentication
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import config from "@/config";
import apiClient from "@/lib/apiClient";
import {
  clearRefreshToken,
  fetchAuthSession,
  logoutAllSessions,
} from "@/services/sessionApi";

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

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    const token = Cookies.get(config.tokenKey);

    const adminReturnPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";

    try {
      await logoutAllSessions(token);
    } catch (error) {
      console.warn("Server logout failed:", error);
    }

    Cookies.remove(config.tokenKey);
    Cookies.remove(config.refreshTokenKey);
    clearRefreshToken();
    dispatch(clearAuth());

    if (typeof window !== "undefined") {
      const frontendUrl = (
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ).replace(/\/$/, "");
      const params = new URLSearchParams({ from: "admin" });
      if (adminReturnPath.startsWith("/")) {
        params.set("returnTo", adminReturnPath);
      }
      window.location.href = `${frontendUrl}/login?${params.toString()}`;
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
          clearRefreshToken();
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
