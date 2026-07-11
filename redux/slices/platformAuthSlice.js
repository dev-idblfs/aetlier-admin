/**
 * Platform operator auth — control-plane JWT (aud=platform).
 * Isolated from clinic admin authSlice / admin_access_token.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import config from "@/config";
import platformApiClient from "@/lib/platformApiClient";

function detailMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  return error.response?.data?.message || fallback;
}

export const platformSignIn = createAsyncThunk(
  "platformAuth/signIn",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await platformApiClient.post(
        "/platform/auth/login",
        credentials
      );
      const accessToken = response.data?.access_token;
      if (accessToken) {
        Cookies.set(config.platformTokenKey, accessToken, { expires: 1 });
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        detailMessage(error, "Invalid email or password")
      );
    }
  }
);

export const fetchPlatformOperator = createAsyncThunk(
  "platformAuth/fetchOperator",
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get(config.platformTokenKey);
      if (!token) {
        return rejectWithValue({ message: "No platform session", status: 401 });
      }
      const response = await platformApiClient.get("/platform/auth/me");
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: detailMessage(error, "Failed to fetch platform operator"),
        status: error.response?.status,
      });
    }
  }
);

export const platformLogout = createAsyncThunk(
  "platformAuth/logout",
  async ({ returnPath } = {}, { dispatch }) => {
    Cookies.remove(config.platformTokenKey);
    dispatch(clearPlatformAuth());

    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      const safePath =
        returnPath?.startsWith("/") &&
        !returnPath.startsWith("//") &&
        returnPath.startsWith("/platform")
          ? returnPath
          : null;
      if (safePath && safePath !== "/platform/login") {
        params.set("returnTo", safePath);
      }
      const qs = params.toString();
      window.location.href = qs
        ? `/platform/login?${qs}`
        : "/platform/login";
    }
  }
);

const initialState = {
  operator: null,
  capabilities: {},
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const platformAuthSlice = createSlice({
  name: "platformAuth",
  initialState,
  reducers: {
    clearPlatformAuth: (state) => {
      state.operator = null;
      state.capabilities = {};
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setPlatformLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(platformSignIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(platformSignIn.fulfilled, (state, action) => {
        state.operator = action.payload.operator;
        state.capabilities = action.payload.operator?.capabilities || {};
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(platformSignIn.rejected, (state, action) => {
        state.operator = null;
        state.capabilities = {};
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload || "Sign in failed";
      })
      .addCase(fetchPlatformOperator.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPlatformOperator.fulfilled, (state, action) => {
        state.operator = action.payload;
        state.capabilities = action.payload?.capabilities || {};
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchPlatformOperator.rejected, (state, action) => {
        state.operator = null;
        state.capabilities = {};
        state.isAuthenticated = false;
        state.isLoading = false;
        if (action.payload?.status !== 401) {
          state.error = action.payload?.message || null;
        }
      });
  },
});

export const { clearPlatformAuth, setPlatformLoading } =
  platformAuthSlice.actions;
export default platformAuthSlice.reducer;
