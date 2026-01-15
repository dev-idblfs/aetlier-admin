/**
 * Permission Utilities
 * Provides permission checking and role-based access control helpers
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with permissions array
 * @param {string} permission - Permission string (e.g., 'appointment.read.any')
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;

  // Super admin has all permissions
  if (user.role === "super_admin" || user.role === "superadmin") {
    return true;
  }

  return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with permissions array
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissions) {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === "super_admin" || user.role === "superadmin") {
    return true;
  }

  if (!user.permissions || !Array.isArray(permissions)) return false;

  return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Check if user has all specified permissions
 * @param {Object} user - User object with permissions array
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean}
 */
export function hasAllPermissions(user, permissions) {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === "super_admin" || user.role === "superadmin") {
    return true;
  }

  if (!user.permissions || !Array.isArray(permissions)) return false;

  return permissions.every((p) => user.permissions.includes(p));
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object with role
 * @param {string|string[]} roles - Role or array of roles to check
 * @returns {boolean}
 */
export function hasRole(user, roles) {
  if (!user || !user.role) return false;

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
}

/**
 * Check if user is super admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isSuperAdmin(user) {
  return hasRole(user, ["super_admin", "superadmin"]);
}

/**
 * Check if user is admin (includes super admin)
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdmin(user) {
  return hasRole(user, ["super_admin", "superadmin", "admin"]);
}

// Permission constants for easy reference
export const PERMISSIONS = {
  // === SYSTEM ===
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view.any",

  // === CLINICAL ===
  // Appointments
  APPOINTMENT_READ_ANY: "appointment.read.any",
  APPOINTMENT_READ_OWN: "appointment.read.own",
  APPOINTMENT_CREATE: "appointment.create.any",
  APPOINTMENT_UPDATE_ANY: "appointment.update.any",
  APPOINTMENT_UPDATE_OWN: "appointment.update.own",
  APPOINTMENT_DELETE_ANY: "appointment.delete.any",
  APPOINTMENT_APPROVE: "appointment.approve.any",
  APPOINTMENT_CANCEL: "appointment.cancel.any",
  APPOINTMENT_RESCHEDULE: "appointment.reschedule.any",

  // Doctors
  DOCTOR_READ_ANY: "doctor.read.any",
  DOCTOR_CREATE: "doctor.create.any",
  DOCTOR_UPDATE: "doctor.update.any",
  DOCTOR_DELETE: "doctor.delete.any",

  // Services
  SERVICE_READ_ANY: "service.read.any",
  SERVICE_CREATE: "service.create.any",
  SERVICE_UPDATE: "service.update.any",
  SERVICE_DELETE: "service.delete.any",

  // === USER MANAGEMENT ===
  // Users
  USER_READ_ANY: "user.read.any",
  USER_READ_OWN: "user.read.own",
  USER_CREATE: "user.create.any",
  USER_UPDATE_ANY: "user.update.any",
  USER_UPDATE_OWN: "user.update.own",
  USER_DELETE: "user.delete.any",
  USER_ROLE_MANAGE: "user.role.manage",

  // Roles & Permissions (Admin only)
  ROLE_READ: "role.read.any",
  ROLE_CREATE: "role.create.any",
  ROLE_UPDATE: "role.update.any",
  ROLE_DELETE: "role.delete.any",

  PERMISSION_READ: "permission.read.any",
  PERMISSION_CREATE: "permission.create.any",
  PERMISSION_UPDATE: "permission.update.any",
  PERMISSION_DELETE: "permission.delete.any",
  PERMISSION_ASSIGN: "permission.assign.any",
  PERMISSION_REVOKE: "permission.revoke.any",

  // === SYSTEM ===
  // Settings
  SETTINGS_READ: "settings.read.any",
  SETTINGS_UPDATE: "settings.update.any",

  // Reports
  REPORTS_VIEW: "reports.view.any",
  REPORTS_EXPORT: "reports.export.any",

  // === FINANCE ===
  // Invoices
  INVOICE_READ_ANY: "invoice.read.any",
  INVOICE_CREATE: "invoice.create.any",
  INVOICE_UPDATE: "invoice.update.any",
  INVOICE_DELETE: "invoice.delete.any",
  INVOICE_SEND: "invoice.send.any",

  // Expenses
  EXPENSE_READ_ANY: "expense.read.any",
  EXPENSE_CREATE: "expense.create.any",
  EXPENSE_UPDATE: "expense.update.any",
  EXPENSE_DELETE: "expense.delete.any",

  // Customers
  CUSTOMER_READ_ANY: "customer.read.any",
  CUSTOMER_CREATE: "customer.create.any",
  CUSTOMER_UPDATE: "customer.update.any",
  CUSTOMER_DELETE: "customer.delete.any",

  // Finance Dashboard & Reports
  FINANCE_DASHBOARD_VIEW: "finance.dashboard.view",
  FINANCE_REPORTS_VIEW: "finance.reports.view",
};

const permissionsModule = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  isSuperAdmin,
  isAdmin,
  PERMISSIONS,
};

export default permissionsModule;
