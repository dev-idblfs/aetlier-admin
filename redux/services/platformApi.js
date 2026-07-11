/**
 * RTK Query — platform control-plane APIs (/api/platform/*).
 * Separate from clinic `api` slice; uses platform_access_token only.
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import config from "@/config";

const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers) => {
    const token = Cookies.get(config.platformTokenKey);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("X-Client-App", "platform");
    return headers;
  },
});

const baseQueryWithAuth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    Cookies.remove(config.platformTokenKey);
    if (typeof window !== "undefined") {
      const returnTo = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/platform/login?returnTo=${returnTo}`;
    }
  }

  return result;
};

export const platformApi = createApi({
  reducerPath: "platformApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["PlatformTenant", "PlatformOperator", "PlatformAudit", "Cutover"],
  endpoints: (builder) => ({
    listPlatformTenants: builder.query({
      query: () => "/platform/tenants",
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({
                type: "PlatformTenant",
                id,
              })),
              { type: "PlatformTenant", id: "LIST" },
            ]
          : [{ type: "PlatformTenant", id: "LIST" }],
    }),

    getPlatformTenant: builder.query({
      query: (id) => `/platform/tenants/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PlatformTenant", id }],
    }),

    createPlatformTenant: builder.mutation({
      query: (body) => ({
        url: "/platform/tenants",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "PlatformTenant", id: "LIST" },
        { type: "Cutover", id: "STATUS" },
      ],
    }),

    updatePlatformTenant: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/platform/tenants/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "PlatformTenant", id },
        { type: "PlatformTenant", id: "LIST" },
        { type: "PlatformAudit", id: "LIST" },
      ],
    }),

    suspendPlatformTenant: builder.mutation({
      query: (id) => ({
        url: `/platform/tenants/${id}/suspend`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PlatformTenant", id },
        { type: "PlatformTenant", id: "LIST" },
        { type: "PlatformAudit", id: "LIST" },
      ],
    }),

    unsuspendPlatformTenant: builder.mutation({
      query: (id) => ({
        url: `/platform/tenants/${id}/unsuspend`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PlatformTenant", id },
        { type: "PlatformTenant", id: "LIST" },
        { type: "PlatformAudit", id: "LIST" },
      ],
    }),

    retryPlatformTenant: builder.mutation({
      query: (id) => ({
        url: `/platform/tenants/${id}/retry`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PlatformTenant", id },
        { type: "PlatformTenant", id: "LIST" },
        { type: "PlatformAudit", id: "LIST" },
      ],
    }),

    dropOrphanPlatformTenantDb: builder.mutation({
      query: (id) => ({
        url: `/platform/tenants/${id}/drop-orphan-db`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PlatformTenant", id },
        { type: "PlatformTenant", id: "LIST" },
      ],
    }),

    listPlatformOperators: builder.query({
      query: () => "/platform/operators",
      providesTags: [{ type: "PlatformOperator", id: "LIST" }],
    }),

    createPlatformOperator: builder.mutation({
      query: (body) => ({
        url: "/platform/operators",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "PlatformOperator", id: "LIST" },
        { type: "PlatformAudit", id: "LIST" },
      ],
    }),

    updatePlatformOperator: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/platform/operators/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        { type: "PlatformOperator", id: "LIST" },
        { type: "PlatformAudit", id: "LIST" },
      ],
    }),

    listPlatformAudit: builder.query({
      query: ({ tenant_id, limit = 50 } = {}) => {
        const params = new URLSearchParams();
        if (tenant_id) params.set("tenant_id", tenant_id);
        params.set("limit", String(limit));
        return `/platform/audit?${params.toString()}`;
      },
      providesTags: [{ type: "PlatformAudit", id: "LIST" }],
    }),

    getCutoverStatus: builder.query({
      query: () => "/platform/cutover/status",
      providesTags: [{ type: "Cutover", id: "STATUS" }],
    }),
  }),
});

export const {
  useListPlatformTenantsQuery,
  useGetPlatformTenantQuery,
  useCreatePlatformTenantMutation,
  useUpdatePlatformTenantMutation,
  useSuspendPlatformTenantMutation,
  useUnsuspendPlatformTenantMutation,
  useRetryPlatformTenantMutation,
  useDropOrphanPlatformTenantDbMutation,
  useListPlatformOperatorsQuery,
  useCreatePlatformOperatorMutation,
  useUpdatePlatformOperatorMutation,
  useListPlatformAuditQuery,
  useGetCutoverStatusQuery,
} = platformApi;
