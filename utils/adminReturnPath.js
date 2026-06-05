const STORAGE_KEY = 'aetlier_admin_return_path';
const GENERIC_PATHS = new Set(['/', '/login']);

export function isExplicitAdminReturnPath(path) {
  if (!path?.startsWith('/') || path.startsWith('//')) return false;
  const pathname = path.split('?')[0].split('#')[0];
  return !GENERIC_PATHS.has(pathname);
}

/** Remember last non-generic admin page for logout → re-login handoff. */
export function persistAdminReturnPath(path) {
  if (!isExplicitAdminReturnPath(path)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // ignore
  }
}

export function readStoredAdminReturnPath() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isExplicitAdminReturnPath(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function clearStoredAdminReturnPath() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Path to send as ?returnTo= on public /login after admin logout. */
export function resolveAdminLogoutReturnPath(explicitPath) {
  if (isExplicitAdminReturnPath(explicitPath)) {
    return explicitPath;
  }
  return readStoredAdminReturnPath();
}
