/**
 * Parse FastAPI / backend validation and error payloads into field-level errors.
 */

function normalizeDetailArray(body) {
  if (!body) return [];

  const raw = body.detail ?? body.details;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return [{ loc: ['body'], msg: raw, type: 'value_error' }];
  }
  if (typeof raw === 'object' && raw.msg) return [raw];

  return [];
}

/**
 * @param {unknown} body - Response body from failed API call
 * @returns {{ fieldErrors: Record<string, string>, formError?: string }}
 */
export function parseApiValidationErrors(body) {
  const items = normalizeDetailArray(body);
  const fieldErrors = {};
  const formMessages = [];

  for (const item of items) {
    const loc = Array.isArray(item.loc) ? item.loc : [];
    const msg = item.msg || item.message || 'Invalid value';
    const fieldName = loc.find(
      (part, idx) => idx > 0 && part !== 'body' && typeof part === 'string'
    );

    if (fieldName) {
      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = msg;
      }
    } else {
      formMessages.push(msg);
    }
  }

  return {
    fieldErrors,
    formError: formMessages.length ? formMessages.join('. ') : undefined,
  };
}

/**
 * Apply server validation errors to a react-hook-form instance.
 * @param {import('react-hook-form').UseFormReturn} methods
 * @param {Record<string, string>} fieldErrors
 */
export function applyServerErrors(methods, fieldErrors) {
  Object.entries(fieldErrors).forEach(([field, message]) => {
    methods.setError(field, { type: 'server', message });
  });
}

/**
 * Extract a human-readable message from any API error shape.
 * @param {unknown} error - RTK Query error, axios error, or plain Error
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  const data =
    error?.data ??
    error?.response?.data ??
    (typeof error === 'object' && 'detail' in error ? error : null);

  if (typeof data === 'string') return data;
  if (data?.detail && typeof data.detail === 'string') return data.detail;
  if (data?.message && typeof data.message === 'string') return data.message;
  if (error?.message && typeof error.message === 'string') return error.message;

  const { formError } = parseApiValidationErrors(data);
  return formError || fallback;
}
