/**
 * Static fallback route rules — used until /settings/navigation/permission-presets
 * loads from the backend. Prefer updating app/core/nav_permission_presets.py only.
 */
import { PERMISSIONS } from '@/utils/permissions';

export const ADMIN_ROUTE_RULES = [
  { prefix: '/finance/invoices', any: [PERMISSIONS.INVOICE_VIEW_ANY] },
  { prefix: '/finance/expenses', any: [PERMISSIONS.EXPENSE_VIEW_ANY] },
  { prefix: '/finance/customers', any: [PERMISSIONS.CUSTOMER_VIEW_ANY] },
  { prefix: '/finance/reports', any: [PERMISSIONS.REPORTS_VIEW] },
  { prefix: '/finance', any: [PERMISSIONS.REPORTS_VIEW, PERMISSIONS.INVOICE_VIEW_ANY] },
  { prefix: '/appointments', any: [PERMISSIONS.APPOINTMENT_READ_ANY, PERMISSIONS.APPOINTMENT_READ_ASSIGNED] },
  { prefix: '/doctors', any: [PERMISSIONS.DOCTOR_READ_ANY] },
  { prefix: '/users', any: [PERMISSIONS.USER_READ_ANY] },
  { prefix: '/verification', any: [PERMISSIONS.VERIFICATION_VERIFY_ANY] },
  { prefix: '/services', any: [PERMISSIONS.SERVICE_READ_ANY] },
  { prefix: '/roles', any: [PERMISSIONS.ROLE_READ] },
  { prefix: '/permissions', any: [PERMISSIONS.PERMISSION_READ] },
  { prefix: '/settings', any: [PERMISSIONS.SETTINGS_READ] },
  { prefix: '/leads', any: [PERMISSIONS.LEAD_READ_ANY] },
  { prefix: '/audit', any: [PERMISSIONS.AUDIT_READ_ANY] },
];

/** Dashboard home — any authenticated admin portal user. */
export const ADMIN_DASHBOARD_PATHS = ['/', ''];
