/**
 * Normalize RTK Query / API payloads that may be a bare array or { doctors: [] }.
 */
export function normalizeApiList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.doctors)) return data.doctors;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}
