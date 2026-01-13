/**
 * API Configuration
 */

const config = {
  // API Base URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",

  // Frontend URL (for unified login)
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",

  // Admin URL
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001",

  // App Info
  appName: "Aetlier Admin",
  appVersion: "1.0.0",

  // Authentication
  tokenKey: "admin_access_token",
  refreshTokenKey: "admin_refresh_token",

  // Pagination defaults
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],

  // Date/Time formats
  dateFormat: "YYYY-MM-DD",
  timeFormat: "HH:mm",
  displayDateFormat: "MMM DD, YYYY",
  displayTimeFormat: "hh:mm A",
};

export default config;
