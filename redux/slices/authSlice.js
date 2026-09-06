/**
 * Auth Slice - Redux state for authentication
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/lib/apiClient";
import { setAccessTokenCookie, removeAccessTokenCookie } from "@/lib/authCookies";
import {
  clearRefreshToken,
  storeRefreshToken,
  usesCookieAuth,
} from "@/services/sessionApi";

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/auth/signin", credentials);
      const accessToken = response.data?.tokens?.access_token;
      if (accessToken) {
        setAccessTokenCookie(accessToken);
      }
      if (response.data?.tokens?.refresh_token && !usesCookieAuth()) {
        storeRefreshToken(response.data.tokens.refresh_token);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Invalid email or password"
      );
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/auth/google", credentials);
      const accessToken = response.data?.tokens?.access_token;
      if (accessToken) {
        setAccessTokenCookie(accessToken);
      }
      if (response.data?.tokens?.refresh_token && !usesCookieAuth()) {
        storeRefreshToken(response.data.tokens.refresh_token);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Google sign-in failed"
      );
    }
  }
);

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
  async ({ returnPath } = {}, { dispatch }) => {
    // Local admin logout only — do not revoke server sessions or the shared
    // refresh cookie, so the user can re-enter admin via SSO from www.
    removeAccessTokenCookie();
    clearRefreshToken();
    dispatch(clearAuth());

    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      const safePath =
        returnPath?.startsWith("/") && !returnPath.startsWith("//")
          ? returnPath
          : null;
      if (safePath && safePath !== "/login") {
        params.set("returnTo", safePath);
      }
      const qs = params.toString();
      window.location.href = qs ? `/login?${qs}` : "/login";
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
      .addCase(signIn.pending, (state) => {
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload?.user || null;
        state.permissions = action.payload?.user?.permissions || [];
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Sign in failed";
        state.isAuthenticated = false;
      })
      .addCase(googleLogin.pending, (state) => {
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload?.user || null;
        state.permissions = action.payload?.user?.permissions || [];
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Google sign-in failed";
        state.isAuthenticated = false;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        if (!state.isAuthenticated) {
          state.isLoading = true;
        }
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
          removeAccessTokenCookie();
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
