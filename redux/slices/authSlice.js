/**
 * Auth Slice - Redux state for authentication
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import config from "@/config";
import apiClient from "@/lib/apiClient";
import {
  clearRefreshToken,
  storeRefreshToken,
} from "@/services/sessionApi";

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/auth/signin", credentials);
      const accessToken = response.data?.tokens?.access_token;
      if (accessToken) {
        Cookies.set(config.tokenKey, accessToken, { expires: 7 });
      }
      if (response.data?.tokens?.refresh_token) {
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

export const organizationSignup = createAsyncThunk(
  "auth/organizationSignup",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        "/auth/organization-signup",
        payload
      );
      const accessToken = response.data?.tokens?.access_token;
      if (accessToken) {
        Cookies.set(config.tokenKey, accessToken, { expires: 7 });
      }
      if (response.data?.tokens?.refresh_token) {
        storeRefreshToken(response.data.tokens.refresh_token);
      }
      const orgId =
        response.data?.organization?.id ||
        response.data?.user?.primary_organization_id;
      if (typeof window !== "undefined" && orgId) {
        localStorage.setItem("admin_active_organization_id", orgId);
      }
      return response.data;
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message =
        detail?.error?.message ||
        (typeof detail === "string" ? detail : null) ||
        error.response?.data?.message ||
        "Failed to create organization";
      return rejectWithValue(message);
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
    Cookies.remove(config.tokenKey);
    Cookies.remove(config.refreshTokenKey);
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
  activeOrganizationId: null,
  organizations: [],
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
      state.organizations = action.payload?.organizations || [];
      state.activeOrganizationId =
        action.payload?.active_organization_id ||
        action.payload?.primary_organization_id ||
        action.payload?.organizations?.[0]?.id ||
        null;
      if (typeof window !== "undefined" && state.activeOrganizationId) {
        localStorage.setItem(
          "admin_active_organization_id",
          state.activeOrganizationId
        );
      }
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload || [];
      if (state.user) {
        state.user.permissions = action.payload || [];
      }
    },
    setActiveOrganization: (state, action) => {
      state.activeOrganizationId = action.payload;
      if (state.user) {
        state.user.active_organization_id = action.payload;
      }
      if (typeof window !== "undefined" && action.payload) {
        localStorage.setItem("admin_active_organization_id", action.payload);
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.activeOrganizationId = null;
      state.organizations = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_active_organization_id");
      }
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
      state.organizations = action.payload.user?.organizations || [];
      state.activeOrganizationId =
        action.payload.user?.active_organization_id ||
        action.payload.user?.primary_organization_id ||
        action.payload.user?.organizations?.[0]?.id ||
        null;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== "undefined" && state.activeOrganizationId) {
        localStorage.setItem(
          "admin_active_organization_id",
          state.activeOrganizationId
        );
      }
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
        state.organizations = action.payload?.user?.organizations || [];
        state.activeOrganizationId =
          action.payload?.user?.active_organization_id ||
          action.payload?.user?.primary_organization_id ||
          action.payload?.user?.organizations?.[0]?.id ||
          null;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
        if (typeof window !== "undefined" && state.activeOrganizationId) {
          localStorage.setItem(
            "admin_active_organization_id",
            state.activeOrganizationId
          );
        }
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Sign in failed";
        state.isAuthenticated = false;
      })
      .addCase(organizationSignup.pending, (state) => {
        state.error = null;
      })
      .addCase(organizationSignup.fulfilled, (state, action) => {
        state.user = action.payload?.user || null;
        state.permissions = action.payload?.user?.permissions || [];
        state.organizations = action.payload?.user?.organizations || [];
        state.activeOrganizationId =
          action.payload?.organization?.id ||
          action.payload?.user?.active_organization_id ||
          action.payload?.user?.primary_organization_id ||
          action.payload?.user?.organizations?.[0]?.id ||
          null;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
        if (typeof window !== "undefined" && state.activeOrganizationId) {
          localStorage.setItem(
            "admin_active_organization_id",
            state.activeOrganizationId
          );
        }
      })
      .addCase(organizationSignup.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Organization signup failed";
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
        state.organizations = action.payload?.organizations || [];
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_active_organization_id")
            : null;
        state.activeOrganizationId =
          stored ||
          action.payload?.active_organization_id ||
          action.payload?.primary_organization_id ||
          action.payload?.organizations?.[0]?.id ||
          null;
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
          state.activeOrganizationId = null;
          state.organizations = [];
        }
      });
  },
});

export const {
  setUser,
  setPermissions,
  setActiveOrganization,
  clearAuth,
  setLoading,
  setCredentials,
} = authSlice.actions;
export default authSlice.reducer;
