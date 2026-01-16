/**
 * RTK Query API Service
 * RESTful endpoints following naming conventions
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import config from "@/config";

const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers) => {
    const token = Cookies.get(config.tokenKey);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Handle 401 errors globally
const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    Cookies.remove(config.tokenKey);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Appointment",
    "User",
    "Doctor",
    "Service",
    "Role",
    "Permission",
    "Invoice",
    "Expense",
    "ExpenseCategory",
    "Customer",
    "Report",
    "Navigation",
    "Wallet",
  ],
  endpoints: (builder) => ({
    // =========================================================================
    // AUTH ENDPOINTS
    // =========================================================================

    // POST /auth/google - Google OAuth login
    googleLogin: builder.mutation({
      query: (credentials) => ({
        url: "/auth/google",
        method: "POST",
        body: credentials,
      }),
    }),

    // POST /auth/signin - Email/password login
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/signin",
        method: "POST",
        body: credentials,
      }),
    }),

    // GET /auth/me - Get current user
    getCurrentUser: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    // =========================================================================
    // APPOINTMENT ENDPOINTS (RESTful)
    // =========================================================================

    // GET /appointments - List all appointments with pagination
    getAppointments: builder.query({
      query: ({
        page = 1,
        page_size = 10,
        status,
        date_from,
        date_to,
        scope,
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: page_size.toString(),
        });
        if (status) params.append("status", status);
        if (date_from) params.append("date_from", date_from);
        if (date_to) params.append("date_to", date_to);
        if (scope) params.append("scope", scope);
        return `/appointments?${params.toString()}`;
      },
      providesTags: ["Appointment"],
    }),

    // GET /appointments/:id - Get single appointment
    getAppointment: builder.query({
      query: (id) => `/appointments/${id}`,
      providesTags: (result, error, id) => [{ type: "Appointment", id }],
    }),

    // POST /appointments - Create new appointment
    createAppointment: builder.mutation({
      query: (data) => ({
        url: "/appointments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Appointment"],
    }),

    // PATCH /appointments/:id - Update appointment
    updateAppointment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/appointments/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Appointment", id },
        "Appointment",
      ],
    }),

    // DELETE /appointments/:id - Cancel appointment
    deleteAppointment: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/appointments/${id}${
          reason ? `?reason=${encodeURIComponent(reason)}` : ""
        }`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointment"],
    }),

    // =========================================================================
    // USER ENDPOINTS (Admin)
    // =========================================================================

    // GET /admin/users - List all users with roles
    getUsers: builder.query({
      query: ({ skip = 0, limit = 100 } = {}) => {
        const params = new URLSearchParams({
          skip: skip.toString(),
          limit: limit.toString(),
        });
        return `/admin/users?${params.toString()}`;
      },
      providesTags: ["User"],
    }),

    // GET /admin/users/:id - Get single user
    getUser: builder.query({
      query: (userId) => `/admin/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    // POST /admin/users - Create new user
    createUser: builder.mutation({
      query: ({ email, name, phone, password, is_active }) => {
        const params = new URLSearchParams({ email, name });
        if (phone) params.append("phone", phone);
        if (password) params.append("password", password);
        if (is_active !== undefined) params.append("is_active", is_active);
        return {
          url: `/admin/users?${params.toString()}`,
          method: "POST",
        };
      },
      invalidatesTags: ["User"],
    }),

    // PATCH /admin/users/:id - Update user
    updateUser: builder.mutation({
      query: ({ id, name, phone, is_active, is_verified }) => {
        const params = new URLSearchParams();
        if (name !== undefined) params.append("name", name);
        if (phone !== undefined) params.append("phone", phone);
        if (is_active !== undefined) params.append("is_active", is_active);
        if (is_verified !== undefined)
          params.append("is_verified", is_verified);
        return {
          url: `/admin/users/${id}?${params.toString()}`,
          method: "PATCH",
        };
      },
      invalidatesTags: ["User"],
    }),

    // DELETE /admin/users/:id - Delete user
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // GET /admin/users/:id/permissions - Get user's permissions
    getUserPermissions: builder.query({
      query: (userId) => `/admin/users/${userId}/permissions`,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    // POST /admin/users/:id/assign-role - Assign role to user
    assignUserRole: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/admin/users/${userId}/assign-role?role_id=${roleId}`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    // DELETE /admin/users/:id/revoke-role - Revoke role from user
    revokeUserRole: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/admin/users/${userId}/revoke-role?role_id=${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // =========================================================================
    // USER PREFERENCES ENDPOINTS
    // =========================================================================

    // GET /users/:userId/preferences - Get user preferences
    getUserPreferences: builder.query({
      query: (userId) => `/users/${userId}/preferences`,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    // PATCH /users/:userId/preferences - Update user preferences
    updateUserPreferences: builder.mutation({
      query: ({ userId, preferences }) => ({
        url: `/users/${userId}/preferences`,
        method: "PATCH",
        body: preferences,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),

    // =========================================================================
    // ROLE & PERMISSION ENDPOINTS
    // =========================================================================

    // GET /admin/roles - List all roles
    getRoles: builder.query({
      query: () => "/admin/roles",
      providesTags: ["Role"],
    }),

    // POST /admin/roles - Create role
    createRole: builder.mutation({
      query: (data) => ({
        url: "/admin/roles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Role"],
    }),

    // PATCH /admin/roles/:id - Update role
    updateRole: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/roles/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Role"],
    }),

    // DELETE /admin/roles/:id - Delete role
    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/admin/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    // GET /admin/permissions - List all permissions
    getPermissions: builder.query({
      query: () => "/admin/permissions",
      providesTags: ["Permission"],
    }),

    // POST /admin/permissions - Create permission
    createPermission: builder.mutation({
      query: (data) => ({
        url: "/admin/permissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Permission"],
    }),

    // POST /admin/roles/:id/permissions - Add permission to role
    addPermissionToRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: `/admin/roles/${roleId}/permissions/${permissionId}`,
        method: "POST",
      }),
      invalidatesTags: ["Role"],
    }),

    // DELETE /admin/roles/:id/permissions/:permissionId - Remove permission from role
    removePermissionFromRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: `/admin/roles/${roleId}/permissions/${permissionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    // =========================================================================
    // DOCTOR ENDPOINTS (RESTful)
    // =========================================================================

    // GET /doctors - List all doctors
    getDoctors: builder.query({
      query: ({ active_only = false } = {}) => {
        const params = new URLSearchParams();
        if (active_only) params.append("active_only", "true");
        const queryString = params.toString();
        return `/doctors${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Doctor"],
    }),

    // GET /doctors/specialty/:specialization - Filter by specialization
    getDoctorsBySpecialty: builder.query({
      query: (specialization) =>
        `/doctors/specialty/${encodeURIComponent(specialization)}`,
      providesTags: ["Doctor"],
    }),

    // GET /doctors/:id - Get single doctor
    getDoctor: builder.query({
      query: (id) => `/doctors/${id}`,
      providesTags: (result, error, id) => [{ type: "Doctor", id }],
    }),

    // POST /doctors - Create doctor
    createDoctor: builder.mutation({
      query: (data) => ({
        url: "/doctors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Doctor"],
    }),

    // PATCH /doctors/:id - Update doctor
    updateDoctor: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/doctors/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Doctor", id },
        "Doctor",
      ],
    }),

    // DELETE /doctors/:id - Delete doctor
    deleteDoctor: builder.mutation({
      query: (id) => ({
        url: `/doctors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Doctor"],
    }),

    // =========================================================================
    // SERVICE ENDPOINTS (RESTful)
    // =========================================================================

    // GET /services - List all services
    getServices: builder.query({
      query: () => "/services",
      providesTags: ["Service"],
    }),

    // GET /services/category/:category - Get services by category
    getServicesByCategory: builder.query({
      query: (category) => `/services/category/${encodeURIComponent(category)}`,
      providesTags: ["Service"],
    }),

    // GET /services/:id - Get single service
    getService: builder.query({
      query: (id) => `/services/${id}`,
      providesTags: (result, error, id) => [{ type: "Service", id }],
    }),

    // POST /services - Create service
    createService: builder.mutation({
      query: (data) => ({
        url: "/services",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Service"],
    }),

    // PATCH /services/:id - Update service
    updateService: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/services/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Service", id },
        "Service",
      ],
    }),

    // DELETE /services/:id - Delete service
    deleteService: builder.mutation({
      query: (id) => ({
        url: `/services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Service"],
    }),

    // =========================================================================
    // INVOICE ENDPOINTS
    // =========================================================================

    // GET /invoices/settings - Get invoice settings
    getInvoiceSettings: builder.query({
      query: () => "/invoices/settings",
      providesTags: ["Invoice"],
    }),

    // PATCH /invoices/settings - Update invoice settings
    updateInvoiceSettings: builder.mutation({
      query: (data) => ({
        url: "/invoices/settings",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Invoice"],
    }),

    // POST /invoices/settings/logo - Upload invoice logo
    uploadInvoiceLogo: builder.mutation({
      query: (formData) => ({
        url: "/invoices/settings/logo",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Invoice"],
    }),

    // GET /invoices - List invoices
    getInvoices: builder.query({
      query: ({
        page = 1,
        page_size = 20,
        status,
        date_from,
        date_to,
        customer_id,
        search,
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: page_size.toString(),
        });
        if (status) params.append("status", status);
        if (date_from) params.append("date_from", date_from);
        if (date_to) params.append("date_to", date_to);
        if (customer_id) params.append("customer_id", customer_id);
        if (search) params.append("search", search);
        return `/invoices?${params.toString()}`;
      },
      providesTags: ["Invoice"],
    }),

    // GET /invoices/:id - Get single invoice
    getInvoice: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: "Invoice", id }],
    }),

    // POST /invoices/check-duplicates - Check for duplicate invoices
    checkDuplicateInvoices: builder.mutation({
      query: ({ user_id, grand_total, invoice_date, exclude_invoice_id }) => {
        const params = new URLSearchParams({
          user_id: user_id,
          grand_total: grand_total.toString(),
          invoice_date: invoice_date,
        });
        if (exclude_invoice_id) {
          params.append("exclude_invoice_id", exclude_invoice_id);
        }
        return {
          url: `/invoices/check-duplicates?${params.toString()}`,
          method: "POST",
        };
      },
    }),

    // POST /invoices - Create invoice
    createInvoice: builder.mutation({
      query: ({ force_create = false, ...data }) => ({
        url: `/invoices?force_create=${force_create}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Invoice"],
    }),

    // PATCH /invoices/:id - Update invoice
    updateInvoice: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/invoices/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Invoice", id },
        "Invoice",
      ],
    }),

    // DELETE /invoices/:id - Cancel invoice
    cancelInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoice"],
    }),

    // POST /invoices/:id/payment - Record payment
    recordInvoicePayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/invoices/${id}/payment`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Invoice", id },
        "Invoice",
      ],
    }),

    // GET /invoices/:id/pdf - Download PDF (returns blob URL)
    getInvoicePdfUrl: builder.query({
      query: (id) => `/invoices/${id}/pdf`,
      responseHandler: async (response) => {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      },
    }),

    // POST /invoices/:id/send - Send invoice email
    sendInvoice: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/invoices/${id}/send`,
        method: "POST",
        body: data,
      }),
    }),

    // POST /invoices/create-from-appointment - Create invoice from appointment
    createInvoiceFromAppointment: builder.mutation({
      query: (appointmentId) => ({
        url: `/invoices/create-from-appointment?appointment_id=${appointmentId}`,
        method: "POST",
      }),
      invalidatesTags: ["Invoice", "Appointment"],
    }),

    // =========================================================================
    // EXPENSE ENDPOINTS
    // =========================================================================

    // GET /expenses/categories - List expense categories
    getExpenseCategories: builder.query({
      query: (includeInactive = false) =>
        `/expenses/categories?include_inactive=${includeInactive}`,
      providesTags: ["ExpenseCategory"],
    }),

    // POST /expenses/categories - Create category
    createExpenseCategory: builder.mutation({
      query: (data) => ({
        url: "/expenses/categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ExpenseCategory"],
    }),

    // PATCH /expenses/categories/:id - Update category
    updateExpenseCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/expenses/categories/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ExpenseCategory"],
    }),

    // DELETE /expenses/categories/:id - Delete category
    deleteExpenseCategory: builder.mutation({
      query: (id) => ({
        url: `/expenses/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExpenseCategory"],
    }),

    // POST /expenses/categories/seed - Seed default categories
    seedExpenseCategories: builder.mutation({
      query: () => ({
        url: "/expenses/categories/seed",
        method: "POST",
      }),
      invalidatesTags: ["ExpenseCategory"],
    }),

    // GET /expenses - List expenses
    getExpenses: builder.query({
      query: ({
        page = 1,
        page_size = 20,
        category_id,
        date_from,
        date_to,
        payment_status,
        search,
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: page_size.toString(),
        });
        if (category_id) params.append("category_id", category_id);
        if (date_from) params.append("date_from", date_from);
        if (date_to) params.append("date_to", date_to);
        if (payment_status) params.append("payment_status", payment_status);
        if (search) params.append("search", search);
        return `/expenses?${params.toString()}`;
      },
      providesTags: ["Expense"],
    }),

    // GET /expenses/:id - Get single expense
    getExpense: builder.query({
      query: (id) => `/expenses/${id}`,
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),

    // POST /expenses - Create expense
    createExpense: builder.mutation({
      query: (data) => ({
        url: "/expenses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Expense"],
    }),

    // PATCH /expenses/:id - Update expense
    updateExpense: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/expenses/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Expense", id },
        "Expense",
      ],
    }),

    // DELETE /expenses/:id - Delete expense
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expense"],
    }),

    // POST /expenses/:id/receipt - Upload receipt
    uploadExpenseReceipt: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/expenses/${id}/receipt`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Expense", id }],
    }),

    // =========================================================================
    // CUSTOMER ENDPOINTS
    // =========================================================================

    // GET /customers - List customers
    getCustomers: builder.query({
      query: ({
        page = 1,
        page_size = 20,
        search,
        customer_type,
        is_active = true,
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: page_size.toString(),
        });
        if (search) params.append("search", search);
        if (customer_type) params.append("customer_type", customer_type);
        if (is_active !== undefined) params.append("is_active", is_active);
        return `/customers?${params.toString()}`;
      },
      providesTags: ["Customer"],
    }),

    // GET /customers/search - Search customers (autocomplete)
    searchCustomers: builder.query({
      query: ({ q, limit = 10 }) =>
        `/customers/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      providesTags: ["Customer"],
    }),

    // GET /customers/:id - Get single customer
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),

    // POST /customers - Create customer
    createCustomer: builder.mutation({
      query: (data) => ({
        url: "/customers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Customer"],
    }),

    // PATCH /customers/:id - Update customer
    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/customers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Customer", id },
        "Customer",
      ],
    }),

    // DELETE /customers/:id - Delete customer
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customer"],
    }),

    // =========================================================================
    // WALLET / REFERRAL ENDPOINTS
    // =========================================================================

    // GET /wallet/:user_id - Get user's coin wallet (admin only)
    getUserWallet: builder.query({
      query: (userId) => `/wallet/${userId}`,
      providesTags: (result, error, userId) => [{ type: "Wallet", id: userId }],
    }),

    // =========================================================================
    // FINANCIAL REPORTS ENDPOINTS
    // =========================================================================

    // GET /reports/dashboard - Financial dashboard
    getFinancialDashboard: builder.query({
      query: ({ date_from, date_to } = {}) => {
        const params = new URLSearchParams();
        if (date_from) params.append("date_from", date_from);
        if (date_to) params.append("date_to", date_to);
        const queryString = params.toString();
        return `/reports/dashboard${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Report"],
    }),

    // GET /reports/revenue - Revenue report
    getRevenueReport: builder.query({
      query: ({ date_from, date_to, group_by = "month" }) => {
        const params = new URLSearchParams({ date_from, date_to, group_by });
        return `/reports/revenue?${params.toString()}`;
      },
      providesTags: ["Report"],
    }),

    // GET /reports/expenses - Expense report
    getExpenseReport: builder.query({
      query: ({ date_from, date_to, group_by = "category" }) => {
        const params = new URLSearchParams({ date_from, date_to, group_by });
        return `/reports/expenses?${params.toString()}`;
      },
      providesTags: ["Report"],
    }),

    // GET /reports/profit-loss - Profit & Loss report
    getProfitLossReport: builder.query({
      query: ({ date_from, date_to }) => {
        const params = new URLSearchParams({ date_from, date_to });
        return `/reports/profit-loss?${params.toString()}`;
      },
      providesTags: ["Report"],
    }),

    // GET /reports/tax-summary - Tax summary report
    getTaxSummaryReport: builder.query({
      query: ({ date_from, date_to }) => {
        const params = new URLSearchParams({ date_from, date_to });
        return `/reports/tax-summary?${params.toString()}`;
      },
      providesTags: ["Report"],
    }),

    // =========================================================================
    // NAVIGATION / SETTINGS ENDPOINTS
    // =========================================================================

    // GET /settings/navigation - Get navigation for current user (filtered by permissions)
    getNavigation: builder.query({
      query: () => "/settings/navigation",
      providesTags: ["Navigation"],
    }),

    // GET /settings/navigation/all - Get all navigation for admin management
    getAllNavigation: builder.query({
      query: () => "/settings/navigation/all",
      providesTags: ["Navigation"],
    }),

    // POST /settings/navigation - Create navigation item
    createNavigationItem: builder.mutation({
      query: (data) => ({
        url: "/settings/navigation",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Navigation"],
    }),

    // PUT /settings/navigation/:id - Update navigation item
    updateNavigationItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/settings/navigation/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Navigation"],
    }),

    // DELETE /settings/navigation/:id - Delete navigation item
    deleteNavigationItem: builder.mutation({
      query: (id) => ({
        url: `/settings/navigation/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Navigation"],
    }),

    // PUT /settings/navigation/:id/permissions - Update navigation permissions
    updateNavigationPermissions: builder.mutation({
      query: ({ id, permission_ids }) => ({
        url: `/settings/navigation/${id}/permissions`,
        method: "PUT",
        body: { permission_ids },
      }),
      invalidatesTags: ["Navigation"],
    }),

    // POST /settings/navigation/reorder - Reorder navigation items
    reorderNavigation: builder.mutation({
      query: (items) => ({
        url: "/settings/navigation/reorder",
        method: "POST",
        body: { items },
      }),
      invalidatesTags: ["Navigation"],
    }),
  }),
});

export const {
  // Auth
  useGoogleLoginMutation,
  useLoginMutation,
  useGetCurrentUserQuery,
  // Appointments
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
  // Users & Roles
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserPermissionsQuery,
  useLazyGetUserPermissionsQuery,
  useAssignUserRoleMutation,
  useRevokeUserRoleMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  // Permissions
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useAddPermissionToRoleMutation,
  useRemovePermissionFromRoleMutation,
  // Doctors
  useGetDoctorsQuery,
  useGetDoctorsBySpecialtyQuery,
  useGetDoctorQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  // Services
  useGetServicesQuery,
  useGetServicesByCategoryQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  // Invoices
  useGetInvoiceSettingsQuery,
  useUpdateInvoiceSettingsMutation,
  useUploadInvoiceLogoMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useLazyGetInvoiceQuery,
  useCheckDuplicateInvoicesMutation,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useCancelInvoiceMutation,
  useRecordInvoicePaymentMutation,
  useGetInvoicePdfUrlQuery,
  useLazyGetInvoicePdfUrlQuery,
  useSendInvoiceMutation,
  useCreateInvoiceFromAppointmentMutation,
  // Expenses
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useSeedExpenseCategoriesMutation,
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useUploadExpenseReceiptMutation,
  // Customers
  useGetCustomersQuery,
  useSearchCustomersQuery,
  useLazySearchCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  // Wallet
  useGetUserWalletQuery,
  // Financial Reports
  useGetFinancialDashboardQuery,
  useGetRevenueReportQuery,
  useGetExpenseReportQuery,
  useGetProfitLossReportQuery,
  useGetTaxSummaryReportQuery,
  // Navigation / Settings
  useGetNavigationQuery,
  useGetAllNavigationQuery,
  useCreateNavigationItemMutation,
  useUpdateNavigationItemMutation,
  useDeleteNavigationItemMutation,
  useUpdateNavigationPermissionsMutation,
  useReorderNavigationMutation,
  // App Settings
  useGetAppSettingsQuery,
  useGetAppSettingQuery,
  useUpdateAppSettingMutation,
  useSeedAppSettingsMutation,
} = api;
